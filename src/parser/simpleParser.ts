import type { ParseResult, Exercise, ExerciseSet, Workout, ExerciseGroup } from './types';

/**
 * A simplified parser that's more robust and handles edge cases better
 */
export class SimpleParser {
  parse(input: string): ParseResult {
    const errors: any[] = [];
    const suggestions: any[] = [];
    
    try {
      // Basic validation
      if (!input || typeof input !== 'string') {
        return {
          success: false,
          errors: [{
            position: 0,
            line: 1,
            column: 1,
            message: 'Invalid input',
            severity: 'error'
          }],
          suggestions: []
        };
      }
      
      // Clean the input
      const cleanInput = input.trim();
      if (!cleanInput) {
        return {
          success: false,
          errors: [{
            position: 0,
            line: 1,
            column: 1,
            message: 'Empty input',
            severity: 'error'
          }],
          suggestions: []
        };
      }
      
      // Split into lines
      const lines = cleanInput.split('\n').filter(line => line.trim());
      const groups: ExerciseGroup[] = [];
      
      for (const line of lines) {
        // Check for superset notation
        if (line.toLowerCase().includes(' ss ')) {
          const parts = line.split(/\s+ss\s+/i);
          const exercises: Exercise[] = [];
          
          for (const part of parts) {
            const exercise = this.parseLine(part.trim());
            if (exercise) {
              exercises.push(exercise);
            }
          }
          
          if (exercises.length > 1) {
            groups.push({
              type: 'superset',
              exercises
            });
          } else if (exercises.length === 1) {
            groups.push({
              type: 'single',
              exercises
            });
          }
        } else {
          const exercise = this.parseLine(line.trim());
          if (exercise) {
            groups.push({
              type: 'single',
              exercises: [exercise]
            });
          }
        }
      }
      
      if (groups.length === 0) {
        return {
          success: false,
          errors: [{
            position: 0,
            line: 1,
            column: 1,
            message: 'No valid exercises found',
            severity: 'error'
          }],
          suggestions: []
        };
      }
      
      return {
        success: true,
        workout: { groups },
        errors: [],
        suggestions: []
      };
      
    } catch (error) {
      return {
        success: false,
        errors: [{
          position: 0,
          line: 1,
          column: 1,
          message: 'Parse error: ' + (error instanceof Error ? error.message : 'Unknown error'),
          severity: 'error'
        }],
        suggestions: []
      };
    }
  }
  
