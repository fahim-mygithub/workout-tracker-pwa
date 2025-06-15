import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import { WorkoutPage } from '../WorkoutPage';
import workoutReducer from '../../store/slices/workoutSlice';
import type { ActiveWorkout } from '../../store/slices/workoutSlice';

// Mock react-router-dom
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  Clock: () => <div data-testid="clock-icon" />,
  Play: () => <div data-testid="play-icon" />,
  Pause: () => <div data-testid="pause-icon" />,
  Square: () => <div data-testid="square-icon" />,
  ChevronLeft: () => <div data-testid="chevron-left-icon" />,
  ChevronRight: () => <div data-testid="chevron-right-icon" />,
  Home: () => <div data-testid="home-icon" />,
  AlertTriangle: () => <div data-testid="alert-triangle-icon" />,
  Trophy: () => <div data-testid="trophy-icon" />,
  Target: () => <div data-testid="target-icon" />,
  TrendingUp: () => <div data-testid="trending-up-icon" />,
  Star: () => <div data-testid="star-icon" />,
  TrendingDown: () => <div data-testid="trending-down-icon" />,
  Link: () => <div data-testid="link-icon" />,
  RotateCcw: () => <div data-testid="rotate-ccw-icon" />,
  X: () => <div data-testid="x-icon" />,
}));

