import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Container, Typography, LoadingSpinner, Alert, Button } from '../components/ui';
import { ExerciseSearchBar } from '../components/exercise/ExerciseSearchBar';
import { ExerciseFilters } from '../components/exercise/ExerciseFilters';
import { ExerciseDirectoryCard } from '../components/exercise/ExerciseDirectoryCard';
import { ExerciseDetailModal } from '../components/exercise/ExerciseDetailModal';
import { useInfiniteScroll } from '../hooks/useInfiniteScroll';
import { 
  searchExercises, 
  clearFilter, 
  updateFilter,
  filterByMuscleGroup,
  filterByEquipment
} from '../store/slices/exerciseSlice';
import { startWorkout } from '../store/slices/workoutSlice';
import type { RootState } from '../store';
import type { Exercise } from '../types/exercise';
import type { ExerciseFilter } from '../store/slices/exerciseSlice';
import { Grid, List } from 'lucide-react';

type ViewMode = 'list' | 'compact';

export const ExercisesPage: React.FC = () => {
  const dispatch = useDispatch();
  const { 
    filteredExercises, 
    filter, 
    isLoading, 
    error,
    exercises 
  } = useSelector((state: RootState) => state.exercise);

  // Local state
  const [searchValue, setSearchValue] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [displayCount, setDisplayCount] = useState(20);

  // Paginated exercises for display
  const displayedExercises = useMemo(() => {
    return filteredExercises.slice(0, displayCount);
  }, [filteredExercises, displayCount]);

  const hasMore = displayCount < filteredExercises.length;

  // Debounced search effect
  useEffect(() => {
    const timer = setTimeout(() => {
      dispatch(searchExercises(searchValue));
    }, 300);

    return () => clearTimeout(timer);
  }, [searchValue, dispatch]);

  // Load more exercises for infinite scroll
  const handleLoadMore = useCallback(() => {
    if (hasMore && !isLoading) {
      setDisplayCount(prev => Math.min(prev + 20, filteredExercises.length));
    }
  }, [hasMore, isLoading, filteredExercises.length]);

  const handleFiltersChange = useCallback((newFilters: ExerciseFilter) => {
    dispatch(updateFilter(newFilters));
    
    // Apply filters
    if (newFilters.muscleGroup) {
      dispatch(filterByMuscleGroup(newFilters.muscleGroup));
    } else if (newFilters.equipment) {
      dispatch(filterByEquipment(newFilters.equipment));
    } else {
      // If no specific filters, just search again
      dispatch(searchExercises(searchValue));
    }
  }, [dispatch, searchValue]);

  const handleClearFilters = useCallback(() => {
    dispatch(clearFilter());
    setSearchValue('');
  }, [dispatch]);

  const handleClearSearch = useCallback(() => {
    setSearchValue('');
    dispatch(searchExercises(''));
  }, [dispatch]);

  const handleAddToWorkout = useCallback((exercise: Exercise) => {
    // Create a simple workout with this exercise
    const workout = {
      id: `workout-${Date.now()}`,
      name: `${exercise.name} Workout`,
      exercises: [{
        id: `exercise-${Date.now()}`,
        exerciseId: exercise.id,
        exerciseName: exercise.name,
        sets: [{
          id: `set-${Date.now()}`,
          reps: 10,
          weight: 100,
          completed: false,
        }],
        restTimeSeconds: 90,
        completed: false,
      }],
      currentExerciseIndex: 0,
      currentSetIndex: 0,
    };

    dispatch(startWorkout(workout));
    
    // Show success message (you might want to add a toast notification)
    console.log(`Started workout with ${exercise.name}`);
  }, [dispatch]);

  const handleFilterByMuscleGroup = useCallback((muscleGroup: string) => {
    const newFilters = { ...filter, muscleGroup };
    dispatch(updateFilter(newFilters));
    dispatch(filterByMuscleGroup(muscleGroup));
    setShowFilters(true);
  }, [dispatch, filter]);

  const handleFilterByDifficulty = useCallback((difficulty: string) => {
    const newFilters = { ...filter, difficulty };
    dispatch(updateFilter(newFilters));
    dispatch(searchExercises(searchValue)); // Re-apply search with new difficulty filter
    setShowFilters(true);
  }, [dispatch, filter, searchValue]);

  // Infinite scroll setup
  const { ref: loadMoreRef } = useInfiniteScroll({
    hasNextPage: hasMore,
    isFetching: isLoading,
    fetchNextPage: handleLoadMore,
    threshold: 400,
  });

  // Active filters count
  const activeFiltersCount = useMemo(() => {
    return [filter.muscleGroup, filter.equipment, filter.difficulty].filter(Boolean).length;
  }, [filter]);

  if (error) {
    return (
      <Container maxWidth="6xl" padding="lg">
        <Alert variant="destructive" title="Error Loading Exercises">
          {error}
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="6xl" padding="lg">
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center">
          <Typography variant="h1" className="mb-2">
            Exercise Directory
          </Typography>
          <Typography variant="body1" color="muted">
            Browse and search through thousands of exercises
          </Typography>
        </div>

        {/* Search and Filters */}
        <div className="space-y-4">
          <ExerciseSearchBar
            value={searchValue}
            onChange={setSearchValue}
            onClear={handleClearSearch}
            showFilters={true}
            onToggleFilters={() => setShowFilters(!showFilters)}
            filtersActive={activeFiltersCount > 0}
          />

          <ExerciseFilters
            filters={filter}
            onFiltersChange={handleFiltersChange}
            onClearFilters={handleClearFilters}
            isVisible={showFilters}
          />
        </div>

        {/* Results Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Typography variant="body1" color="muted">
              {filteredExercises.length > 0 
                ? `${filteredExercises.length} exercises found` 
                : 'No exercises found'}
            </Typography>
            
            {(searchValue || activeFiltersCount > 0) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  handleClearSearch();
                  handleClearFilters();
                }}
                className="text-blue-600 hover:text-blue-700"
              >
                Clear all
              </Button>
            )}
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded ${viewMode === 'list' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'}`}
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('compact')}
              className={`p-2 rounded ${viewMode === 'compact' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'}`}
            >
              <Grid className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Exercise List */}
        {displayedExercises.length > 0 ? (
          <div className={`
            ${viewMode === 'list' ? 'space-y-4' : 'grid grid-cols-1 gap-2'}
          `}>
            {displayedExercises.map((exercise) => (
              <ExerciseDirectoryCard
                key={exercise.id}
                exercise={exercise}
                onViewDetails={setSelectedExercise}
                onAddToWorkout={handleAddToWorkout}
                onFilterByMuscleGroup={handleFilterByMuscleGroup}
                onFilterByDifficulty={handleFilterByDifficulty}
                isCompact={viewMode === 'compact'}
              />
            ))}
          </div>
        ) : !isLoading ? (
          <div className="text-center py-12">
            <Typography variant="h5" color="muted" className="mb-2">
              No exercises found
            </Typography>
            <Typography variant="body1" color="muted">
              {exercises.length === 0 
                ? 'No exercises loaded. Please check your database connection.'
                : 'Try adjusting your search terms or filters'}
            </Typography>
          </div>
        ) : null}

        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-8">
            <LoadingSpinner size="lg" />
            <Typography variant="body2" color="muted" className="mt-2">
              Loading exercises...
            </Typography>
          </div>
        )}

        {/* Load More Trigger */}
        {hasMore && !isLoading && (
          <div ref={loadMoreRef} className="h-4" />
        )}

        {/* Exercise Detail Modal */}
        <ExerciseDetailModal
          exercise={selectedExercise}
          isOpen={!!selectedExercise}
          onClose={() => setSelectedExercise(null)}
          onAddToWorkout={handleAddToWorkout}
        />
      </div>
    </Container>
  );
};