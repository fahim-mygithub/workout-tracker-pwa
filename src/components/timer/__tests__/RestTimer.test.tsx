import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { RestTimer } from '../RestTimer';
import workoutReducer from '../../../store/slices/workoutSlice';

// Mock Web Audio API
const mockAudioContext = {
  createOscillator: vi.fn(() => ({
    connect: vi.fn(),
    frequency: {
      setValueAtTime: vi.fn(),
      exponentialRampToValueAtTime: vi.fn(),
    },
    start: vi.fn(),
    stop: vi.fn(),
  })),
  createGain: vi.fn(() => ({
    connect: vi.fn(),
    gain: {
      setValueAtTime: vi.fn(),
      exponentialRampToValueAtTime: vi.fn(),
    },
  })),
  destination: {},
  currentTime: 0,
};

// Mock Notification API
const mockNotification = vi.fn();
Object.defineProperty(window, 'Notification', {
  value: mockNotification,
  configurable: true,
});

Object.defineProperty(window, 'AudioContext', {
  value: function() { return mockAudioContext; },
  configurable: true,
});

Object.defineProperty(window, 'webkitAudioContext', {
  value: function() { return mockAudioContext; },
  configurable: true,
});

// Mock store helper
const createTestStore = (initialState = {}) => {
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
        ...initialState,
      },
    },
  });
};

const renderWithStore = (component: React.ReactElement, initialState = {}) => {
  const store = createTestStore(initialState);
  return {
    ...render(
      <Provider store={store}>
        {component}
      </Provider>
    ),
    store,
  };
};

