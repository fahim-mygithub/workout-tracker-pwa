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
  clearSearch, 
  setFilters, 
  clearFilters 
} from '../store/slices/exerciseSlice';
import { createWorkout } from '../store/slices/workoutSlice';
import type { RootState } from '../store';
import type { Exercise, ExerciseFilter } from '../types/exercise';
import { Grid, LayoutGrid, List } from 'lucide-react';

type ViewMode = 'grid' | 'list' | 'compact';

export const ExercisesPage: React.FC = () => {
  const dispatch = useDispatch();
  const { 
    exercises, 
    searchTerm, 
    filters, 
    isLoading, 
    error, 
    hasMore,
    totalCount 
  } = useSelector((state: RootState) => state.exercise);

  // Local state
  const [searchValue, setSearchValue] = useState(searchTerm);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [page, setPage] = useState(1);

  // Debounced search effect
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchValue !== searchTerm) {
        handleSearch(searchValue);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchValue, searchTerm]);

  // Initial load
  useEffect(() => {
    if (exercises.length === 0 && !isLoading) {
      handleSearch('', 1);
    }
  }, []);

  const handleSearch = useCallback((term: string, pageNum: number = 1) => {
    dispatch(searchExercises({
      searchTerm: term,
      filters,
      page: pageNum,
      limit: 20,
    }));
    setPage(pageNum);
  }, [dispatch, filters]);

  const handleLoadMore = useCallback(() => {
    if (hasMore && !isLoading) {
      const nextPage = page + 1;
      dispatch(searchExercises({
        searchTerm: searchValue,
        filters,
        page: nextPage,
        limit: 20,
      }));
      setPage(nextPage);
    }
  }, [dispatch, searchValue, filters, page, hasMore, isLoading]);

  const handleFiltersChange = useCallback((newFilters: ExerciseFilter) => {
    dispatch(setFilters(newFilters));
    handleSearch(searchValue, 1);
  }, [dispatch, searchValue, handleSearch]);

  const handleClearFilters = useCallback(() => {
    dispatch(clearFilters());
    handleSearch(searchValue, 1);
  }, [dispatch, searchValue, handleSearch]);

  const handleClearSearch = useCallback(() => {
    setSearchValue('');
    dispatch(clearSearch());
    handleSearch('', 1);
  }, [dispatch, handleSearch]);

  const handleAddToWorkout = useCallback((exercise: Exercise) => {
    // Create a simple workout with this exercise
    const workout = {
      id: `workout-${Date.now()}`,
      name: `${exercise.name} Workout`,
      groups: [{
        id: `group-${Date.now()}`,
        type: 'single' as const,
        exercises: [{
          id: exercise.id,
          name: exercise.name,
          muscleGroup: exercise.muscleGroup,
          equipment: exercise.equipment,
          sets: [{
            id: `set-${Date.now()}`,
            reps: 10,
            weight: { value: 0, unit: 'lbs' as const },
            rest: 60,
            completed: false,
          }],
        }],
      }],
      totalTime: 0,
      createdAt: new Date(),
    };

    dispatch(createWorkout(workout));
    
    // Show success message (you might want to add a toast notification)
    console.log(`Added ${exercise.name} to workout`);
  }, [dispatch]);

  // Infinite scroll setup
  const { ref: loadMoreRef } = useInfiniteScroll({
    hasNextPage: hasMore,
    isFetching: isLoading,
    fetchNextPage: handleLoadMore,
    threshold: 400,
  });

  // Active filters count
  const activeFiltersCount = useMemo(() => {
    return [filters.muscleGroup, filters.equipment, filters.difficulty].filter(Boolean).length;
  }, [filters]);

  if (error) {
    return (
      <Container maxWidth="xl" padding="lg">
        <Alert variant="destructive" title="Error Loading Exercises">
          {error}
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" padding="lg">
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
            filters={filters}
            onFiltersChange={handleFiltersChange}
            onClearFilters={handleClearFilters}
            isVisible={showFilters}
          />
        </div>

        {/* Results Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Typography variant="body1" color="muted">
              {totalCount > 0 ? `${totalCount} exercises found` : 'No exercises found'}
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
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded ${viewMode === 'grid' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'}`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
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
        {exercises.length > 0 ? (
          <div className={`
            ${viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 
              viewMode === 'list' ? 'space-y-4' :
              'grid grid-cols-1 gap-2'}
          `}>
            {exercises.map((exercise) => (
              <ExerciseDirectoryCard
                key={exercise.id}
                exercise={exercise}
                onViewDetails={setSelectedExercise}
                onAddToWorkout={handleAddToWorkout}
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
              Try adjusting your search terms or filters
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