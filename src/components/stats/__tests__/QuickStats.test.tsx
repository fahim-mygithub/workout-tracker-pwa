import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { QuickStats } from '../QuickStats';
import workoutReducer, { ActiveWorkout } from '../../../store/slices/workoutSlice';

// Mock store factory
const createMockStore = (workoutState = {}) => {
  return configureStore({
    reducer: {
      workout: workoutReducer,
      app: (state = {}) => state,
      user: (state = {}) => state,
      exercise: (state = {}) => state,
    },
    preloadedState: {
      workout: {
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
        ...workoutState,
      },
    },
  });
};

describe('QuickStats', () => {
  it('renders basic stats with no data', () => {
    const store = createMockStore();
    
    render(
      <Provider store={store}>
        <QuickStats />
      </Provider>
    );
    
    expect(screen.getByText('Quick Stats')).toBeInTheDocument();
    expect(screen.getByText('Total Workouts')).toBeInTheDocument();
    expect(screen.getByText('This Week')).toBeInTheDocument();
    expect(screen.getByText('Active Time')).toBeInTheDocument();
    expect(screen.getByText('Progress')).toBeInTheDocument();
    
    // Should show 0 for empty data
    expect(screen.getByText('0')).toBeInTheDocument(); // Total workouts
    expect(screen.getByText('-')).toBeInTheDocument(); // Active time when no workout
  });

  it('displays workout history count', () => {
    const store = createMockStore({
      workoutHistory: ['workout1', 'workout2', 'workout3'],
    });
    
    render(
      <Provider store={store}>
        <QuickStats />
      </Provider>
    );
    
    expect(screen.getByText('3')).toBeInTheDocument(); // Total workouts
  });

  it('shows active workout information', () => {
    const mockActiveWorkout: ActiveWorkout = {
      id: 'test-workout',
      name: 'Test Workout',
      exercises: [
        {
          id: 'ex1',
          exerciseId: 'bench-press',
          exerciseName: 'Bench Press',
          sets: [
            { id: 'set1', reps: 10, weight: 135, completed: true },
            { id: 'set2', reps: 10, weight: 135, completed: false },
          ],
          completed: false,
        },
        {
          id: 'ex2',
          exerciseId: 'squats',
          exerciseName: 'Squats',
          sets: [
            { id: 'set1', reps: 12, weight: 185, completed: true },
          ],
          completed: true,
        },
      ],
      startTime: new Date().toISOString(),
      currentExerciseIndex: 0,
      currentSetIndex: 1,
      totalDuration: 1800, // 30 minutes
      isActive: true,
    };

    const store = createMockStore({
      activeWorkout: mockActiveWorkout,
    });
    
    render(
      <Provider store={store}>
        <QuickStats />
      </Provider>
    );
    
    // Should show active workout duration
    expect(screen.getByText('30m')).toBeInTheDocument();
    
    // Should show progress (1 out of 2 exercises completed = 50%)
    expect(screen.getByText('50%')).toBeInTheDocument();
    expect(screen.getByText('1/2 exercises')).toBeInTheDocument();
  });

  it('calculates this week stats correctly', () => {
    const store = createMockStore({
      workoutHistory: ['w1', 'w2', 'w3', 'w4', 'w5'],
    });
    
    render(
      <Provider store={store}>
        <QuickStats />
      </Provider>
    );
    
    // Should show min of total workouts and 7 for this week
    expect(screen.getByText('5')).toBeInTheDocument(); // This week count
    expect(screen.getByText('2 days left')).toBeInTheDocument(); // 7 - 5 = 2
  });

  it('displays helpful subtitles', () => {
    const store = createMockStore();
    
    render(
      <Provider store={store}>
        <QuickStats />
      </Provider>
    );
    
    expect(screen.getByText('All time')).toBeInTheDocument();
    expect(screen.getByText('7 days left')).toBeInTheDocument();
    expect(screen.getByText('No active workout')).toBeInTheDocument();
    expect(screen.getByText('Start a workout')).toBeInTheDocument();
  });

  it('shows current workout subtitle when active', () => {
    const mockActiveWorkout: ActiveWorkout = {
      id: 'test-workout',
      name: 'Test Workout',
      exercises: [],
      startTime: new Date().toISOString(),
      currentExerciseIndex: 0,
      currentSetIndex: 0,
      totalDuration: 600, // 10 minutes
      isActive: true,
    };

    const store = createMockStore({
      activeWorkout: mockActiveWorkout,
    });
    
    render(
      <Provider store={store}>
        <QuickStats />
      </Provider>
    );
    
    expect(screen.getByText('Current workout')).toBeInTheDocument();
  });
});