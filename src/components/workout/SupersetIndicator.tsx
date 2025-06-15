import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState } from '../../store';
import { nextSupersetExercise, completeSupersetRound, endSuperset } from '../../store/slices/workoutSlice';
import {
  Card,
  CardContent,
  Typography,
  Button,
  Flex,
} from '../ui';
import { Link, ChevronRight, RotateCcw, Square } from 'lucide-react';

export const SupersetIndicator: React.FC = () => {
  const dispatch = useDispatch();
  const { activeWorkout } = useSelector((state: RootState) => state.workout);

  if (!activeWorkout?.currentSupersetGroup || !activeWorkout.supersetGroups) {
    return null;
  }

  const currentSupersetGroup = activeWorkout.supersetGroups.find(
    group => group.id === activeWorkout.currentSupersetGroup
  );

  if (!currentSupersetGroup) {
    return null;
  }

  const currentExercise = activeWorkout.exercises[activeWorkout.currentExerciseIndex];
  const isLastExerciseInSuperset = 
    currentSupersetGroup.currentExerciseIndex === currentSupersetGroup.exerciseIds.length - 1;
  const isLastSetOfExercise = 
    activeWorkout.currentSetIndex === currentExercise?.sets.length - 1;

  const handleNextSupersetExercise = () => {
    if (isLastExerciseInSuperset) {
      // Complete the superset round
      if (isLastSetOfExercise) {
        // End superset if this is the last set of the last exercise
        dispatch(endSuperset());
      } else {
        // Go to next round
        dispatch(completeSupersetRound());
      }
    } else {
      // Move to next exercise in superset
      dispatch(nextSupersetExercise());
    }
  };

  const getExerciseNames = () => {
    return currentSupersetGroup.exerciseIds.map(exerciseId => {
      const exercise = activeWorkout.exercises.find(ex => ex.exerciseId === exerciseId);
      return exercise?.exerciseName || exerciseId;
    });
  };

  const getCurrentProgress = () => {
    const exerciseNames = getExerciseNames();
    const currentIndex = currentSupersetGroup.currentExerciseIndex;
    return {
      current: exerciseNames[currentIndex],
      next: currentIndex < exerciseNames.length - 1 ? exerciseNames[currentIndex + 1] : null,
      position: `${currentIndex + 1}/${exerciseNames.length}`,
    };
  };

  const progress = getCurrentProgress();

  return (
    <Card className="border-l-4 border-l-blue-500 bg-blue-50">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Link className="w-5 h-5 text-blue-600" />
          <Typography variant="h6" className="font-semibold text-blue-800">
            Superset: {currentSupersetGroup.name}
          </Typography>
        </div>

        <div className="space-y-3">
          {/* Current Exercise Progress */}
          <div>
            <Typography variant="body2" color="secondary" className="mb-1">
              Exercise {progress.position}
            </Typography>
            <Typography variant="body1" className="font-medium">
              {progress.current}
            </Typography>
          </div>

          {/* Next Exercise Preview */}
          {progress.next && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span>Next:</span>
              <span className="font-medium">{progress.next}</span>
            </div>
          )}

          {/* Superset Flow Controls */}
          <Flex gap="sm" className="pt-2">
            {!isLastExerciseInSuperset ? (
              <Button
                variant="primary"
                size="sm"
                onClick={handleNextSupersetExercise}
                className="flex-1"
              >
                <ChevronRight className="w-4 h-4 mr-1" />
                Next Exercise
              </Button>
            ) : isLastSetOfExercise ? (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => dispatch(endSuperset())}
                className="flex-1"
              >
                <Square className="w-4 h-4 mr-1" />
                End Superset
              </Button>
            ) : (
              <Button
                variant="primary"
                size="sm"
                onClick={handleNextSupersetExercise}
                className="flex-1"
              >
                <RotateCcw className="w-4 h-4 mr-1" />
                Next Round
              </Button>
            )}
          </Flex>

          {/* Rest Time Info */}
          <div className="text-xs text-gray-600 space-y-1">
            <div>Rest between exercises: {currentSupersetGroup.restBetweenExercises}s</div>
            <div>Rest after superset: {currentSupersetGroup.restAfterSet}s</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};