describe('RestTimer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    
    // Mock Notification permission
    Object.defineProperty(window.Notification, 'permission', {
      value: 'granted',
      configurable: true,
    });
    
    Object.defineProperty(window.Notification, 'requestPermission', {
      value: vi.fn().mockResolvedValue('granted'),
      configurable: true,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Basic Rendering', () => {
    it('does not render when timer is inactive and time is 0', () => {
      const { container } = renderWithStore(<RestTimer />);
      expect(container.firstChild).toBeNull();
    });

    it('renders full timer interface when active', () => {
      renderWithStore(<RestTimer />, {
        restTimer: {
          isActive: true,
          timeRemaining: 60,
          totalTime: 60,
          autoStart: true,
        },
      });

      expect(screen.getByText('Rest Time')).toBeInTheDocument();
      expect(screen.getAllByText('1:00')).toHaveLength(2); // Main timer and total time
      expect(screen.getByText('Skip Rest')).toBeInTheDocument();
    });

    it('renders minimal timer when showMinimal is true', () => {
      renderWithStore(<RestTimer showMinimal={true} />, {
        restTimer: {
          isActive: true,
          timeRemaining: 30,
          totalTime: 60,
          autoStart: true,
        },
      });

      expect(screen.getByText('Rest Time')).toBeInTheDocument();
      expect(screen.getByText('0:30')).toBeInTheDocument();
      expect(screen.getByText('Skip')).toBeInTheDocument();
    });
  });

  describe('Timer Display', () => {
    it('formats time correctly for minutes and seconds', () => {
      renderWithStore(<RestTimer />, {
        restTimer: {
          isActive: true,
          timeRemaining: 125, // 2:05
          totalTime: 180,
          autoStart: true,
        },
      });

      expect(screen.getByText('2:05')).toBeInTheDocument();
    });

    it('shows progress percentage', () => {
      renderWithStore(<RestTimer />, {
        restTimer: {
          isActive: true,
          timeRemaining: 30,
          totalTime: 60,
          autoStart: true,
        },
      });

      expect(screen.getByText('50%')).toBeInTheDocument();
    });

    it('displays total time correctly', () => {
      renderWithStore(<RestTimer />, {
        restTimer: {
          isActive: true,
          timeRemaining: 45,
          totalTime: 90,
          autoStart: true,
        },
      });

      expect(screen.getByText('1:30')).toBeInTheDocument(); // Total time
    });
  });

  describe('Timer Controls', () => {
    it('shows pause button when timer is active', () => {
      renderWithStore(<RestTimer />, {
        restTimer: {
          isActive: true,
          timeRemaining: 60,
          totalTime: 60,
          autoStart: true,
        },
      });

      expect(screen.getByText('Pause')).toBeInTheDocument();
    });

    it('calls onTimerSkip when skip button is clicked', () => {
      const onTimerSkip = vi.fn();
      renderWithStore(<RestTimer onTimerSkip={onTimerSkip} />, {
        restTimer: {
          isActive: true,
          timeRemaining: 60,
          totalTime: 60,
          autoStart: true,
        },
      });

      fireEvent.click(screen.getByText('Skip Rest'));
      expect(onTimerSkip).toHaveBeenCalled();
    });

    it('displays auto-start toggle correctly', () => {
      renderWithStore(<RestTimer />, {
        restTimer: {
          isActive: true,
          timeRemaining: 60,
          totalTime: 60,
          autoStart: true,
        },
      });

      expect(screen.getByText('Auto-start timer')).toBeInTheDocument();
      expect(screen.getByText('ON')).toBeInTheDocument();
    });

    it('toggles auto-start when button is clicked', () => {
      const { store } = renderWithStore(<RestTimer />, {
        restTimer: {
          isActive: true,
          timeRemaining: 60,
          totalTime: 60,
          autoStart: true,
        },
      });

      fireEvent.click(screen.getByText('ON'));
      
      // Check that action was dispatched
      const state = store.getState();
      expect(state.workout.restTimer.autoStart).toBe(false);
    });
  });

  describe('Timer Countdown', () => {
    it('counts down automatically when active', async () => {
      const { store } = renderWithStore(<RestTimer />, {
        restTimer: {
          isActive: true,
          timeRemaining: 5,
          totalTime: 60,
          autoStart: true,
        },
      });

      expect(screen.getByText('0:05')).toBeInTheDocument();

      // Advance timer by 1 second
      act(() => {
        vi.advanceTimersByTime(1000);
      });

      await waitFor(() => {
        const state = store.getState();
        expect(state.workout.restTimer.timeRemaining).toBe(4);
      });
    });

    it('calls onTimerComplete when timer reaches zero', async () => {
      const onTimerComplete = vi.fn();
      renderWithStore(<RestTimer onTimerComplete={onTimerComplete} />, {
        restTimer: {
          isActive: true,
          timeRemaining: 1,
          totalTime: 60,
          autoStart: true,
        },
      });

      // Advance timer by 1 second to reach 0
      act(() => {
        vi.advanceTimersByTime(1000);
      });

      await waitFor(() => {
        expect(onTimerComplete).toHaveBeenCalled();
      });
    });

    it('stops counting when timer reaches zero', async () => {
      const { store } = renderWithStore(<RestTimer />, {
        restTimer: {
          isActive: true,
          timeRemaining: 1,
          totalTime: 60,
          autoStart: true,
        },
      });

      // Advance timer to completion
      act(() => {
        vi.advanceTimersByTime(1000);
      });

      await waitFor(() => {
        const state = store.getState();
        expect(state.workout.restTimer.timeRemaining).toBe(0);
      });

      // Advance more time - should not go negative
      act(() => {
        vi.advanceTimersByTime(1000);
      });

      const finalState = store.getState();
      expect(finalState.workout.restTimer.timeRemaining).toBe(0);
    });
  });

  describe('Notifications', () => {
    it('requests notification permission on mount', () => {
      renderWithStore(<RestTimer />, {
        restTimer: {
          isActive: true,
          timeRemaining: 60,
          totalTime: 60,
          autoStart: true,
        },
      });

      expect(window.Notification.requestPermission).toHaveBeenCalled();
    });

    it('creates audio notification when timer reaches 10 seconds', async () => {
      renderWithStore(<RestTimer />, {
        restTimer: {
          isActive: true,
          timeRemaining: 11,
          totalTime: 60,
          autoStart: true,
        },
      });

      // Advance to 10 seconds
      act(() => {
        vi.advanceTimersByTime(1000);
      });

      await waitFor(() => {
        expect(mockAudioContext.createOscillator).toHaveBeenCalled();
      });
    });

    it('creates browser notification when timer completes', async () => {
      renderWithStore(<RestTimer />, {
        restTimer: {
          isActive: true,
          timeRemaining: 1,
          totalTime: 60,
          autoStart: true,
        },
      });

      // Complete the timer
      act(() => {
        vi.advanceTimersByTime(1000);
      });

      await waitFor(() => {
        expect(mockNotification).toHaveBeenCalledWith(
          'Rest Complete!',
          expect.objectContaining({
            body: 'Time to start your next set',
          })
        );
      });
    });
  });

  describe('Visual States', () => {
    it('applies correct color classes based on time remaining', () => {
      renderWithStore(<RestTimer />, {
        restTimer: {
          isActive: true,
          timeRemaining: 5,
          totalTime: 60,
          autoStart: true,
        },
      });

      const timerDisplay = screen.getByText('0:05');
      expect(timerDisplay).toHaveClass('text-orange-600');
    });

    it('shows correct progress in circular progress bar', () => {
      renderWithStore(<RestTimer />, {
        restTimer: {
          isActive: true,
          timeRemaining: 30,
          totalTime: 60,
          autoStart: true,
        },
      });

      // Check that SVG circle exists (progress indicator)
      const circles = document.querySelectorAll('circle');
      expect(circles.length).toBeGreaterThan(0);
    });
  });

  describe('Exercise Integration', () => {
    it('displays exercise information when exerciseId is provided', () => {
      renderWithStore(<RestTimer />, {
        restTimer: {
          isActive: true,
          timeRemaining: 60,
          totalTime: 60,
          exerciseId: 'bench-press',
          autoStart: true,
        },
      });

      expect(screen.getByText('Break between sets')).toBeInTheDocument();
    });

    it('shows generic message when no exerciseId is provided', () => {
      renderWithStore(<RestTimer />, {
        restTimer: {
          isActive: true,
          timeRemaining: 60,
          totalTime: 60,
          autoStart: true,
        },
      });

      expect(screen.getByText('Rest period active')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels and roles', () => {
      renderWithStore(<RestTimer />, {
        restTimer: {
          isActive: true,
          timeRemaining: 60,
          totalTime: 60,
          autoStart: true,
        },
      });

      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
      
      // All buttons should be accessible
      buttons.forEach(button => {
        expect(button).toBeVisible();
      });
    });

    it('supports keyboard navigation', () => {
      renderWithStore(<RestTimer />, {
        restTimer: {
          isActive: true,
          timeRemaining: 60,
          totalTime: 60,
          autoStart: true,
        },
      });

      const skipButton = screen.getByText('Skip Rest');
      skipButton.focus();
      expect(skipButton).toHaveFocus();
    });
  });

  describe('Edge Cases', () => {
    it('handles zero duration timer', () => {
      renderWithStore(<RestTimer />, {
        restTimer: {
          isActive: true,
          timeRemaining: 0,
          totalTime: 0,
          autoStart: true,
        },
      });

      expect(screen.getByText('0:00')).toBeInTheDocument();
    });

    it('handles very long timer durations', () => {
      renderWithStore(<RestTimer />, {
        restTimer: {
          isActive: true,
          timeRemaining: 3665, // 1 hour, 1 minute, 5 seconds
          totalTime: 3665,
          autoStart: true,
        },
      });

      expect(screen.getByText('61:05')).toBeInTheDocument();
    });

    it('handles paused state correctly', () => {
      renderWithStore(<RestTimer />, {
        restTimer: {
          isActive: false,
          timeRemaining: 30,
          totalTime: 60,
          autoStart: true,
        },
      });

      expect(screen.getByText('Resume')).toBeInTheDocument();
    });
  });
});