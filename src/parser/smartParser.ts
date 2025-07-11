import type { ParseResult, Exercise, ExerciseSet, Workout, ExerciseGroup, RepsValue, ParseSuggestion } from './types';
import { ExerciseMatcher } from './exerciseDatabase';

/**
 * A smarter parser that handles complex workout notations
 */
export class SmartParser {
  parse(input: string): ParseResult {
    try {
      if (!input || typeof input !== 'string') {
        return this.errorResult('Invalid input');
      }
      
      const lines = input.trim().split('\n').filter(line => line.trim());
      const groups: ExerciseGroup[] = [];
      const suggestions: ParseSuggestion[] = [];
      
      for (const line of lines) {
        const trimmedLine = line.trim();
        
        // Check for superset
        if (trimmedLine.toLowerCase().includes(' ss ')) {
          const parts = trimmedLine.split(/\s+ss\s+/i);
          const exercises: Exercise[] = [];
          let firstExerciseInfo: { setCount: number; reps: RepsValue } | null = null;
          
          for (let i = 0; i < parts.length; i++) {
            const exercise = this.parseExerciseLine(parts[i].trim(), i > 0 ? firstExerciseInfo : null);
            if (exercise) {
              // Store the set info from the first exercise
              if (i === 0 && exercise.sets.length > 0) {
                firstExerciseInfo = {
                  setCount: exercise.sets.length,
                  reps: exercise.sets[0].reps
                };
              }
              exercises.push(exercise);
              // Check if exercise is in database and add suggestions if not
              const matchedExercise = ExerciseMatcher.findExercise(exercise.name);
              if (!matchedExercise) {
                const exerciseSuggestions = ExerciseMatcher.getSuggestions(exercise.name, 3);
                if (exerciseSuggestions.length > 0) {
                  suggestions.push({
                    original: exercise.name,
                    suggestion: exerciseSuggestions[0],
                    alternatives: exerciseSuggestions.slice(1)
                  });
                }
              }
            }
          }
          
          if (exercises.length > 0) {
            groups.push({
              type: exercises.length > 1 ? 'superset' : 'single',
              exercises
            });
          }
        } else {
          const exercise = this.parseExerciseLine(trimmedLine);
          if (exercise) {
            groups.push({
              type: 'single',
              exercises: [exercise]
            });
            // Check if exercise is in database and add suggestions if not
            const matchedExercise = ExerciseMatcher.findExercise(exercise.name);
            if (!matchedExercise) {
              const exerciseSuggestions = ExerciseMatcher.getSuggestions(exercise.name, 3);
              if (exerciseSuggestions.length > 0) {
                suggestions.push({
                  original: exercise.name,
                  suggestion: exerciseSuggestions[0],
                  confidence: 0.8
                });
              }
            }
          }
        }
      }
      
      if (groups.length === 0) {
        return this.errorResult('No valid exercises found');
      }
      
      return {
        success: true,
        workout: { groups },
        errors: [],
        suggestions
      };
    } catch (error) {
      return this.errorResult('Parse error: ' + (error instanceof Error ? error.message : 'Unknown'));
    }
  }
  