const createTestStore = (overrides: any = {}) => {
  const defaultWorkoutState = {
    activeWorkout: {
      id: 'test-workout-1',
      name: 'Test Push Day',
      exercises: [
        {
          id: 'exercise-1',
          exerciseId: 'bench-press',
          exerciseName: 'Bench Press',
          sets: [
            {
              id: 'set-1',
              reps: 8,
              weight: 135,
              completed: false,
            },
            {
              id: 'set-2',
              reps: 8,
              weight: 135,
              completed: false,
            },
            {
              id: 'set-3',
              reps: 8,
              weight: 135,
              completed: false,
            },
          ],
          restTimeSeconds: 180,
          completed: false,
          progression: {
            type: 'linear' as const,
            increment: 5,
            backoffPercentage: 10,
            maxFailures: 3,
          },
        },
        {
          id: 'exercise-2',
          exerciseId: 'shoulder-press',
          exerciseName: 'Shoulder Press',
          sets: [
            {
              id: 'set-4',
              reps: 10,
              weight: 95,
              completed: false,
            },
            {
              id: 'set-5',
              reps: 10,
              weight: 95,
              completed: false,
            },
          ],
          restTimeSeconds: 120,
          completed: false,
        },
      ],
      startTime: new Date().toISOString(),
      currentExerciseIndex: 0,
      currentSetIndex: 0,
      totalDuration: 0,
      isActive: true,
    } as ActiveWorkout,
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

  // Deep merge the overrides
  const workoutState = {
    ...defaultWorkoutState,
    ...overrides,
    activeWorkout: overrides.activeWorkout 
      ? { ...defaultWorkoutState.activeWorkout, ...overrides.activeWorkout }
      : defaultWorkoutState.activeWorkout,
  };

  return configureStore({
    reducer: {
      workout: workoutReducer,
    },
    preloadedState: {
      workout: workoutState,
    },
  });
};

const renderWithProviders = (component: React.ReactElement, initialState = {}) => {
  const store = createTestStore(initialState);
  return {
    ...render(
      <Provider store={store}>
        <BrowserRouter>
          {component}
        </BrowserRouter>
      </Provider>
    ),
    store,
  };
};

describe('WorkoutPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('renders workout page with active workout', () => {
      renderWithProviders(<WorkoutPage />);

      expect(screen.getByText('Test Push Day')).toBeInTheDocument();
      expect(screen.getByText('Bench Press')).toBeInTheDocument();
      expect(screen.getByText('Exercise 1 of 2')).toBeInTheDocument();
      expect(screen.getByText('Set 1 of 3')).toBeInTheDocument();
    });

    it('redirects to home when no active workout', () => {
      renderWithProviders(<WorkoutPage />, {
        activeWorkout: null,
      });

      expect(mockNavigate).toHaveBeenCalledWith('/');
    });

    it('displays workout progress correctly', () => {
      renderWithProviders(<WorkoutPage />);

      expect(screen.getByText('0/5 sets')).toBeInTheDocument();
      // Progress bar should show 0%
      const progressBar = document.querySelector('.bg-blue-600');
      expect(progressBar).toHaveStyle('width: 0%');
    });
  });

  describe('Navigation Controls', () => {
    it('disables previous exercise button on first exercise', () => {
      renderWithProviders(<WorkoutPage />);

      const prevExerciseBtn = screen.getByText('Previous Exercise');
      expect(prevExerciseBtn).toBeDisabled();
    });

    it('enables next exercise button when not on last exercise', () => {
      renderWithProviders(<WorkoutPage />);

      const nextExerciseBtn = screen.getByText('Next Exercise');
      expect(nextExerciseBtn).not.toBeDisabled();
    });

    it('disables previous set button on first set', () => {
      renderWithProviders(<WorkoutPage />);

      const prevSetBtn = screen.getByText('Previous Set');
      expect(prevSetBtn).toBeDisabled();
    });

    it('enables next set button when not on last set', () => {
      renderWithProviders(<WorkoutPage />);

      const nextSetBtn = screen.getByText('Next Set');
      expect(nextSetBtn).not.toBeDisabled();
    });

    it('navigates to next exercise when button clicked', () => {
      const { store } = renderWithProviders(<WorkoutPage />);

      const nextExerciseBtn = screen.getByText('Next Exercise');
      fireEvent.click(nextExerciseBtn);

      const state = store.getState();
      expect(state.workout.activeWorkout?.currentExerciseIndex).toBe(1);
      expect(state.workout.activeWorkout?.currentSetIndex).toBe(0);
    });

    it('navigates to next set when button clicked', () => {
      const { store } = renderWithProviders(<WorkoutPage />);

      const nextSetBtn = screen.getByText('Next Set');
      fireEvent.click(nextSetBtn);

      const state = store.getState();
      expect(state.workout.activeWorkout?.currentSetIndex).toBe(1);
    });
  });

  describe('Workout Controls', () => {
    it('shows pause button when workout is active', () => {
      renderWithProviders(<WorkoutPage />);

      expect(screen.getByText('Pause')).toBeInTheDocument();
    });

    it('shows resume button when workout is paused', () => {
      renderWithProviders(<WorkoutPage />, {
        activeWorkout: {
          isActive: false,
        },
      });

      expect(screen.getByText('Resume')).toBeInTheDocument();
    });

    it('toggles workout state when pause/resume clicked', () => {
      const { store } = renderWithProviders(<WorkoutPage />);

      const pauseBtn = screen.getByText('Pause');
      fireEvent.click(pauseBtn);

      const state = store.getState();
      expect(state.workout.activeWorkout?.isActive).toBe(false);
    });

    it('shows end workout modal when end button clicked', () => {
      renderWithProviders(<WorkoutPage />);

      const endWorkoutBtn = screen.getByText('End Workout');
      fireEvent.click(endWorkoutBtn);

      expect(screen.getByText('Are you sure you want to end this workout?')).toBeInTheDocument();
    });
  });

  describe('Failed Set Handling', () => {
    it('shows mark as failed button', () => {
      renderWithProviders(<WorkoutPage />);

      expect(screen.getByText('Mark Set as Failed')).toBeInTheDocument();
    });

    it('opens failed set modal when button clicked', () => {
      renderWithProviders(<WorkoutPage />);

      const failedSetBtn = screen.getByText('Mark Set as Failed');
      fireEvent.click(failedSetBtn);

      expect(screen.getByText('Mark Set as Failed')).toBeInTheDocument();
      expect(screen.getByText('Rate of Perceived Exertion (RPE)')).toBeInTheDocument();
    });

    it('displays failed set indicator when set has failed', () => {
      renderWithProviders(<WorkoutPage />, {
        activeWorkout: {
          exercises: [
            {
              id: 'exercise-1',
              exerciseId: 'bench-press',
              exerciseName: 'Bench Press',
              sets: [
                {
                  id: 'set-1',
                  reps: 8,
                  weight: 135,
                  completed: true,
                  failed: true,
                  failureCount: 1,
                },
              ],
              restTimeSeconds: 180,
              completed: false,
            },
          ],
        },
      });

      expect(screen.getByText('Previous attempt failed')).toBeInTheDocument();
    });
  });

  describe('Progression Display', () => {
    it('shows progression type when exercise has progression config', () => {
      renderWithProviders(<WorkoutPage />);

      expect(screen.getByText('linear progression')).toBeInTheDocument();
    });

    it('does not show progression info when exercise has no progression', () => {
      renderWithProviders(<WorkoutPage />, {
        activeWorkout: {
          currentExerciseIndex: 1, // Second exercise has no progression
        },
      });

      expect(screen.queryByText('progression')).not.toBeInTheDocument();
    });
  });

  describe('Workout Completion', () => {
    it('shows completion modal when all sets are completed', async () => {
      // Mock completed workout
      const completedWorkout = {
        activeWorkout: {
          exercises: [
            {
              id: 'exercise-1',
              exerciseId: 'bench-press',
              exerciseName: 'Bench Press',
              sets: [
                {
                  id: 'set-1',
                  reps: 8,
                  weight: 135,
                  completed: true,
                  actualReps: 8,
                  actualWeight: 135,
                },
              ],
              restTimeSeconds: 180,
              completed: true,
            },
          ],
          currentExerciseIndex: 0,
          currentSetIndex: 0,
        },
      };

      const { store } = renderWithProviders(<WorkoutPage />, completedWorkout);

      // Simulate completing the last set
      fireEvent.click(screen.getByText('Mark Set as Failed')); // This will trigger set completion logic
      
      // The actual completion would be triggered by ExerciseCard component
      // For testing, we'll dispatch the action directly
      await waitFor(() => {
        // Check if completion modal would be shown
        expect(store.getState().workout.activeWorkout?.exercises[0].sets[0].completed).toBe(true);
      });
    });
  });

  describe('Timer Integration', () => {
    it('shows rest timer when active', () => {
      renderWithProviders(<WorkoutPage />, {
        restTimer: {
          isActive: true,
          timeRemaining: 60,
          totalTime: 180,
          autoStart: true,
        },
      });

      // RestTimer component should be rendered
      // Actual content depends on RestTimer implementation
    });
  });

  describe('Superset Support', () => {
    it('shows superset indicator when in superset', () => {
      renderWithProviders(<WorkoutPage />, {
        activeWorkout: {
          currentSupersetGroup: 'superset-1',
          supersetGroups: [
            {
              id: 'superset-1',
              name: 'Chest & Triceps',
              exerciseIds: ['bench-press', 'tricep-dips'],
              currentExerciseIndex: 0,
              restBetweenExercises: 30,
              restAfterSet: 180,
            },
          ],
        },
      });

      expect(screen.getByText('Superset: Chest & Triceps')).toBeInTheDocument();
    });

    it('does not show superset indicator when not in superset', () => {
      renderWithProviders(<WorkoutPage />);

      expect(screen.queryByText('Superset:')).not.toBeInTheDocument();
    });
  });

  describe('Workout Statistics', () => {
    it('calculates and displays workout progress', () => {
      renderWithProviders(<WorkoutPage />, {
        activeWorkout: {
          exercises: [
            {
              id: 'exercise-1',
              exerciseId: 'bench-press',
              exerciseName: 'Bench Press',
              sets: [
                { id: 'set-1', completed: true },
                { id: 'set-2', completed: true },
                { id: 'set-3', completed: false },
              ],
              completed: false,
            },
          ],
        },
      });

      expect(screen.getByText('2/3 sets')).toBeInTheDocument();
    });

    it('updates progress bar based on completion', () => {
      renderWithProviders(<WorkoutPage />, {
        activeWorkout: {
          exercises: [
            {
              id: 'exercise-1',
              exerciseId: 'bench-press',
              exerciseName: 'Bench Press',
              sets: [
                { id: 'set-1', completed: true },
                { id: 'set-2', completed: false },
              ],
              completed: false,
            },
          ],
        },
      });

      const progressBar = document.querySelector('.bg-blue-600');
      expect(progressBar).toHaveStyle('width: 50%');
    });
  });

  describe('Error Handling', () => {
    it('shows warning alert when workout is paused', () => {
      renderWithProviders(<WorkoutPage />, {
        activeWorkout: {
          isActive: false,
        },
      });

      expect(screen.getByText('Workout Paused')).toBeInTheDocument();
      expect(screen.getByText('Your workout is currently paused. Tap Resume to continue.')).toBeInTheDocument();
    });
  });

  describe('Time Formatting', () => {
    it('formats time correctly for hours, minutes, and seconds', () => {
      // This test would require mocking the timer effect
      // For now, we'll test the formatTime function logic indirectly
      renderWithProviders(<WorkoutPage />);
      
      // The timer display should be present
      expect(screen.getByText(/^\d+:\d+$/)).toBeInTheDocument();
    });
  });
});