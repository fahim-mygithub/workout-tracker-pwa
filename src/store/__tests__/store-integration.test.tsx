import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import workoutReducer from '../slices/workoutSlice';
import exerciseReducer from '../slices/exerciseSlice';
import userReducer from '../slices/userSlice';
import appReducer from '../slices/appSlice';
import { useAppSelector, useAppDispatch } from '../hooks';
import { setTheme } from '../slices/userSlice';
import { showSuccess } from '../slices/appSlice';

// Create a fresh store for each test
const createTestStore = () => configureStore({
  reducer: {
    workout: workoutReducer,
    exercise: exerciseReducer,
    user: userReducer,
    app: appReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }),
});

// Test component to verify store integration
const TestComponent: React.FC = () => {
  const dispatch = useAppDispatch();
  const theme = useAppSelector(state => state.user.preferences.theme);
  const notifications = useAppSelector(state => state.app.notifications);

  const handleThemeChange = () => {
    dispatch(setTheme('dark'));
    dispatch(showSuccess({
      title: 'Theme Changed',
      message: 'Theme set to dark mode',
    }));
  };

  return (
    <div>
      <div data-testid="theme">Current theme: {theme}</div>
      <div data-testid="notifications">Notifications: {notifications.length}</div>
      <button onClick={handleThemeChange} data-testid="change-theme">
        Change Theme
      </button>
    </div>
  );
};

describe('Redux Store Integration', () => {
  let store: ReturnType<typeof createTestStore>;

  beforeEach(() => {
    store = createTestStore();
  });

  it('should provide initial state to components', () => {
    render(
      <Provider store={store}>
        <TestComponent />
      </Provider>
    );

    expect(screen.getByTestId('theme')).toHaveTextContent('Current theme: system');
    expect(screen.getByTestId('notifications')).toHaveTextContent('Notifications: 0');
  });

  it('should allow components to dispatch actions and update state', () => {
    render(
      <Provider store={store}>
        <TestComponent />
      </Provider>
    );

    // Initial state
    expect(screen.getByTestId('theme')).toHaveTextContent('Current theme: system');
    expect(screen.getByTestId('notifications')).toHaveTextContent('Notifications: 0');

    // Dispatch actions
    fireEvent.click(screen.getByTestId('change-theme'));

    // Check updated state
    expect(screen.getByTestId('theme')).toHaveTextContent('Current theme: dark');
    expect(screen.getByTestId('notifications')).toHaveTextContent('Notifications: 1');
  });

  it('should have proper TypeScript types', () => {
    const state = store.getState();
    
    // Verify state structure
    expect(state).toHaveProperty('workout');
    expect(state).toHaveProperty('exercise');
    expect(state).toHaveProperty('user');
    expect(state).toHaveProperty('app');

    // Verify initial state values
    expect(state.user.preferences.theme).toBe('system');
    expect(state.app.isOnline).toBe(true);
    expect(state.workout.activeWorkout).toBeNull();
    expect(state.exercise.exercises).toEqual([]);
  });

  it('should handle multiple slice updates in sequence', () => {
    const { getState, dispatch } = store;
    
    // Initial state
    expect(getState().user.preferences.theme).toBe('system');
    expect(getState().app.notifications).toHaveLength(0);

    // Dispatch multiple actions
    dispatch(setTheme('light'));
    expect(getState().user.preferences.theme).toBe('light');

    dispatch(showSuccess({
      title: 'Test',
      message: 'Test message',
    }));
    expect(getState().app.notifications).toHaveLength(1);

    dispatch(setTheme('dark'));
    expect(getState().user.preferences.theme).toBe('dark');
    expect(getState().app.notifications).toHaveLength(1); // Should remain unchanged
  });

  describe('State persistence and serialization', () => {
    it('should handle Date serialization correctly', () => {
      const { getState, dispatch } = store;

      dispatch(showSuccess({
        title: 'Test',
        message: 'Test with timestamp',
      }));

      const state = getState();
      const notification = state.app.notifications[0];
      
      expect(notification.timestamp).toBeDefined();
      expect(typeof notification.timestamp).toBe('string');
      expect(new Date(notification.timestamp).getTime()).toBeGreaterThan(0);
    });

    it('should maintain referential equality for unchanged slices', () => {
      const { getState, dispatch } = store;
      
      const initialUserState = getState().user;
      const initialWorkoutState = getState().workout;
      const initialAppState = getState().app;
      
      // Dispatch action that only affects app slice
      dispatch(showSuccess({
        title: 'Test',
        message: 'Test message',
      }));
      
      const newState = getState();
      
      // User and workout slices should maintain referential equality
      expect(newState.user).toBe(initialUserState);
      expect(newState.workout).toBe(initialWorkoutState);
      
      // App slice should be different
      expect(newState.app).not.toBe(initialAppState);
    });
  });
});