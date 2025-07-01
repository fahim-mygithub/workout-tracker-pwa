import { WorkoutParser } from './parser';
import type { ParseResult } from './types';

// Initialize parser instance
const parser = new WorkoutParser();

// Handle messages from main thread
self.addEventListener('message', (event) => {
  const { id, text } = event.data;
  
  try {
    // Parse the workout text
    const result = parser.parse(text);
    
    // Send result back to main thread
    self.postMessage({
      id,
      result,
      error: null
    });
  } catch (error) {
    // Send error back to main thread
    self.postMessage({
      id,
      result: null,
      error: error instanceof Error ? error.message : 'Unknown parsing error'
    });
  }
});

// Export empty object to make TypeScript happy
export {};