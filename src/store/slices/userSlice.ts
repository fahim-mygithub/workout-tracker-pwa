import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  units: 'metric' | 'imperial';
  defaultRestTime: number; // in seconds
  autoStartTimer: boolean;
  enableNotifications: boolean;
  enableSounds: boolean;
  language: string;
  dateFormat: 'dd/mm/yyyy' | 'mm/dd/yyyy' | 'yyyy-mm-dd';
  timeFormat: '12h' | '24h';
}

export interface UserStats {
  totalWorkouts: number;
  totalTimeMinutes: number;
  totalSets: number;
  totalReps: number;
  totalWeightLifted: number; // in kg or lbs based on units
  streakDays: number;
  favoriteExercises: string[];
  lastWorkoutDate: string | null;
}

export interface UserProfile {
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  createdAt: string | null;
  lastActiveAt: string | null;
}

interface UserState {
  profile: UserProfile | null;
  preferences: UserPreferences;
  stats: UserStats;
  isLoading: boolean;
  error: string | null;
}

const defaultPreferences: UserPreferences = {
  theme: 'system',
  units: 'metric',
  defaultRestTime: 90, // 90 seconds
  autoStartTimer: true,
  enableNotifications: true,
  enableSounds: true,
  language: 'en',
  dateFormat: 'dd/mm/yyyy',
  timeFormat: '24h',
};

const defaultStats: UserStats = {
  totalWorkouts: 0,
  totalTimeMinutes: 0,
  totalSets: 0,
  totalReps: 0,
  totalWeightLifted: 0,
  streakDays: 0,
  favoriteExercises: [],
  lastWorkoutDate: null,
};

const initialState: UserState = {
  profile: null,
  preferences: defaultPreferences,
  stats: defaultStats,
  isLoading: false,
  error: null,
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setUserProfile: (state, action: PayloadAction<UserProfile>) => {
      state.profile = action.payload;
      state.error = null;
    },

    updateUserProfile: (state, action: PayloadAction<Partial<UserProfile>>) => {
      if (state.profile) {
        state.profile = { ...state.profile, ...action.payload };
      }
    },

    clearUserProfile: (state) => {
      state.profile = null;
      state.stats = defaultStats;
    },

    updatePreferences: (state, action: PayloadAction<Partial<UserPreferences>>) => {
      state.preferences = { ...state.preferences, ...action.payload };
    },

    resetPreferences: (state) => {
      state.preferences = defaultPreferences;
    },

    updateStats: (state, action: PayloadAction<Partial<UserStats>>) => {
      state.stats = { ...state.stats, ...action.payload };
    },

    incrementWorkoutCount: (state) => {
      state.stats.totalWorkouts += 1;
      state.stats.lastWorkoutDate = new Date().toISOString();
    },

    addWorkoutTime: (state, action: PayloadAction<number>) => {
      state.stats.totalTimeMinutes += action.payload;
    },

    addSets: (state, action: PayloadAction<number>) => {
      state.stats.totalSets += action.payload;
    },

    addReps: (state, action: PayloadAction<number>) => {
      state.stats.totalReps += action.payload;
    },

    addWeightLifted: (state, action: PayloadAction<number>) => {
      state.stats.totalWeightLifted += action.payload;
    },

    updateStreak: (state, action: PayloadAction<number>) => {
      state.stats.streakDays = action.payload;
    },

    addFavoriteExercise: (state, action: PayloadAction<string>) => {
      if (!state.stats.favoriteExercises.includes(action.payload)) {
        state.stats.favoriteExercises.push(action.payload);
      }
    },

    removeFavoriteExercise: (state, action: PayloadAction<string>) => {
      state.stats.favoriteExercises = state.stats.favoriteExercises.filter(
        id => id !== action.payload
      );
    },

    setTheme: (state, action: PayloadAction<'light' | 'dark' | 'system'>) => {
      state.preferences.theme = action.payload;
    },

    setUnits: (state, action: PayloadAction<'metric' | 'imperial'>) => {
      state.preferences.units = action.payload;
    },

    setDefaultRestTime: (state, action: PayloadAction<number>) => {
      state.preferences.defaultRestTime = action.payload;
    },

    toggleAutoStartTimer: (state) => {
      state.preferences.autoStartTimer = !state.preferences.autoStartTimer;
    },

    toggleNotifications: (state) => {
      state.preferences.enableNotifications = !state.preferences.enableNotifications;
    },

    toggleSounds: (state) => {
      state.preferences.enableSounds = !state.preferences.enableSounds;
    },

    setLanguage: (state, action: PayloadAction<string>) => {
      state.preferences.language = action.payload;
    },

    setDateFormat: (state, action: PayloadAction<'dd/mm/yyyy' | 'mm/dd/yyyy' | 'yyyy-mm-dd'>) => {
      state.preferences.dateFormat = action.payload;
    },

    setTimeFormat: (state, action: PayloadAction<'12h' | '24h'>) => {
      state.preferences.timeFormat = action.payload;
    },

    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },

    setError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
    },

    clearError: (state) => {
      state.error = null;
    },
  },
});

export const {
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
  addFavoriteExercise,
  removeFavoriteExercise,
  setTheme,
  setUnits,
  setDefaultRestTime,
  toggleAutoStartTimer,
  toggleNotifications,
  toggleSounds,
  setLanguage,
  setDateFormat,
  setTimeFormat,
  setLoading,
  setError,
  clearError,
} = userSlice.actions;

export default userSlice.reducer;