  private parseExerciseLine(line: string, defaultSetInfo: { setCount: number; reps: RepsValue } | null = null): Exercise | null {
    // Handle the specific format: "5x Incline db 3X8-10 @ 75lbs"
    // This should be 5 sets of 8-10 reps at 75lbs
    
    // First, try to extract the weight if it exists
    let weight: { value: number; unit?: 'lbs' | 'kg' } | undefined;
    let lineWithoutWeight = line;
    
    const weightMatch = line.match(/@\s*(\d+(?:\.\d+)?)\s*(lbs?|kg)?/i);
    if (weightMatch) {
      weight = {
        value: parseFloat(weightMatch[1]),
        unit: (weightMatch[2] as 'lbs' | 'kg') || 'lbs'
      };
      lineWithoutWeight = line.substring(0, weightMatch.index!).trim();
    }
    
    // Special pattern for "5x Exercise Name 3x8-10" format
    // The first number (5) is the actual set count, the second (3x8-10) is often a typo or additional info
    const specialMatch = lineWithoutWeight.match(/^(\d+)\s*[x×\*]\s+(.+?)\s+(\d+)\s*[x×\*]\s*(\d+(?:-\d+)?)$/i);
    if (specialMatch) {
      const setCount = parseInt(specialMatch[1]) || 1; // Use the FIRST number as set count
      const exerciseName = specialMatch[2].trim();
      const repsStr = specialMatch[4];
      const reps = this.parseReps(repsStr); // Use the rep range from the second part
      
      const sets: ExerciseSet[] = [];
      for (let i = 0; i < Math.min(setCount, 20); i++) {
        const set: ExerciseSet = { reps };
        if (weight) {
          set.weight = weight;
        }
        sets.push(set);
      }
      
      return {
        name: exerciseName,
        sets
      };
    }
    
    // Standard pattern: "5x Exercise Name"
    const standardMatch = lineWithoutWeight.match(/^(\d+)\s*[x×\*]\s+(.+)$/i);
    if (standardMatch) {
      const setCount = parseInt(standardMatch[1]) || 1;
      const exerciseName = standardMatch[2].trim();
      
      // Default reps if not specified
      const sets: ExerciseSet[] = [];
      for (let i = 0; i < Math.min(setCount, 20); i++) {
        const set: ExerciseSet = { reps: 10 };
        if (weight) {
          set.weight = weight;
        }
        sets.push(set);
      }
      
      return {
        name: exerciseName,
        sets
      };
    }
    
    // Try simpler patterns
    // Pattern: "5x10 Bench Press"
    const simpleMatch = lineWithoutWeight.match(/^(\d+)\s*[x×\*]\s*(\d+(?:-\d+)?)\s+(.+)$/i);
    if (simpleMatch) {
      const setCount = parseInt(simpleMatch[1]) || 1;
      const reps = this.parseReps(simpleMatch[2]);
      const exerciseName = simpleMatch[3].trim();
      
      const sets: ExerciseSet[] = [];
      for (let i = 0; i < Math.min(setCount, 20); i++) {
        const set: ExerciseSet = { reps };
        if (weight) {
          set.weight = weight;
        }
        sets.push(set);
      }
      
      return {
        name: exerciseName,
        sets
      };
    }
    
    // Fallback: treat the whole line as exercise name, but try to extract reps if present
    // Check if the line ends with a rep pattern like "12-15" or "12"
    const fallbackMatch = line.match(/^(.+?)\s+(\d+(?:-\d+)?|\d+\/\d+\/\d+|AMRAP)$/i);
    if (fallbackMatch) {
      const exerciseName = fallbackMatch[1].trim();
      const repsStr = fallbackMatch[2];
      const reps = this.parseReps(repsStr);
      
      // Use defaultSetInfo if provided, otherwise default to 3 sets when no set count is specified but reps are
      const setCount = defaultSetInfo?.setCount || 3;
      const sets: ExerciseSet[] = [];
      for (let i = 0; i < setCount; i++) {
        const set: ExerciseSet = { reps };
        if (weight) {
          set.weight = weight;
        }
        sets.push(set);
      }
      
      return {
        name: exerciseName,
        sets
      };
    }
    
    // Final fallback: just the exercise name with default sets
    // If defaultSetInfo is provided (for supersets), inherit from first exercise
    const setCount = defaultSetInfo?.setCount || 1;
    const reps = defaultSetInfo?.reps || 10;
    const sets: ExerciseSet[] = [];
    for (let i = 0; i < setCount; i++) {
      sets.push({ reps });
    }
    
    return {
      name: lineWithoutWeight,
      sets
    };
  }
  
  private parseReps(repsStr: string): RepsValue {
    if (repsStr.toLowerCase() === 'amrap') {
      return 'AMRAP';
    }
    
    if (repsStr.includes('-')) {
      const [minStr, maxStr] = repsStr.split('-');
      const min = parseInt(minStr) || 10;
      const max = parseInt(maxStr) || min;
      return { min, max };
    }
    
    const reps = parseInt(repsStr);
    const result = isNaN(reps) || reps <= 0 || reps > 100 ? 10 : reps;
    return result;
  }
  
  private errorResult(message: string): ParseResult {
    return {
      success: false,
      errors: [{
        position: 0,
        line: 1,
        column: 1,
        message,
        severity: 'error'
      }],
      suggestions: []
    };
  }
}