import React from 'react';
import { Button, Typography, Flex } from '../ui';
import { Clock, Pause, Play, X } from 'lucide-react';
import { cn } from '../../lib/utils';
import type { WorkoutExercise } from '../../store/slices/workoutSlice';

export interface WorkoutHeaderProps {
  workoutName: string;
  currentExercise: WorkoutExercise;
  currentExerciseIndex: number;
  currentSetIndex: number;
  totalExercises: number;
  workoutTimer: number;
  exercises: WorkoutExercise[];
  isActive: boolean;
  onPauseResume: () => void;
  onEndWorkout: () => void;
}

export const WorkoutHeader: React.FC<WorkoutHeaderProps> = ({
  workoutName,
  currentExercise,
  currentExerciseIndex,
  currentSetIndex,
  totalExercises,
  workoutTimer,
  exercises,
  isActive,
  onPauseResume,
  onEndWorkout,
}) => {
  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const getWorkoutProgress = (): number => {
    const completedSets = exercises.reduce(
      (acc, exercise) => acc + exercise.sets.filter(set => set.completed).length,
      0
    );
    const totalSets = exercises.reduce(
      (acc, exercise) => acc + exercise.sets.length,
      0
    );
    return totalSets > 0 ? (completedSets / totalSets) * 100 : 0;
  };

  const progressPercentage = getWorkoutProgress();

  return (
    <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b shadow-sm">
      <div className="px-4 py-3 space-y-3">
        {/* Top Row - Workout Info and Controls */}
        <Flex justify="between" align="center">
          <div className="flex-1">
            <Typography variant="h6" className="font-bold text-lg truncate">
              {currentExercise.exerciseName}
            </Typography>
            <Typography variant="body2" color="secondary" className="text-xs">
              Exercise {currentExerciseIndex + 1} of {totalExercises} • Set {currentSetIndex + 1} of {currentExercise.sets.length}
            </Typography>
          </div>
          
          <Flex gap="sm" align="center">
            <Button
              variant="ghost"
              size="icon"
              onClick={onPauseResume}
              className="h-10 w-10"
            >
              {isActive ? (
                <Pause className="w-5 h-5" />
              ) : (
                <Play className="w-5 h-5" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onEndWorkout}
              className="h-10 w-10 text-destructive hover:text-destructive"
            >
              <X className="w-5 h-5" />
            </Button>
          </Flex>
        </Flex>

        {/* Timer and Progress Row */}
        <div className="space-y-2">
          <Flex justify="between" align="center">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <Typography variant="body2" className="font-mono font-semibold">
                {formatTime(workoutTimer)}
              </Typography>
            </div>
            <Typography variant="body2" color="secondary">
              {Math.round(progressPercentage)}% Complete
            </Typography>
          </Flex>
          
          {/* Progress Bar */}
          <div className="relative w-full h-2 bg-muted rounded-full overflow-hidden">
            <div
              className={cn(
                "absolute top-0 left-0 h-full bg-primary rounded-full transition-all duration-500 ease-out",
                {
                  "bg-green-500": progressPercentage === 100,
                }
              )}
              style={{ width: `${progressPercentage}%` }}
            >
              {/* Animated shine effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};