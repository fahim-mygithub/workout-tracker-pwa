import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, Typography } from '../ui';
import { SetProgressIndicator } from './SetProgressIndicator';
import { cn } from '../../lib/utils';
import type { WorkoutExercise, WorkoutSet } from '../../store/slices/workoutSlice';
import { ExerciseVideo } from '../exercise/ExerciseVideo';

export interface ExerciseItemProps {
  exercise: WorkoutExercise;
  exerciseIndex: number;
  state: 'pending' | 'active' | 'completed';
  isCurrentExercise: boolean;
  currentSetIndex?: number;
  onClick?: () => void;
}

export const ExerciseItem: React.FC<ExerciseItemProps> = ({
  exercise,
  exerciseIndex: _exerciseIndex,
  state,
  isCurrentExercise,
  currentSetIndex = 0,
  onClick,
}) => {

  const getCurrentWeight = (): string => {
    if (!isCurrentExercise || currentSetIndex === undefined) {
      return exercise.sets[0]?.weight?.toString() || '0';
    }
    return exercise.sets[currentSetIndex]?.weight?.toString() || '0';
  };

  const getWeightRange = (): { min: number; max: number } => {
    const weights = exercise.sets
      .map(set => set.weight || 0)
      .filter(weight => weight > 0);
    
    if (weights.length === 0) return { min: 0, max: 0 };
    
    return {
      min: Math.min(...weights),
      max: Math.max(...weights),
    };
  };

  const weightRange = getWeightRange();
  const currentWeight = getCurrentWeight();

  return (
    <Card
      variant={isCurrentExercise ? 'elevated' : 'default'}
      className={cn(
        'transition-all duration-300 cursor-pointer overflow-hidden',
        {
          'ring-2 ring-primary shadow-lg': isCurrentExercise,
          'opacity-60 grayscale': state === 'pending' && !isCurrentExercise,
          'border-green-500/20 bg-green-50/5': state === 'completed',
        }
      )}
      onClick={onClick}
    >
      <CardContent className="p-4 space-y-4">
        {/* Top Section - Video and Exercise Info */}
        <div className="grid grid-cols-5 gap-4">
          {/* Video Section - Left Side */}
          <div className="col-span-2">
            <ExerciseVideo 
              videoLinks={exercise.videoLinks}
              exerciseName={exercise.exerciseName}
              className="w-full"
            />
          </div>

          {/* Exercise Info - Right Side */}
          <div className="col-span-3 space-y-2">
            <div>
              <Typography variant="h6" className="font-bold line-clamp-1">
                {exercise.exerciseName}
              </Typography>
              <Typography variant="body2" color="secondary">
                {exercise.sets.length} sets × {exercise.sets[0]?.reps || 0} reps
              </Typography>
            </div>
            
            {/* Notes/Variations */}
            {exercise.notes && (
              <Typography variant="caption" className="text-muted-foreground line-clamp-2">
                {exercise.notes}
              </Typography>
            )}
          </div>
        </div>

        {/* Set Progress Indicator */}
        <SetProgressIndicator
          sets={exercise.sets}
          currentSetIndex={isCurrentExercise ? currentSetIndex : undefined}
        />

        {/* Weight Display */}
        <div className="bg-muted/30 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Typography variant="body2" className="text-muted-foreground">
                Weight Range
              </Typography>
              <Typography variant="h6" className="font-bold">
                {weightRange.min === weightRange.max
                  ? `${weightRange.min} lbs`
                  : `${weightRange.min}-${weightRange.max} lbs`}
              </Typography>
            </div>
            {isCurrentExercise && (
              <div className="text-right space-y-1">
                <Typography variant="body2" className="text-muted-foreground">
                  Current Set
                </Typography>
                <Typography variant="h5" className="font-bold text-primary">
                  {currentWeight} lbs
                </Typography>
              </div>
            )}
          </div>
          
          {/* Exercise Duration (if tracking) */}
          {isCurrentExercise && (
            <div className="mt-2 pt-2 border-t border-border/50">
              <Typography variant="caption" className="text-muted-foreground">
                Set duration: 0:00
              </Typography>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};