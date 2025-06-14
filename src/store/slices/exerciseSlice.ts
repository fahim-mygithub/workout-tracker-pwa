import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { Exercise } from '../../types/exercise';

export interface ExerciseFilter {
  muscleGroup?: string;
  equipment?: string;
  difficulty?: string;
  search?: string;
}

export interface ExerciseState {
  exercises: Exercise[];
  filteredExercises: Exercise[];
  selectedExercise: Exercise | null;
  filter: ExerciseFilter;
  favorites: string[]; // exercise IDs
  recentlyUsed: string[]; // exercise IDs
  isLoading: boolean;
  error: string | null;
  lastUpdated: string | null;
}

const initialState: ExerciseState = {
  exercises: [],
  filteredExercises: [],
  selectedExercise: null,
  filter: {},
  favorites: [],
  recentlyUsed: [],
  isLoading: false,
  error: null,
  lastUpdated: null,
};

const exerciseSlice = createSlice({
  name: 'exercise',
  initialState,
  reducers: {
    setExercises: (state, action: PayloadAction<Exercise[]>) => {
      state.exercises = action.payload;
      state.filteredExercises = action.payload;
      state.lastUpdated = new Date().toISOString();
      state.error = null;
    },

    setFilteredExercises: (state, action: PayloadAction<Exercise[]>) => {
      state.filteredExercises = action.payload;
    },

    setSelectedExercise: (state, action: PayloadAction<Exercise | null>) => {
      state.selectedExercise = action.payload;
    },

    updateFilter: (state, action: PayloadAction<Partial<ExerciseFilter>>) => {
      state.filter = { ...state.filter, ...action.payload };
    },

    clearFilter: (state) => {
      state.filter = {};
      state.filteredExercises = state.exercises;
    },

    addToFavorites: (state, action: PayloadAction<string>) => {
      if (!state.favorites.includes(action.payload)) {
        state.favorites.push(action.payload);
      }
    },

    removeFromFavorites: (state, action: PayloadAction<string>) => {
      state.favorites = state.favorites.filter(id => id !== action.payload);
    },

    addToRecentlyUsed: (state, action: PayloadAction<string>) => {
      // Remove if already exists to avoid duplicates
      state.recentlyUsed = state.recentlyUsed.filter(id => id !== action.payload);
      // Add to beginning
      state.recentlyUsed.unshift(action.payload);
      // Keep only last 20 recent exercises
      if (state.recentlyUsed.length > 20) {
        state.recentlyUsed = state.recentlyUsed.slice(0, 20);
      }
    },

    clearRecentlyUsed: (state) => {
      state.recentlyUsed = [];
    },

    searchExercises: (state, action: PayloadAction<string>) => {
      const searchTerm = action.payload.toLowerCase().trim();
      
      if (!searchTerm) {
        state.filteredExercises = state.exercises;
        return;
      }

      state.filteredExercises = state.exercises.filter(exercise => 
        exercise.name.toLowerCase().includes(searchTerm) ||
        exercise.muscleGroup.toLowerCase().includes(searchTerm) ||
        exercise.equipment.toLowerCase().includes(searchTerm) ||
        exercise.searchKeywords.some(keyword => 
          keyword.toLowerCase().includes(searchTerm)
        ) ||
        (exercise.instructions && exercise.instructions.some(instruction => 
          instruction.toLowerCase().includes(searchTerm)
        ))
      );
    },

    filterByMuscleGroup: (state, action: PayloadAction<string>) => {
      state.filter.muscleGroup = action.payload;
      const muscleGroup = action.payload.toLowerCase();
      state.filteredExercises = state.exercises.filter(exercise => 
        exercise.muscleGroup.toLowerCase().includes(muscleGroup)
      );
    },

    filterByEquipment: (state, action: PayloadAction<string>) => {
      state.filter.equipment = action.payload;
      state.filteredExercises = state.exercises.filter(exercise => 
        exercise.equipment.toLowerCase() === action.payload.toLowerCase()
      );
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
  setExercises,
  setFilteredExercises,
  setSelectedExercise,
  updateFilter,
  clearFilter,
  addToFavorites,
  removeFromFavorites,
  addToRecentlyUsed,
  clearRecentlyUsed,
  searchExercises,
  filterByMuscleGroup,
  filterByEquipment,
  setLoading,
  setError,
  clearError,
} = exerciseSlice.actions;

export default exerciseSlice.reducer;