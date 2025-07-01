// Token types for the workout parser
export enum TokenType {
  // Numbers and operators
  NUMBER = 'NUMBER',
  MULTIPLY = 'MULTIPLY',           // x, X, ×, *
  PLUS = 'PLUS',                   // +
  DASH = 'DASH',                   // -
  COMMA = 'COMMA',                 // ,
  SLASH = 'SLASH',                 // /
  COLON = 'COLON',                 // :
  AT = 'AT',                       // @
  PERCENT = 'PERCENT',             // %
  LPAREN = 'LPAREN',               // (
  RPAREN = 'RPAREN',               // )
  
  // Keywords
  SUPERSET = 'SUPERSET',           // ss, SS
  RPE = 'RPE',                     // RPE, rpe
  REST = 'REST',                   // R, rest
  TEMPO = 'TEMPO',                 // tempo
  DROP = 'DROP',                   // drop, dropset
  AMRAP = 'AMRAP',                 // AMRAP, amrap
  BW = 'BW',                       // BW, bodyweight
  RM = 'RM',                       // RM, rep max
  
  // Units
  WEIGHT_UNIT = 'WEIGHT_UNIT',     // lbs, kg, lb, pounds, kilos
  TIME_UNIT = 'TIME_UNIT',         // s, sec, min, m
  
  // General
  WORD = 'WORD',                   // Exercise names and other words
  NEWLINE = 'NEWLINE',             // Line breaks
  EOF = 'EOF',                     // End of input
  UNKNOWN = 'UNKNOWN'              // Unknown tokens
}

export interface Token {
  type: TokenType;
  value: string;
  position: number;
  line: number;
  column: number;
}

// AST Node Types
export interface Weight {
  value: number;
  max?: number;          // For weight ranges (e.g., 25-35lbs)
  unit?: 'lbs' | 'kg';
  isBodyweight?: boolean;
  percentage?: boolean;  // For percentage-based training
  perSide?: boolean;     // For "on each side" notation
}

export interface Tempo {
  eccentric: number;     // Lowering phase
  pause: number;         // Pause at bottom
  concentric: number;    // Lifting phase
  pauseTop?: number;     // Pause at top (optional)
}

export interface Range {
  min: number;
  max: number;
}

export type RepsValue = number | Range | 'AMRAP';

export interface ExerciseSet {
  reps: RepsValue;
  weight?: Weight;
  rpe?: number;
  tempo?: Tempo;
  rest?: number;  // Rest in seconds
  failed?: boolean;  // For marking failed sets
}

export interface Exercise {
  name: string;
  sets: ExerciseSet[];
  notes?: string[];
  modifiers?: {
    superset?: boolean;
    dropset?: boolean;
    cluster?: boolean;
    circuit?: boolean;
  };
}

export interface ExerciseGroup {
  type: 'single' | 'superset' | 'circuit' | 'dropset' | 'cluster';
  exercises: Exercise[];
  rest?: number;  // Rest between exercises in group
}

export interface Workout {
  groups: ExerciseGroup[];
  totalVolume?: number;
  estimatedDuration?: number;
}

// Parser Result Types
export interface ParseError {
  position: number;
  line: number;
  column: number;
  message: string;
  suggestion?: string;
  severity: 'error' | 'warning';
}

export interface ParseSuggestion {
  original: string;
  suggestion: string;
  confidence: number;  // 0-1
}

export interface ParseResult {
  success: boolean;
  workout?: Workout;
  errors: ParseError[];
  suggestions: ParseSuggestion[];
  tokens?: Token[];  // For debugging
}