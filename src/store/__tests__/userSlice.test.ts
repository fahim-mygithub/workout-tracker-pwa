import { describe, it, expect } from 'vitest';
import userReducer, {
  setUserProfile,
  updateUserProfile,
  clearUserProfile,
  updatePreferences,
  resetPreferences,
  updateStats,
  incrementWorkoutCount,
  addWorkoutTime,
  addSets,
  addReps,
  addWeightLifted,
  updateStreak,
  setTheme,
  setUnits,
  toggleNotifications,
  type UserProfile,
  type UserPreferences,
} from '../slices/userSlice';

const mockUserProfile: UserProfile = {
  displayName: 'John Doe',
  email: 'john@example.com',
  photoURL: 'https://example.com/photo.jpg',
  createdAt: '2024-01-01T00:00:00.000Z',
  lastActiveAt: '2024-01-15T12:00:00.000Z',
};

describe('userSlice', () => {
  const initialState = {
    profile: null,
    preferences: {
      theme: 'system' as const,
      units: 'metric' as const,
      defaultRestTime: 90,
      autoStartTimer: true,
      enableNotifications: true,
      enableSounds: true,
      language: 'en',
      dateFormat: 'dd/mm/yyyy' as const,
      timeFormat: '24h' as const,
    },
    stats: {
      totalWorkouts: 0,
      totalTimeMinutes: 0,
      totalSets: 0,
      totalReps: 0,
      totalWeightLifted: 0,
      streakDays: 0,
      favoriteExercises: [],
      lastWorkoutDate: null,
    },
    isLoading: false,
    error: null,
  };

  it('should return the initial state', () => {
    expect(userReducer(undefined, { type: 'unknown' })).toEqual(initialState);
  });

  describe('user profile', () => {
    it('should set user profile', () => {
      const state = userReducer(initialState, setUserProfile(mockUserProfile));

      expect(state.profile).toEqual(mockUserProfile);
      expect(state.error).toBeNull();
    });

    it('should update user profile', () => {
      const stateWithProfile = {
        ...initialState,
        profile: mockUserProfile,
      };

      const updates = {
        displayName: 'Jane Doe',
        lastActiveAt: '2024-01-16T12:00:00.000Z',
      };

      const state = userReducer(stateWithProfile, updateUserProfile(updates));

      expect(state.profile?.displayName).toBe('Jane Doe');
      expect(state.profile?.email).toBe('john@example.com'); // unchanged
      expect(state.profile?.lastActiveAt).toBe('2024-01-16T12:00:00.000Z');
    });

    it('should clear user profile', () => {
      const stateWithProfile = {
        ...initialState,
        profile: mockUserProfile,
        stats: {
          ...initialState.stats,
          totalWorkouts: 10,
          totalTimeMinutes: 500,
        },
      };

      const state = userReducer(stateWithProfile, clearUserProfile());

      expect(state.profile).toBeNull();
      expect(state.stats.totalWorkouts).toBe(0); // stats should be reset
    });
  });

  describe('preferences', () => {
    it('should update preferences', () => {
      const updates: Partial<UserPreferences> = {
        theme: 'dark',
        defaultRestTime: 120,
        enableNotifications: false,
      };

      const state = userReducer(initialState, updatePreferences(updates));

      expect(state.preferences.theme).toBe('dark');
      expect(state.preferences.defaultRestTime).toBe(120);
      expect(state.preferences.enableNotifications).toBe(false);
      expect(state.preferences.units).toBe('metric'); // unchanged
    });

    it('should reset preferences to defaults', () => {
      const stateWithCustomPreferences = {
        ...initialState,
        preferences: {
          ...initialState.preferences,
          theme: 'dark' as const,
          units: 'imperial' as const,
          defaultRestTime: 180,
          enableNotifications: false,
        },
      };

      const state = userReducer(stateWithCustomPreferences, resetPreferences());

      expect(state.preferences).toEqual(initialState.preferences);
    });

    it('should set theme', () => {
      const state = userReducer(initialState, setTheme('light'));
      expect(state.preferences.theme).toBe('light');
    });

    it('should set units', () => {
      const state = userReducer(initialState, setUnits('imperial'));
      expect(state.preferences.units).toBe('imperial');
    });

    it('should toggle notifications', () => {
      const state1 = userReducer(initialState, toggleNotifications());
      expect(state1.preferences.enableNotifications).toBe(false);

      const state2 = userReducer(state1, toggleNotifications());
      expect(state2.preferences.enableNotifications).toBe(true);
    });
  });

  describe('stats', () => {
    it('should update stats', () => {
      const updates = {
        totalWorkouts: 5,
        totalTimeMinutes: 300,
        streakDays: 7,
      };

      const state = userReducer(initialState, updateStats(updates));

      expect(state.stats.totalWorkouts).toBe(5);
      expect(state.stats.totalTimeMinutes).toBe(300);
      expect(state.stats.streakDays).toBe(7);
      expect(state.stats.totalSets).toBe(0); // unchanged
    });

    it('should increment workout count', () => {
      const state = userReducer(initialState, incrementWorkoutCount());

      expect(state.stats.totalWorkouts).toBe(1);
      expect(state.stats.lastWorkoutDate).toBeDefined();
      expect(new Date(state.stats.lastWorkoutDate!).getTime()).toBeGreaterThan(
        Date.now() - 1000 // within last second
      );
    });

    it('should add workout time', () => {
      const state = userReducer(initialState, addWorkoutTime(45));
      expect(state.stats.totalTimeMinutes).toBe(45);

      const state2 = userReducer(state, addWorkoutTime(30));
      expect(state2.stats.totalTimeMinutes).toBe(75);
    });

    it('should add sets', () => {
      const state = userReducer(initialState, addSets(15));
      expect(state.stats.totalSets).toBe(15);

      const state2 = userReducer(state, addSets(10));
      expect(state2.stats.totalSets).toBe(25);
    });

    it('should add reps', () => {
      const state = userReducer(initialState, addReps(100));
      expect(state.stats.totalReps).toBe(100);

      const state2 = userReducer(state, addReps(50));
      expect(state2.stats.totalReps).toBe(150);
    });

    it('should add weight lifted', () => {
      const state = userReducer(initialState, addWeightLifted(500));
      expect(state.stats.totalWeightLifted).toBe(500);

      const state2 = userReducer(state, addWeightLifted(250));
      expect(state2.stats.totalWeightLifted).toBe(750);
    });

    it('should update streak', () => {
      const state = userReducer(initialState, updateStreak(14));
      expect(state.stats.streakDays).toBe(14);
    });
  });

  describe('favorite exercises', () => {
    it('should add favorite exercise', () => {
      const state = userReducer(initialState, {
        type: 'user/addFavoriteExercise',
        payload: 'bench-press',
      });

      expect(state.stats.favoriteExercises).toContain('bench-press');
    });

    it('should not add duplicate favorite exercise', () => {
      const stateWithFavorite = {
        ...initialState,
        stats: {
          ...initialState.stats,
          favoriteExercises: ['bench-press'],
        },
      };

      const state = userReducer(stateWithFavorite, {
        type: 'user/addFavoriteExercise',
        payload: 'bench-press',
      });

      expect(state.stats.favoriteExercises).toEqual(['bench-press']);
    });

    it('should remove favorite exercise', () => {
      const stateWithFavorites = {
        ...initialState,
        stats: {
          ...initialState.stats,
          favoriteExercises: ['bench-press', 'squat', 'deadlift'],
        },
      };

      const state = userReducer(stateWithFavorites, {
        type: 'user/removeFavoriteExercise',
        payload: 'squat',
      });

      expect(state.stats.favoriteExercises).toEqual(['bench-press', 'deadlift']);
    });
  });
});