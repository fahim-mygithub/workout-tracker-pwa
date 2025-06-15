import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ExerciseDirectoryCard } from '../ExerciseDirectoryCard';
import type { Exercise } from '../../../types/exercise';

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  PlayCircle: () => <div data-testid="play-circle-icon" />,
  Info: () => <div data-testid="info-icon" />,
  Plus: () => <div data-testid="plus-icon" />,
  Target: () => <div data-testid="target-icon" />,
  Zap: () => <div data-testid="zap-icon" />,
  Settings: () => <div data-testid="settings-icon" />,
}));

const mockExercise: Exercise = {
  id: 'test-exercise-1',
  name: 'Bench Press',
  muscleGroup: 'chest',
  equipment: 'barbell',
  difficulty: 'intermediate',
  force: 'push',
  grips: 'overhand',
  mechanic: 'compound',
  instructions: [
    'Lie on a bench with your feet flat on the floor',
    'Grip the barbell with hands slightly wider than shoulder-width',
    'Lower the bar to your chest',
    'Press the bar back up to starting position'
  ],
  videoLinks: ['https://example.com/video1.mp4'],
  searchKeywords: ['bench', 'press', 'chest', 'barbell'],
  createdAt: new Date('2023-01-01'),
  updatedAt: new Date('2023-01-01'),
};

