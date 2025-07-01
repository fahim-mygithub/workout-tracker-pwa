export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  birthday?: Date;
  gender?: 'male' | 'female' | 'other' | 'prefer-not-to-say';
  experienceLevel?: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  
  // Physical stats
  height?: number; // stored in cm
  weight?: number; // stored in kg
  heightUnit: 'cm' | 'ft';
  weightUnit: 'kg' | 'lbs';
  
  // Preferences
  preferences: UserPreferences;
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  lastSyncedAt?: Date;
}

export interface UserPreferences {
  darkMode: boolean;
  unitSystem: 'metric' | 'imperial';
  defaultRestTime: number; // in seconds
  autoStartTimer: boolean;
  notifications: {
    workoutReminders: boolean;
    restTimerAlerts: boolean;
    achievements: boolean;
  };
}

export interface WorkoutData {
  id: string;
  userId: string;
  name: string;
  description?: string;
  exercises: WorkoutExercise[];
  tags: string[];
  category?: WorkoutCategory;
  isPublic: boolean;
  shareableId?: string;
  createdAt: Date;
  updatedAt: Date;
  lastPerformedAt?: Date;
  performanceCount: number;
}

export interface WorkoutExercise {
  exerciseId: string;
  exerciseName: string;
  sets: ExerciseSet[];
  notes?: string;
  restTime?: number; // override default rest time
  supersetWith?: string[]; // exercise IDs in same superset
}

export interface ExerciseSet {
  targetReps?: number;
  targetWeight?: number;
  targetTime?: number; // for time-based exercises
  targetDistance?: number; // for distance-based exercises
  rpe?: number;
}

export interface ExerciseHistory {
  id: string;
  userId: string;
  exerciseId: string;
  exerciseName: string;
  workoutId?: string;
  workoutName?: string;
  performedAt: Date;
  sets: PerformedSet[];
  personalRecords?: {
    maxWeight?: boolean;
    maxReps?: boolean;
    maxVolume?: boolean;
  };
  muscleGroups?: string[];
  equipment?: string;
  notes?: string;
}

export interface PerformedSet {
  setNumber: number;
  targetReps?: number;
  targetWeight?: number;
  actualReps?: number;
  actualWeight?: number;
  time?: number;
  distance?: number;
  rpe?: number;
  completed: boolean;
  notes?: string;
}

export type WorkoutCategory = 
  | 'strength'
  | 'cardio'
  | 'flexibility'
  | 'sports'
  | 'rehabilitation'
  | 'custom';

export interface SharedWorkout {
  id: string;
  workoutData: Omit<WorkoutData, 'userId'>;
  sharedBy: {
    displayName: string;
    photoURL?: string;
  };
  sharedAt: Date;
  viewCount: number;
}

// BMI Calculation helpers
export interface BMIData {
  bmi: number;
  category: 'underweight' | 'normal' | 'overweight' | 'obese';
  healthyWeightRange: {
    min: number;
    max: number;
  };
}

// Unit conversion helpers
export interface UnitConverters {
  kgToLbs: (kg: number) => number;
  lbsToKg: (lbs: number) => number;
  cmToFt: (cm: number) => { feet: number; inches: number };
  ftToCm: (feet: number, inches: number) => number;
}

