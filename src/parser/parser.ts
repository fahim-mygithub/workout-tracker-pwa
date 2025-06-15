import type { 
  Token, 
  Exercise, 
  ExerciseSet, 
  ExerciseGroup, 
  Workout, 
  ParseError, 
  ParseResult,
  ParseSuggestion,
  Weight,
  RepsValue,
  Range,
  Tempo
} from './types';
import { TokenType } from './types';
import { Tokenizer } from './tokenizer';
import { ExerciseMatcher } from './exerciseDatabase';

export class WorkoutParser {
  private tokens: Token[] = [];
  private current: number = 0;
  private errors: ParseError[] = [];
  private suggestions: ParseSuggestion[] = [];

  parse(input: string): ParseResult {
    // Reset state
    this.current = 0;
    this.errors = [];
    this.suggestions = [];

    // Tokenize input
    try {
      this.tokens = Tokenizer.tokenize(input);
    } catch (error) {
      return {
        success: false,
        errors: [{
          position: 0,
          line: 1,
          column: 1,
          message: 'Failed to tokenize input',
          severity: 'error'
        }],
        suggestions: []
      };
    }

    // Parse workout
    try {
      const workout = this.parseWorkout();
      
      return {
        success: this.errors.length === 0,
        workout,
        errors: this.errors,
        suggestions: this.suggestions,
        tokens: this.tokens // For debugging
      };
    } catch (error) {
      this.addError('Unexpected parsing error: ' + (error instanceof Error ? error.message : 'Unknown error'));
      
      return {
        success: false,
        errors: this.errors,
        suggestions: this.suggestions,
        tokens: this.tokens
      };
    }
  }

  private parseWorkout(): Workout {
    const groups: ExerciseGroup[] = [];

    while (!this.isAtEnd()) {
      // Skip newlines between exercises
      while (this.match(TokenType.NEWLINE)) {
        // Just consume them
      }

      if (this.isAtEnd()) break;

      const group = this.parseExerciseGroup();
      if (group) {
        groups.push(group);
      }

      // Skip trailing newlines
      while (this.match(TokenType.NEWLINE)) {
        // Just consume them
      }
    }

    return { groups };
  }

  private parseExerciseGroup(): ExerciseGroup | null {
    const exercises: Exercise[] = [];
    
    // Parse first exercise
    const firstExercise = this.parseExercise();
    if (!firstExercise) return null;
    
    exercises.push(firstExercise);

    // Check for superset or circuit notation
    let groupType: ExerciseGroup['type'] = 'single';
    
    while (true) {
      if (this.match(TokenType.SUPERSET)) {
        groupType = 'superset';
      } else if (this.match(TokenType.PLUS)) {
        // Could be circuit or just addition
        if (this.peekExercise()) {
          groupType = 'circuit';
        } else {
          this.current--; // Put it back
          break;
        }
      } else {
        break;
      }

      const nextExercise = this.parseExercise();
      if (nextExercise) {
        exercises.push(nextExercise);
      } else {
        this.addError('Expected exercise after superset/circuit operator');
        break;
      }
    }

    return {
      type: groupType,
      exercises
    };
  }

  private parseExercise(): Exercise | null {
    // Try different parsing strategies
    const strategies = [
      () => this.parseStandardNotation(),      // 5x10 Squat
      () => this.parseWeightFirstNotation(),   // 225 3x5 Squat
      () => this.parseAtNotation(),            // 3x5@225 Squat
      () => this.parseCommaNotation(),         // 225x5,5,5 Squat
      () => this.parseSlashNotation(),         // 12/10/8 Curls
    ];

    for (const strategy of strategies) {
      const savePoint = this.current;
      const exercise = strategy();
      
      if (exercise) {
        return exercise;
      }
      
      // Reset to try next strategy
      this.current = savePoint;
    }

    // If all strategies fail, try to provide helpful error
    this.addError('Unable to parse exercise notation', this.getSuggestionForFailedParse());
    this.skipToNextExercise();
    
    return null;
  }

  // Standard notation: 5x10 Squat @225 R90
  private parseStandardNotation(): Exercise | null {
    const sets = this.parseSetsReps();
    if (!sets) return null;

    const name = this.parseExerciseName();
    if (!name) {
      this.addError('Expected exercise name after sets/reps');
      return null;
    }

    const modifiers = this.parseModifiers();

    // Distribute modifiers across all sets
    const exerciseSets = Array(sets.setCount).fill(null).map(() => ({
      reps: sets.reps,
      ...modifiers
    }));

    return {
      name,
      sets: exerciseSets
    };
  }

  // Weight first: 225 3x5 Squat
  private parseWeightFirstNotation(): Exercise | null {
    if (!this.checkNumber()) return null;
    
    const weight = this.parseWeight();
    if (!weight) return null;

    const sets = this.parseSetsReps();
    if (!sets) return null;

    const name = this.parseExerciseName();
    if (!name) return null;

    const modifiers = this.parseModifiers();

    const exerciseSets = Array(sets.setCount).fill(null).map(() => ({
      reps: sets.reps,
      weight,
      ...modifiers
    }));

    return {
      name,
      sets: exerciseSets
    };
  }