describe('ExerciseDirectoryCard', () => {
  const mockOnViewDetails = vi.fn();
  const mockOnAddToWorkout = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Default View', () => {
    it('renders exercise information correctly', () => {
      render(
        <ExerciseDirectoryCard
          exercise={mockExercise}
          onViewDetails={mockOnViewDetails}
          onAddToWorkout={mockOnAddToWorkout}
        />
      );

      expect(screen.getByText('Bench Press')).toBeInTheDocument();
      expect(screen.getByText('chest')).toBeInTheDocument();
      expect(screen.getByText('intermediate')).toBeInTheDocument();
      expect(screen.getByText('barbell')).toBeInTheDocument();
      expect(screen.getByText('compound')).toBeInTheDocument();
    });

    it('shows video indicator when video links are available', () => {
      render(
        <ExerciseDirectoryCard
          exercise={mockExercise}
          onViewDetails={mockOnViewDetails}
          onAddToWorkout={mockOnAddToWorkout}
        />
      );

      expect(screen.getByText('Video')).toBeInTheDocument();
      expect(screen.getByTestId('play-circle-icon')).toBeInTheDocument();
    });

    it('does not show video indicator when no video links', () => {
      const exerciseWithoutVideo = { ...mockExercise, videoLinks: [] };
      
      render(
        <ExerciseDirectoryCard
          exercise={exerciseWithoutVideo}
          onViewDetails={mockOnViewDetails}
          onAddToWorkout={mockOnAddToWorkout}
        />
      );

      expect(screen.queryByText('Video')).not.toBeInTheDocument();
    });

    it('shows instructions preview', () => {
      render(
        <ExerciseDirectoryCard
          exercise={mockExercise}
          onViewDetails={mockOnViewDetails}
          onAddToWorkout={mockOnAddToWorkout}
        />
      );

      expect(screen.getByText('Instructions')).toBeInTheDocument();
      expect(screen.getByText(mockExercise.instructions[0])).toBeInTheDocument();
    });

    it('calls onViewDetails when view details button is clicked', () => {
      render(
        <ExerciseDirectoryCard
          exercise={mockExercise}
          onViewDetails={mockOnViewDetails}
          onAddToWorkout={mockOnAddToWorkout}
        />
      );

      const viewButton = screen.getByText('View Details');
      fireEvent.click(viewButton);

      expect(mockOnViewDetails).toHaveBeenCalledWith(mockExercise);
    });

    it('calls onAddToWorkout when add to workout button is clicked', () => {
      render(
        <ExerciseDirectoryCard
          exercise={mockExercise}
          onViewDetails={mockOnViewDetails}
          onAddToWorkout={mockOnAddToWorkout}
        />
      );

      const addButton = screen.getByText('Add to Workout');
      fireEvent.click(addButton);

      expect(mockOnAddToWorkout).toHaveBeenCalledWith(mockExercise);
    });
  });

  describe('Compact View', () => {
    it('renders compact layout when isCompact is true', () => {
      render(
        <ExerciseDirectoryCard
          exercise={mockExercise}
          onViewDetails={mockOnViewDetails}
          onAddToWorkout={mockOnAddToWorkout}
          isCompact={true}
        />
      );

      expect(screen.getByText('Bench Press')).toBeInTheDocument();
      expect(screen.getByText('chest')).toBeInTheDocument();
      expect(screen.getByText('barbell')).toBeInTheDocument();
      
      // Should not show detailed information in compact mode
      expect(screen.queryByText('Instructions')).not.toBeInTheDocument();
      expect(screen.queryByText('View Details')).not.toBeInTheDocument();
      expect(screen.queryByText('Add to Workout')).not.toBeInTheDocument();
    });

    it('shows icon buttons in compact mode', () => {
      render(
        <ExerciseDirectoryCard
          exercise={mockExercise}
          onViewDetails={mockOnViewDetails}
          onAddToWorkout={mockOnAddToWorkout}
          isCompact={true}
        />
      );

      expect(screen.getByTestId('info-icon')).toBeInTheDocument();
      expect(screen.getByTestId('plus-icon')).toBeInTheDocument();
    });

    it('handles button clicks in compact mode', () => {
      render(
        <ExerciseDirectoryCard
          exercise={mockExercise}
          onViewDetails={mockOnViewDetails}
          onAddToWorkout={mockOnAddToWorkout}
          isCompact={true}
        />
      );

      const infoButton = screen.getByTestId('info-icon').closest('button');
      const addButton = screen.getByTestId('plus-icon').closest('button');

      fireEvent.click(infoButton!);
      expect(mockOnViewDetails).toHaveBeenCalledWith(mockExercise);

      fireEvent.click(addButton!);
      expect(mockOnAddToWorkout).toHaveBeenCalledWith(mockExercise);
    });
  });

  describe('Difficulty Colors', () => {
    it('applies correct colors for beginner difficulty', () => {
      const beginnerExercise = { ...mockExercise, difficulty: 'beginner' as const };
      
      render(
        <ExerciseDirectoryCard
          exercise={beginnerExercise}
          onViewDetails={mockOnViewDetails}
          onAddToWorkout={mockOnAddToWorkout}
        />
      );

      const difficultyTag = screen.getByText('beginner');
      expect(difficultyTag).toHaveClass('text-green-600', 'bg-green-50');
    });

    it('applies correct colors for intermediate difficulty', () => {
      render(
        <ExerciseDirectoryCard
          exercise={mockExercise}
          onViewDetails={mockOnViewDetails}
          onAddToWorkout={mockOnAddToWorkout}
        />
      );

      const difficultyTag = screen.getByText('intermediate');
      expect(difficultyTag).toHaveClass('text-yellow-600', 'bg-yellow-50');
    });

    it('applies correct colors for advanced difficulty', () => {
      const advancedExercise = { ...mockExercise, difficulty: 'advanced' as const };
      
      render(
        <ExerciseDirectoryCard
          exercise={advancedExercise}
          onViewDetails={mockOnViewDetails}
          onAddToWorkout={mockOnAddToWorkout}
        />
      );

      const difficultyTag = screen.getByText('advanced');
      expect(difficultyTag).toHaveClass('text-red-600', 'bg-red-50');
    });
  });

  describe('Optional Fields', () => {
    it('handles exercise without mechanic field', () => {
      const exerciseWithoutMechanic = { ...mockExercise, mechanic: null };
      
      render(
        <ExerciseDirectoryCard
          exercise={exerciseWithoutMechanic}
          onViewDetails={mockOnViewDetails}
          onAddToWorkout={mockOnAddToWorkout}
        />
      );

      expect(screen.queryByText('Type')).not.toBeInTheDocument();
    });

    it('handles exercise without instructions', () => {
      const exerciseWithoutInstructions = { ...mockExercise, instructions: [] };
      
      render(
        <ExerciseDirectoryCard
          exercise={exerciseWithoutInstructions}
          onViewDetails={mockOnViewDetails}
          onAddToWorkout={mockOnAddToWorkout}
        />
      );

      expect(screen.queryByText('Instructions')).not.toBeInTheDocument();
    });
  });

  describe('Hover Effects', () => {
    it('applies hover classes to card', () => {
      render(
        <ExerciseDirectoryCard
          exercise={mockExercise}
          onViewDetails={mockOnViewDetails}
          onAddToWorkout={mockOnAddToWorkout}
        />
      );

      const card = screen.getByText('Bench Press').closest('.group');
      expect(card).toHaveClass('hover:shadow-lg');
    });

    it('applies group hover effects to title', () => {
      render(
        <ExerciseDirectoryCard
          exercise={mockExercise}
          onViewDetails={mockOnViewDetails}
          onAddToWorkout={mockOnAddToWorkout}
        />
      );

      const title = screen.getByText('Bench Press');
      expect(title).toHaveClass('group-hover:text-blue-600');
    });
  });
});