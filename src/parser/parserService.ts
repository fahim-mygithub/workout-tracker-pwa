import type { ParseResult } from './types';

interface PendingRequest {
  resolve: (result: ParseResult) => void;
  reject: (error: Error) => void;
}

export class ParserService {
  private worker: Worker | null = null;
  private requestId = 0;
  private pendingRequests = new Map<number, PendingRequest>();
  
  constructor() {
    this.initializeWorker();
  }
  
  private initializeWorker(): void {
    // Keep worker disabled for now
    this.worker = null;
    return;
    
    try {
      // Create worker with proper type
      this.worker = new Worker(
        new URL('./parser.worker.ts', import.meta.url),
        { type: 'module' }
      );
      
      // Handle messages from worker
      this.worker.addEventListener('message', (event) => {
        const { id, result, error } = event.data;
        const pending = this.pendingRequests.get(id);
        
        if (pending) {
          this.pendingRequests.delete(id);
          
          if (error) {
            pending.reject(new Error(error));
          } else {
            pending.resolve(result);
          }
        }
      });
      
      // Handle worker errors
      this.worker.addEventListener('error', (error) => {
        console.error('Parser worker error:', error);
        // Reject all pending requests
        this.pendingRequests.forEach(pending => {
          pending.reject(new Error('Parser worker crashed'));
        });
        this.pendingRequests.clear();
        
        // Try to reinitialize worker
        this.worker = null;
        setTimeout(() => this.initializeWorker(), 1000);
      });
    } catch (error) {
      console.error('Failed to initialize parser worker:', error);
      this.worker = null;
    }
  }
  
  async parse(text: string): Promise<ParseResult> {
    // Validate input
    if (!text || typeof text !== 'string') {
      return {
        success: false,
        errors: [{
          position: 0,
          line: 1,
          column: 1,
          message: 'Invalid input text',
          severity: 'error'
        }],
        suggestions: []
      };
    }
    
    // Fallback to synchronous parsing if worker is not available
    if (!this.worker) {
      try {
        // Try the SmartParser first (handles complex notation better)
        const { SmartParser } = await import('./smartParser');
        const smartParser = new SmartParser();
        const result = smartParser.parse(text);
        
        // If SmartParser succeeds, return the result
        if (result.success) {
          return result;
        }
        
        // If it fails, try the SimpleParser as fallback
        console.log('SmartParser failed, trying SimpleParser');
        const { SimpleParser } = await import('./simpleParser');
        const simpleParser = new SimpleParser();
        return simpleParser.parse(text);
        
      } catch (error) {
        console.error('Parser error:', error);
        // Try the original parser as last resort
        try {
          const { WorkoutParser } = await import('./parser');
          const parser = new WorkoutParser();
          return parser.parse(text);
        } catch (finalError) {
          console.error('All parsers failed:', finalError);
          return {
            success: false,
            errors: [{
              position: 0,
              line: 1,
              column: 1,
              message: 'Failed to parse workout: ' + (error instanceof Error ? error.message : 'Unknown error'),
              severity: 'error'
            }],
            suggestions: []
          };
        }
      }
    }
    
    // Use worker for parsing
    try {
      return await new Promise((resolve, reject) => {
        const id = ++this.requestId;
        this.pendingRequests.set(id, { resolve, reject });
        
        // Set timeout for parsing
        const timeout = setTimeout(async () => {
          if (this.pendingRequests.has(id)) {
            this.pendingRequests.delete(id);
            // Fallback to sync parsing on timeout
            try {
              const { WorkoutParser } = await import('./parser');
              const parser = new WorkoutParser();
              const result = parser.parse(text);
              resolve(result);
            } catch (error) {
              reject(new Error('Parsing failed: ' + (error instanceof Error ? error.message : 'Unknown error')));
            }
          }
        }, 3000); // 3 second timeout before fallback
        
        // Send message to worker
        this.worker!.postMessage({ id, text });
        
        // Update the pending request with timeout cleanup
        this.pendingRequests.set(id, {
          resolve: (result) => {
            clearTimeout(timeout);
            this.pendingRequests.delete(id);
            resolve(result);
          },
          reject: (error) => {
            clearTimeout(timeout);
            this.pendingRequests.delete(id);
            reject(error);
          }
        });
      });
    } catch (error) {
      // Final fallback to sync parsing
      const { WorkoutParser } = await import('./parser');
      const parser = new WorkoutParser();
      return parser.parse(text);
    }
  }
  
  // Get text length based debounce delay
  getDebounceDelay(textLength: number): number {
    if (textLength < 100) return 300;
    if (textLength < 500) return 500;
    if (textLength < 1000) return 750;
    return 1000; // Max 1 second for very large texts
  }
  
  // Cleanup method
  destroy(): void {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
    this.pendingRequests.clear();
  }
}

// Export singleton instance
export const parserService = new ParserService();