  // At notation: 3x5@225 Squat
  private parseAtNotation(): Exercise | null {
    const sets = this.parseSetsReps();
    if (!sets) return null;

    if (!this.match(TokenType.AT)) return null;

    const weight = this.parseWeight();
    if (!weight) return null;

    const name = this.parseExerciseName();
    if (!name) return null;

    const modifiers = this.parseModifiers();

    const exerciseSets = Array(sets.setCount).fill(null).map(() => ({
      reps: sets.reps,
      weight,
      ...modifiers
    }));

    return {
      name,
      sets: exerciseSets
    };
  }

  // Comma notation: 225x5,5,3 Squat (different reps per set)
  private parseCommaNotation(): Exercise | null {
    if (!this.checkNumber()) return null;
    
    const weight = this.parseWeight();
    if (!weight) return null;

    if (!this.match(TokenType.MULTIPLY)) return null;

    const repsList: number[] = [];
    
    // First rep count
    const firstReps = this.consumeNumber();
    if (firstReps === null) return null;
    repsList.push(firstReps);

    // Additional rep counts
    while (this.match(TokenType.COMMA)) {
      const reps = this.consumeNumber();
      if (reps === null) {
        this.addError('Expected number after comma');
        break;
      }
      repsList.push(reps);
    }

    const name = this.parseExerciseName();
    if (!name) return null;

    const modifiers = this.parseModifiers();

    const exerciseSets = repsList.map((reps, index) => ({
      reps,
      weight,
      failed: index === repsList.length - 1 && reps < repsList[0], // Last set with fewer reps might be failed
      ...modifiers
    }));

    return {
      name,
      sets: exerciseSets
    };
  }

  // Slash notation: 12/10/8 Curls (drop sets)
  private parseSlashNotation(): Exercise | null {
    const repsList: number[] = [];
    
    // First rep count
    const firstReps = this.consumeNumber();
    if (firstReps === null) return null;
    repsList.push(firstReps);

    // Must have at least one slash
    if (!this.match(TokenType.SLASH)) return null;

    // Additional rep counts
    do {
      const reps = this.consumeNumber();
      if (reps === null) {
        this.addError('Expected number after slash');
        break;
      }
      repsList.push(reps);
    } while (this.match(TokenType.SLASH));

    const name = this.parseExerciseName();
    if (!name) return null;

    const modifiers = this.parseModifiers();

    const exerciseSets = repsList.map(reps => ({
      reps,
      ...modifiers
    }));

    return {
      name,
      sets: exerciseSets,
      modifiers: { dropset: true }
    };
  }

  private parseSetsReps(): { setCount: number; reps: RepsValue } | null {
    const setCount = this.consumeNumber();
    if (setCount === null) return null;

    if (!this.match(TokenType.MULTIPLY)) return null;

    // Check for AMRAP
    if (this.match(TokenType.AMRAP)) {
      return { setCount, reps: 'AMRAP' };
    }

    // Check for range (8-12)
    const firstRep = this.consumeNumber();
    if (firstRep === null) return null;

    if (this.match(TokenType.DASH)) {
      const secondRep = this.consumeNumber();
      if (secondRep === null) {
        this.addError('Expected number after dash in rep range');
        return null;
      }
      return { 
        setCount, 
        reps: { min: firstRep, max: secondRep } as Range 
      };
    }

    return { setCount, reps: firstRep };
  }

  private parseExerciseName(): string | null {
    const words: string[] = [];

    while (!this.isAtEnd() && this.check(TokenType.WORD)) {
      words.push(this.advance().value);
    }

    if (words.length === 0) return null;

    const rawName = words.join(' ');
    
    // Try to match with known exercises
    const matchedExercise = ExerciseMatcher.findExercise(rawName);
    
    if (matchedExercise) {
      return matchedExercise;
    }
    
    // If no match found, check if it might be a misspelling
    const suggestions = ExerciseMatcher.getSuggestions(rawName);
    if (suggestions.length > 0) {
      this.suggestions.push({
        original: rawName,
        suggestion: suggestions[0],
        confidence: 0.8
      });
    }
    
    // Return the raw name anyway (user might be using custom exercise)
    return rawName;
  }

