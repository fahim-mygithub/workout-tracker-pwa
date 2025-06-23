import React, { useState, useCallback, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { 
  DndContext, 
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from '@dnd-kit/core';
import type { DragEndEvent, DragStartEvent, UniqueIdentifier } from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import { Typography, Button, Input, LoadingSpinner } from '../ui';
import { ExerciseSearchBar } from '../exercise/ExerciseSearchBar';
import { ExerciseFilters } from '../exercise/ExerciseFilters';
import { BuilderExerciseCard } from './BuilderExerciseCard';
import { DraggableExerciseCard } from './DraggableExerciseCard';
import { Search, X, Play } from 'lucide-react';
import type { RootState } from '../../store';
import type { Exercise } from '../../types/exercise';
import type { WorkoutExercise } from '../../store/slices/workoutSlice';
import { searchExercises, updateFilter, clearFilter } from '../../store/slices/exerciseSlice';
import { startWorkout } from '../../store/slices/workoutSlice';
import { useLoadExercises } from '../../hooks/useLoadExercises';
import { cn } from '../../lib/utils';

interface VisualWorkoutBuilderProps {
  onWorkoutStart: () => void;
}

export const VisualWorkoutBuilder: React.FC<VisualWorkoutBuilderProps> = ({ onWorkoutStart }) => {
  const dispatch = useDispatch();
  const { filteredExercises, filter, isLoading } = useSelector((state: RootState) => state.exercise);
  
  // Load exercises if not already loaded
  useLoadExercises();
  
  // Local state
  const [workoutName, setWorkoutName] = useState('');
  const [workoutExercises, setWorkoutExercises] = useState<WorkoutExercise[]>([]);
  const [searchValue, setSearchValue] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);
  const [draggedExercise, setDraggedExercise] = useState<Exercise | null>(null);
  const [supersetGroups, setSupersetGroups] = useState<{ [key: string]: string[] }>({});

  // Droppable area setup
  const { setNodeRef: setDroppableRef } = useDroppable({
    id: 'workout-builder-drop-area',
  });

  // Sensors for drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Search effect
  React.useEffect(() => {
    const timer = setTimeout(() => {
      dispatch(searchExercises(searchValue));
    }, 300);

    return () => clearTimeout(timer);
  }, [searchValue, dispatch]);

  // Active filters count
  const activeFiltersCount = useMemo(() => {
    return [filter.muscleGroup, filter.equipment, filter.difficulty].filter(Boolean).length;
  }, [filter]);

  // Handle drag start
  const handleDragStart = useCallback((event: DragStartEvent) => {
    const { active } = event;
    console.log('Drag started:', active.id);
    setActiveId(active.id);
    
    // Check if dragging from exercise directory
    const exercise = filteredExercises.find(ex => ex.id === active.id);
    if (exercise) {
      console.log('Found exercise:', exercise.name);
      setDraggedExercise(exercise);
    }
  }, [filteredExercises]);

  // Handle drag end
  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    
    console.log('Drag ended:', { activeId: active.id, overId: over?.id, hasDraggedExercise: !!draggedExercise });
    
    // If dragging from exercise directory (draggedExercise exists)
    if (draggedExercise) {
      // Add to workout regardless of drop target if dropped anywhere on the right side
      // Check if we're over the droppable area or any of its children
      const newExercise: WorkoutExercise = {
        id: `workout-exercise-${Date.now()}`,
        exerciseId: draggedExercise.id,
        exerciseName: draggedExercise.name,
        sets: [
          {
            id: `set-${Date.now()}-1`,
            reps: 10,
            weight: 0,
            completed: false,
          },
          {
            id: `set-${Date.now()}-2`,
            reps: 10,
            weight: 0,
            completed: false,
          },
          {
            id: `set-${Date.now()}-3`,
            reps: 10,
            weight: 0,
            completed: false,
          },
        ],
        restTimeSeconds: 90,
        completed: false,
      };
      
      setWorkoutExercises([...workoutExercises, newExercise]);
    } 
    // If reordering within workout builder
    else if (over && active.id !== over.id && !draggedExercise) {
      const oldIndex = workoutExercises.findIndex(ex => ex.id === active.id);
      const newIndex = workoutExercises.findIndex(ex => ex.id === over.id);
      
      if (oldIndex !== -1 && newIndex !== -1) {
        setWorkoutExercises(arrayMove(workoutExercises, oldIndex, newIndex));
      }
    }

    setActiveId(null);
    setDraggedExercise(null);
  }, [draggedExercise, workoutExercises]);

  // Handle exercise updates
  const handleExerciseUpdate = useCallback((exerciseId: string, updates: Partial<WorkoutExercise>) => {
    setWorkoutExercises(exercises => 
      exercises.map(ex => ex.id === exerciseId ? { ...ex, ...updates } : ex)
    );
  }, []);

  // Handle exercise removal
  const handleRemoveExercise = useCallback((exerciseId: string) => {
    setWorkoutExercises(exercises => exercises.filter(ex => ex.id !== exerciseId));
    // Also remove from superset groups
    setSupersetGroups(groups => {
      const newGroups = { ...groups };
      Object.keys(newGroups).forEach(key => {
        newGroups[key] = newGroups[key].filter(id => id !== exerciseId);
        if (newGroups[key].length < 2) {
          delete newGroups[key];
        }
      });
      return newGroups;
    });
  }, []);

  // Handle superset toggle
  const handleToggleSuperset = useCallback((exerciseId: string) => {
    const exerciseIndex = workoutExercises.findIndex(ex => ex.id === exerciseId);
    if (exerciseIndex <= 0) return;
    
    const prevExercise = workoutExercises[exerciseIndex - 1];
    const currentExercise = workoutExercises[exerciseIndex];
    
    setSupersetGroups(groups => {
      const newGroups = { ...groups };
      
      // Check if exercises are already in a superset together
      let isInSuperset = false;
      let supersetKey = '';
      
      Object.keys(newGroups).forEach(key => {
        if (newGroups[key].includes(prevExercise.id) && newGroups[key].includes(currentExercise.id)) {
          isInSuperset = true;
          supersetKey = key;
        }
      });
      
      if (isInSuperset) {
        // Remove current exercise from superset
        newGroups[supersetKey] = newGroups[supersetKey].filter(id => id !== currentExercise.id);
        if (newGroups[supersetKey].length < 2) {
          delete newGroups[supersetKey];
        }
      } else {
        // Check if previous exercise is in a superset
        let prevSupersetKey = '';
        Object.keys(newGroups).forEach(key => {
          if (newGroups[key].includes(prevExercise.id)) {
            prevSupersetKey = key;
          }
        });
        
        if (prevSupersetKey) {
          // Add current exercise to existing superset
          newGroups[prevSupersetKey].push(currentExercise.id);
        } else {
          // Create new superset
          const newKey = `superset-${Date.now()}`;
          newGroups[newKey] = [prevExercise.id, currentExercise.id];
        }
      }
      
      return newGroups;
    });
  }, [workoutExercises]);

  // Helper functions for superset status
  const isInSuperset = useCallback((exerciseId: string) => {
    return Object.values(supersetGroups).some(group => group.includes(exerciseId));
  }, [supersetGroups]);
  
  const isNextInSuperset = useCallback((exerciseId: string, index: number) => {
    if (index === 0) return false;
    const prevExercise = workoutExercises[index - 1];
    return Object.values(supersetGroups).some(group => 
      group.includes(exerciseId) && group.includes(prevExercise.id)
    );
  }, [supersetGroups, workoutExercises]);
  
  const isPrevInSuperset = useCallback((exerciseId: string, index: number) => {
    if (index >= workoutExercises.length - 1) return false;
    const nextExercise = workoutExercises[index + 1];
    return Object.values(supersetGroups).some(group => 
      group.includes(exerciseId) && group.includes(nextExercise.id)
    );
  }, [supersetGroups, workoutExercises]);

  // Handle workout save/start
  const handleStartWorkout = useCallback(() => {
    if (workoutExercises.length === 0) return;
    
    // Add superset information to exercises
    const exercisesWithSupersets = workoutExercises.map(exercise => {
      let supersetGroupId = undefined;
      Object.entries(supersetGroups).forEach(([groupId, exerciseIds]) => {
        if (exerciseIds.includes(exercise.id)) {
          supersetGroupId = groupId;
        }
      });
      
      return {
        ...exercise,
        isSuperset: !!supersetGroupId,
        supersetGroup: supersetGroupId,
      };
    });
    
    // Create workout structure for Redux
    const workout = {
      id: `workout-${Date.now()}`,
      name: workoutName || 'Visual Workout',
      exercises: exercisesWithSupersets,
      currentExerciseIndex: 0,
      currentSetIndex: 0,
    };
    
    // Save to Redux store
    dispatch(startWorkout(workout));
    
    // Navigate to workout page
    onWorkoutStart();
  }, [workoutExercises, workoutName, dispatch, onWorkoutStart]);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex flex-col md:grid md:grid-cols-2 gap-4 md:gap-6 min-h-[600px] md:h-[calc(100vh-200px)]">
        {/* Exercise Directory Panel */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden flex flex-col h-[300px] md:h-auto">
          <div className="p-4 border-b border-gray-200">
            <Typography variant="h4" className="mb-3">Exercise Directory</Typography>
            
            <ExerciseSearchBar
              value={searchValue}
              onChange={setSearchValue}
              onClear={() => setSearchValue('')}
              showFilters={true}
              onToggleFilters={() => setShowFilters(!showFilters)}
              filtersActive={activeFiltersCount > 0}
            />
            
            <ExerciseFilters
              filters={filter}
              onFiltersChange={(filters) => dispatch(updateFilter(filters))}
              onClearFilters={() => dispatch(clearFilter())}
              isVisible={showFilters}
            />
          </div>
          
          <div className="flex-1 overflow-y-auto p-4">
            {isLoading ? (
              <div className="flex justify-center py-8">
                <LoadingSpinner />
              </div>
            ) : (
              <div className="space-y-2">
                {filteredExercises.slice(0, 50).map(exercise => (
                  <DraggableExerciseCard
                    key={exercise.id}
                    exercise={exercise}
                    isDragging={activeId === exercise.id}
                    onAddClick={() => {
                      const newExercise: WorkoutExercise = {
                        id: `workout-exercise-${Date.now()}`,
                        exerciseId: exercise.id,
                        exerciseName: exercise.name,
                        sets: [
                          {
                            id: `set-${Date.now()}-1`,
                            reps: 10,
                            weight: 0,
                            completed: false,
                          },
                          {
                            id: `set-${Date.now()}-2`,
                            reps: 10,
                            weight: 0,
                            completed: false,
                          },
                          {
                            id: `set-${Date.now()}-3`,
                            reps: 10,
                            weight: 0,
                            completed: false,
                          },
                        ],
                        restTimeSeconds: 90,
                        completed: false,
                      };
                      setWorkoutExercises([...workoutExercises, newExercise]);
                    }}
                  />
                ))}
                {filteredExercises.length === 0 && (
                  <div className="text-center py-8">
                    <Typography variant="body1" color="muted">
                      No exercises found
                    </Typography>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Workout Builder Panel */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden flex flex-col h-[400px] md:h-auto">
          <div className="p-4 border-b border-gray-200">
            <Input
              placeholder="Workout Name (e.g., Upper Body Day)"
              value={workoutName}
              onChange={(e) => setWorkoutName(e.target.value)}
              className="mb-3"
            />
            
            <div className="flex items-center justify-between">
              <Typography variant="h4">
                Workout Builder
                {workoutExercises.length > 0 && (
                  <span className="text-sm font-normal text-gray-500 ml-2">
                    ({workoutExercises.length} exercises)
                  </span>
                )}
              </Typography>
              
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setWorkoutExercises([])}
                  disabled={workoutExercises.length === 0}
                >
                  <X className="w-4 h-4 mr-1" />
                  Clear
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleStartWorkout}
                  disabled={workoutExercises.length === 0}
                >
                  <Play className="w-4 h-4 mr-1" />
                  Start Workout
                </Button>
              </div>
            </div>
          </div>
          
          <div 
            ref={setDroppableRef}
            className="flex-1 overflow-y-auto p-4"
          >
            {workoutExercises.length === 0 ? (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <Search className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <Typography variant="h5" color="muted" className="mb-2">
                  Drag exercises here to build your workout
                </Typography>
                <Typography variant="body2" color="muted">
                  Search for exercises on the left and drag them over to get started
                </Typography>
              </div>
            ) : (
              <SortableContext
                items={workoutExercises.map(ex => ex.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-0">
                  {workoutExercises.map((exercise, index) => (
                    <div key={exercise.id} className={cn(
                      'relative',
                      // No margin for exercises that are part of a superset (except the first one)
                      isNextInSuperset(exercise.id, index) ? '' : 'mb-3',
                      // Add top margin only for first exercise or non-superset exercises
                      index === 0 || (!isNextInSuperset(exercise.id, index) && index > 0) ? 'mt-3' : ''
                    )}>
                      <BuilderExerciseCard
                        exercise={exercise}
                        index={index}
                        onUpdate={(updates) => handleExerciseUpdate(exercise.id, updates)}
                        onRemove={() => handleRemoveExercise(exercise.id)}
                        onToggleSuperset={() => handleToggleSuperset(exercise.id)}
                        isNextInSuperset={isNextInSuperset(exercise.id, index)}
                        isPrevInSuperset={isPrevInSuperset(exercise.id, index)}
                        isDragging={activeId === exercise.id}
                      />
                    </div>
                  ))}
                </div>
              </SortableContext>
            )}
          </div>
        </div>
      </div>

      <DragOverlay>
        {activeId && draggedExercise && (
          <div className="opacity-80">
            <DraggableExerciseCard exercise={draggedExercise} isDragging />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
};