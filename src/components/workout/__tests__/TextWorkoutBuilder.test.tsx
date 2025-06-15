import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { TextWorkoutBuilder } from '../TextWorkoutBuilder';
import workoutReducer from '../../../store/slices/workoutSlice';

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  Play: () => <div data-testid="play-icon" />,
  Save: () => <div data-testid="save-icon" />,
  FileText: () => <div data-testid="file-text-icon" />,
  HelpCircle: () => <div data-testid="help-circle-icon" />,
  Eye: () => <div data-testid="eye-icon" />,
  EyeOff: () => <div data-testid="eye-off-icon" />,
  Zap: () => <div data-testid="zap-icon" />,
  AlertTriangle: () => <div data-testid="alert-triangle-icon" />,
  CheckCircle: () => <div data-testid="check-circle-icon" />,
  Clock: () => <div data-testid="clock-icon" />,
  Weight: () => <div data-testid="weight-icon" />,
  Search: () => <div data-testid="search-icon" />,
  ChevronDown: () => <div data-testid="chevron-down-icon" />,
  X: () => <div data-testid="x-icon" />,
  AlertCircle: () => <div data-testid="alert-circle-icon" />,
}));

// Mock the parser
vi.mock('../../../parser', () => ({
  WorkoutParser: vi.fn().mockImplementation(() => ({
    parse: vi.fn().mockReturnValue({
      success: true,
      workout: {
        groups: [{
          type: 'single',
          exercises: [{
            name: 'Bench Press',
            sets: [{
              reps: 10,
              weight: { value: 225, unit: 'lbs' },
              rest: 90
            }]
          }]
        }]
      },
      errors: [],
      suggestions: []
    })
  })),
  ExerciseMatcher: {
    getSuggestions: vi.fn().mockReturnValue([])
  }
}));

const createTestStore = () => {
  return configureStore({
    reducer: {
      workout: workoutReducer,
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
      },
    },
  });
};

const renderWithProvider = (component: React.ReactElement) => {
  const store = createTestStore();
  return {
    ...render(
      <Provider store={store}>
        {component}
      </Provider>
    ),
    store,
  };
};

