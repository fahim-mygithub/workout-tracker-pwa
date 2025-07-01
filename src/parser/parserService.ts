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
    // Fallback to synchronous parsing if worker is not available
    if (!this.worker) {
      const { WorkoutParser } = await import('./parser');
      const parser = new WorkoutParser();
      return parser.parse(text);
    }
    
    // Use worker for parsing
    return new Promise((resolve, reject) => {
      const id = ++this.requestId;
      this.pendingRequests.set(id, { resolve, reject });
      
      // Set timeout for parsing
      const timeout = setTimeout(() => {
        if (this.pendingRequests.has(id)) {
          this.pendingRequests.delete(id);
          reject(new Error('Parsing timeout'));
        }
      }, 5000); // 5 second timeout
      
      // Send message to worker
      this.worker!.postMessage({ id, text });
      
      // Clear timeout when request completes
      const originalResolve = resolve;
      const originalReject = reject;
      resolve = (result) => {
        clearTimeout(timeout);
        originalResolve(result);
      };
      reject = (error) => {
        clearTimeout(timeout);
        originalReject(error);
      };
    });
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