  private parseLine(line: string): Exercise | null {
    try {
      console.log('Parsing line:', line);
      // Remove any special characters that might cause issues
      const cleanLine = line.replace(/[^\w\s\-x×\*@,.()]/gi, '');
      
      // First, handle the problematic format: "5x Incline db 3X8-10 @ 75lbs"
      // This should be interpreted as 5 sets of Incline DB, not 3 sets
      // The "3X8-10" is likely a typo and should be ignored or treated as additional info
      
      // Look for patterns with parentheses first (these are clearer)
      const parenMatch = line.match(/(\d+)\s*[x×\*]\s+(.+?)\s*\(([^)]+)\)/i);
      if (parenMatch) {
        const setCount = parseInt(parenMatch[1]) || 1;
        const exerciseName = parenMatch[2].trim();
        const parenContent = parenMatch[3];
        
        // Parse the parenthetical content for reps/weight info
        const innerMatch = parenContent.match(/(\d+)\s*[x×\*]?\s*(\d+(?:-\d+)?)\s*(?:@\s*(\d+(?:\.\d+)?)\s*(lbs?|kg))?/i);
        
        const sets: ExerciseSet[] = [];
        const safeSetCount = Math.min(Math.max(1, setCount), 20);
        
        for (let i = 0; i < safeSetCount; i++) {
          if (innerMatch) {
            const set = this.parseReps(innerMatch[2]);
            if (innerMatch[3]) {
              set.weight = { value: parseFloat(innerMatch[3]), unit: (innerMatch[4] as 'lbs' | 'kg') || 'lbs' };
            }
            sets.push(set);
          } else {
            sets.push({ reps: 10 }); // Default
          }
        }
        
        return {
          name: exerciseName,
          sets
        };
      }
      
      // For your specific format: "5x Incline db 3X8-10 @ 75lbs"
      // We want 5 sets of 8-10 reps at 75lbs
      const specialMatch = line.match(/^(\d+)\s*[x×\*]\s+(.+?)\s+\d+[x×\*](\d+(?:-\d+)?)\s*(?:@\s*(\d+(?:\.\d+)?)\s*(lbs?|kg))?$/i);
      if (specialMatch) {
        const setCount = parseInt(specialMatch[1]) || 1;
        const exerciseName = specialMatch[2].trim();
        const repsStr = specialMatch[3];
        const weight = specialMatch[4] ? parseFloat(specialMatch[4]) : undefined;
        const unit = specialMatch[5] as 'lbs' | 'kg' | undefined;
        
        const sets: ExerciseSet[] = [];
        const safeSetCount = Math.min(Math.max(1, setCount), 20);
        
        for (let i = 0; i < safeSetCount; i++) {
          const set = this.parseReps(repsStr);
          if (weight) {
            set.weight = { value: weight, unit };
          }
          sets.push(set);
        }
        
        return {
          name: exerciseName,
          sets
        };
      }
      
      // Simple regex patterns
      const patterns = [
        // 5x10 Exercise Name
        /^(\d+)\s*[x×\*]\s*(\d+(?:-\d+)?)\s+(.+?)(?:\s*@\s*(\d+(?:\.\d+)?)\s*(lbs?|kg))?$/i,
        // 5x Exercise Name (with variations)
        /^(\d+)\s*[x×\*]\s+(.+?)$/i,
        // Just exercise name with sets
        /^(.+?)\s+(\d+)\s*[x×\*]\s*(\d+(?:-\d+)?)$/i
      ];
      
      for (const pattern of patterns) {
        const match = cleanLine.match(pattern);
        if (match) {
          return this.createExerciseFromMatch(match, pattern);
        }
      }
      
      // Fallback: just treat the whole line as an exercise name
      return {
        name: line,
        sets: [{
          reps: 10
        }]
      };
      
    } catch (error) {
      console.error('Error parsing line:', line, error);
      return null;
    }
  }
  
  private createExerciseFromMatch(match: RegExpMatchArray, pattern: RegExp): Exercise {
    // Pattern 1: 5x10 Exercise Name @weight
    if (match.length >= 4 && match[3]) {
      const setCount = parseInt(match[1]) || 1;
      const repsStr = match[2];
      const exerciseName = match[3].trim();
      const weight = match[4] ? parseFloat(match[4]) : undefined;
      const unit = match[5] as 'lbs' | 'kg' | undefined;
      
      const sets: ExerciseSet[] = [];
      const safeSetCount = Math.min(Math.max(1, setCount), 20);
      
      for (let i = 0; i < safeSetCount; i++) {
        const set: ExerciseSet = this.parseReps(repsStr);
        if (weight) {
          set.weight = { value: weight, unit };
        }
        sets.push(set);
      }
      
      return {
        name: exerciseName,
        sets
      };
    }
    
    // Pattern 2: 5x Exercise Name
    if (match.length >= 3 && match[2] && !match[3]) {
      const setCount = parseInt(match[1]) || 1;
      const exerciseName = match[2].trim();
      
      const sets: ExerciseSet[] = [];
      const safeSetCount = Math.min(Math.max(1, setCount), 20);
      
      for (let i = 0; i < safeSetCount; i++) {
        sets.push({ reps: 10 }); // Default reps
      }
      
      return {
        name: exerciseName,
        sets
      };
    }
    
    // Default fallback
    return {
      name: match[0],
      sets: [{ reps: 10 }]
    };
  }
  
  private parseReps(repsStr: string): ExerciseSet {
    if (repsStr.includes('-')) {
      const [minStr, maxStr] = repsStr.split('-');
      const min = parseInt(minStr) || 10;
      const max = parseInt(maxStr) || min;
      return { reps: { min, max } };
    }
    
    const reps = parseInt(repsStr);
    if (isNaN(reps) || reps <= 0 || reps > 100) {
      return { reps: 10 };
    }
    
    return { reps };
  }
}