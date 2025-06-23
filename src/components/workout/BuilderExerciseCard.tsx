import React, { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardContent, CardHeader, Typography, Button, Input } from '../ui';
import { GripVertical, Plus, Minus, Trash2, ChevronDown, ChevronUp, Clock, Link, Unlink } from 'lucide-react';
import { cn } from '../../lib/utils';
import type { WorkoutExercise, WorkoutSet } from '../../store/slices/workoutSlice';

interface BuilderExerciseCardProps {
  exercise: WorkoutExercise;
  index: number;
  onUpdate: (updates: Partial<WorkoutExercise>) => void;
  onRemove: () => void;
  onToggleSuperset?: () => void;
  isNextInSuperset?: boolean;
  isPrevInSuperset?: boolean;
  isDragging?: boolean;
}

export const BuilderExerciseCard: React.FC<BuilderExerciseCardProps> = ({
  exercise,
  index,
  onUpdate,
  onRemove,
  onToggleSuperset,
  isNextInSuperset = false,
  isPrevInSuperset = false,
  isDragging = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [editingRest, setEditingRest] = useState(false);
  const [tempRestTime, setTempRestTime] = useState(exercise.restTimeSeconds?.toString() || '90');

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: exercise.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  // Handle set updates
  const handleSetUpdate = (setIndex: number, field: keyof WorkoutSet, value: number) => {
    const updatedSets = [...exercise.sets];
    updatedSets[setIndex] = {
      ...updatedSets[setIndex],
      [field]: value,
    };
    onUpdate({ sets: updatedSets });
  };

  // Add new set
  const handleAddSet = () => {
    const lastSet = exercise.sets[exercise.sets.length - 1];
    const newSet: WorkoutSet = {
      id: `set-${Date.now()}`,
      reps: lastSet?.reps || 10,
      weight: lastSet?.weight || 0,
      completed: false,
    };
    onUpdate({ sets: [...exercise.sets, newSet] });
  };

  // Remove set
  const handleRemoveSet = (setIndex: number) => {
    if (exercise.sets.length > 1) {
      const updatedSets = exercise.sets.filter((_, i) => i !== setIndex);
      onUpdate({ sets: updatedSets });
    }
  };

  // Update rest time
  const handleRestTimeUpdate = () => {
    const restTime = parseInt(tempRestTime) || 90;
    onUpdate({ restTimeSeconds: restTime });
    setEditingRest(false);
  };

  // Update notes
  const handleNotesUpdate = (notes: string) => {
    onUpdate({ notes });
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} className="relative">
      {/* Superset Label Badge - show only on first exercise */}
      {!isNextInSuperset && isPrevInSuperset && (
        <div className="absolute -top-3 left-4 z-10">
          <div className="bg-blue-500 text-white text-[11px] font-bold px-3 py-1 rounded-full shadow-md flex items-center gap-1">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
            SUPERSET
          </div>
        </div>
      )}
      
      <Card className={cn(
        'transition-all relative',
        isDragging && 'opacity-50',
        'hover:shadow-md',
        // Remove top border and round corners for connected cards
        isNextInSuperset && 'rounded-t-none border-t-0 -mt-px',
        isPrevInSuperset && !isNextInSuperset && 'rounded-b-none',
        // Blue outline for superset cards
        (isNextInSuperset || isPrevInSuperset) && 'border-2 border-blue-500',
        // Ensure proper stacking
        (isNextInSuperset || isPrevInSuperset) && 'relative z-0'
      )}>
        
        {/* Separator line for superset exercises */}
        {isNextInSuperset && (
          <div className="absolute top-0 left-4 right-4 h-px bg-blue-200"></div>
        )}
        
        <CardHeader className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 flex-1">
              <div
                {...listeners}
                className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600"
              >
                <GripVertical className="w-5 h-5" />
              </div>
              
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <Typography variant="h6" className="font-semibold">
                    {index + 1}. {exercise.exerciseName}
                  </Typography>
                  <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="p-1 hover:bg-gray-100 rounded"
                  >
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </button>
                </div>
                
                <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                  <span>{exercise.sets.length} sets</span>
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {editingRest ? (
                      <div className="flex items-center gap-1">
                        <Input
                          type="number"
                          value={tempRestTime}
                          onChange={(e) => setTempRestTime(e.target.value)}
                          className="w-16 h-6 text-xs"
                          onBlur={handleRestTimeUpdate}
                          onKeyDown={(e) => e.key === 'Enter' && handleRestTimeUpdate()}
                          autoFocus
                        />
                        <span className="text-xs">sec</span>
                      </div>
                    ) : (
                      <button
                        onClick={() => setEditingRest(true)}
                        className="hover:text-blue-600"
                      >
                        {exercise.restTimeSeconds}s rest
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {onToggleSuperset && index > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onToggleSuperset}
                  className={cn(
                    'text-gray-500 hover:text-blue-600 hover:bg-blue-50',
                    isPrevInSuperset && 'text-blue-600 bg-blue-50'
                  )}
                  title={isPrevInSuperset ? 'Remove from superset' : 'Create superset with previous exercise'}
                >
                  {isPrevInSuperset ? (
                    <Unlink className="w-4 h-4" />
                  ) : (
                    <Link className="w-4 h-4" />
                  )}
                </Button>
              )}
              
              <Button
                variant="ghost"
                size="sm"
                onClick={onRemove}
                className="text-red-500 hover:text-red-600 hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        {isExpanded && (
          <CardContent className="p-4 pt-0 space-y-3">
            {/* Sets */}
            <div className="space-y-2">
              {exercise.sets.map((set, setIndex) => (
                <div key={set.id} className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg">
                  <Typography variant="body2" className="font-medium w-16">
                    Set {setIndex + 1}
                  </Typography>
                  
                  <div className="flex items-center gap-2 flex-1">
                    <div className="flex items-center gap-1">
                      <Input
                        type="number"
                        value={set.reps || 0}
                        onChange={(e) => handleSetUpdate(setIndex, 'reps', parseInt(e.target.value) || 0)}
                        className="w-16 h-8 text-center"
                        min="0"
                      />
                      <span className="text-sm text-gray-600">reps</span>
                    </div>
                    
                    <span className="text-gray-400">×</span>
                    
                    <div className="flex items-center gap-1">
                      <Input
                        type="number"
                        value={set.weight || 0}
                        onChange={(e) => handleSetUpdate(setIndex, 'weight', parseFloat(e.target.value) || 0)}
                        className="w-20 h-8 text-center"
                        min="0"
                        step="2.5"
                      />
                      <span className="text-sm text-gray-600">lbs</span>
                    </div>
                  </div>
                  
                  {exercise.sets.length > 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveSet(setIndex)}
                      className="p-1 text-gray-400 hover:text-red-500"
                    >
                      <Minus className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>

            {/* Add Set Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleAddSet}
              className="w-full"
            >
              <Plus className="w-4 h-4 mr-1" />
              Add Set
            </Button>

            {/* Notes */}
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">
                Notes (optional)
              </label>
              <Input
                placeholder="Form cues, tempo, etc..."
                value={exercise.notes || ''}
                onChange={(e) => handleNotesUpdate(e.target.value)}
                className="w-full"
              />
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
};