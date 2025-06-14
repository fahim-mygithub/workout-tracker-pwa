import { describe, it, expect } from 'vitest';
import workoutReducer, {
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
  startRestTimer,
  updateRestTimer,
  stopRestTimer,
  toggleAutoStartTimer,
  type ActiveWorkout,
  type WorkoutExercise,
} from '../slices/workoutSlice';

const mockWorkoutExercise: WorkoutExercise = {
  id: 'ex1',
  exerciseId: 'bench-press',
  exerciseName: 'Bench Press',
  sets: [
    { id: 'set1', reps: 5, weight: 80, completed: false },
    { id: 'set2', reps: 5, weight: 80, completed: false },
    { id: 'set3', reps: 5, weight: 80, completed: false },
  ],
  restTimeSeconds: 180,
  completed: false,
};

const mockActiveWorkout: Omit<ActiveWorkout, 'isActive' | 'startTime' | 'totalDuration'> = {
  id: 'workout1',
  name: 'Push Day',
  exercises: [mockWorkoutExercise],
  currentExerciseIndex: 0,
  currentSetIndex: 0,
};

describe('workoutSlice', () => {
  const initialState = {
    activeWorkout: null,
    restTimer: {
      isActive: false,
      timeRemaining: 0,
      totalTime: 0,
      autoStart: true,
    },
    workoutHistory: [],
    isLoading: false,
    error: null,
  };

  it('should return the initial state', () => {
    expect(workoutReducer(undefined, { type: 'unknown' })).toEqual(initialState);
  });

  describe('startWorkout', () => {
    it('should start a new workout', () => {
      const action = startWorkout(mockActiveWorkout);
      const state = workoutReducer(initialState, action);

      expect(state.activeWorkout).toBeDefined();
      expect(state.activeWorkout?.name).toBe('Push Day');
      expect(state.activeWorkout?.isActive).toBe(true);
      expect(state.activeWorkout?.startTime).toBeDefined();
      expect(state.activeWorkout?.totalDuration).toBe(0);
      expect(state.error).toBeNull();
    });
  });

  describe('endWorkout', () => {
    it('should end the active workout and add to history', () => {
      const stateWithWorkout = {
        ...initialState,
        activeWorkout: {
          ...mockActiveWorkout,
          isActive: true,
          startTime: new Date().toISOString(),
          totalDuration: 3600,
        },
      };

      const state = workoutReducer(stateWithWorkout, endWorkout());

      expect(state.activeWorkout).toBeNull();
      expect(state.workoutHistory).toContain('workout1');
      expect(state.restTimer.isActive).toBe(false);
    });
  });

  describe('pauseWorkout', () => {
    it('should pause the active workout', () => {
      const stateWithWorkout = {
        ...initialState,
        activeWorkout: {
          ...mockActiveWorkout,
          isActive: true,
          startTime: new Date().toISOString(),
          totalDuration: 1800,
        },
      };

      const state = workoutReducer(stateWithWorkout, pauseWorkout());

      expect(state.activeWorkout?.isActive).toBe(false);
    });
  });

  describe('resumeWorkout', () => {
    it('should resume the paused workout', () => {
      const stateWithPausedWorkout = {
        ...initialState,
        activeWorkout: {
          ...mockActiveWorkout,
          isActive: false,
          startTime: new Date().toISOString(),
          totalDuration: 1800,
        },
      };

      const state = workoutReducer(stateWithPausedWorkout, resumeWorkout());

      expect(state.activeWorkout?.isActive).toBe(true);
    });
  });

  describe('exercise navigation', () => {
    const workoutWithMultipleExercises = {
      ...mockActiveWorkout,
      exercises: [
        mockWorkoutExercise,
        { ...mockWorkoutExercise, id: 'ex2', exerciseName: 'Incline Press' },
      ],
    };

    const stateWithMultipleExercises = {
      ...initialState,
      activeWorkout: {
        ...workoutWithMultipleExercises,
        isActive: true,
        startTime: new Date().toISOString(),
        totalDuration: 0,
      },
    };

    it('should move to next exercise', () => {
      const state = workoutReducer(stateWithMultipleExercises, nextExercise());

      expect(state.activeWorkout?.currentExerciseIndex).toBe(1);
      expect(state.activeWorkout?.currentSetIndex).toBe(0);
    });

    it('should not move past last exercise', () => {
      const stateAtLastExercise = {
        ...stateWithMultipleExercises,
        activeWorkout: {
          ...stateWithMultipleExercises.activeWorkout!,
          currentExerciseIndex: 1,
        },
      };

      const state = workoutReducer(stateAtLastExercise, nextExercise());

      expect(state.activeWorkout?.currentExerciseIndex).toBe(1);
    });

    it('should move to previous exercise', () => {
      const stateAtSecondExercise = {
        ...stateWithMultipleExercises,
        activeWorkout: {
          ...stateWithMultipleExercises.activeWorkout!,
          currentExerciseIndex: 1,
        },
      };

      const state = workoutReducer(stateAtSecondExercise, previousExercise());

      expect(state.activeWorkout?.currentExerciseIndex).toBe(0);
      expect(state.activeWorkout?.currentSetIndex).toBe(0);
    });

    it('should not move before first exercise', () => {
      const state = workoutReducer(stateWithMultipleExercises, previousExercise());

      expect(state.activeWorkout?.currentExerciseIndex).toBe(0);
    });
  });

  describe('set navigation', () => {
    const stateWithWorkout = {
      ...initialState,
      activeWorkout: {
        ...mockActiveWorkout,
        isActive: true,
        startTime: new Date().toISOString(),
        totalDuration: 0,
      },
    };

    it('should move to next set', () => {
      const state = workoutReducer(stateWithWorkout, nextSet());

      expect(state.activeWorkout?.currentSetIndex).toBe(1);
    });

    it('should not move past last set', () => {
      const stateAtLastSet = {
        ...stateWithWorkout,
        activeWorkout: {
          ...stateWithWorkout.activeWorkout!,
          currentSetIndex: 2,
        },
      };

      const state = workoutReducer(stateAtLastSet, nextSet());

      expect(state.activeWorkout?.currentSetIndex).toBe(2);
    });

    it('should move to previous set', () => {
      const stateAtSecondSet = {
        ...stateWithWorkout,
        activeWorkout: {
          ...stateWithWorkout.activeWorkout!,
          currentSetIndex: 1,
        },
      };

      const state = workoutReducer(stateAtSecondSet, previousSet());

      expect(state.activeWorkout?.currentSetIndex).toBe(0);
    });

    it('should not move before first set', () => {
      const state = workoutReducer(stateWithWorkout, previousSet());

      expect(state.activeWorkout?.currentSetIndex).toBe(0);
    });
  });

  describe('set completion', () => {
    const stateWithWorkout = {
      ...initialState,
      activeWorkout: {
        ...mockActiveWorkout,
        isActive: true,
        startTime: new Date().toISOString(),
        totalDuration: 0,
      },
    };

    it('should complete a set', () => {
      const action = completeSet({
        exerciseIndex: 0,
        setIndex: 0,
        actualValues: { actualReps: 5, actualWeight: 82.5 },
      });

      const state = workoutReducer(stateWithWorkout, action);

      const completedSet = state.activeWorkout?.exercises[0].sets[0];
      expect(completedSet?.completed).toBe(true);
      expect(completedSet?.actualReps).toBe(5);
      expect(completedSet?.actualWeight).toBe(82.5);
    });

    it('should mark exercise as complete when all sets are done', () => {
      let state = stateWithWorkout;

      // Complete all sets
      for (let i = 0; i < 3; i++) {
        state = workoutReducer(state, completeSet({
          exerciseIndex: 0,
          setIndex: i,
        }));
      }

      expect(state.activeWorkout?.exercises[0].completed).toBe(true);
    });

    it('should uncomplete a set', () => {
      const stateWithCompletedSet = {
        ...stateWithWorkout,
        activeWorkout: {
          ...stateWithWorkout.activeWorkout!,
          exercises: [{
            ...stateWithWorkout.activeWorkout!.exercises[0],
            sets: [
              { ...stateWithWorkout.activeWorkout!.exercises[0].sets[0], completed: true },
              ...stateWithWorkout.activeWorkout!.exercises[0].sets.slice(1),
            ],
            completed: true,
          }],
        },
      };

      const state = workoutReducer(stateWithCompletedSet, uncompleteSet({
        exerciseIndex: 0,
        setIndex: 0,
      }));

      expect(state.activeWorkout?.exercises[0].sets[0].completed).toBe(false);
      expect(state.activeWorkout?.exercises[0].completed).toBe(false);
    });
  });

  describe('rest timer', () => {
    it('should start rest timer', () => {
      const action = startRestTimer({ seconds: 90, exerciseId: 'bench-press' });
      const state = workoutReducer(initialState, action);

      expect(state.restTimer.isActive).toBe(true);
      expect(state.restTimer.timeRemaining).toBe(90);
      expect(state.restTimer.totalTime).toBe(90);
      expect(state.restTimer.exerciseId).toBe('bench-press');
    });

    it('should update rest timer', () => {
      const stateWithTimer = {
        ...initialState,
        restTimer: {
          isActive: true,
          timeRemaining: 90,
          totalTime: 90,
          autoStart: true,
        },
      };

      const state = workoutReducer(stateWithTimer, updateRestTimer(45));

      expect(state.restTimer.timeRemaining).toBe(45);
      expect(state.restTimer.isActive).toBe(true);
    });

    it('should stop timer when time reaches zero', () => {
      const stateWithTimer = {
        ...initialState,
        restTimer: {
          isActive: true,
          timeRemaining: 1,
          totalTime: 90,
          autoStart: true,
        },
      };

      const state = workoutReducer(stateWithTimer, updateRestTimer(0));

      expect(state.restTimer.timeRemaining).toBe(0);
      expect(state.restTimer.isActive).toBe(false);
    });

    it('should stop rest timer manually', () => {
      const stateWithTimer = {
        ...initialState,
        restTimer: {
          isActive: true,
          timeRemaining: 45,
          totalTime: 90,
          autoStart: true,
        },
      };

      const state = workoutReducer(stateWithTimer, stopRestTimer());

      expect(state.restTimer.isActive).toBe(false);
      expect(state.restTimer.timeRemaining).toBe(0);
    });

    it('should toggle auto start timer', () => {
      const state = workoutReducer(initialState, toggleAutoStartTimer());

      expect(state.restTimer.autoStart).toBe(false);

      const state2 = workoutReducer(state, toggleAutoStartTimer());

      expect(state2.restTimer.autoStart).toBe(true);
    });
  });
});