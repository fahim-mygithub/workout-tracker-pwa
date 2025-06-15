import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import type { RootState } from '../store';
import {
  endWorkout,
  pauseWorkout,
  resumeWorkout,
  nextExercise,
  previousExercise,
  nextSet,
  previousSet,
  completeSet,
  updateWorkoutDuration,
} from '../store/slices/workoutSlice';
import {
  Container,
  Typography,
  Button,
  Card,
  CardContent,
  Flex,
  Alert,
  Modal,
} from '../components/ui';
import { ExerciseCard } from '../components/exercise';
import { RestTimer } from '../components/timer';
import { FailedSetModal, SupersetIndicator, WorkoutCompletion } from '../components/workout';
import { Clock, Play, Pause, Square, ChevronLeft, ChevronRight, Home, AlertTriangle } from 'lucide-react';

export const WorkoutPage: React.FC = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { activeWorkout, restTimer } = useSelector((state: RootState) => state.workout);
  const [showEndWorkoutModal, setShowEndWorkoutModal] = useState(false);
  const [showFailedSetModal, setShowFailedSetModal] = useState(false);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [workoutTimer, setWorkoutTimer] = useState(0);

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

  if (!activeWorkout) {
    return (
      <Container maxWidth="lg" padding="lg">
        <Alert variant="warning" title="No active workout found. Redirecting to home..." />
      </Container>
    );
  }

  const currentExercise = activeWorkout.exercises[activeWorkout.currentExerciseIndex];
  const currentSet = currentExercise?.sets[activeWorkout.currentSetIndex];
  const isFirstExercise = activeWorkout.currentExerciseIndex === 0;
  const isLastExercise = activeWorkout.currentExerciseIndex === activeWorkout.exercises.length - 1;
  const isFirstSet = activeWorkout.currentSetIndex === 0;
  const isLastSet = activeWorkout.currentSetIndex === currentExercise?.sets.length - 1;

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

  const handlePauseResume = () => {
    if (activeWorkout.isActive) {
      dispatch(pauseWorkout());
    } else {
      dispatch(resumeWorkout());
    }
  };

  const handleEndWorkout = () => {
    dispatch(endWorkout());
    navigate('/');
  };

  const handleNextExercise = () => {
    if (!isLastExercise) {
      dispatch(nextExercise());
    }
  };

  const handlePreviousExercise = () => {
    if (!isFirstExercise) {
      dispatch(previousExercise());
    }
  };

  const handleNextSet = () => {
    if (!isLastSet) {
      dispatch(nextSet());
    }
  };

  const handlePreviousSet = () => {
    if (!isFirstSet) {
      dispatch(previousSet());
    }
  };

  const handleSetComplete = (actualValues: Partial<any>) => {
    dispatch(completeSet({
      exerciseIndex: activeWorkout.currentExerciseIndex,
      setIndex: activeWorkout.currentSetIndex,
      actualValues,
    }));

    // Check if workout is complete
    const allExercisesComplete = activeWorkout.exercises.every(exercise =>
      exercise.sets.every(set => set.completed)
    );
    
    if (allExercisesComplete) {
      setShowCompletionModal(true);
      return;
    }

    // Auto-advance to next set or exercise
    if (!isLastSet) {
      handleNextSet();
    } else if (!isLastExercise) {
      handleNextExercise();
    }
  };

  const handleSetFailed = () => {
    setShowFailedSetModal(true);
  };

  const progress = getWorkoutProgress();
  const progressPercentage = progress.total > 0 ? (progress.completed / progress.total) * 100 : 0;

  return (
    <Container maxWidth="lg" padding="sm">
      <div className="space-y-4">
        {/* Header */}
        <Card>
          <CardContent className="p-4">
            <Flex justify="between" align="center" className="mb-3">
              <Typography variant="h4" className="font-bold">
                {activeWorkout.name}
              </Typography>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/')}
                className="text-gray-500 hover:text-gray-700"
              >
                <Home className="w-4 h-4" />
              </Button>
            </Flex>

            <div className="grid grid-cols-2 gap-4 mb-3">
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 text-sm text-gray-600 mb-1">
                  <Clock className="w-4 h-4" />
                  Workout Time
                </div>
                <div className="text-lg font-mono font-semibold">
                  {formatTime(workoutTimer)}
                </div>
              </div>
              <div className="text-center">
                <div className="text-sm text-gray-600 mb-1">Progress</div>
                <div className="text-lg font-semibold">
                  {progress.completed}/{progress.total} sets
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progressPercentage}%` }}
                  />
                </div>
              </div>
            </div>

            <Flex gap="sm" justify="center">
              <Button
                variant={activeWorkout.isActive ? "secondary" : "primary"}
                size="sm"
                onClick={handlePauseResume}
              >
                {activeWorkout.isActive ? (
                  <>
                    <Pause className="w-4 h-4 mr-1" />
                    Pause
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-1" />
                    Resume
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowEndWorkoutModal(true)}
              >
                <Square className="w-4 h-4 mr-1" />
                End Workout
              </Button>
            </Flex>
          </CardContent>
        </Card>

        {/* Superset Indicator */}
        <SupersetIndicator />

        {/* Exercise Navigation */}
        <Card>
          <CardContent className="p-4">
            <Flex justify="between" align="center" className="mb-3">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePreviousExercise}
                disabled={isFirstExercise}
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Previous Exercise
              </Button>
              
              <div className="text-center">
                <Typography variant="body2" color="secondary">
                  Exercise {activeWorkout.currentExerciseIndex + 1} of {activeWorkout.exercises.length}
                </Typography>
                <Typography variant="h6" className="font-semibold">
                  {currentExercise.exerciseName}
                </Typography>
                {currentExercise.progression && (
                  <Typography variant="body2" color="secondary" className="text-xs">
                    {currentExercise.progression.type} progression
                  </Typography>
                )}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={handleNextExercise}
                disabled={isLastExercise}
              >
                Next Exercise
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </Flex>

            {/* Set Navigation */}
            <Flex justify="between" align="center">
              <Button
                variant="ghost"
                size="sm"
                onClick={handlePreviousSet}
                disabled={isFirstSet}
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Previous Set
              </Button>

              <div className="text-center">
                <Typography variant="body2" color="secondary">
                  Set {activeWorkout.currentSetIndex + 1} of {currentExercise.sets.length}
                </Typography>
                {currentSet?.failed && (
                  <div className="flex items-center justify-center gap-1 text-xs text-orange-600 mt-1">
                    <AlertTriangle className="w-3 h-3" />
                    Previous attempt failed
                  </div>
                )}
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={handleNextSet}
                disabled={isLastSet}
              >
                Next Set
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </Flex>

            {/* Failed Set Button */}
            <div className="mt-3 pt-3 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSetFailed}
                className="w-full border-orange-300 text-orange-600 hover:bg-orange-50"
              >
                <AlertTriangle className="w-4 h-4 mr-1" />
                Mark Set as Failed
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Current Exercise Card */}
        <ExerciseCard
          exercise={{
            id: currentExercise.exerciseId,
            name: currentExercise.exerciseName,
            sets: currentExercise.sets.map((set, index) => ({
              reps: set.reps,
              weight: set.weight,
              time: set.time,
              distance: set.distance,
              completed: set.completed,
              isActive: index === activeWorkout.currentSetIndex,
            })),
            restTime: currentExercise.restTimeSeconds,
            notes: currentExercise.notes,
          }}
          state={currentExercise.completed ? 'completed' : restTimer.isActive ? 'resting' : 'active'}
          onSetComplete={handleSetComplete}
          onSkip={() => {
            if (!isLastExercise) {
              handleNextExercise();
            }
          }}
          currentSetIndex={activeWorkout.currentSetIndex}
        />

        {/* Rest Timer */}
        <RestTimer
          onTimerComplete={() => {
            // Timer completed, ready for next set
          }}
          onTimerSkip={() => {
            // Skip rest, continue with workout
          }}
        />

        {/* Workout Status */}
        {!activeWorkout.isActive && (
          <Alert
            variant="warning"
            title="Workout Paused"
            description="Your workout is currently paused. Tap Resume to continue."
          />
        )}
      </div>

      {/* End Workout Modal */}
      <Modal
        isOpen={showEndWorkoutModal}
        onClose={() => setShowEndWorkoutModal(false)}
        title="End Workout"
      >
        <div className="space-y-4">
          <Typography variant="body1">
            Are you sure you want to end this workout? Your progress will be saved.
          </Typography>
          
          <div className="text-sm text-gray-600 space-y-1">
            <div>Duration: {formatTime(workoutTimer)}</div>
            <div>Sets completed: {progress.completed}/{progress.total}</div>
            <div>Progress: {Math.round(progressPercentage)}%</div>
          </div>

          <Flex gap="sm" justify="end">
            <Button
              variant="outline"
              onClick={() => setShowEndWorkoutModal(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleEndWorkout}
            >
              End Workout
            </Button>
          </Flex>
        </div>
      </Modal>

      {/* Failed Set Modal */}
      <FailedSetModal
        isOpen={showFailedSetModal}
        onClose={() => setShowFailedSetModal(false)}
        exerciseIndex={activeWorkout.currentExerciseIndex}
        setIndex={activeWorkout.currentSetIndex}
        currentWeight={currentSet?.weight}
        backoffPercentage={currentExercise.progression?.backoffPercentage || 10}
      />

      {/* Workout Completion Modal */}
      <WorkoutCompletion
        isOpen={showCompletionModal}
        onClose={() => setShowCompletionModal(false)}
      />
    </Container>
  );
};