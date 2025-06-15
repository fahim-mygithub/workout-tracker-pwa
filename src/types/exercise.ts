export interface Exercise {
  id: string;
  muscleGroup: string;
  name: string;
  equipment: string;
  videoLinks: string[];
  difficulty: ExerciseDifficulty;
  force: ExerciseForce | null;
  grips: ExerciseGrip | null;
  mechanic: ExerciseMechanic | null;
  instructions: string[];
  searchKeywords: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ExerciseRaw {
  'Muscle Group': string;
  'Exercise Name': string;
  'Equipment': string;
  'Video Links': string;
  'Difficulty': string;
  'Force': string;
  'Grips': string;
  'Mechanic': string;
  'Instructions': string;
}

export type ExerciseDifficulty = 
  | 'Novice' 
  | 'Beginner' 
  | 'Intermediate' 
  | 'Advanced' 
  | 'Expert';

export type ExerciseForce = 
  | 'Push' 
  | 'Pull' 
  | 'Hold' 
  | 'Static';

export type ExerciseGrip = 
  | 'Overhand: Pronated'
  | 'Underhand: Supinated' 
  | 'Neutral'
  | 'Mixed'
  | 'Hook'
  | 'Wide'
  | 'Narrow';

export type ExerciseMechanic = 
  | 'Isolation' 
  | 'Compound';

// ExerciseFilter is defined in store/slices/exerciseSlice.ts

export interface ExerciseSearchResult {
  exercises: Exercise[];
  totalCount: number;
  hasMore: boolean;
}

export interface ExerciseStats {
  totalExercises: number;
  byMuscleGroup: Record<string, number>;
  byEquipment: Record<string, number>;
  byDifficulty: Record<ExerciseDifficulty, number>;
}