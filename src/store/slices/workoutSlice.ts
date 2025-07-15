import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

export interface ProgressionConfig {
  type: 'linear' | 'percentage' | 'rpe' | 'deload';
  increment: number;
  backoffPercentage: number;
  maxFailures: number;
  restTimeIncrease?: number; // seconds to add on failure
}

export interface SupersetGroup {
  id: string;
  name: string;
  exerciseIds: string[];
  currentExerciseIndex: number;
  restBetweenExercises: number; // shorter rest between superset exercises
  restAfterSet: number; // normal rest after completing full superset
}

export interface WorkoutExercise {
  id: string;
  exerciseId: string;
  exerciseName: string;
  sets: WorkoutSet[];
  restTimeSeconds?: number;
  notes?: string;
  completed: boolean;
  isSuperset?: boolean;
  supersetGroup?: string;
  progression?: ProgressionConfig;
  videoLinks?: string[];
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
  failed?: boolean;
  failureCount?: number;
  rpe?: number; // Rate of Perceived Exertion (1-10)
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
  supersetGroups?: SupersetGroup[];
  currentSupersetGroup?: string;
  totalVolume?: number; // total weight x reps
  averageRPE?: number;
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
      console.log('[workoutSlice] endWorkout reducer - activeWorkout before:', state.activeWorkout);
      if (state.activeWorkout) {
        state.workoutHistory.unshift(state.activeWorkout.id);
        state.activeWorkout = null;
      }
      state.restTimer = initialState.restTimer;
      console.log('[workoutSlice] endWorkout reducer - activeWorkout after:', state.activeWorkout);
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

    markSetAsFailed: (state, action: PayloadAction<{ exerciseIndex: number; setIndex: number; rpe?: number }>) => {
      if (state.activeWorkout) {
        const exercise = state.activeWorkout.exercises[action.payload.exerciseIndex];
        const set = exercise.sets[action.payload.setIndex];
        
        set.failed = true;
        set.completed = true;
        set.failureCount = (set.failureCount || 0) + 1;
        if (action.payload.rpe) {
          set.rpe = action.payload.rpe;
        }

        // Apply back-off weight calculation
        if (set.weight && exercise.progression) {
          const backoffAmount = set.weight * (exercise.progression.backoffPercentage / 100);
          const newWeight = Math.max(set.weight - backoffAmount, 0);
          
          // Update remaining sets with reduced weight
          exercise.sets.slice(action.payload.setIndex + 1).forEach(nextSet => {
            if (nextSet.weight) {
              nextSet.weight = newWeight;
            }
          });
        }
      }
    },

    calculateProgression: (state, action: PayloadAction<{ exerciseIndex: number }>) => {
      if (state.activeWorkout) {
        const exercise = state.activeWorkout.exercises[action.payload.exerciseIndex];
        const lastSet = exercise.sets[exercise.sets.length - 1];
        
        if (lastSet.completed && !lastSet.failed && exercise.progression) {
          const { type, increment } = exercise.progression;
          
          switch (type) {
            case 'linear':
              if (lastSet.weight) {
                lastSet.weight += increment;
              }
              break;
            case 'percentage':
              if (lastSet.weight) {
                lastSet.weight = Math.round(lastSet.weight * (1 + increment / 100));
              }
              break;
            case 'rpe':
              // RPE-based progression logic
              if (lastSet.rpe && lastSet.rpe <= 7) {
                // If RPE is 7 or below, increase weight
                if (lastSet.weight) {
                  lastSet.weight += increment;
                }
              }
              break;
          }
        }
      }
    },

    startSuperset: (state, action: PayloadAction<{ supersetId: string }>) => {
      if (state.activeWorkout) {
        state.activeWorkout.currentSupersetGroup = action.payload.supersetId;
        const supersetGroup = state.activeWorkout.supersetGroups?.find(
          group => group.id === action.payload.supersetId
        );
        if (supersetGroup) {
          supersetGroup.currentExerciseIndex = 0;
        }
      }
    },

    nextSupersetExercise: (state) => {
      if (state.activeWorkout && state.activeWorkout.currentSupersetGroup) {
        const supersetGroup = state.activeWorkout.supersetGroups?.find(
          group => group.id === state.activeWorkout!.currentSupersetGroup
        );
        if (supersetGroup && supersetGroup.currentExerciseIndex < supersetGroup.exerciseIds.length - 1) {
          supersetGroup.currentExerciseIndex += 1;
          // Find and navigate to next exercise in superset
          const nextExerciseId = supersetGroup.exerciseIds[supersetGroup.currentExerciseIndex];
          const nextExerciseIndex = state.activeWorkout.exercises.findIndex(
            ex => ex.exerciseId === nextExerciseId
          );
          if (nextExerciseIndex !== -1) {
            state.activeWorkout.currentExerciseIndex = nextExerciseIndex;
            state.activeWorkout.currentSetIndex = 0;
          }
        }
      }
    },

    completeSupersetRound: (state) => {
      if (state.activeWorkout && state.activeWorkout.currentSupersetGroup) {
        const supersetGroup = state.activeWorkout.supersetGroups?.find(
          group => group.id === state.activeWorkout!.currentSupersetGroup
        );
        if (supersetGroup) {
          // Reset to first exercise in superset for next round
          supersetGroup.currentExerciseIndex = 0;
          const firstExerciseId = supersetGroup.exerciseIds[0];
          const firstExerciseIndex = state.activeWorkout.exercises.findIndex(
            ex => ex.exerciseId === firstExerciseId
          );
          if (firstExerciseIndex !== -1) {
            state.activeWorkout.currentExerciseIndex = firstExerciseIndex;
            // Move to next set
            state.activeWorkout.currentSetIndex += 1;
          }
        }
      }
    },

    endSuperset: (state) => {
      if (state.activeWorkout) {
        state.activeWorkout.currentSupersetGroup = undefined;
      }
    },

    updateWorkoutStats: (state) => {
      if (state.activeWorkout) {
        // Calculate total volume (weight x reps)
        let totalVolume = 0;
        let totalRPE = 0;
        let rpeCount = 0;

        state.activeWorkout.exercises.forEach(exercise => {
          exercise.sets.forEach(set => {
            if (set.completed && set.actualWeight && set.actualReps) {
              totalVolume += set.actualWeight * set.actualReps;
            }
            if (set.rpe) {
              totalRPE += set.rpe;
              rpeCount += 1;
            }
          });
        });

        state.activeWorkout.totalVolume = totalVolume;
        state.activeWorkout.averageRPE = rpeCount > 0 ? totalRPE / rpeCount : undefined;
      }
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
  markSetAsFailed,
  calculateProgression,
  startSuperset,
  nextSupersetExercise,
  completeSupersetRound,
  endSuperset,
  updateWorkoutStats,
} = workoutSlice.actions;

export default workoutSlice.reducer;