  private parseModifiers(): Partial<ExerciseSet> {
    const modifiers: Partial<ExerciseSet> = {};

    while (!this.isAtEnd()) {
      if (this.match(TokenType.AT)) {
        // RPE or weight
        if (this.match(TokenType.RPE) || (this.peek().type === TokenType.NUMBER && this.peekAhead()?.type !== TokenType.WEIGHT_UNIT)) {
          const rpe = this.consumeNumber();
          if (rpe !== null) {
            modifiers.rpe = rpe;
          }
        } else {
          const weight = this.parseWeight();
          if (weight) {
            modifiers.weight = weight;
          }
        }
      } else if (this.check(TokenType.NUMBER) && this.peekAhead()?.type === TokenType.WEIGHT_UNIT) {
        // Weight with unit
        const weight = this.parseWeight();
        if (weight) {
          modifiers.weight = weight;
        }
      } else if (this.match(TokenType.REST) || (this.check(TokenType.WORD) && this.peek().value.toLowerCase() === 'r')) {
        // Rest period
        if (this.peek().value.toLowerCase() === 'r') this.advance();
        const rest = this.consumeNumber();
        if (rest !== null) {
          modifiers.rest = rest;
          // Optional time unit
          this.match(TokenType.TIME_UNIT);
        }
      } else if (this.match(TokenType.TEMPO)) {
        // Tempo notation
        const tempo = this.parseTempo();
        if (tempo) {
          modifiers.tempo = tempo;
        }
      } else {
        break;
      }
    }

    return modifiers;
  }

  private parseWeight(): Weight | null {
    if (this.match(TokenType.BW)) {
      return { value: 0, isBodyweight: true };
    }

    const value = this.consumeNumber();
    if (value === null) return null;

    let unit: 'lbs' | 'kg' | undefined;
    let percentage = false;

    if (this.match(TokenType.PERCENT)) {
      percentage = true;
    } else if (this.match(TokenType.WEIGHT_UNIT)) {
      const unitToken = this.previous().value.toLowerCase();
      unit = unitToken.startsWith('k') ? 'kg' : 'lbs';
    }

    return { value, unit, percentage };
  }

  private parseTempo(): Tempo | null {
    // Expect format like 2-1-2 or 2-1-2-1
    const eccentric = this.consumeNumber();
    if (eccentric === null) return null;

    if (!this.match(TokenType.DASH)) return null;

    const pause = this.consumeNumber();
    if (pause === null) return null;

    if (!this.match(TokenType.DASH)) return null;

    const concentric = this.consumeNumber();
    if (concentric === null) return null;

    let pauseTop: number | undefined;
    if (this.match(TokenType.DASH)) {
      pauseTop = this.consumeNumber() ?? undefined;
    }

    return { eccentric, pause, concentric, pauseTop };
  }

  // Helper methods
  private match(...types: TokenType[]): boolean {
    for (const type of types) {
      if (this.check(type)) {
        this.advance();
        return true;
      }
    }
    return false;
  }

  private check(type: TokenType): boolean {
    if (this.isAtEnd()) return false;
    return this.peek().type === type;
  }

  private checkNumber(): boolean {
    return this.check(TokenType.NUMBER);
  }

  private advance(): Token {
    if (!this.isAtEnd()) this.current++;
    return this.previous();
  }

  private isAtEnd(): boolean {
    return this.peek().type === TokenType.EOF;
  }

  private peek(): Token {
    return this.tokens[this.current];
  }

  private peekAhead(): Token | null {
    if (this.current + 1 >= this.tokens.length) return null;
    return this.tokens[this.current + 1];
  }

  private previous(): Token {
    return this.tokens[this.current - 1];
  }

  private consumeNumber(): number | null {
    if (!this.check(TokenType.NUMBER)) return null;
    const token = this.advance();
    return parseFloat(token.value);
  }

  private peekExercise(): boolean {
    // Simple heuristic: check if next tokens look like an exercise
    const savedPosition = this.current;
    
    // Skip optional weight
    if (this.check(TokenType.NUMBER)) {
      this.advance();
      this.match(TokenType.WEIGHT_UNIT);
    }

    // Look for sets x reps pattern
    const hasExercise = this.check(TokenType.NUMBER) && 
                       this.peekAhead()?.type === TokenType.MULTIPLY;

    this.current = savedPosition;
    return hasExercise;
  }

  private skipToNextExercise(): void {
    while (!this.isAtEnd() && 
           !this.check(TokenType.NEWLINE) && 
           !this.check(TokenType.PLUS) && 
           !this.check(TokenType.SUPERSET)) {
      this.advance();
    }
  }

  private addError(message: string, suggestion?: string): void {
    const token = this.peek();
    this.errors.push({
      position: token.position,
      line: token.line,
      column: token.column,
      message,
      suggestion,
      severity: 'error'
    });
  }

  private getSuggestionForFailedParse(): string {
    // Analyze tokens to provide helpful suggestions
    const tokens = this.tokens.slice(Math.max(0, this.current - 3), this.current + 3);
    const hasNumber = tokens.some(t => t.type === TokenType.NUMBER);
    const hasMultiply = tokens.some(t => t.type === TokenType.MULTIPLY);
    
    if (hasNumber && !hasMultiply) {
      return 'Try using format like "3x10" for sets and reps';
    }
    
    if (hasMultiply && !hasNumber) {
      return 'Missing numbers for sets or reps';
    }
    
    return 'Try formats like "3x10 Squat", "225 3x5 Bench", or "5@225 Deadlift"';
  }
}