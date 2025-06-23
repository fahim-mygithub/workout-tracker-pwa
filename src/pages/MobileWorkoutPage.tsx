import React, { useEffect, useState, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import type { RootState } from '../store';
import {
  endWorkout,
  pauseWorkout,
  resumeWorkout,
  completeSet,
  updateWorkoutDuration,
  nextExercise,
  startRestTimer,
  stopRestTimer,
  type WorkoutSet,
} from '../store/slices/workoutSlice';
import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';
import { MobileExerciseCard } from '../components/exercise/MobileExerciseCard';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '../components/ui/sheet';

export const MobileWorkoutPage: React.FC = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { activeWorkout, restTimer } = useSelector((state: RootState) => state.workout);
  const [showEndWorkoutSheet, setShowEndWorkoutSheet] = useState(false);
  const [showCompletionSheet, setShowCompletionSheet] = useState(false);
  const [workoutTimer, setWorkoutTimer] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Update workout duration timer
  useEffect(() => {
    if (!activeWorkout?.isActive) return;

    const interval = setInterval(() => {
      const startTime = new Date(activeWorkout.startTime).getTime();
      const currentTime = Date.now();
      const duration = Math.floor((currentTime - startTime) / 1000);
      setWorkoutTimer(duration);
      dispatch(updateWorkoutDuration(duration));
    }, 1000);

    return () => clearInterval(interval);
  }, [activeWorkout?.isActive, activeWorkout?.startTime, dispatch]);

  // Redirect if no active workout
  useEffect(() => {
    if (!activeWorkout) {
      navigate('/');
    }
  }, [activeWorkout, navigate]);

  // Scroll to current exercise
  useEffect(() => {
    if (scrollContainerRef.current && activeWorkout) {
      const currentCard = document.getElementById(`exercise-${activeWorkout.currentExerciseIndex}`);
      if (currentCard) {
        currentCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [activeWorkout?.currentExerciseIndex]);

  if (!activeWorkout) {
    return null;
  }

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const getWorkoutProgress = (): { completed: number; total: number } => {
    const completedSets = activeWorkout.exercises.reduce(
      (acc, exercise) => acc + exercise.sets.filter(set => set.completed).length,
      0
    );
    const totalSets = activeWorkout.exercises.reduce(
      (acc, exercise) => acc + exercise.sets.length,
      0
    );
    return { completed: completedSets, total: totalSets };
  };

  const handleSetComplete = (exerciseId: string, setId: string, setData: Partial<WorkoutSet>) => {
    const exerciseIndex = activeWorkout.exercises.findIndex(e => e.id === exerciseId);
    const exercise = activeWorkout.exercises[exerciseIndex];
    const setIndex = exercise.sets.findIndex(s => s.id === setId);
    dispatch(completeSet({ exerciseIndex, setIndex, actualValues: setData }));
  };

  const handleExerciseComplete = (exerciseId: string) => {
    dispatch(nextExercise());
    
    // Check if workout is complete
    const exerciseIndex = activeWorkout.exercises.findIndex(e => e.id === exerciseId);
    if (exerciseIndex === activeWorkout.exercises.length - 1) {
      setShowCompletionSheet(true);
    }
  };

  const handleStartRest = (exerciseId: string, duration: number) => {
    dispatch(startRestTimer({ exerciseId, duration }));
  };

  const handleSkipRest = (exerciseId: string) => {
    dispatch(stopRestTimer());
  };

  const handleEditSet = (exerciseId: string, setId: string, setData: Partial<WorkoutSet>) => {
    // TODO: Implement set editing functionality
    console.log('Edit set:', exerciseId, setId, setData);
  };

  const handleEndWorkout = () => {
    dispatch(endWorkout());
    navigate('/');
  };

  const progress = getWorkoutProgress();
  const progressPercentage = (progress.completed / progress.total) * 100;

  return (
    <div className="min-h-screen bg-background">
      {/* Fixed Header */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-background/95 backdrop-blur-md border-b border-border">
        <div className="px-4 py-3">
          {/* Progress Bar */}
          <div className="h-1 bg-secondary rounded-full overflow-hidden mb-3">
            <div 
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-semibold line-clamp-1">{activeWorkout.name}</h1>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {formatTime(workoutTimer)}
                </span>
                <span>•</span>
                <span>{progress.completed}/{progress.total} sets</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => activeWorkout.isActive ? dispatch(pauseWorkout()) : dispatch(resumeWorkout())}
                className="h-10 w-10"
              >
                {activeWorkout.isActive ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowEndWorkoutSheet(true)}
                className="h-10 w-10"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Exercise Cards */}
      <div 
        ref={scrollContainerRef}
        className="pt-24 pb-20 px-4 space-y-4"
      >
        {activeWorkout.exercises.map((exercise, index) => {
          const exerciseState = (() => {
            if (exercise.sets.every(set => set.completed)) return 'completed';
            if (index === activeWorkout.currentExerciseIndex) {
              if (restTimer.isActive && restTimer.exerciseId === exercise.id) return 'resting';
              return 'active';
            }
            return 'pending';
          })();

          return (
            <div key={exercise.id} id={`exercise-${index}`}>
              <MobileExerciseCard
                exercise={exercise}
                state={exerciseState}
                isCurrentExercise={index === activeWorkout.currentExerciseIndex}
                currentSetIndex={activeWorkout.currentSetIndex}
                restTimeRemaining={restTimer.isActive && restTimer.exerciseId === exercise.id ? restTimer.remainingTime : undefined}
                onSetComplete={(setId, setData) => handleSetComplete(exercise.id, setId, setData)}
                onExerciseComplete={handleExerciseComplete}
                onStartRest={handleStartRest}
                onSkipRest={handleSkipRest}
                onEditSet={(setId, setData) => handleEditSet(exercise.id, setId, setData)}
              />
            </div>
          );
        })}
      </div>

      {/* End Workout Sheet */}
      <Sheet open={showEndWorkoutSheet} onOpenChange={setShowEndWorkoutSheet}>
        <SheetContent side="bottom" className="h-auto">
          <SheetHeader>
            <SheetTitle>End Workout?</SheetTitle>
          </SheetHeader>
          <div className="mt-6 space-y-4">
            <p className="text-sm text-muted-foreground">
              You have completed {progress.completed} out of {progress.total} sets. 
              Are you sure you want to end this workout?
            </p>
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                onClick={() => setShowEndWorkoutSheet(false)}
              >
                Continue
              </Button>
              <Button
                variant="destructive"
                onClick={handleEndWorkout}
              >
                End Workout
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Completion Sheet */}
      <Sheet open={showCompletionSheet} onOpenChange={setShowCompletionSheet}>
        <SheetContent side="bottom" className="h-[60vh]">
          <SheetHeader>
            <SheetTitle>Workout Complete! 🎉</SheetTitle>
          </SheetHeader>
          <div className="mt-6 space-y-6">
            <div className="text-center">
              <div className="text-6xl mb-4">💪</div>
              <h3 className="text-2xl font-bold mb-2">Great Job!</h3>
              <p className="text-muted-foreground">
                You've completed your workout
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 text-center">
              <Card>
                <CardContent className="p-4">
                  <p className="text-3xl font-bold text-primary">{formatTime(workoutTimer)}</p>
                  <p className="text-xs text-muted-foreground mt-1">Duration</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-3xl font-bold text-primary">{progress.total}</p>
                  <p className="text-xs text-muted-foreground mt-1">Sets Completed</p>
                </CardContent>
              </Card>
            </div>

            <Button
              className="w-full h-14"
              onClick={handleEndWorkout}
            >
              Finish Workout
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};