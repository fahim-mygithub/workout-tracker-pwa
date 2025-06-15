import React, { useState } from 'react';
import { Button, Card, CardContent, Typography, Flex, Input } from '../ui';
import { cn } from '../../utils/cn';
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

  return (
    <div
      className={cn(
        'flex items-center justify-between p-3 border rounded-lg transition-colors',
        {
          'bg-blue-50 border-blue-200': isActive && !isCompleted,
          'bg-green-50 border-green-200': isCompleted,
          'bg-gray-50 border-gray-200': !isActive && !isCompleted,
          'ring-2 ring-blue-400': isActive && !isCompleted,
        }
      )}
    >
      <div className="flex items-center space-x-4">
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 text-sm font-medium">
          {index + 1}
        </div>
        
        <div>
          <Typography variant="body2" className="font-medium">
            Target: {formatSetTarget()}
          </Typography>
          {isCompleted && (
            <Typography variant="caption" color="secondary">
              Actual: {formatSetActual()}
            </Typography>
          )}
        </div>
      </div>

      <div className="flex items-center space-x-2">
        {isActive && !isCompleted && !isEditing && (
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsEditing(true)}
          >
            Complete Set
          </Button>
        )}

        {isCompleted && !isEditing && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsEditing(true)}
          >
            Edit
          </Button>
        )}

        {isEditing && (
          <div className="flex items-center space-x-2">
            {set.reps !== undefined && (
              <Input
                type="number"
                placeholder="Reps"
                value={editValues.actualReps}
                onChange={(e) => setEditValues(prev => ({ ...prev, actualReps: parseInt(e.target.value) || 0 }))}
                className="w-16 text-sm"
              />
            )}
            {set.weight !== undefined && (
              <Input
                type="number"
                placeholder="Weight"
                value={editValues.actualWeight}
                onChange={(e) => setEditValues(prev => ({ ...prev, actualWeight: parseInt(e.target.value) || 0 }))}
                className="w-20 text-sm"
              />
            )}
            {set.time !== undefined && (
              <Input
                type="number"
                placeholder="Time (s)"
                value={editValues.actualTime}
                onChange={(e) => setEditValues(prev => ({ ...prev, actualTime: parseInt(e.target.value) || 0 }))}
                className="w-20 text-sm"
              />
            )}
            {set.distance !== undefined && (
              <Input
                type="number"
                placeholder="Distance"
                value={editValues.actualDistance}
                onChange={(e) => setEditValues(prev => ({ ...prev, actualDistance: parseInt(e.target.value) || 0 }))}
                className="w-20 text-sm"
              />
            )}
            <Button
              variant="primary"
              size="sm"
              onClick={isCompleted ? handleEditSet : handleSaveSet}
            >
              Save
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsEditing(false)}
            >
              Cancel
            </Button>
          </div>
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

  const getStateIcon = () => {
    switch (state) {
      case 'completed':
        return '✅';
      case 'active':
        return '🏋️';
      case 'resting':
        return '⏳';
      default:
        return '⭕';
    }
  };

  const getStateColor = () => {
    switch (state) {
      case 'completed':
        return 'border-green-500 bg-green-50';
      case 'active':
        return 'border-blue-500 bg-blue-50';
      case 'resting':
        return 'border-orange-500 bg-orange-50';
      default:
        return 'border-gray-200 bg-white';
    }
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
    <Card className={cn('transition-all duration-200', getStateColor(), className)}>
      <CardContent className="p-4">
        {/* Exercise Header */}
        <Flex justify="between" align="center" className="mb-4">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">{getStateIcon()}</span>
            <div>
              <Typography variant="h5" className="font-semibold">
                {exercise.exerciseName}
              </Typography>
              <Typography variant="caption" color="secondary">
                {completedSets}/{totalSets} sets • {exercise.restTimeSeconds ? `${exercise.restTimeSeconds}s rest` : 'No rest'}
              </Typography>
            </div>
          </div>
          
          {isCurrentExercise && (
            <div className="px-2 py-1 bg-blue-100 text-blue-800 rounded-md text-xs font-medium">
              Current
            </div>
          )}
        </Flex>

        {/* Rest Timer */}
        {isResting && restTimeRemaining !== undefined && (
          <div className="mb-4 p-3 bg-orange-100 border border-orange-200 rounded-lg">
            <Flex justify="between" align="center">
              <div>
                <Typography variant="body2" className="font-medium text-orange-800">
                  Rest Time
                </Typography>
                <Typography variant="h4" className="font-bold text-orange-600">
                  {formatRestTime(restTimeRemaining)}
                </Typography>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onSkipRest?.(exercise.id)}
                className="border-orange-300 text-orange-700 hover:bg-orange-50"
              >
                Skip Rest
              </Button>
            </Flex>
          </div>
        )}

        {/* Exercise Notes */}
        {exercise.notes && (
          <div className="mb-4 p-2 bg-gray-50 rounded border">
            <Typography variant="caption" color="secondary" className="font-medium">
              Notes:
            </Typography>
            <Typography variant="body2">
              {exercise.notes}
            </Typography>
          </div>
        )}

        {/* Sets */}
        <div className="space-y-2">
          <Typography variant="body2" className="font-medium text-gray-700">
            Sets
          </Typography>
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
          <div className="mt-4 pt-3 border-t">
            <Flex justify="between">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onExerciseComplete?.(exercise.id)}
              >
                Skip Exercise
              </Button>
              {completedSets > 0 && (
                <Typography variant="caption" color="secondary">
                  {completedSets}/{totalSets} sets completed
                </Typography>
              )}
            </Flex>
          </div>
        )}

        {/* Completed Exercise Summary */}
        {isCompleted && (
          <div className="mt-4 pt-3 border-t border-green-200">
            <Typography variant="body2" className="text-green-700 font-medium">
              ✅ Exercise completed!
            </Typography>
            <Typography variant="caption" color="secondary">
              All {totalSets} sets finished
            </Typography>
          </div>
        )}
      </CardContent>
    </Card>
  );
};