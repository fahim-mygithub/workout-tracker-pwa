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

    // Validate input
    if (!input || typeof input !== 'string') {
      return {
        success: false,
        errors: [{
          position: 0,
          line: 1,
          column: 1,
          message: 'Invalid input provided',
          severity: 'error'
        }],
        suggestions: []
      };
    }

    // Limit input size to prevent OOM
    const maxInputLength = 10000;
    if (input.length > maxInputLength) {
      return {
        success: false,
        errors: [{
          position: 0,
          line: 1,
          column: 1,
          message: `Input too long (${input.length} characters). Maximum allowed: ${maxInputLength}`,
          severity: 'error'
        }],
        suggestions: []
      };
    }

    // Tokenize input
    try {
      this.tokens = Tokenizer.tokenize(input);
      
      // Limit token count to prevent memory issues
      const maxTokens = 5000;
      if (this.tokens.length > maxTokens) {
        return {
          success: false,
          errors: [{
            position: 0,
            line: 1,
            column: 1,
            message: `Too many tokens (${this.tokens.length}). Maximum allowed: ${maxTokens}`,
            severity: 'error'
          }],
          suggestions: []
        };
      }
    } catch (error) {
      console.error('Tokenization error:', error);
      return {
        success: false,
        errors: [{
          position: 0,
          line: 1,
          column: 1,
          message: 'Failed to tokenize input: ' + (error instanceof Error ? error.message : 'Unknown error'),
          severity: 'error'
        }],
        suggestions: []
      };
    }

    // Parse workout with timeout protection
    const startTime = Date.now();
    const maxParseTime = 2000; // 2 seconds max
    
    try {
      const workout = this.parseWorkout();
      
      // Check if parsing took too long
      if (Date.now() - startTime > maxParseTime) {
        this.addError('Parsing took too long. Please simplify your workout notation.');
      }
      
      return {
        success: this.errors.length === 0,
        workout,
        errors: this.errors,
        suggestions: this.suggestions
      };
    } catch (error) {
      console.error('Parse error:', error);
      this.addError('Unexpected parsing error: ' + (error instanceof Error ? error.message : 'Unknown error'));
      
      return {
        success: false,
        errors: this.errors,
        suggestions: this.suggestions
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
    // Try different parsing strategies - start with simple ones first
    const strategies = [
      () => this.parseStandardNotation(),      // 5x10 Squat
      () => this.parseWeightFirstNotation(),   // 225 3x5 Squat
      () => this.parseAtNotation(),            // 3x5@225 Squat
      () => this.parseSlashNotation(),         // 12/10/8 Curls
      () => this.parseCommaNotation(),         // 225x5,5,5 Squat
      () => this.parseComplexNotation(),       // 5x DB Press (2x failure @85) (3x8-10 @75)
    ];

    for (const strategy of strategies) {
      const savePoint = this.current;
      
      try {
        const exercise = strategy();
        
        if (exercise && exercise.name && exercise.sets.length > 0) {
          return exercise;
        }
      } catch (error) {
        // Strategy failed, continue to next one
        console.debug('Parse strategy failed:', error);
      }
      
      // Reset to try next strategy
      this.current = savePoint;
    }

    // If all strategies fail, try to provide helpful error
    this.addError('Unable to parse exercise notation', this.getSuggestionForFailedParse());
    this.skipToNextExercise();
    
    return null;
  }

  // Complex notation with parenthetical variations: 5x Incline DB (2x failure @85) (3x8-10 @75)
  private parseComplexNotation(): Exercise | null {
    const startPosition = this.current;
    
    // First, try to parse total sets
    const totalSets = this.consumeNumber();
    if (totalSets === null || totalSets <= 0 || totalSets > 100) {
      this.current = startPosition;
      return null;
    }
    
    // Check for 'x' without specific reps (indicates complex notation)
    if (!this.match(TokenType.MULTIPLY)) {
      this.current = startPosition;
      return null;
    }
    
    // If there's a number right after 'x', this is standard notation
    if (this.check(TokenType.NUMBER)) {
      this.current = startPosition;
      return null;
    }
    
    // Parse exercise name - must come before parentheses
    const name = this.parseExerciseName();
    if (!name || name.trim() === '') {
      this.current = startPosition;
      return null;
    }
    
    const allSets: ExerciseSet[] = [];
    let notes: string[] = [];
    
    // Check if we actually have parentheses, otherwise just use default sets
    if (!this.check(TokenType.LPAREN)) {
      // No parentheses, just create default sets
      const modifiers = this.parseModifiers();
      const safeSetCount = Math.min(totalSets, 100);
      for (let i = 0; i < safeSetCount; i++) {
        allSets.push({ reps: 10, ...modifiers });
      }
      return {
        name,
        sets: allSets,
        notes: notes.length > 0 ? notes : undefined
      };
    }
    
    // Look for parenthetical set variations
    let parenCount = 0;
    const maxParens = 5;
    
    while (this.check(TokenType.LPAREN) && parenCount < maxParens) {
      if (!this.match(TokenType.LPAREN)) break;
      parenCount++;
      
      const setVariation = this.parseSetVariation();
      if (setVariation && setVariation.sets.length > 0) {
        allSets.push(...setVariation.sets);
        if (setVariation.note) {
          notes.push(setVariation.note);
        }
      }
      
      // Consume closing parenthesis if present
      this.match(TokenType.RPAREN);
    }
    
    // If we didn't parse any sets, create defaults
    if (allSets.length === 0) {
      const safeSetCount = Math.min(totalSets, 100);
      for (let i = 0; i < safeSetCount; i++) {
        allSets.push({ reps: 10 });
      }
    }
    
    return {
      name,
      sets: allSets,
      notes: notes.length > 0 ? notes : undefined
    };
  }
  
  // Parse set variation inside parentheses
  private parseSetVariation(): { sets: ExerciseSet[], note?: string } | null {
    const sets: ExerciseSet[] = [];
    let note: string | undefined;
    
    // Save position in case we need to backtrack
    const startPos = this.current;
    
    // Parse sets x reps pattern
    const setCount = this.consumeNumber();
    if (setCount === null || setCount > 100) {
      // Reset and try to parse special instruction
      this.current = startPos;
      const instruction = this.parseSpecialInstruction();
      if (instruction) {
        note = instruction;
      }
      return { sets: [], note };
    }
    
    if (!this.match(TokenType.MULTIPLY)) {
      // Reset if no multiply sign
      this.current = startPos;
      return { sets: [], note: undefined };
    }
    
    // Parse reps (could be range, AMRAP, or number)
    let reps: RepsValue = 10; // Default
    
    if (this.match(TokenType.AMRAP)) {
      reps = 'AMRAP';
    } else if (this.check(TokenType.NUMBER)) {
      const firstRep = this.consumeNumber();
      if (firstRep !== null) {
        // Check for range
        if (this.match(TokenType.DASH) && this.check(TokenType.NUMBER)) {
          const secondRep = this.consumeNumber();
          if (secondRep !== null && secondRep > firstRep) {
            reps = { min: firstRep, max: secondRep };
          } else {
            reps = firstRep;
          }
        } else {
          reps = firstRep;
        }
      }
    } else if (this.check(TokenType.WORD)) {
      // Check for "failure" keyword
      const savedPos = this.current;
      const word = this.advance().value.toLowerCase();
      if (word === 'failure' || word === 'fail') {
        reps = 'AMRAP';
        note = 'to failure';
      } else {
        // Reset if not a recognized keyword
        this.current = savedPos;
      }
    }
    
    // Parse modifiers but limit iterations
    const modifiers = this.parseModifiersLimited(10);
    
    // Create sets with parsed information
    const safeCount = Math.min(Math.max(0, setCount), 20);
    for (let i = 0; i < safeCount; i++) {
      sets.push({ reps, ...modifiers });
    }
    
    return { sets, note };
  }
  
  // Limited version of parseModifiers for use within parentheses
  private parseModifiersLimited(maxIterations: number): Partial<ExerciseSet> {
    const modifiers: Partial<ExerciseSet> = {};
    let iterations = 0;
    
    while (!this.isAtEnd() && iterations < maxIterations && this.peek().type !== TokenType.RPAREN) {
      iterations++;
      
      if (this.match(TokenType.AT)) {
        // Try to parse weight after @
        const weight = this.parseWeight();
        if (weight) {
          modifiers.weight = weight;
        }
      } else if (this.match(TokenType.WORD)) {
        // Consume but don't process random words
        continue;
      } else {
        break;
      }
    }
    
    return modifiers;
  }
  
  // Parse special instructions
  private parseSpecialInstruction(): string | null {
    const words: string[] = [];
    let wordCount = 0;
    const maxWords = 20;
    
    while (this.check(TokenType.WORD) && !this.check(TokenType.RPAREN) && wordCount < maxWords) {
      // Check if we're at the closing parenthesis
      if (this.peek().type === TokenType.RPAREN) {
        break;
      }
      
      const word = this.advance().value;
      words.push(word);
      wordCount++;
      
      // Stop if we hit something that looks like a new exercise or set notation
      if (this.check(TokenType.NUMBER) || this.check(TokenType.SUPERSET)) {
        break;
      }
    }
    
    return words.length > 0 ? words.join(' ') : null;
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
    const setCount = Math.min(Math.max(1, Math.floor(sets.setCount)), 100); // Ensure valid integer
    
    const exerciseSets: ExerciseSet[] = [];
    for (let i = 0; i < setCount; i++) {
      exerciseSets.push({
        reps: sets.reps,
        ...modifiers
      });
    }

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

    const setCount = Math.min(Math.max(1, Math.floor(sets.setCount)), 100); // Ensure valid integer
    
    const exerciseSets: ExerciseSet[] = [];
    for (let i = 0; i < setCount; i++) {
      exerciseSets.push({
        reps: sets.reps,
        weight,
        ...modifiers
      });
    }

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

    const setCount = Math.min(Math.max(1, Math.floor(sets.setCount)), 100); // Ensure valid integer
    
    const exerciseSets: ExerciseSet[] = [];
    for (let i = 0; i < setCount; i++) {
      exerciseSets.push({
        reps: sets.reps,
        weight,
        ...modifiers
      });
    }

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
    if (setCount === null || setCount <= 0 || setCount > 100) return null;

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
    const stopTokens = [
      TokenType.AT, TokenType.LPAREN, TokenType.RPAREN, 
      TokenType.SUPERSET, TokenType.NEWLINE, TokenType.EOF,
      TokenType.REST
    ];
    
    let wordCount = 0;
    const maxWords = 10; // Limit exercise name length

    while (!this.isAtEnd() && !stopTokens.includes(this.peek().type) && wordCount < maxWords) {
      if (this.check(TokenType.WORD)) {
        words.push(this.advance().value);
        wordCount++;
      } else if (this.check(TokenType.NUMBER)) {
        // Stop if we see a number that looks like sets (e.g., "4x" in next exercise)
        if (this.peekAhead()?.type === TokenType.MULTIPLY) {
          break;
        }
        // Otherwise include the number in exercise name (e.g., "21s")
        words.push(this.advance().value);
        wordCount++;
      } else if (this.check(TokenType.DASH) && words.length > 0 && wordCount < maxWords - 1) {
        // Include dashes in exercise names (e.g., "Y-Raises")
        words.push(this.advance().value);
      } else {
        break;
      }
    }

    if (words.length === 0) return null;

    // Clean up the name (remove trailing dashes, etc.)
    let rawName = words.join(' ').trim();
    if (rawName.endsWith('-')) {
      rawName = rawName.slice(0, -1).trim();
    }
    
    // Limit final name length
    if (rawName.length > 100) {
      rawName = rawName.substring(0, 100);
    }
    
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
    let iterationCount = 0;
    const maxIterations = 50;

    while (!this.isAtEnd() && iterationCount < maxIterations) {
      iterationCount++;
      if (this.match(TokenType.AT)) {
        // Weight after @ symbol
        const weight = this.parseWeight();
        if (weight) {
          modifiers.weight = weight;
        } else {
          // Try RPE if not weight
          const rpe = this.consumeNumber();
          if (rpe !== null && rpe >= 1 && rpe <= 10) {
            modifiers.rpe = rpe;
          }
        }
      } else if (this.check(TokenType.NUMBER)) {
        // Check if it's weight (with unit) or standalone
        const nextToken = this.peekAhead();
        if (nextToken && (nextToken.type === TokenType.WEIGHT_UNIT || 
            (nextToken.type === TokenType.WORD && 
             (nextToken.value.toLowerCase() === 'on' || 
              nextToken.value.toLowerCase() === 'each' ||
              nextToken.value.toLowerCase() === 'per')))) {
          const weight = this.parseWeight();
          if (weight) {
            modifiers.weight = weight;
          }
        } else {
          // Could be RPE or other number
          break;
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
      } else if (this.match(TokenType.RPE)) {
        // Explicit RPE notation
        const rpe = this.consumeNumber();
        if (rpe !== null) {
          modifiers.rpe = rpe;
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

    // Check for weight range (e.g., 25-35lbs)
    let maxValue: number | undefined;
    if (this.match(TokenType.DASH)) {
      maxValue = this.consumeNumber() || undefined;
    }

    let unit: 'lbs' | 'kg' | undefined;
    let percentage = false;
    let perSide = false;

    if (this.match(TokenType.PERCENT)) {
      percentage = true;
    } else if (this.match(TokenType.WEIGHT_UNIT)) {
      const unitToken = this.previous().value.toLowerCase();
      unit = unitToken.startsWith('k') ? 'kg' : 'lbs';
    }

    // Check for "on each side" or "per side" notation
    if (this.check(TokenType.WORD)) {
      const nextWords = [];
      const savedPosition = this.current;
      
      // Look ahead for "on each side", "per side", etc.
      for (let i = 0; i < 3 && this.check(TokenType.WORD); i++) {
        nextWords.push(this.advance().value.toLowerCase());
      }
      
      const phrase = nextWords.join(' ');
      if (phrase.includes('each side') || phrase.includes('per side') || 
          phrase.includes('on each') || phrase.includes('per arm')) {
        perSide = true;
      } else {
        // Reset position if not a weight modifier
        this.current = savedPosition;
      }
    }

    const weight: Weight = { value, unit, percentage };
    if (maxValue !== undefined) {
      weight.max = maxValue;
    }
    if (perSide) {
      weight.perSide = true;
    }

    return weight;
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
    const value = parseFloat(token.value);
    
    // Validate the number
    if (isNaN(value) || !isFinite(value)) {
      return null;
    }
    
    return value;
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
    let safetyCounter = 0;
    const maxIterations = 1000;
    
    while (!this.isAtEnd() && 
           !this.check(TokenType.NEWLINE) && 
           !this.check(TokenType.PLUS) && 
           !this.check(TokenType.SUPERSET) &&
           safetyCounter < maxIterations) {
      this.advance();
      safetyCounter++;
    }
    
    if (safetyCounter >= maxIterations) {
      console.error('Infinite loop detected in skipToNextExercise');
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