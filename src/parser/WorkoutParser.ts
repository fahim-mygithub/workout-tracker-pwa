export interface Exercise {
  name: string;
  sets: number;
  reps: number;
  weight?: string;
  rpe?: number;
}

export interface WorkoutSet {
  exercises: Exercise[];
  type: 'normal' | 'superset' | 'circuit';
}

export interface ParseResult {
  success: boolean;
  data?: WorkoutSet[];
  error?: string;
}

export class WorkoutParser {
  private static readonly SETS_REPS_PATTERN = /(\d+)x(\d+)/;
  private static readonly RPE_PATTERN = /@RPE(\d+(?:\.\d+)?)/i;
  private static readonly WEIGHT_PATTERN = /(\d+(?:\.\d+)?)(lbs?|kg|pounds?)/i;
  private static readonly SUPERSET_PATTERN = /\bss\b/i;
  private static readonly CIRCUIT_PATTERN = /\+/;

  static parse(input: string): ParseResult {
    try {
      if (!input.trim()) {
        return {
          success: false,
          error: 'Input cannot be empty'
        };
      }

      const workoutSets = this.parseWorkoutSets(input);
      
      return {
        success: true,
        data: workoutSets
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown parsing error'
      };
    }
  }

  private static parseWorkoutSets(input: string): WorkoutSet[] {
    const sets: WorkoutSet[] = [];
    
    // Split by common delimiters and filter empty strings
    const segments = input.split(/[,;]/).map(s => s.trim()).filter(s => s);
    
    for (const segment of segments) {
      const workoutSet = this.parseSegment(segment);
      if (workoutSet) {
        sets.push(workoutSet);
      }
    }
    
    return sets;
  }

  private static parseSegment(segment: string): WorkoutSet | null {
    const isSuperset = this.SUPERSET_PATTERN.test(segment);
    const isCircuit = this.CIRCUIT_PATTERN.test(segment);
    
    let type: 'normal' | 'superset' | 'circuit' = 'normal';
    if (isSuperset) type = 'superset';
    else if (isCircuit) type = 'circuit';
    
    const exercises: Exercise[] = [];
    
    if (type === 'superset') {
      // Split by "ss" for supersets
      const exerciseParts = segment.split(this.SUPERSET_PATTERN).map(s => s.trim()).filter(s => s);
      for (const part of exerciseParts) {
        const exercise = this.parseExercise(part);
        if (exercise) {
          exercises.push(exercise);
        }
      }
    } else if (type === 'circuit') {
      // Split by "+" for circuits
      const exerciseParts = segment.split(this.CIRCUIT_PATTERN).map(s => s.trim()).filter(s => s);
      for (const part of exerciseParts) {
        const exercise = this.parseExercise(part);
        if (exercise) {
          exercises.push(exercise);
        }
      }
    } else {
      // For normal sets, parse as single exercise
      const exercise = this.parseExercise(segment);
      if (exercise) {
        exercises.push(exercise);
      }
    }
    
    return exercises.length > 0 ? { exercises, type } : null;
  }

  private static parseExercise(text: string): Exercise | null {
    const setsRepsMatch = text.match(this.SETS_REPS_PATTERN);
    if (!setsRepsMatch) {
      return null;
    }
    
    const sets = parseInt(setsRepsMatch[1]);
    const reps = parseInt(setsRepsMatch[2]);
    
    // Extract exercise name (everything before the sets x reps pattern)
    const nameMatch = text.substring(0, setsRepsMatch.index).trim();
    if (!nameMatch) {
      return null;
    }
    
    const exercise: Exercise = {
      name: nameMatch,
      sets,
      reps
    };
    
    // Extract weight if present
    const weightMatch = text.match(this.WEIGHT_PATTERN);
    if (weightMatch) {
      exercise.weight = `${weightMatch[1]} ${weightMatch[2]}`;
    }
    
    // Extract RPE if present
    const rpeMatch = text.match(this.RPE_PATTERN);
    if (rpeMatch) {
      exercise.rpe = parseFloat(rpeMatch[1]);
    }
    
    return exercise;
  }
}