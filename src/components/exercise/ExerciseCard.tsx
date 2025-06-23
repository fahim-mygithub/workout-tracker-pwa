import React, { useState } from 'react';
import { Button } from '../ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Typography } from '../ui/Typography';
import { Flex } from '../ui/Layout';
import { Input } from '../ui/Input';
import { cn } from '../../lib/utils';
import type { WorkoutExercise, WorkoutSet } from '../../store/slices/workoutSlice';

export type ExerciseCardState = 'pending' | 'active' | 'completed' | 'resting';

export interface ExerciseCardProps {
  exercise: WorkoutExercise;
  state?: ExerciseCardState;
  isCurrentExercise?: boolean;
  currentSetIndex?: number;
  restTimeRemaining?: number;
  onSetComplete?: (setId: string, setData: Partial<WorkoutSet>) => void;
  onExerciseComplete?: (exerciseId: string) => void;
  onStartRest?: (exerciseId: string, duration: number) => void;
  onSkipRest?: (exerciseId: string) => void;
  onEditSet?: (setId: string, setData: Partial<WorkoutSet>) => void;
  className?: string;
}

interface SetRowProps {
  set: WorkoutSet;
  index: number;
  isActive: boolean;
  isCompleted: boolean;
  onSetComplete: (setData: Partial<WorkoutSet>) => void;
  onEditSet: (setData: Partial<WorkoutSet>) => void;
}

const SetRow: React.FC<SetRowProps> = ({
  set,
  index,
  isActive,
  isCompleted,
  onSetComplete,
  onEditSet,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValues, setEditValues] = useState({
    actualReps: set.actualReps || set.reps || 0,
    actualWeight: set.actualWeight || set.weight || 0,
    actualTime: set.actualTime || set.time || 0,
    actualDistance: set.actualDistance || set.distance || 0,
  });

  const handleSaveSet = () => {
    onSetComplete({
      ...editValues,
      completed: true,
    });
    setIsEditing(false);
  };

  const handleEditSet = () => {
    onEditSet(editValues);
    setIsEditing(false);
  };

  const formatSetTarget = () => {
    if (set.reps && set.weight) {
      return `${set.reps} × ${set.weight}lbs`;
    } else if (set.time) {
      return `${Math.floor(set.time / 60)}:${(set.time % 60).toString().padStart(2, '0')}`;
    } else if (set.distance) {
      return `${set.distance}m`;
    } else if (set.reps) {
      return `${set.reps} reps`;
    }
    return '-';
  };

  const formatSetActual = () => {
    if (set.actualReps && set.actualWeight) {
      return `${set.actualReps} × ${set.actualWeight}lbs`;
    } else if (set.actualTime) {
      return `${Math.floor(set.actualTime / 60)}:${(set.actualTime % 60).toString().padStart(2, '0')}`;
    } else if (set.actualDistance) {
      return `${set.actualDistance}m`;
    } else if (set.actualReps) {
      return `${set.actualReps} reps`;
    }
    return '-';
  };

  if (isEditing) {
    return (
      <div className={cn(
        'p-4 border-2 rounded-xl space-y-3 transition-all',
        'bg-card border-primary shadow-sm'
      )}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-muted-foreground">Set {index + 1}</span>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsEditing(false)}
            >
              Cancel
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={isCompleted ? handleEditSet : handleSaveSet}
            >
              Save
            </Button>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          {set.reps !== undefined && (
            <div>
              <label className="text-xs text-muted-foreground font-medium block mb-1">Reps</label>
              <Input
                type="number"
                inputMode="numeric"
                value={editValues.actualReps}
                onChange={(e) => setEditValues(prev => ({ ...prev, actualReps: parseInt(e.target.value) || 0 }))}
                className="h-12 text-lg font-semibold text-center"
              />
            </div>
          )}
          {set.weight !== undefined && (
            <div>
              <label className="text-xs text-muted-foreground font-medium block mb-1">Weight (lbs)</label>
              <Input
                type="number"
                inputMode="decimal"
                value={editValues.actualWeight}
                onChange={(e) => setEditValues(prev => ({ ...prev, actualWeight: parseFloat(e.target.value) || 0 }))}
                className="h-12 text-lg font-semibold text-center"
              />
            </div>
          )}
          {set.time !== undefined && (
            <div>
              <label className="text-xs text-muted-foreground font-medium block mb-1">Time (sec)</label>
              <Input
                type="number"
                inputMode="numeric"
                value={editValues.actualTime}
                onChange={(e) => setEditValues(prev => ({ ...prev, actualTime: parseInt(e.target.value) || 0 }))}
                className="h-12 text-lg font-semibold text-center"
              />
            </div>
          )}
          {set.distance !== undefined && (
            <div>
              <label className="text-xs text-muted-foreground font-medium block mb-1">Distance (m)</label>
              <Input
                type="number"
                inputMode="numeric"
                value={editValues.actualDistance}
                onChange={(e) => setEditValues(prev => ({ ...prev, actualDistance: parseInt(e.target.value) || 0 }))}
                className="h-12 text-lg font-semibold text-center"
              />
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'flex items-center justify-between p-4 rounded-xl transition-all',
        'border-2',
        {
          'bg-primary/5 border-primary shadow-sm': isActive && !isCompleted,
          'bg-green-500/5 border-green-500/20': isCompleted,
          'bg-muted/20 border-muted/30': !isActive && !isCompleted,
        }
      )}
    >
      <div className="flex items-center gap-4">
        <div className={cn(
          'flex items-center justify-center w-10 h-10 rounded-full text-sm font-bold transition-all',
          {
            'bg-primary text-primary-foreground': isActive && !isCompleted,
            'bg-green-500/20 text-green-700': isCompleted,
            'bg-muted/50 text-muted-foreground': !isActive && !isCompleted,
          }
        )}>
          {isCompleted ? '✓' : index + 1}
        </div>
        
        <div>
          <div className="font-medium text-base">
            {formatSetTarget()}
          </div>
          {isCompleted && (
            <div className="text-sm text-muted-foreground">
              Actual: {formatSetActual()}
            </div>
          )}
        </div>
      </div>

      <div>
        {isActive && !isCompleted && (
          <Button
            variant="default"
            size="default"
            onClick={() => setIsEditing(true)}
          >
            Complete
          </Button>
        )}

        {isCompleted && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsEditing(true)}
          >
            Edit
          </Button>
        )}
      </div>
    </div>
  );
};