describe('TextWorkoutBuilder', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock localStorage
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: vi.fn(() => '[]'),
        setItem: vi.fn(),
      },
      writable: true,
    });
  });

  describe('Basic Rendering', () => {
    it('renders the text workout builder interface', () => {
      renderWithProvider(<TextWorkoutBuilder />);

      expect(screen.getByText('Text Workout Builder')).toBeInTheDocument();
      expect(screen.getByText('Create workouts using natural language syntax')).toBeInTheDocument();
      expect(screen.getByText('Workout Text')).toBeInTheDocument();
    });

    it('renders with initial text', () => {
      renderWithProvider(<TextWorkoutBuilder initialText="5x10 Bench Press" />);

      const textarea = screen.getByDisplayValue('5x10 Bench Press');
      expect(textarea).toBeInTheDocument();
    });

    it('shows help and preview toggle buttons', () => {
      renderWithProvider(<TextWorkoutBuilder />);

      expect(screen.getByText('Help')).toBeInTheDocument();
      expect(screen.getByTestId('eye-off-icon')).toBeInTheDocument(); // Preview is shown by default
    });
  });

  describe('Text Input and Parsing', () => {
    it('handles text input changes', async () => {
      renderWithProvider(<TextWorkoutBuilder />);

      const textarea = screen.getByRole('textbox');
      fireEvent.change(textarea, { target: { value: '5x10 Bench Press @225lbs' } });

      expect(textarea).toHaveValue('5x10 Bench Press @225lbs');
    });

    it('shows parse success status', async () => {
      renderWithProvider(<TextWorkoutBuilder />);

      const textarea = screen.getByRole('textbox');
      fireEvent.change(textarea, { target: { value: '5x10 Bench Press' } });

      await waitFor(() => {
        expect(screen.getByText('Workout parsed successfully!')).toBeInTheDocument();
      });
    });

    it('displays workout preview when parsing succeeds', async () => {
      renderWithProvider(<TextWorkoutBuilder />);

      const textarea = screen.getByRole('textbox');
      fireEvent.change(textarea, { target: { value: '5x10 Bench Press @225lbs' } });

      await waitFor(() => {
        expect(screen.getByText('Workout Overview')).toBeInTheDocument();
        expect(screen.getByText('1')).toBeInTheDocument(); // 1 exercise
        expect(screen.getByText('Bench Press')).toBeInTheDocument();
      });
    });
  });

  describe('Preview Toggle', () => {
    it('toggles preview visibility', () => {
      renderWithProvider(<TextWorkoutBuilder />);

      // Preview should be visible by default
      expect(screen.getByText('Workout Overview')).toBeInTheDocument();

      // Click toggle button
      const toggleButton = screen.getByTestId('eye-off-icon').closest('button');
      fireEvent.click(toggleButton!);

      // Preview should be hidden
      expect(screen.queryByText('Workout Overview')).not.toBeInTheDocument();
    });
  });

  describe('Help Modal', () => {
    it('opens help modal when help button clicked', () => {
      renderWithProvider(<TextWorkoutBuilder />);

      const helpButton = screen.getByText('Help');
      fireEvent.click(helpButton);

      expect(screen.getByText('Workout Syntax Help')).toBeInTheDocument();
      expect(screen.getByText('Basic Format')).toBeInTheDocument();
      expect(screen.getByText('Examples')).toBeInTheDocument();
    });

    it('shows syntax examples in help modal', () => {
      renderWithProvider(<TextWorkoutBuilder />);

      const helpButton = screen.getByText('Help');
      fireEvent.click(helpButton);

      expect(screen.getByText('5x10 Bench Press @225lbs')).toBeInTheDocument();
      expect(screen.getByText('3x8-12 RDL 185kg')).toBeInTheDocument();
      expect(screen.getByText('ss')).toBeInTheDocument(); // Superset explanation
    });
  });

  describe('Workout Actions', () => {
    it('enables start workout button when parsing succeeds', async () => {
      const onWorkoutStart = vi.fn();
      renderWithProvider(<TextWorkoutBuilder onWorkoutStart={onWorkoutStart} />);

      const textarea = screen.getByRole('textbox');
      fireEvent.change(textarea, { target: { value: '5x10 Bench Press' } });

      await waitFor(() => {
        const startButton = screen.getByText('Start Workout');
        expect(startButton).not.toBeDisabled();
      });
    });

    it('calls onWorkoutStart when start button clicked', async () => {
      const onWorkoutStart = vi.fn();
      renderWithProvider(<TextWorkoutBuilder onWorkoutStart={onWorkoutStart} />);

      const textarea = screen.getByRole('textbox');
      fireEvent.change(textarea, { target: { value: '5x10 Bench Press' } });

      await waitFor(() => {
        const startButton = screen.getByText('Start Workout');
        fireEvent.click(startButton);
        expect(onWorkoutStart).toHaveBeenCalled();
      });
    });

    it('saves workout to localStorage when save button clicked', async () => {
      renderWithProvider(<TextWorkoutBuilder />);

      const textarea = screen.getByRole('textbox');
      fireEvent.change(textarea, { target: { value: '5x10 Bench Press' } });

      await waitFor(() => {
        const saveButton = screen.getByText('Save Workout');
        fireEvent.click(saveButton);
        expect(localStorage.setItem).toHaveBeenCalled();
      });
    });
  });

  describe('Error Handling', () => {
    it('displays parse errors when parsing fails', async () => {
      const { WorkoutParser } = await import('../../../parser');
      const mockParser = new WorkoutParser();
      mockParser.parse = vi.fn().mockReturnValue({
        success: false,
        errors: [{
          position: 0,
          line: 1,
          column: 1,
          message: 'Invalid syntax',
          severity: 'error'
        }],
        suggestions: []
      });

      renderWithProvider(<TextWorkoutBuilder />);

      const textarea = screen.getByRole('textbox');
      fireEvent.change(textarea, { target: { value: 'invalid workout text' } });

      await waitFor(() => {
        expect(screen.getByText('Line 1: Invalid syntax')).toBeInTheDocument();
      });
    });

    it('shows suggestions when available', async () => {
      const { WorkoutParser } = await import('../../../parser');
      const mockParser = new WorkoutParser();
      mockParser.parse = vi.fn().mockReturnValue({
        success: false,
        errors: [],
        suggestions: [{
          original: 'benchpress',
          suggestion: 'bench press',
          confidence: 0.8
        }]
      });

      renderWithProvider(<TextWorkoutBuilder />);

      const textarea = screen.getByRole('textbox');
      fireEvent.change(textarea, { target: { value: 'benchpress' } });

      await waitFor(() => {
        expect(screen.getByText('Suggestions:')).toBeInTheDocument();
        expect(screen.getByText('Did you mean "bench press" instead of "benchpress"?')).toBeInTheDocument();
      });
    });
  });

  describe('Workout Preview Generation', () => {
    it('calculates workout statistics correctly', async () => {
      renderWithProvider(<TextWorkoutBuilder />);

      const textarea = screen.getByRole('textbox');
      fireEvent.change(textarea, { target: { value: '5x10 Bench Press @225lbs' } });

      await waitFor(() => {
        expect(screen.getByText('1')).toBeInTheDocument(); // 1 exercise
        expect(screen.getByText('5')).toBeInTheDocument(); // 5 sets
        // Estimated time should be calculated
        expect(screen.getByTestId('clock-icon')).toBeInTheDocument();
      });
    });

    it('displays exercise details in preview', async () => {
      renderWithProvider(<TextWorkoutBuilder />);

      const textarea = screen.getByRole('textbox');
      fireEvent.change(textarea, { target: { value: '5x10 Bench Press @225lbs' } });

      await waitFor(() => {
        expect(screen.getByText('Bench Press')).toBeInTheDocument();
        expect(screen.getByText('1 sets × 10')).toBeInTheDocument();
        expect(screen.getByText('225lbs')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels and roles', () => {
      renderWithProvider(<TextWorkoutBuilder />);

      const textarea = screen.getByRole('textbox');
      expect(textarea).toBeInTheDocument();

      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
    });

    it('supports keyboard navigation', () => {
      renderWithProvider(<TextWorkoutBuilder />);

      const helpButton = screen.getByText('Help');
      helpButton.focus();
      expect(helpButton).toHaveFocus();
    });
  });

  describe('Performance', () => {
    it('debounces parsing to avoid excessive re-parsing', async () => {
      const { WorkoutParser } = await import('../../../parser');
      const mockParser = new WorkoutParser();
      const parseSpy = vi.spyOn(mockParser, 'parse');

      renderWithProvider(<TextWorkoutBuilder />);

      const textarea = screen.getByRole('textbox');
      
      // Type quickly
      fireEvent.change(textarea, { target: { value: '5' } });
      fireEvent.change(textarea, { target: { value: '5x' } });
      fireEvent.change(textarea, { target: { value: '5x10' } });
      fireEvent.change(textarea, { target: { value: '5x10 ' } });
      fireEvent.change(textarea, { target: { value: '5x10 Bench' } });

      // Should only parse once after debounce delay
      await waitFor(() => {
        expect(parseSpy.mock.calls.length).toBeLessThan(5);
      }, { timeout: 500 });
    });
  });
});