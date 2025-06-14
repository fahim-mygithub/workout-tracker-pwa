import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

export interface WorkoutExercise {
  id: string;
  exerciseId: string;
  exerciseName: string;
  sets: WorkoutSet[];
  restTimeSeconds?: number;
  notes?: string;
  completed: boolean;
}

export interface WorkoutSet {
  id: string;
  reps?: number;
  weight?: number;
  time?: number; // in seconds for time-based exercises
  distance?: number; // in meters for distance-based exercises
  completed: boolean;
  actualReps?: number;
  actualWeight?: number;
  actualTime?: number;
  actualDistance?: number;
}

export interface ActiveWorkout {
  id: string;
  name: string;
  exercises: WorkoutExercise[];
  startTime: string; // ISO string
  currentExerciseIndex: number;
  currentSetIndex: number;
  totalDuration: number; // in seconds
  isActive: boolean;
}

export interface RestTimer {
  isActive: boolean;
  timeRemaining: number; // in seconds
  totalTime: number;
  exerciseId?: string;
  autoStart: boolean;
}

interface WorkoutState {
  activeWorkout: ActiveWorkout | null;
  restTimer: RestTimer;
  workoutHistory: string[]; // workout IDs
  isLoading: boolean;
  error: string | null;
}

const initialState: WorkoutState = {
  activeWorkout: null,
  restTimer: {
    isActive: false,
    timeRemaining: 0,
    totalTime: 0,
    autoStart: true,
  },
  // Add some mock workout history for demonstration
  workoutHistory: [
    'workout-2024-12-13-001',
    'workout-2024-12-11-002', 
    'workout-2024-12-09-003',
    'workout-2024-12-07-004',
    'workout-2024-12-05-005'
  ],
  isLoading: false,
  error: null,
};

const workoutSlice = createSlice({
  name: 'workout',
  initialState,
  reducers: {
    startWorkout: (state, action: PayloadAction<Omit<ActiveWorkout, 'isActive' | 'startTime' | 'totalDuration'>>) => {
      state.activeWorkout = {
        ...action.payload,
        isActive: true,
        startTime: new Date().toISOString(),
        totalDuration: 0,
      };
      state.error = null;
    },

    endWorkout: (state) => {
      if (state.activeWorkout) {
        state.workoutHistory.unshift(state.activeWorkout.id);
        state.activeWorkout = null;
      }
      state.restTimer = initialState.restTimer;
    },

    pauseWorkout: (state) => {
      if (state.activeWorkout) {
        state.activeWorkout.isActive = false;
      }
    },

    resumeWorkout: (state) => {
      if (state.activeWorkout) {
        state.activeWorkout.isActive = true;
      }
    },

    nextExercise: (state) => {
      if (state.activeWorkout && state.activeWorkout.currentExerciseIndex < state.activeWorkout.exercises.length - 1) {
        state.activeWorkout.currentExerciseIndex += 1;
        state.activeWorkout.currentSetIndex = 0;
      }
    },

    previousExercise: (state) => {
      if (state.activeWorkout && state.activeWorkout.currentExerciseIndex > 0) {
        state.activeWorkout.currentExerciseIndex -= 1;
        state.activeWorkout.currentSetIndex = 0;
      }
    },

    nextSet: (state) => {
      if (state.activeWorkout) {
        const currentExercise = state.activeWorkout.exercises[state.activeWorkout.currentExerciseIndex];
        if (state.activeWorkout.currentSetIndex < currentExercise.sets.length - 1) {
          state.activeWorkout.currentSetIndex += 1;
        }
      }
    },

    previousSet: (state) => {
      if (state.activeWorkout && state.activeWorkout.currentSetIndex > 0) {
        state.activeWorkout.currentSetIndex -= 1;
      }
    },

    completeSet: (state, action: PayloadAction<{ exerciseIndex: number; setIndex: number; actualValues?: Partial<WorkoutSet> }>) => {
      if (state.activeWorkout) {
        const exercise = state.activeWorkout.exercises[action.payload.exerciseIndex];
        const set = exercise.sets[action.payload.setIndex];
        
        set.completed = true;
        if (action.payload.actualValues) {
          Object.assign(set, action.payload.actualValues);
        }

        // Check if exercise is complete
        if (exercise.sets.every(s => s.completed)) {
          exercise.completed = true;
        }
      }
    },

    uncompleteSet: (state, action: PayloadAction<{ exerciseIndex: number; setIndex: number }>) => {
      if (state.activeWorkout) {
        const exercise = state.activeWorkout.exercises[action.payload.exerciseIndex];
        const set = exercise.sets[action.payload.setIndex];
        
        set.completed = false;
        exercise.completed = false;
      }
    },

    updateWorkoutDuration: (state, action: PayloadAction<number>) => {
      if (state.activeWorkout) {
        state.activeWorkout.totalDuration = action.payload;
      }
    },

    startRestTimer: (state, action: PayloadAction<{ seconds: number; exerciseId?: string }>) => {
      state.restTimer = {
        isActive: true,
        timeRemaining: action.payload.seconds,
        totalTime: action.payload.seconds,
        exerciseId: action.payload.exerciseId,
        autoStart: state.restTimer.autoStart,
      };
    },

    updateRestTimer: (state, action: PayloadAction<number>) => {
      if (state.restTimer.isActive) {
        state.restTimer.timeRemaining = Math.max(0, action.payload);
        if (state.restTimer.timeRemaining === 0) {
          state.restTimer.isActive = false;
        }
      }
    },

    stopRestTimer: (state) => {
      state.restTimer.isActive = false;
      state.restTimer.timeRemaining = 0;
    },

    toggleAutoStartTimer: (state) => {
      state.restTimer.autoStart = !state.restTimer.autoStart;
    },

    setError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
    },

    clearError: (state) => {
      state.error = null;
    },

    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
  },
});

export const {
  startWorkout,
  endWorkout,
  pauseWorkout,
  resumeWorkout,
  nextExercise,
  previousExercise,
  nextSet,
  previousSet,
  completeSet,
  uncompleteSet,
  updateWorkoutDuration,
  startRestTimer,
  updateRestTimer,
  stopRestTimer,
  toggleAutoStartTimer,
  setError,
  clearError,
  setLoading,
} = workoutSlice.actions;

export default workoutSlice.reducer;