import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { useRestTimer } from '../useRestTimer';
import workoutReducer from '../../../store/slices/workoutSlice';
import React, { type ReactNode } from 'react';

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

const createWrapper = (store: any) => {
  return ({ children }: { children: ReactNode }) => React.createElement(Provider, { store }, children);
};

describe('useRestTimer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Hook Functionality', () => {
    it('returns initial timer state', () => {
      const store = createTestStore();
      const wrapper = createWrapper(store);
      
      const { result } = renderHook(() => useRestTimer(), { wrapper });

      expect(result.current.isActive).toBe(false);
      expect(result.current.timeRemaining).toBe(0);
      expect(result.current.totalTime).toBe(0);
      expect(result.current.progress).toBe(0);
    });

    it('provides timer control functions', () => {
      const store = createTestStore();
      const wrapper = createWrapper(store);
      
      const { result } = renderHook(() => useRestTimer(), { wrapper });

      expect(typeof result.current.startTimer).toBe('function');
      expect(typeof result.current.stopTimer).toBe('function');
      expect(typeof result.current.addTime).toBe('function');
      expect(typeof result.current.subtractTime).toBe('function');
    });
  });

  describe('Timer Control Functions', () => {
    it('starts timer with correct duration and exercise ID', () => {
      const store = createTestStore();
      const wrapper = createWrapper(store);
      
      const { result } = renderHook(() => useRestTimer(), { wrapper });

      act(() => {
        result.current.startTimer(60, 'bench-press');
      });

      const state = store.getState();
      expect(state.workout.restTimer.isActive).toBe(true);
      expect(state.workout.restTimer.timeRemaining).toBe(60);
      expect(state.workout.restTimer.totalTime).toBe(60);
      expect(state.workout.restTimer.exerciseId).toBe('bench-press');
    });

    it('stops timer correctly', () => {
      const store = createTestStore({
        restTimer: {
          isActive: true,
          timeRemaining: 30,
          totalTime: 60,
          autoStart: true,
        },
      });
      const wrapper = createWrapper(store);
      
      const { result } = renderHook(() => useRestTimer(), { wrapper });

      act(() => {
        result.current.stopTimer();
      });

      const state = store.getState();
      expect(state.workout.restTimer.isActive).toBe(false);
      expect(state.workout.restTimer.timeRemaining).toBe(0);
    });

    it('adds time to active timer', () => {
      const store = createTestStore({
        restTimer: {
          isActive: true,
          timeRemaining: 30,
          totalTime: 60,
          autoStart: true,
        },
      });
      const wrapper = createWrapper(store);
      
      const { result } = renderHook(() => useRestTimer(), { wrapper });

      act(() => {
        result.current.addTime(15);
      });

      const state = store.getState();
      expect(state.workout.restTimer.timeRemaining).toBe(45);
    });

    it('subtracts time from active timer', () => {
      const store = createTestStore({
        restTimer: {
          isActive: true,
          timeRemaining: 45,
          totalTime: 60,
          autoStart: true,
        },
      });
      const wrapper = createWrapper(store);
      
      const { result } = renderHook(() => useRestTimer(), { wrapper });

      act(() => {
        result.current.subtractTime(15);
      });

      const state = store.getState();
      expect(state.workout.restTimer.timeRemaining).toBe(30);
    });

    it('does not allow negative time when subtracting', () => {
      const store = createTestStore({
        restTimer: {
          isActive: true,
          timeRemaining: 10,
          totalTime: 60,
          autoStart: true,
        },
      });
      const wrapper = createWrapper(store);
      
      const { result } = renderHook(() => useRestTimer(), { wrapper });

      act(() => {
        result.current.subtractTime(20);
      });

      const state = store.getState();
      expect(state.workout.restTimer.timeRemaining).toBe(0);
    });

    it('does not modify inactive timer when adding/subtracting time', () => {
      const store = createTestStore({
        restTimer: {
          isActive: false,
          timeRemaining: 30,
          totalTime: 60,
          autoStart: true,
        },
      });
      const wrapper = createWrapper(store);
      
      const { result } = renderHook(() => useRestTimer(), { wrapper });

      const initialState = store.getState();
      const initialTime = initialState.workout.restTimer.timeRemaining;

      act(() => {
        result.current.addTime(15);
        result.current.subtractTime(10);
      });

      const finalState = store.getState();
      expect(finalState.workout.restTimer.timeRemaining).toBe(initialTime);
    });
  });

  describe('Progress Calculation', () => {
    it('calculates progress correctly', () => {
      const store = createTestStore({
        restTimer: {
          isActive: true,
          timeRemaining: 30,
          totalTime: 60,
          autoStart: true,
        },
      });
      const wrapper = createWrapper(store);
      
      const { result } = renderHook(() => useRestTimer(), { wrapper });

      expect(result.current.progress).toBe(50);
    });

    it('returns 0 progress when total time is 0', () => {
      const store = createTestStore({
        restTimer: {
          isActive: true,
          timeRemaining: 0,
          totalTime: 0,
          autoStart: true,
        },
      });
      const wrapper = createWrapper(store);
      
      const { result } = renderHook(() => useRestTimer(), { wrapper });

      expect(result.current.progress).toBe(0);
    });

    it('returns 100 progress when timer is complete', () => {
      const store = createTestStore({
        restTimer: {
          isActive: false,
          timeRemaining: 0,
          totalTime: 60,
          autoStart: true,
        },
      });
      const wrapper = createWrapper(store);
      
      const { result } = renderHook(() => useRestTimer(), { wrapper });

      expect(result.current.progress).toBe(100);
    });
  });

  describe('Callback Functions', () => {
    it('calls onTimerComplete when timer reaches zero', () => {
      const onTimerComplete = vi.fn();
      
      const store = createTestStore({
        restTimer: {
          isActive: true,
          timeRemaining: 0,
          totalTime: 60,
          autoStart: true,
        },
      });
      const wrapper = createWrapper(store);
      
      renderHook(() => useRestTimer({ onTimerComplete }), { wrapper });

      expect(onTimerComplete).toHaveBeenCalled();
    });

    it('does not call onTimerComplete if totalTime is 0', () => {
      const onTimerComplete = vi.fn();
      
      const store = createTestStore({
        restTimer: {
          isActive: true,
          timeRemaining: 0,
          totalTime: 0,
          autoStart: true,
        },
      });
      const wrapper = createWrapper(store);
      
      renderHook(() => useRestTimer({ onTimerComplete }), { wrapper });

      expect(onTimerComplete).not.toHaveBeenCalled();
    });

    it('calls onTimerWarning at specific time intervals', () => {
      const onTimerWarning = vi.fn();
      
      // Test 30-second warning
      const store30 = createTestStore({
        restTimer: {
          isActive: true,
          timeRemaining: 30,
          totalTime: 60,
          autoStart: true,
        },
      });
      const wrapper30 = createWrapper(store30);
      
      renderHook(() => useRestTimer({ onTimerWarning }), { wrapper: wrapper30 });
      expect(onTimerWarning).toHaveBeenCalledWith(30);

      // Reset mock
      onTimerWarning.mockClear();

      // Test 10-second warning
      const store10 = createTestStore({
        restTimer: {
          isActive: true,
          timeRemaining: 10,
          totalTime: 60,
          autoStart: true,
        },
      });
      const wrapper10 = createWrapper(store10);
      
      renderHook(() => useRestTimer({ onTimerWarning }), { wrapper: wrapper10 });
      expect(onTimerWarning).toHaveBeenCalledWith(10);

      // Reset mock
      onTimerWarning.mockClear();

      // Test 5-second warning
      const store5 = createTestStore({
        restTimer: {
          isActive: true,
          timeRemaining: 5,
          totalTime: 60,
          autoStart: true,
        },
      });
      const wrapper5 = createWrapper(store5);
      
      renderHook(() => useRestTimer({ onTimerWarning }), { wrapper: wrapper5 });
      expect(onTimerWarning).toHaveBeenCalledWith(5);
    });

    it('does not call onTimerWarning when timer is inactive', () => {
      const onTimerWarning = vi.fn();
      
      const store = createTestStore({
        restTimer: {
          isActive: false,
          timeRemaining: 10,
          totalTime: 60,
          autoStart: true,
        },
      });
      const wrapper = createWrapper(store);
      
      renderHook(() => useRestTimer({ onTimerWarning }), { wrapper });

      expect(onTimerWarning).not.toHaveBeenCalled();
    });
  });

  describe('State Synchronization', () => {
    it('updates hook state when Redux state changes', () => {
      const store = createTestStore();
      const wrapper = createWrapper(store);
      
      const { result } = renderHook(() => useRestTimer(), { wrapper });

      // Initial state
      expect(result.current.isActive).toBe(false);
      expect(result.current.timeRemaining).toBe(0);

      // Start timer
      act(() => {
        result.current.startTimer(120);
      });

      // Check updated state
      expect(result.current.isActive).toBe(true);
      expect(result.current.timeRemaining).toBe(120);
      expect(result.current.totalTime).toBe(120);
    });

    it('reflects restTimer object changes', () => {
      const store = createTestStore({
        restTimer: {
          isActive: true,
          timeRemaining: 45,
          totalTime: 90,
          exerciseId: 'squats',
          autoStart: false,
        },
      });
      const wrapper = createWrapper(store);
      
      const { result } = renderHook(() => useRestTimer(), { wrapper });

      expect(result.current.restTimer.isActive).toBe(true);
      expect(result.current.restTimer.timeRemaining).toBe(45);
      expect(result.current.restTimer.totalTime).toBe(90);
      expect(result.current.restTimer.exerciseId).toBe('squats');
      expect(result.current.restTimer.autoStart).toBe(false);
    });
  });
});