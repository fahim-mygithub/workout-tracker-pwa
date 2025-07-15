import React, { useState, useCallback, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
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
import { Typography, Button, Input, LoadingSpinner, Modal, Alert, Textarea } from '../ui';
import { ExerciseSearchBar } from '../exercise/ExerciseSearchBar';
import { ExerciseFilters } from '../exercise/ExerciseFilters';
import { BuilderExerciseCard } from './BuilderExerciseCard';
import { DraggableExerciseCard } from './DraggableExerciseCard';
import { Search, X, Play, Save } from 'lucide-react';
import type { RootState } from '../../store';
import type { Exercise } from '../../types/exercise';
import type { WorkoutExercise } from '../../store/slices/workoutSlice';
import { searchExercises, updateFilter, clearFilter } from '../../store/slices/exerciseSlice';
import { startWorkout } from '../../store/slices/workoutSlice';
import { useLoadExercises } from '../../hooks/useLoadExercises';
import { cn } from '../../lib/utils';
import { useAuth } from '../../contexts/AuthContext';
import { userProfileService } from '../../services/userProfile.service';
import type { WorkoutData, WorkoutExercise as ServiceWorkoutExercise, ExerciseSet } from '../../types';

interface VisualWorkoutBuilderProps {
  onWorkoutStart: () => void;
}

export const VisualWorkoutBuilder: React.FC<VisualWorkoutBuilderProps> = ({ onWorkoutStart }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useAuth();
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
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [workoutDescription, setWorkoutDescription] = useState('');
  const [workoutTags, setWorkoutTags] = useState('');
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

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
        videoUrl: draggedExercise.videoLinks?.[0], // Map first video URL
        thumbnailUrl: undefined, // Could be generated from video URL if needed
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

  // Convert workout exercises to service format
  const convertToServiceFormat = useCallback((): ServiceWorkoutExercise[] => {
    return workoutExercises.map(exercise => {
      let supersetWithExerciseIds: string[] = [];
      
      // Find superset group for this exercise
      Object.entries(supersetGroups).forEach(([groupId, exerciseIds]) => {
        if (exerciseIds.includes(exercise.id)) {
          // Get other exercises in the superset and map to their exercise IDs
          const otherExerciseIds = exerciseIds.filter(id => id !== exercise.id);
          supersetWithExerciseIds = otherExerciseIds
            .map(id => {
              const otherExercise = workoutExercises.find(ex => ex.id === id);
              return otherExercise ? otherExercise.exerciseId : '';
            })
            .filter(id => id !== '');
        }
      });
      
      const serviceExercise: ServiceWorkoutExercise = {
        exerciseId: exercise.exerciseId,
        exerciseName: exercise.exerciseName,
        sets: exercise.sets.map(set => {
          const cleanSet: ExerciseSet = {};
          if (set.reps) cleanSet.targetReps = set.reps;
          if (set.weight && set.weight > 0) cleanSet.targetWeight = set.weight;
          if (set.rpe) cleanSet.rpe = set.rpe;
          return cleanSet;
        }),
        restTime: exercise.restTimeSeconds || 90,
      };
      
      // Only add optional fields if they have values
      if (exercise.notes) {
        serviceExercise.notes = exercise.notes;
      }
      if (supersetWithExerciseIds.length > 0) {
        serviceExercise.supersetWith = supersetWithExerciseIds;
      }
      
      return serviceExercise;
    });
  }, [workoutExercises, supersetGroups]);

  // Handle save workout
  const handleSaveWorkout = useCallback(async () => {
    if (!user) {
      alert('Please sign in to save workouts');
      navigate('/login');
      return;
    }

    if (workoutExercises.length === 0) {
      setSaveError('Please add exercises to your workout');
      return;
    }

    setShowSaveModal(true);
  }, [user, workoutExercises.length, navigate]);

  const confirmSaveWorkout = useCallback(async () => {
    if (!user || workoutExercises.length === 0 || !workoutName.trim()) return;

    setIsSaving(true);
    setSaveError(null);

    try {
      const exercises = convertToServiceFormat();
      const tags = workoutTags.split(',').map(tag => tag.trim()).filter(Boolean);
      
      // Build workout data object with only defined values
      const workoutData: any = {
        userId: user.uid,
        name: workoutName,
        exercises: exercises.map(exercise => {
          // Clean up exercise data
          const cleanExercise: any = {
            exerciseId: exercise.exerciseId,
            exerciseName: exercise.exerciseName,
            sets: exercise.sets.map(set => {
              const cleanSet: any = {};
              if (set.targetReps !== undefined) cleanSet.targetReps = set.targetReps;
              if (set.targetWeight !== undefined && set.targetWeight !== null && set.targetWeight > 0) {
                cleanSet.targetWeight = set.targetWeight;
              }
              if (set.rpe !== undefined) cleanSet.rpe = set.rpe;
              return cleanSet;
            }),
            restTime: exercise.restTime || 90,
          };
          
          if (exercise.notes) cleanExercise.notes = exercise.notes;
          if (exercise.supersetWith && exercise.supersetWith.length > 0) {
            cleanExercise.supersetWith = exercise.supersetWith;
          }
          
          return cleanExercise;
        }),
        tags,
        category: 'custom',
        isPublic: false,
        performanceCount: 0,
      };
      
      // Add description only if it exists
      if (workoutDescription.trim()) {
        workoutData.description = workoutDescription;
      }

      await userProfileService.saveWorkout(workoutData);
      
      // Clear form
      setWorkoutName('');
      setWorkoutDescription('');
      setWorkoutTags('');
      setShowSaveModal(false);
      
      alert('Workout saved successfully!');
      navigate('/profile');
    } catch (error) {
      console.error('Error saving workout:', error);
      setSaveError('Failed to save workout. Please try again.');
    } finally {
      setIsSaving(false);
    }
  }, [user, workoutExercises.length, workoutName, workoutDescription, workoutTags, convertToServiceFormat, navigate]);

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
  }, [workoutExercises, workoutName, dispatch, onWorkoutStart, supersetGroups]);

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
                  variant="outline"
                  size="sm"
                  onClick={handleSaveWorkout}
                  disabled={workoutExercises.length === 0}
                >
                  <Save className="w-4 h-4 mr-1" />
                  Save
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

      {/* Save Workout Modal */}
      <Modal
        isOpen={showSaveModal}
        onClose={() => {
          setShowSaveModal(false);
          setSaveError(null);
        }}
        title="Save Workout"
        size="md"
      >
        <div className="space-y-4">
          {saveError && (
            <Alert variant="error" title="Error">
              {saveError}
            </Alert>
          )}
          
          <div>
            <Typography variant="body2" className="mb-1">
              Workout Name *
            </Typography>
            <Input
              value={workoutName}
              onChange={(e) => setWorkoutName(e.target.value)}
              placeholder="e.g., Upper Body Strength"
              required
            />
          </div>

          <div>
            <Typography variant="body2" className="mb-1">
              Description
            </Typography>
            <Textarea
              value={workoutDescription}
              onChange={(e) => setWorkoutDescription(e.target.value)}
              placeholder="Brief description of the workout..."
              rows={3}
            />
          </div>

          <div>
            <Typography variant="body2" className="mb-1">
              Tags (comma-separated)
            </Typography>
            <Input
              value={workoutTags}
              onChange={(e) => setWorkoutTags(e.target.value)}
              placeholder="e.g., strength, upper body, push"
            />
          </div>

          <div className="flex gap-2 mt-6">
            <Button
              variant="outline"
              onClick={() => {
                setShowSaveModal(false);
                setSaveError(null);
              }}
              className="flex-1"
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={confirmSaveWorkout}
              className="flex-1"
              disabled={!workoutName.trim() || isSaving}
            >
              {isSaving ? 'Saving...' : 'Save Workout'}
            </Button>
          </div>
        </div>
      </Modal>
    </DndContext>
  );
};