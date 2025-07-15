import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import type { RootState } from '../store';
import {
  startWorkout,
  endWorkout,
  pauseWorkout,
  resumeWorkout,
  completeSet,
  nextSet,
  nextExercise,
  updateWorkoutDuration,
  updateRestTimer,
  stopRestTimer,
  type WorkoutData,
  type WorkoutExercise,
} from '../store/slices/workoutSlice';
import { WorkoutHeader } from '../components/workout/WorkoutHeader';
import { ExerciseList } from '../components/workout/ExerciseList';
import { WorkoutControls } from '../components/workout/WorkoutControls';
import { WorkoutCompletion } from '../components/workout';
import { RestTimer } from '../components/timer/RestTimer';
import { findExerciseInDirectory } from '../utils/exerciseMatching';

export const WorkoutPageV2: React.FC = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { activeWorkout, restTimer } = useSelector((state: RootState) => state.workout);
  const { exercises } = useSelector((state: RootState) => state.exercise);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [workoutTimer, setWorkoutTimer] = useState(0);
  const [hasStartedWorkout, setHasStartedWorkout] = useState(false);

  // Handle workout from navigation state
  useEffect(() => {
    const workoutData = location.state?.workout as WorkoutData | undefined;
    
    console.log('[WorkoutPageV2] useEffect - location.state:', location.state);
    console.log('[WorkoutPageV2] useEffect - workoutData:', workoutData);
    console.log('[WorkoutPageV2] useEffect - activeWorkout:', activeWorkout);
    
    if (workoutData && !activeWorkout && !hasStartedWorkout) {
      console.log('[WorkoutPageV2] Starting workout from navigation state');
      setHasStartedWorkout(true);
      const workoutExercises: WorkoutExercise[] = workoutData.exercises.map((exercise, index) => {
        // Find the exercise in the directory using fuzzy matching
        const matchedExercise = findExerciseInDirectory(exercise.exerciseName, exercises);
        
        return {
          id: `exercise-${index}`,
          exerciseId: exercise.exerciseId || matchedExercise?.id || `custom-${index}`,
          exerciseName: exercise.exerciseName,
          sets: exercise.sets.map((set, setIndex) => ({
            id: `set-${index}-${setIndex}`,
            reps: set.targetReps,
            weight: set.targetWeight,
            time: set.targetTime,
            distance: set.targetDistance,
            completed: false,
            rpe: set.rpe,
          })),
          restTimeSeconds: exercise.restTime || exercise.sets[0]?.restBetweenSets || 90,
          notes: exercise.notes,
          completed: false,
          isSuperset: exercise.supersetWith ? true : false,
          supersetGroup: exercise.supersetWith?.join(','),
          videoLinks: matchedExercise?.videoLinks || [],
        };
      });

      dispatch(startWorkout({
        id: `workout-${Date.now()}`,
        name: workoutData.name,
        description: workoutData.description,
        exercises: workoutExercises,
        currentExerciseIndex: 0,
        currentSetIndex: 0,
      }));
    }
  }, [location.state, activeWorkout, dispatch, exercises]);

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

  // Update rest timer
  useEffect(() => {
    if (!restTimer.isActive || restTimer.timeRemaining <= 0) return;

    const interval = setInterval(() => {
      const newTime = restTimer.timeRemaining - 1;
      dispatch(updateRestTimer(newTime));
      
      if (newTime <= 0) {
        dispatch(stopRestTimer());
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [restTimer.isActive, restTimer.timeRemaining, dispatch]);

  // Redirect if no active workout
  useEffect(() => {
    if (!activeWorkout && !location.state?.workout) {
      navigate('/');
    }
  }, [activeWorkout, location.state, navigate]);

  if (!activeWorkout) {
    console.log('[WorkoutPageV2] No activeWorkout, returning null');
    return null;
  }

  console.log('[WorkoutPageV2] Rendering with activeWorkout:', activeWorkout);
  
  // Additional safety check in case activeWorkout becomes null during render
  if (!activeWorkout?.exercises || !activeWorkout.exercises[activeWorkout.currentExerciseIndex]) {
    console.log('[WorkoutPageV2] activeWorkout or exercises invalid, returning null');
    return null;
  }
  
  const currentExercise = activeWorkout.exercises[activeWorkout.currentExerciseIndex];
  const currentSet = currentExercise?.sets[activeWorkout.currentSetIndex];

  const handleSetComplete = (actualValues: Partial<typeof currentSet>) => {
    dispatch(completeSet({
      exerciseIndex: activeWorkout.currentExerciseIndex,
      setIndex: activeWorkout.currentSetIndex,
      actualValues,
    }));

    // Move to next set or exercise
    const currentExercise = activeWorkout.exercises[activeWorkout.currentExerciseIndex];
    if (activeWorkout.currentSetIndex < currentExercise.sets.length - 1) {
      // Move to next set in current exercise
      dispatch(nextSet());
    } else if (activeWorkout.currentExerciseIndex < activeWorkout.exercises.length - 1) {
      // Move to next exercise
      dispatch(nextExercise());
    } else {
      // Check if workout is complete
      const allSetsComplete = activeWorkout.exercises.every(exercise =>
        exercise.sets.every(set => set.completed)
      );
      
      if (allSetsComplete) {
        setShowCompletionModal(true);
      }
    }
  };

  const handleEndWorkout = () => {
    console.log('[WorkoutPageV2] handleEndWorkout - ending workout');
    // Clear the workout from state
    dispatch(endWorkout());
    // Navigate to workout with null state to prevent auto-start
    navigate('/workout', { replace: true, state: null });
  };

  const handlePauseResume = () => {
    if (activeWorkout.isActive) {
      dispatch(pauseWorkout());
    } else {
      dispatch(resumeWorkout());
    }
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header - Fixed at top */}
      <WorkoutHeader
        workoutName={activeWorkout.name}
        currentExercise={currentExercise}
        currentExerciseIndex={activeWorkout.currentExerciseIndex}
        currentSetIndex={activeWorkout.currentSetIndex}
        totalExercises={activeWorkout.exercises.length}
        workoutTimer={workoutTimer}
        exercises={activeWorkout.exercises}
        isActive={activeWorkout.isActive}
        onPauseResume={handlePauseResume}
        onEndWorkout={() => handleEndWorkout()}
      />

      {/* Exercise List - Scrollable middle section */}
      <div className="flex-1 overflow-hidden">
        <ExerciseList
          exercises={activeWorkout.exercises}
          currentExerciseIndex={activeWorkout.currentExerciseIndex}
          currentSetIndex={activeWorkout.currentSetIndex}
          onExerciseClick={(index) => {
            // Optional: Allow jumping to specific exercises
          }}
        />
      </div>

      {/* Rest Timer is integrated into WorkoutControls */}

      {/* Workout Controls - Fixed at bottom */}
      <WorkoutControls
        currentExercise={currentExercise}
        currentSet={currentSet}
        currentExerciseIndex={activeWorkout.currentExerciseIndex}
        currentSetIndex={activeWorkout.currentSetIndex}
        totalExercises={activeWorkout.exercises.length}
        totalSets={currentExercise?.sets.length || 0}
        isResting={restTimer.isActive}
        restTimeRemaining={restTimer.timeRemaining}
        onSetComplete={handleSetComplete}
        onSkipRest={() => {
          dispatch(stopRestTimer());
        }}
      />

      {/* Workout Completion Modal */}
      <WorkoutCompletion
        isOpen={showCompletionModal}
        onClose={() => setShowCompletionModal(false)}
      />
    </div>
  );
};