import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ExerciseSearchBar } from '../ExerciseSearchBar';

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  Search: () => <div data-testid="search-icon" />,
  Filter: () => <div data-testid="filter-icon" />,
  X: () => <div data-testid="x-icon" />,
}));

describe('ExerciseSearchBar', () => {
  const mockOnChange = vi.fn();
  const mockOnClear = vi.fn();
  const mockOnToggleFilters = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('renders search input with placeholder', () => {
      render(
        <ExerciseSearchBar
          value=""
          onChange={mockOnChange}
          onClear={mockOnClear}
          placeholder="Search exercises..."
        />
      );

      const input = screen.getByPlaceholderText('Search exercises...');
      expect(input).toBeInTheDocument();
      expect(screen.getByTestId('search-icon')).toBeInTheDocument();
    });

    it('renders with custom placeholder', () => {
      render(
        <ExerciseSearchBar
          value=""
          onChange={mockOnChange}
          onClear={mockOnClear}
          placeholder="Find your exercise..."
        />
      );

      expect(screen.getByPlaceholderText('Find your exercise...')).toBeInTheDocument();
    });

    it('shows current value in input', () => {
      render(
        <ExerciseSearchBar
          value="bench press"
          onChange={mockOnChange}
          onClear={mockOnClear}
        />
      );

      const input = screen.getByDisplayValue('bench press');
      expect(input).toBeInTheDocument();
    });
  });

  describe('Search Functionality', () => {
    it('calls onChange when input value changes', () => {
      render(
        <ExerciseSearchBar
          value=""
          onChange={mockOnChange}
          onClear={mockOnClear}
        />
      );

      const input = screen.getByRole('textbox');
      fireEvent.change(input, { target: { value: 'squat' } });

      expect(mockOnChange).toHaveBeenCalledWith('squat');
    });

    it('shows clear button when value is present', () => {
      render(
        <ExerciseSearchBar
          value="bench press"
          onChange={mockOnChange}
          onClear={mockOnClear}
        />
      );

      expect(screen.getByTestId('x-icon')).toBeInTheDocument();
    });

    it('does not show clear button when value is empty', () => {
      render(
        <ExerciseSearchBar
          value=""
          onChange={mockOnChange}
          onClear={mockOnClear}
        />
      );

      expect(screen.queryByTestId('x-icon')).not.toBeInTheDocument();
    });

    it('calls onClear and onChange when clear button is clicked', () => {
      render(
        <ExerciseSearchBar
          value="bench press"
          onChange={mockOnChange}
          onClear={mockOnClear}
        />
      );

      const clearButton = screen.getByTestId('x-icon').closest('button');
      fireEvent.click(clearButton!);

      expect(mockOnClear).toHaveBeenCalled();
      expect(mockOnChange).toHaveBeenCalledWith('');
    });
  });

  describe('Filter Toggle', () => {
    it('shows filter button when showFilters is true', () => {
      render(
        <ExerciseSearchBar
          value=""
          onChange={mockOnChange}
          onClear={mockOnClear}
          showFilters={true}
          onToggleFilters={mockOnToggleFilters}
        />
      );

      expect(screen.getByText('Filters')).toBeInTheDocument();
      expect(screen.getByTestId('filter-icon')).toBeInTheDocument();
    });

    it('does not show filter button when showFilters is false', () => {
      render(
        <ExerciseSearchBar
          value=""
          onChange={mockOnChange}
          onClear={mockOnClear}
          showFilters={false}
        />
      );

      expect(screen.queryByText('Filters')).not.toBeInTheDocument();
    });

    it('calls onToggleFilters when filter button is clicked', () => {
      render(
        <ExerciseSearchBar
          value=""
          onChange={mockOnChange}
          onClear={mockOnClear}
          showFilters={true}
          onToggleFilters={mockOnToggleFilters}
        />
      );

      const filterButton = screen.getByText('Filters');
      fireEvent.click(filterButton);

      expect(mockOnToggleFilters).toHaveBeenCalled();
    });

    it('applies active styles when filters are active', () => {
      render(
        <ExerciseSearchBar
          value=""
          onChange={mockOnChange}
          onClear={mockOnClear}
          showFilters={true}
          onToggleFilters={mockOnToggleFilters}
          filtersActive={true}
        />
      );

      const filterButton = screen.getByText('Filters').closest('button');
      expect(filterButton).toHaveClass('bg-blue-600', 'text-white');
    });

    it('shows active indicator when filters are active', () => {
      render(
        <ExerciseSearchBar
          value=""
          onChange={mockOnChange}
          onClear={mockOnClear}
          showFilters={true}
          onToggleFilters={mockOnToggleFilters}
          filtersActive={true}
        />
      );

      const indicator = screen.getByText('•');
      expect(indicator).toBeInTheDocument();
      expect(indicator).toHaveClass('bg-white', 'text-blue-600');
    });
  });

  describe('Focus States', () => {
    it('applies focus ring when input is focused', () => {
      render(
        <ExerciseSearchBar
          value=""
          onChange={mockOnChange}
          onClear={mockOnClear}
        />
      );

      const input = screen.getByRole('textbox');
      fireEvent.focus(input);

      expect(input).toHaveClass('ring-2', 'ring-blue-500');
    });

    it('shows popular searches when focused with empty value', async () => {
      render(
        <ExerciseSearchBar
          value=""
          onChange={mockOnChange}
          onClear={mockOnClear}
        />
      );

      const input = screen.getByRole('textbox');
      fireEvent.focus(input);

      await waitFor(() => {
        expect(screen.getByText('Popular searches:')).toBeInTheDocument();
        expect(screen.getByText('Bench Press')).toBeInTheDocument();
        expect(screen.getByText('Squat')).toBeInTheDocument();
        expect(screen.getByText('Deadlift')).toBeInTheDocument();
      });
    });

    it('clicking popular search calls onChange', async () => {
      render(
        <ExerciseSearchBar
          value=""
          onChange={mockOnChange}
          onClear={mockOnClear}
        />
      );

      const input = screen.getByRole('textbox');
      fireEvent.focus(input);

      await waitFor(() => {
        const benchPressButton = screen.getByText('Bench Press');
        fireEvent.click(benchPressButton);
        expect(mockOnChange).toHaveBeenCalledWith('Bench Press');
      });
    });

    it('does not show popular searches when input has value', () => {
      render(
        <ExerciseSearchBar
          value="squat"
          onChange={mockOnChange}
          onClear={mockOnClear}
        />
      );

      const input = screen.getByRole('textbox');
      fireEvent.focus(input);

      expect(screen.queryByText('Popular searches:')).not.toBeInTheDocument();
    });
  });

  describe('Button Positioning', () => {
    it('positions clear button correctly when no filters', () => {
      render(
        <ExerciseSearchBar
          value="test"
          onChange={mockOnChange}
          onClear={mockOnClear}
          showFilters={false}
        />
      );

      const clearButton = screen.getByTestId('x-icon').closest('button');
      expect(clearButton?.parentElement).toHaveClass('absolute', 'inset-y-0', 'right-0', 'flex', 'items-center');
    });

    it('positions filter button correctly when value is present', () => {
      render(
        <ExerciseSearchBar
          value="test"
          onChange={mockOnChange}
          onClear={mockOnClear}
          showFilters={true}
          onToggleFilters={mockOnToggleFilters}
        />
      );

      const filterButton = screen.getByText('Filters').closest('button');
      expect(filterButton?.parentElement).toHaveClass('mr-12');
    });

    it('positions filter button correctly when no value', () => {
      render(
        <ExerciseSearchBar
          value=""
          onChange={mockOnChange}
          onClear={mockOnClear}
          showFilters={true}
          onToggleFilters={mockOnToggleFilters}
        />
      );

      const filterButton = screen.getByText('Filters').closest('button');
      expect(filterButton?.parentElement).toHaveClass('mr-2');
    });
  });

  describe('Accessibility', () => {
    it('has proper input type and role', () => {
      render(
        <ExerciseSearchBar
          value=""
          onChange={mockOnChange}
          onClear={mockOnClear}
        />
      );

      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('type', 'text');
    });

    it('applies custom className', () => {
      render(
        <ExerciseSearchBar
          value=""
          onChange={mockOnChange}
          onClear={mockOnClear}
          className="custom-class"
        />
      );

      const container = screen.getByRole('textbox').closest('.custom-class');
      expect(container).toBeInTheDocument();
    });
  });
});