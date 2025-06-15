import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import { ExercisesPage } from '../ExercisesPage';
import exerciseReducer from '../../store/slices/exerciseSlice';
import workoutReducer from '../../store/slices/workoutSlice';
import type { Exercise } from '../../types/exercise';

// Mock data
const mockExercises: Exercise[] = [
  {
    id: 'exercise-1',
    muscleGroup: 'Biceps',
    name: 'Barbell Curl',
    equipment: 'Barbell',
    videoLinks: ['https://example.com/barbell-curl.mp4'],
    difficulty: 'Intermediate',
    force: 'Pull',
    grips: 'Underhand: Supinated',
    mechanic: 'Isolation',
    instructions: ['Hold the barbell with both hands', 'Curl up to chest'],
    searchKeywords: ['barbell', 'curl', 'biceps'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'exercise-2',
    muscleGroup: 'Chest',
    name: 'Bench Press',
    equipment: 'Barbell',
    videoLinks: ['https://example.com/bench-press.mp4'],
    difficulty: 'Intermediate',
    force: 'Push',
    grips: 'Overhand: Pronated',
    mechanic: 'Compound',
    instructions: ['Lie on bench', 'Press bar up'],
    searchKeywords: ['bench', 'press', 'chest'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'exercise-3',
    muscleGroup: 'Legs',
    name: 'Squat',
    equipment: 'Barbell',
    videoLinks: [],
    difficulty: 'Advanced',
    force: 'Push',
    grips: null,
    mechanic: 'Compound',
    instructions: ['Stand with feet shoulder-width apart', 'Squat down'],
    searchKeywords: ['squat', 'legs', 'barbell'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// Mock the loadExercises hook
vi.mock('../../hooks/useLoadExercises', () => ({
  useLoadExercises: vi.fn(),
}));

// Mock the infinite scroll hook
vi.mock('../../hooks/useInfiniteScroll', () => ({
  useInfiniteScroll: vi.fn(() => ({ ref: vi.fn() })),
}));

// Create mock store
const createMockStore = (exerciseState = {}, workoutState = {}) => {
  return configureStore({
    reducer: {
      exercise: exerciseReducer,
      workout: workoutReducer,
      app: (state = {}) => state,
      user: (state = {}) => state,
    },
    preloadedState: {
      exercise: {
        exercises: [],
        filteredExercises: [],
        selectedExercise: null,
        filter: {},
        favorites: [],
        recentlyUsed: [],
        isLoading: false,
        error: null,
        lastUpdated: null,
        ...exerciseState,
      },
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

const renderExercisesPage = (exerciseState = {}, workoutState = {}) => {
  const store = createMockStore(exerciseState, workoutState);
  return {
    store,
    ...render(
      <BrowserRouter>
        <Provider store={store}>
          <ExercisesPage />
        </Provider>
      </BrowserRouter>
    ),
  };
};

describe('ExercisesPage', () => {
  describe('Basic Rendering', () => {
    it('renders exercise directory page with header', () => {
      renderExercisesPage();

      expect(screen.getByText('Exercise Directory')).toBeInTheDocument();
      expect(screen.getByText('Browse and search through thousands of exercises')).toBeInTheDocument();
    });

    it('shows loading state', () => {
      renderExercisesPage({ isLoading: true });

      expect(screen.getByText('Loading exercises...')).toBeInTheDocument();
    });

    it('shows error state', () => {
      renderExercisesPage({ error: 'Failed to load exercises' });

      expect(screen.getByText('Error Loading Exercises')).toBeInTheDocument();
      expect(screen.getByText('Failed to load exercises')).toBeInTheDocument();
    });
  });

  describe('Exercise Display', () => {
    it('displays exercises in grid view by default', () => {
      renderExercisesPage({
        exercises: mockExercises,
        filteredExercises: mockExercises,
        lastUpdated: new Date().toISOString(),
      });

      expect(screen.getByText('3 exercises found')).toBeInTheDocument();
      expect(screen.getByText('Barbell Curl')).toBeInTheDocument();
      expect(screen.getByText('Bench Press')).toBeInTheDocument();
      expect(screen.getByText('Squat')).toBeInTheDocument();
    });

    it('shows no exercises message when list is empty', () => {
      renderExercisesPage({
        exercises: [],
        filteredExercises: [],
        lastUpdated: new Date().toISOString(),
      });

      expect(screen.getByText('No exercises found')).toBeInTheDocument();
      expect(screen.getByText('No exercises loaded. Please check your database connection.')).toBeInTheDocument();
    });
  });

  describe('Search Functionality', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.runOnlyPendingTimers();
      vi.useRealTimers();
    });

    it('searches exercises with debounce', async () => {
      const { store } = renderExercisesPage({
        exercises: mockExercises,
        filteredExercises: mockExercises,
        lastUpdated: new Date().toISOString(),
      });

      const searchInput = screen.getByPlaceholderText('Search exercises...');
      await userEvent.type(searchInput, 'bench');

      // Advance timers to trigger debounced search
      vi.advanceTimersByTime(300);

      // Check that search action was dispatched
      const actions = store.getActions();
      expect(actions).toContainEqual(
        expect.objectContaining({
          type: 'exercise/searchExercises',
          payload: 'bench',
        })
      );
    });

    it('clears search when clear button is clicked', async () => {
      renderExercisesPage({
        exercises: mockExercises,
        filteredExercises: [mockExercises[0]],
        filter: { search: 'barbell' },
        lastUpdated: new Date().toISOString(),
      });

      const clearButton = screen.getByText('Clear all');
      fireEvent.click(clearButton);

      // Check that search input is cleared
      const searchInput = screen.getByPlaceholderText('Search exercises...');
      expect(searchInput).toHaveValue('');
    });
  });

  describe('Filter Functionality', () => {
    it('toggles filter panel', () => {
      renderExercisesPage({
        exercises: mockExercises,
        filteredExercises: mockExercises,
        lastUpdated: new Date().toISOString(),
      });

      // Initially filters should not be visible
      expect(screen.queryByText('Popular searches:')).not.toBeInTheDocument();

      // Click filters button
      const filtersButton = screen.getByRole('button', { name: /filters/i });
      fireEvent.click(filtersButton);

      // Filters should now be visible
      expect(screen.getByText('Popular searches:')).toBeInTheDocument();
    });

    it('applies muscle group filter', async () => {
      const { store } = renderExercisesPage({
        exercises: mockExercises,
        filteredExercises: mockExercises,
        lastUpdated: new Date().toISOString(),
      });

      // Toggle filters
      const filtersButton = screen.getByRole('button', { name: /filters/i });
      fireEvent.click(filtersButton);

      // Select muscle group
      const muscleGroupSelect = screen.getByRole('combobox', { name: /muscle group/i });
      fireEvent.change(muscleGroupSelect, { target: { value: 'Chest' } });

      await waitFor(() => {
        const actions = store.getActions();
        expect(actions).toContainEqual(
          expect.objectContaining({
            type: 'exercise/filterByMuscleGroup',
            payload: 'Chest',
          })
        );
      });
    });
  });

  describe('View Mode Switching', () => {
    it('switches between view modes', () => {
      renderExercisesPage({
        exercises: mockExercises,
        filteredExercises: mockExercises,
        lastUpdated: new Date().toISOString(),
      });

      // Should start in grid view
      const container = screen.getByText('Barbell Curl').closest('div[class*="grid"]');
      expect(container).toHaveClass('grid-cols-1', 'md:grid-cols-2', 'lg:grid-cols-3');

      // Switch to list view
      const listViewButton = screen.getAllByRole('button').find(btn => 
        btn.querySelector('svg.w-4.h-4')
      );
      if (listViewButton) {
        fireEvent.click(listViewButton);
      }

      // Should now be in list view
      expect(screen.getByText('Barbell Curl').closest('div')).not.toHaveClass('grid');
    });
  });

  describe('Exercise Actions', () => {
    it('opens exercise detail modal', () => {
      renderExercisesPage({
        exercises: mockExercises,
        filteredExercises: mockExercises,
        lastUpdated: new Date().toISOString(),
      });

      const viewDetailsButtons = screen.getAllByText('View Details');
      fireEvent.click(viewDetailsButtons[0]);

      // Modal should be open with exercise details
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('adds exercise to workout', async () => {
      const { store } = renderExercisesPage({
        exercises: mockExercises,
        filteredExercises: mockExercises,
        lastUpdated: new Date().toISOString(),
      });

      const addToWorkoutButtons = screen.getAllByText('Add to Workout');
      fireEvent.click(addToWorkoutButtons[0]);

      await waitFor(() => {
        const actions = store.getActions();
        expect(actions).toContainEqual(
          expect.objectContaining({
            type: 'workout/startWorkout',
            payload: expect.objectContaining({
              name: 'Barbell Curl Workout',
              exercises: expect.arrayContaining([
                expect.objectContaining({
                  exerciseName: 'Barbell Curl',
                }),
              ]),
            }),
          })
        );
      });
    });
  });
});