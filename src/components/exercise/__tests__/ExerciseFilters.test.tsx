import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ExerciseFilters } from '../ExerciseFilters';
import type { ExerciseFilter } from '../../../types/exercise';

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  ChevronDown: () => <div data-testid="chevron-down-icon" />,
  X: () => <div data-testid="x-icon" />,
  Check: () => <div data-testid="check-icon" />,
}));

describe('ExerciseFilters', () => {
  const mockOnFiltersChange = vi.fn();
  const mockOnClearFilters = vi.fn();

  const defaultFilters: ExerciseFilter = {};

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Visibility', () => {
    it('renders when isVisible is true', () => {
      render(
        <ExerciseFilters
          filters={defaultFilters}
          onFiltersChange={mockOnFiltersChange}
          onClearFilters={mockOnClearFilters}
          isVisible={true}
        />
      );

      expect(screen.getByText('Filters')).toBeInTheDocument();
    });

    it('does not render when isVisible is false', () => {
      render(
        <ExerciseFilters
          filters={defaultFilters}
          onFiltersChange={mockOnFiltersChange}
          onClearFilters={mockOnClearFilters}
          isVisible={false}
        />
      );

      expect(screen.queryByText('Filters')).not.toBeInTheDocument();
    });
  });

  describe('Filter Sections', () => {
    beforeEach(() => {
      render(
        <ExerciseFilters
          filters={defaultFilters}
          onFiltersChange={mockOnFiltersChange}
          onClearFilters={mockOnClearFilters}
          isVisible={true}
        />
      );
    });

    it('renders all filter sections', () => {
      expect(screen.getByText('Muscle Group')).toBeInTheDocument();
      expect(screen.getByText('Equipment')).toBeInTheDocument();
      expect(screen.getByText('Difficulty')).toBeInTheDocument();
    });

    it('shows muscle group options', () => {
      expect(screen.getByText('Chest')).toBeInTheDocument();
      expect(screen.getByText('Back')).toBeInTheDocument();
      expect(screen.getByText('Legs')).toBeInTheDocument();
      expect(screen.getByText('Arms')).toBeInTheDocument();
    });

    it('shows equipment options', () => {
      expect(screen.getByText('Bodyweight')).toBeInTheDocument();
      expect(screen.getByText('Barbell')).toBeInTheDocument();
      expect(screen.getByText('Dumbbells')).toBeInTheDocument();
      expect(screen.getByText('Machine')).toBeInTheDocument();
    });

    it('shows difficulty options', () => {
      expect(screen.getByText('Beginner')).toBeInTheDocument();
      expect(screen.getByText('Intermediate')).toBeInTheDocument();
      expect(screen.getByText('Advanced')).toBeInTheDocument();
    });
  });

  describe('Filter Selection', () => {
    it('calls onFiltersChange when muscle group is selected', () => {
      render(
        <ExerciseFilters
          filters={defaultFilters}
          onFiltersChange={mockOnFiltersChange}
          onClearFilters={mockOnClearFilters}
          isVisible={true}
        />
      );

      const chestOption = screen.getByText('Chest');
      fireEvent.click(chestOption);

      expect(mockOnFiltersChange).toHaveBeenCalledWith({
        muscleGroup: 'chest',
      });
    });

    it('calls onFiltersChange when equipment is selected', () => {
      render(
        <ExerciseFilters
          filters={defaultFilters}
          onFiltersChange={mockOnFiltersChange}
          onClearFilters={mockOnClearFilters}
          isVisible={true}
        />
      );

      const barbellOption = screen.getByText('Barbell');
      fireEvent.click(barbellOption);

      expect(mockOnFiltersChange).toHaveBeenCalledWith({
        equipment: 'barbell',
      });
    });

    it('calls onFiltersChange when difficulty is selected', () => {
      render(
        <ExerciseFilters
          filters={defaultFilters}
          onFiltersChange={mockOnFiltersChange}
          onClearFilters={mockOnClearFilters}
          isVisible={true}
        />
      );

      const intermediateOption = screen.getByText('Intermediate');
      fireEvent.click(intermediateOption);

      expect(mockOnFiltersChange).toHaveBeenCalledWith({
        difficulty: 'intermediate',
      });
    });

    it('deselects filter when clicked again', () => {
      const filtersWithMuscleGroup: ExerciseFilter = { muscleGroup: 'chest' };
      
      render(
        <ExerciseFilters
          filters={filtersWithMuscleGroup}
          onFiltersChange={mockOnFiltersChange}
          onClearFilters={mockOnClearFilters}
          isVisible={true}
        />
      );

      const chestOption = screen.getByText('Chest');
      fireEvent.click(chestOption);

      expect(mockOnFiltersChange).toHaveBeenCalledWith({
        muscleGroup: undefined,
      });
    });
  });

  describe('Active Filters', () => {
    it('shows active filter count when filters are selected', () => {
      const activeFilters: ExerciseFilter = {
        muscleGroup: 'chest',
        equipment: 'barbell',
        difficulty: 'intermediate',
      };

      render(
        <ExerciseFilters
          filters={activeFilters}
          onFiltersChange={mockOnFiltersChange}
          onClearFilters={mockOnClearFilters}
          isVisible={true}
        />
      );

      expect(screen.getByText('3')).toBeInTheDocument();
    });

    it('shows clear all button when filters are active', () => {
      const activeFilters: ExerciseFilter = { muscleGroup: 'chest' };

      render(
        <ExerciseFilters
          filters={activeFilters}
          onFiltersChange={mockOnFiltersChange}
          onClearFilters={mockOnClearFilters}
          isVisible={true}
        />
      );

      expect(screen.getByText('Clear All')).toBeInTheDocument();
    });

    it('calls onClearFilters when clear all button is clicked', () => {
      const activeFilters: ExerciseFilter = { muscleGroup: 'chest' };

      render(
        <ExerciseFilters
          filters={activeFilters}
          onFiltersChange={mockOnFiltersChange}
          onClearFilters={mockOnClearFilters}
          isVisible={true}
        />
      );

      const clearButton = screen.getByText('Clear All');
      fireEvent.click(clearButton);

      expect(mockOnClearFilters).toHaveBeenCalled();
    });

    it('displays active filters section', () => {
      const activeFilters: ExerciseFilter = {
        muscleGroup: 'chest',
        equipment: 'barbell',
      };

      render(
        <ExerciseFilters
          filters={activeFilters}
          onFiltersChange={mockOnFiltersChange}
          onClearFilters={mockOnClearFilters}
          isVisible={true}
        />
      );

      expect(screen.getByText('Active Filters:')).toBeInTheDocument();
      
      // Should show filter tags in the active filters section
      expect(screen.getByText('chest')).toBeInTheDocument();
      expect(screen.getByText('barbell')).toBeInTheDocument();
    });

    it('allows removing individual active filters', () => {
      const activeFilters: ExerciseFilter = { muscleGroup: 'chest' };

      render(
        <ExerciseFilters
          filters={activeFilters}
          onFiltersChange={mockOnFiltersChange}
          onClearFilters={mockOnClearFilters}
          isVisible={true}
        />
      );

      // Find the X button in the active filters section
      const activeFiltersSection = screen.getByText('Active Filters:').closest('div');
      const removeButton = activeFiltersSection?.querySelector('[data-testid="x-icon"]')?.closest('button');
      
      if (removeButton) {
        fireEvent.click(removeButton);
        expect(mockOnFiltersChange).toHaveBeenCalledWith({
          muscleGroup: undefined,
        });
      }
    });
  });

  describe('Filter Section Expansion', () => {
    it('toggles section expansion when header is clicked', () => {
      render(
        <ExerciseFilters
          filters={defaultFilters}
          onFiltersChange={mockOnFiltersChange}
          onClearFilters={mockOnClearFilters}
          isVisible={true}
        />
      );

      const muscleGroupHeader = screen.getByText('Muscle Group');
      
      // Options should be visible initially
      expect(screen.getByText('Chest')).toBeInTheDocument();
      
      // Click to collapse
      fireEvent.click(muscleGroupHeader);
      
      // The chevron should rotate (class change)
      const chevron = screen.getAllByTestId('chevron-down-icon')[0];
      expect(chevron).toBeInTheDocument();
    });
  });

  describe('Selected State Visualization', () => {
    it('shows check icon for selected options', () => {
      const activeFilters: ExerciseFilter = { muscleGroup: 'chest' };

      render(
        <ExerciseFilters
          filters={activeFilters}
          onFiltersChange={mockOnFiltersChange}
          onClearFilters={mockOnClearFilters}
          isVisible={true}
        />
      );

      // Should show check icon for selected chest option
      expect(screen.getByTestId('check-icon')).toBeInTheDocument();
    });

    it('applies selected styling to active options', () => {
      const activeFilters: ExerciseFilter = { muscleGroup: 'chest' };

      render(
        <ExerciseFilters
          filters={activeFilters}
          onFiltersChange={mockOnFiltersChange}
          onClearFilters={mockOnClearFilters}
          isVisible={true}
        />
      );

      const chestButton = screen.getByText('Chest').closest('button');
      expect(chestButton).toHaveClass('bg-blue-50', 'text-blue-700');
    });
  });

  describe('Animation Classes', () => {
    it('applies animation classes to the card', () => {
      const { container } = render(
        <ExerciseFilters
          filters={defaultFilters}
          onFiltersChange={mockOnFiltersChange}
          onClearFilters={mockOnClearFilters}
          isVisible={true}
        />
      );

      const card = container.querySelector('.animate-in');
      expect(card).toBeInTheDocument();
      expect(card).toHaveClass('slide-in-from-top-2', 'duration-300');
    });
  });

  describe('Custom ClassName', () => {
    it('applies custom className', () => {
      const { container } = render(
        <ExerciseFilters
          filters={defaultFilters}
          onFiltersChange={mockOnFiltersChange}
          onClearFilters={mockOnClearFilters}
          isVisible={true}
          className="custom-filter-class"
        />
      );

      expect(container.firstChild).toHaveClass('custom-filter-class');
    });
  });
});