import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { Button, Card, CardContent, Typography, Flex } from '../ui';
import { cn } from '../../lib/utils';
import { Check, Play, Plus, Minus, SkipForward } from 'lucide-react';
import { startRestTimer, stopRestTimer } from '../../store/slices/workoutSlice';
import type { WorkoutExercise, WorkoutSet } from '../../store/slices/workoutSlice';

export interface WorkoutControlsProps {
  currentExercise: WorkoutExercise;
  currentSet: WorkoutSet;
  currentExerciseIndex: number;
  currentSetIndex: number;
  totalExercises: number;
  totalSets: number;
  isResting: boolean;
  restTimeRemaining?: number;
  onSetComplete: (actualValues: Partial<WorkoutSet>) => void;
  onSkipRest: () => void;
}

type WorkoutState = 'pre-workout' | 'active-set' | 'rest-timer';

export const WorkoutControls: React.FC<WorkoutControlsProps> = ({
  currentExercise,
  currentSet,
  currentExerciseIndex,
  currentSetIndex,
  totalExercises,
  totalSets,
  isResting,
  restTimeRemaining = 0,
  onSetComplete,
  onSkipRest,
}) => {
  const dispatch = useDispatch();
  const [workoutState, setWorkoutState] = useState<WorkoutState>('pre-workout');
  const [modifiedReps, setModifiedReps] = useState(currentSet?.reps || 0);
  const [isStarted, setIsStarted] = useState(false);

  useEffect(() => {
    if (!isStarted) {
      setWorkoutState('pre-workout');
    } else if (isResting) {
      setWorkoutState('rest-timer');
    } else {
      setWorkoutState('active-set');
    }
  }, [isResting, isStarted]);

  useEffect(() => {
    setModifiedReps(currentSet?.reps || 0);
  }, [currentSet]);

  const handleStartWorkout = () => {
    setIsStarted(true);
    setWorkoutState('active-set');
  };

  const handleCompleteSet = () => {
    onSetComplete({
      actualReps: currentSet.reps,
      actualWeight: currentSet.weight,
      completed: true,
    });
    
    // Start rest timer if not the last set
    if (currentSetIndex < totalSets - 1 && currentExercise.restTimeSeconds) {
      dispatch(startRestTimer({
        seconds: currentExercise.restTimeSeconds,
        exerciseId: currentExercise.id,
      }));
      setWorkoutState('rest-timer');
    }
  };

  const handleCompleteSetWithModifiedReps = () => {
    onSetComplete({
      actualReps: modifiedReps,
      actualWeight: currentSet.weight,
      completed: true,
    });
    
    // Move to next set or exercise
    if (currentSetIndex < totalSets - 1) {
      setModifiedReps(currentSet.reps || 0);
    }
    dispatch(stopRestTimer());
    setWorkoutState('active-set');
  };

  const handleSkipRest = () => {
    onSkipRest();
    dispatch(stopRestTimer());
    setWorkoutState('active-set');
  };

  const formatRestTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getRestProgress = (): number => {
    if (!currentExercise.restTimeSeconds) return 0;
    return ((currentExercise.restTimeSeconds - restTimeRemaining) / currentExercise.restTimeSeconds) * 100;
  };

  return (
    <div className="sticky bottom-0 z-40 bg-background border-t shadow-lg pb-safe">
      <div className="p-4">
        {/* Pre-Workout State */}
        {workoutState === 'pre-workout' && (
          <Button
            variant="primary"
            size="lg"
            onClick={handleStartWorkout}
            className="w-full h-16 text-lg font-bold animate-pulse shadow-lg"
          >
            <Play className="w-6 h-6 mr-2" />
            Start Workout
          </Button>
        )}

        {/* Active Set State */}
        {workoutState === 'active-set' && currentSet && (
          <div className="space-y-3">
            <div className="text-center">
              <Typography variant="h5" className="font-bold">
                {currentExercise.exerciseName}
              </Typography>
              <Typography variant="body1" color="secondary">
                Set {currentSetIndex + 1} of {totalSets} • {currentSet.reps} reps @ {currentSet.weight} lbs
              </Typography>
            </div>
            
            <Button
              variant="primary"
              size="lg"
              onClick={handleCompleteSet}
              className="w-full h-16 text-lg font-bold shadow-lg"
            >
              <Check className="w-6 h-6 mr-2" />
              Complete Set
            </Button>
          </div>
        )}

        {/* Rest Timer State */}
        {workoutState === 'rest-timer' && (
          <Card className="border-orange-200 bg-orange-50">
            <CardContent className="p-4 space-y-4">
              {/* Rest Timer Display */}
              <div className="text-center">
                <Typography variant="h6" className="font-bold text-orange-800 mb-1">
                  Rest Time
                </Typography>
                <div className="relative mx-auto w-32 h-32">
                  {/* Circular Progress */}
                  <svg className="absolute inset-0 w-full h-full transform -rotate-90">
                    <circle
                      cx="64"
                      cy="64"
                      r="56"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="8"
                      className="text-orange-200"
                    />
                    <circle
                      cx="64"
                      cy="64"
                      r="56"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="8"
                      strokeDasharray={`${2 * Math.PI * 56}`}
                      strokeDashoffset={`${2 * Math.PI * 56 * (1 - getRestProgress() / 100)}`}
                      className="text-orange-500 transition-all duration-1000 ease-linear"
                      strokeLinecap="round"
                    />
                  </svg>
                  
                  {/* Timer Text */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Typography variant="h3" className="font-mono font-bold text-orange-600">
                      {formatRestTime(restTimeRemaining)}
                    </Typography>
                  </div>
                </div>
              </div>

              {/* Rep Modifier */}
              <div className="bg-white rounded-lg p-3">
                <Typography variant="body2" className="text-center mb-2 text-muted-foreground">
                  Modify completed reps
                </Typography>
                <Flex justify="center" align="center" gap="lg">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setModifiedReps(Math.max(0, modifiedReps - 1))}
                    className="h-10 w-10 border-orange-300 text-orange-600 hover:bg-orange-100"
                  >
                    <Minus className="w-5 h-5" />
                  </Button>
                  
                  <Typography variant="h4" className="font-bold min-w-[60px] text-center">
                    {modifiedReps}
                  </Typography>
                  
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setModifiedReps(modifiedReps + 1)}
                    className="h-10 w-10 border-orange-300 text-orange-600 hover:bg-orange-100"
                  >
                    <Plus className="w-5 h-5" />
                  </Button>
                </Flex>
              </div>

              {/* Action Buttons */}
              <Flex gap="sm">
                <Button
                  variant="outline"
                  size="default"
                  onClick={handleSkipRest}
                  className="flex-1 border-orange-300 text-orange-700 hover:bg-orange-100"
                >
                  <SkipForward className="w-4 h-4 mr-1" />
                  Skip Rest
                </Button>
                <Button
                  variant="primary"
                  size="default"
                  onClick={handleCompleteSetWithModifiedReps}
                  disabled={restTimeRemaining > 0}
                  className={cn(
                    "flex-1 transition-all duration-300",
                    restTimeRemaining > 0
                      ? "bg-orange-300 hover:bg-orange-300"
                      : "bg-orange-600 hover:bg-orange-700"
                  )}
                >
                  {restTimeRemaining > 0 ? 'Wait...' : 'Next Set'}
                </Button>
              </Flex>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};