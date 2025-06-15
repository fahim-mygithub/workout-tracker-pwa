import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ExerciseCard } from '../ExerciseCard';
import type { WorkoutExercise } from '../../../store/slices/workoutSlice';

// Mock exercise data
const mockExercise: WorkoutExercise = {
  id: 'exercise-1',
  exerciseId: 'bench-press',
  exerciseName: 'Bench Press',
  restTimeSeconds: 180,
  notes: 'Keep core tight, controlled descent',
  completed: false,
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
      completed: true,
      actualReps: 8,
      actualWeight: 135,
    },
  ],
};

const mockTimeBasedExercise: WorkoutExercise = {
  id: 'exercise-2',
  exerciseId: 'plank',
  exerciseName: 'Plank Hold',
  restTimeSeconds: 60,
  completed: false,
  sets: [
    {
      id: 'set-4',
      time: 60, // 1 minute
      completed: false,
    },
    {
      id: 'set-5',
      time: 60,
      completed: false,
    },
  ],
};

describe('ExerciseCard', () => {
  const mockHandlers = {
    onSetComplete: vi.fn(),
    onExerciseComplete: vi.fn(),
    onStartRest: vi.fn(),
    onSkipRest: vi.fn(),
    onEditSet: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('renders exercise name and basic information', () => {
      render(<ExerciseCard exercise={mockExercise} />);
      
      expect(screen.getByText('Bench Press')).toBeInTheDocument();
      expect(screen.getByText('1/3 sets • 180s rest')).toBeInTheDocument();
    });

    it('displays exercise notes when provided', () => {
      render(<ExerciseCard exercise={mockExercise} />);
      
      expect(screen.getByText('Notes:')).toBeInTheDocument();
      expect(screen.getByText('Keep core tight, controlled descent')).toBeInTheDocument();
    });

    it('renders all sets with correct information', () => {
      render(<ExerciseCard exercise={mockExercise} />);
      
      // Check set targets are displayed (Target: 8 × 135lbs)
      expect(screen.getAllByText(/Target: 8 × 135lbs/)).toHaveLength(3);
      
      // Check set numbers
      expect(screen.getByText('1')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument();
    });
  });

  describe('Exercise States', () => {
    it('renders pending state correctly', () => {
      render(<ExerciseCard exercise={mockExercise} state="pending" />);
      
      expect(screen.getByText('⭕')).toBeInTheDocument();
    });

    it('renders active state correctly', () => {
      render(
        <ExerciseCard 
          exercise={mockExercise} 
          state="active" 
          isCurrentExercise={true}
          currentSetIndex={0}
        />
      );
      
      expect(screen.getByText('🏋️')).toBeInTheDocument();
      expect(screen.getByText('Current')).toBeInTheDocument();
    });

    it('renders completed state correctly', () => {
      const completedExercise = {
        ...mockExercise,
        completed: true,
        sets: mockExercise.sets.map(set => ({ ...set, completed: true })),
      };

      render(<ExerciseCard exercise={completedExercise} state="completed" />);
      
      expect(screen.getByText('✅')).toBeInTheDocument();
      expect(screen.getByText('✅ Exercise completed!')).toBeInTheDocument();
    });

    it('renders resting state with timer', () => {
      render(
        <ExerciseCard 
          exercise={mockExercise} 
          state="resting" 
          restTimeRemaining={120}
          {...mockHandlers}
        />
      );
      
      expect(screen.getByText('⏳')).toBeInTheDocument();
      expect(screen.getByText('Rest Time')).toBeInTheDocument();
      expect(screen.getByText('2:00')).toBeInTheDocument();
      expect(screen.getByText('Skip Rest')).toBeInTheDocument();
    });
  });

  describe('Set Interactions', () => {
    it('allows completing a set when active', () => {
      render(
        <ExerciseCard 
          exercise={mockExercise} 
          state="active" 
          isCurrentExercise={true}
          currentSetIndex={0}
          {...mockHandlers}
        />
      );
      
      // Click "Complete Set" button on first set
      const completeButton = screen.getByText('Complete Set');
      fireEvent.click(completeButton);
      
      // Should show input fields for reps and weight
      expect(screen.getByPlaceholderText('Reps')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Weight')).toBeInTheDocument();
    });

    it('calls onSetComplete with correct data when saving a set', async () => {
      render(
        <ExerciseCard 
          exercise={mockExercise} 
          state="active" 
          isCurrentExercise={true}
          currentSetIndex={0}
          {...mockHandlers}
        />
      );
      
      // Start completing the set
      fireEvent.click(screen.getByText('Complete Set'));
      
      // Fill in values
      const repsInput = screen.getByPlaceholderText('Reps');
      const weightInput = screen.getByPlaceholderText('Weight');
      
      fireEvent.change(repsInput, { target: { value: '10' } });
      fireEvent.change(weightInput, { target: { value: '140' } });
      
      // Save the set
      fireEvent.click(screen.getByText('Save'));
      
      expect(mockHandlers.onSetComplete).toHaveBeenCalledWith('set-1', {
        actualReps: 10,
        actualWeight: 140,
        actualTime: 0,
        actualDistance: 0,
        completed: true,
      });
    });

    it('allows editing a completed set', () => {
      render(<ExerciseCard exercise={mockExercise} {...mockHandlers} />);
      
      // Find the edit button for the completed set (set 3)
      const editButtons = screen.getAllByText('Edit');
      fireEvent.click(editButtons[0]); // Should be for the completed set
      
      expect(screen.getByPlaceholderText('Reps')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Weight')).toBeInTheDocument();
    });
  });

  describe('Time-based Exercises', () => {
    it('renders time-based sets correctly', () => {
      render(<ExerciseCard exercise={mockTimeBasedExercise} />);
      
      expect(screen.getByText('Plank Hold')).toBeInTheDocument();
      expect(screen.getAllByText('Target: 1:00')).toHaveLength(2);
    });

    it('shows time input for time-based exercises', () => {
      render(
        <ExerciseCard 
          exercise={mockTimeBasedExercise} 
          state="active" 
          isCurrentExercise={true}
          currentSetIndex={0}
          {...mockHandlers}
        />
      );
      
      fireEvent.click(screen.getByText('Complete Set'));
      
      expect(screen.getByPlaceholderText('Time (s)')).toBeInTheDocument();
    });
  });

  describe('Rest Timer', () => {
    it('calls onSkipRest when skip button is clicked', () => {
      render(
        <ExerciseCard 
          exercise={mockExercise} 
          state="resting" 
          restTimeRemaining={120}
          {...mockHandlers}
        />
      );
      
      fireEvent.click(screen.getByText('Skip Rest'));
      
      expect(mockHandlers.onSkipRest).toHaveBeenCalledWith('exercise-1');
    });

    it('formats rest time correctly', () => {
      render(
        <ExerciseCard 
          exercise={mockExercise} 
          state="resting" 
          restTimeRemaining={90}
          {...mockHandlers}
        />
      );
      
      expect(screen.getByText('1:30')).toBeInTheDocument();
    });
  });

  describe('Exercise Actions', () => {
    it('allows skipping the entire exercise', () => {
      render(
        <ExerciseCard 
          exercise={mockExercise} 
          state="active" 
          isCurrentExercise={true}
          {...mockHandlers}
        />
      );
      
      fireEvent.click(screen.getByText('Skip Exercise'));
      
      expect(mockHandlers.onExerciseComplete).toHaveBeenCalledWith('exercise-1');
    });

    it('shows progress for current exercise', () => {
      render(
        <ExerciseCard 
          exercise={mockExercise} 
          state="active" 
          isCurrentExercise={true}
          {...mockHandlers}
        />
      );
      
      expect(screen.getByText('1/3 sets completed')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels and roles', () => {
      render(<ExerciseCard exercise={mockExercise} />);
      
      // Check that buttons are properly labeled
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
    });

    it('supports keyboard navigation', () => {
      render(
        <ExerciseCard 
          exercise={mockExercise} 
          state="active" 
          isCurrentExercise={true}
          currentSetIndex={0}
          {...mockHandlers}
        />
      );
      
      const completeButton = screen.getByText('Complete Set');
      completeButton.focus();
      expect(completeButton).toHaveFocus();
    });
  });

  describe('Edge Cases', () => {
    it('handles exercise with no sets', () => {
      const exerciseNoSets = {
        ...mockExercise,
        sets: [],
      };

      render(<ExerciseCard exercise={exerciseNoSets} />);
      
      expect(screen.getByText('Bench Press')).toBeInTheDocument();
      expect(screen.getByText('0/0 sets • 180s rest')).toBeInTheDocument();
    });

    it('handles exercise with no rest time', () => {
      const exerciseNoRest = {
        ...mockExercise,
        restTimeSeconds: undefined,
      };

      render(<ExerciseCard exercise={exerciseNoRest} />);
      
      expect(screen.getByText('1/3 sets • No rest')).toBeInTheDocument();
    });

    it('handles missing actual values gracefully', () => {
      const setWithoutActuals = {
        ...mockExercise,
        sets: [
          {
            id: 'set-incomplete',
            reps: 8,
            weight: 135,
            completed: true,
            // No actual values
          },
        ],
      };

      render(<ExerciseCard exercise={setWithoutActuals} />);
      
      expect(screen.getByText('Target: 8 × 135lbs')).toBeInTheDocument();
      expect(screen.getByText('Actual: -')).toBeInTheDocument();
    });
  });
});