export const ExerciseCard: React.FC<ExerciseCardProps> = ({
  exercise,
  state = 'pending',
  isCurrentExercise = false,
  currentSetIndex = 0,
  restTimeRemaining,
  onSetComplete,
  onExerciseComplete,
  onStartRest,
  onSkipRest,
  onEditSet,
  className,
}) => {
  const completedSets = exercise.sets.filter(set => set.completed).length;
  const totalSets = exercise.sets.length;
  const isCompleted = state === 'completed' || completedSets === totalSets;
  const isResting = state === 'resting';

  const getCardVariant = (): 'default' | 'outlined' | 'elevated' | 'interactive' => {
    if (isCurrentExercise && !isCompleted) return 'elevated';
    if (isCompleted) return 'outlined';
    return 'default';
  };

  const handleSetComplete = (setId: string, setData: Partial<WorkoutSet>) => {
    onSetComplete?.(setId, setData);
    
    // Check if this was the last set and start rest timer
    const setIndex = exercise.sets.findIndex(s => s.id === setId);
    if (setIndex < totalSets - 1 && exercise.restTimeSeconds) {
      onStartRest?.(exercise.id, exercise.restTimeSeconds);
    } else if (setIndex === totalSets - 1) {
      // Last set completed, complete the exercise
      onExerciseComplete?.(exercise.id);
    }
  };

  const formatRestTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Card 
      variant={getCardVariant()}
      className={cn(
        'transition-all duration-300',
        {
          'ring-2 ring-primary': isCurrentExercise && state === 'active',
          'opacity-60': isCompleted,
        },
        className
      )}
    >
      <CardHeader className="pb-4">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-xl">{exercise.exerciseName}</CardTitle>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-sm text-muted-foreground">
                {completedSets}/{totalSets} sets
              </span>
              {exercise.restTimeSeconds && (
                <>
                  <span className="text-muted-foreground">•</span>
                  <span className="text-sm text-muted-foreground">
                    {exercise.restTimeSeconds}s rest
                  </span>
                </>
              )}
            </div>
          </div>
          
          {isCurrentExercise && !isCompleted && (
            <div className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium">
              Active
            </div>
          )}
          
          {isCompleted && (
            <div className="px-3 py-1 bg-green-500/10 text-green-600 rounded-full text-sm font-medium">
              Done
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Rest Timer */}
        {isResting && restTimeRemaining !== undefined && (
          <div className="p-4 bg-orange-500/5 border-2 border-orange-500/20 rounded-xl">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-orange-900">Rest Time</p>
                <p className="text-3xl font-bold text-orange-600 mt-1">
                  {formatRestTime(restTimeRemaining)}
                </p>
              </div>
              <Button
                variant="outline"
                size="default"
                onClick={() => onSkipRest?.(exercise.id)}
                className="border-orange-300 text-orange-700 hover:bg-orange-50"
              >
                Skip Rest
              </Button>
            </div>
          </div>
        )}

        {/* Exercise Notes */}
        {exercise.notes && (
          <div className="p-3 bg-muted/30 rounded-lg">
            <p className="text-xs font-medium text-muted-foreground mb-1">Notes</p>
            <p className="text-sm">{exercise.notes}</p>
          </div>
        )}

        {/* Sets */}
        <div className="space-y-3">
          {exercise.sets.map((set, index) => (
            <SetRow
              key={set.id}
              set={set}
              index={index}
              isActive={isCurrentExercise && currentSetIndex === index && !set.completed}
              isCompleted={set.completed}
              onSetComplete={(setData) => handleSetComplete(set.id, setData)}
              onEditSet={(setData) => onEditSet?.(set.id, setData)}
            />
          ))}
        </div>

        {/* Exercise Actions */}
        {isCurrentExercise && !isCompleted && !isResting && (
          <div className="pt-4 flex justify-between items-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onExerciseComplete?.(exercise.id)}
            >
              Skip Exercise
            </Button>
            <span className="text-sm text-muted-foreground">
              {completedSets > 0 && `${completedSets}/${totalSets} completed`}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};