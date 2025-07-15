import React, { useState } from 'react';
import { Button } from '../ui/Button';
import { Card, CardContent, CardHeader } from '../ui/Card';
import { cn } from '../../lib/utils';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '../ui/sheet';
import type { WorkoutExercise, WorkoutSet } from '../../store/slices/workoutSlice';

export type ExerciseCardState = 'pending' | 'active' | 'completed' | 'resting';

export interface MobileExerciseCardProps {
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

interface MobileSetInputProps {
  set: WorkoutSet;
  isActive: boolean;
  onComplete: (setData: Partial<WorkoutSet>) => void;
}

const MobileSetInput: React.FC<MobileSetInputProps> = ({ set, isActive, onComplete }) => {
  const [values, setValues] = useState({
    actualReps: set.actualReps || set.reps || 0,
    actualWeight: set.actualWeight || set.weight || 0,
  });

  const handleRepsChange = (delta: number) => {
    setValues(prev => ({
      ...prev,
      actualReps: Math.max(0, prev.actualReps + delta)
    }));
  };

  const handleWeightChange = (delta: number) => {
    setValues(prev => ({
      ...prev,
      actualWeight: Math.max(0, prev.actualWeight + delta)
    }));
  };

  const handleComplete = () => {
    onComplete({
      ...values,
      completed: true,
    });
  };

  return (
    <div className={cn(
      'space-y-4 p-4 rounded-xl',
      'bg-card border border-border',
      isActive && 'border-primary bg-primary/5'
    )}>
      {/* Reps Input */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-muted-foreground">Reps</label>
        <div className="flex items-center justify-between">
          <Button
            size="icon"
            variant="outline"
            onClick={() => handleRepsChange(-1)}
            className="h-12 w-12"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
            </svg>
          </Button>
          <div className="flex-1 text-center">
            <span className="text-3xl font-bold">{values.actualReps}</span>
            <span className="text-sm text-muted-foreground ml-1">/{set.reps}</span>
          </div>
          <Button
            size="icon"
            variant="outline"
            onClick={() => handleRepsChange(1)}
            className="h-12 w-12"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </Button>
        </div>
      </div>

      {/* Weight Input */}
      {set.weight !== undefined && (
        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground">Weight (lbs)</label>
          <div className="flex items-center justify-between">
            <Button
              size="icon"
              variant="outline"
              onClick={() => handleWeightChange(-5)}
              className="h-12 w-12"
            >
              <span className="text-sm font-medium">-5</span>
            </Button>
            <div className="flex-1 text-center">
              <span className="text-3xl font-bold">{values.actualWeight}</span>
              <span className="text-sm text-muted-foreground ml-1">lbs</span>
            </div>
            <Button
              size="icon"
              variant="outline"
              onClick={() => handleWeightChange(5)}
              className="h-12 w-12"
            >
              <span className="text-sm font-medium">+5</span>
            </Button>
          </div>
        </div>
      )}

      {/* Complete Button */}
      <Button
        onClick={handleComplete}
        className="w-full h-14"
        variant="default"
      >
        Complete Set
      </Button>
    </div>
  );
};

export const MobileExerciseCard: React.FC<MobileExerciseCardProps> = ({
  exercise,
  state = 'pending',
  isCurrentExercise = false,
  currentSetIndex = 0,
  restTimeRemaining,
  onSetComplete,
  onExerciseComplete,
  onStartRest,
  onSkipRest,
  className,
}) => {
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const completedSets = exercise.sets.filter(set => set.completed).length;
  const totalSets = exercise.sets.length;
  const progress = (completedSets / totalSets) * 100;

  const handleSetComplete = (setId: string, setData: Partial<WorkoutSet>) => {
    onSetComplete?.(setId, setData);
    
    // Check if this was the last set
    const setIndex = exercise.sets.findIndex(s => s.id === setId);
    if (setIndex === exercise.sets.length - 1) {
      onExerciseComplete?.(exercise.id);
    } else {
      // Start rest timer
      const restDuration = 90; // Default rest duration in seconds
      onStartRest?.(exercise.id, restDuration);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <>
      <Card
        variant={isCurrentExercise ? 'interactive' : 'default'}
        className={cn(
          'transition-all duration-300',
          isCurrentExercise && 'scale-[1.02] shadow-lg',
          state === 'completed' && 'opacity-75',
          className
        )}
        padding="none"
      >
        <CardHeader className="p-4 pb-2">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="text-lg font-semibold line-clamp-1">{exercise.exerciseName}</h3>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-muted-foreground">
                  {completedSets}/{totalSets} sets
                </span>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsDetailsOpen(true)}
              className="h-8 w-8 -mr-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </Button>
          </div>
          
          {/* Progress Bar */}
          <div className="mt-3">
            <div className="h-2 bg-secondary rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-4 pt-2">
          {state === 'resting' && restTimeRemaining !== undefined ? (
            <div className="text-center py-8">
              <div className="text-4xl font-bold text-primary mb-2">
                {formatTime(restTimeRemaining)}
              </div>
              <p className="text-sm text-muted-foreground mb-4">Rest Time</p>
              <Button
                variant="outline"
                onClick={() => onSkipRest?.(exercise.id)}
                className="w-full"
              >
                Skip Rest
              </Button>
            </div>
          ) : isCurrentExercise && currentSetIndex < exercise.sets.length ? (
            <MobileSetInput
              set={exercise.sets[currentSetIndex]}
              isActive={true}
              onComplete={(setData) => 
                handleSetComplete(exercise.sets[currentSetIndex].id, setData)
              }
            />
          ) : (
            <div className="grid grid-cols-4 gap-2">
              {exercise.sets.map((set, index) => (
                <div
                  key={set.id}
                  className={cn(
                    'aspect-square rounded-lg flex items-center justify-center',
                    'text-sm font-medium transition-colors',
                    set.completed 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-secondary text-secondary-foreground'
                  )}
                >
                  {index + 1}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Exercise Details Sheet */}
      <Sheet open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <SheetContent side="bottom" className="h-[80vh]">
          <SheetHeader>
            <SheetTitle>{exercise.exerciseName}</SheetTitle>
            <SheetDescription>
              Exercise Details
            </SheetDescription>
          </SheetHeader>
          
          <div className="mt-6 space-y-4">
            {exercise.notes && (
              <div>
                <h4 className="text-sm font-medium mb-2">Notes</h4>
                <p className="text-sm text-muted-foreground">{exercise.notes}</p>
              </div>
            )}
            
            <div>
              <h4 className="text-sm font-medium mb-2">Sets Overview</h4>
              <div className="space-y-2">
                {exercise.sets.map((set, index) => (
                  <div
                    key={set.id}
                    className={cn(
                      'flex items-center justify-between p-3 rounded-lg',
                      'bg-secondary/50 text-sm',
                      set.completed && 'bg-primary/10'
                    )}
                  >
                    <span className="font-medium">Set {index + 1}</span>
                    <span>
                      {set.reps} reps
                      {set.weight && ` × ${set.weight}lbs`}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
};