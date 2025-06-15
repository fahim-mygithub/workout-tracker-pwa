import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import type { RootState } from '../../store';
import { endWorkout, updateWorkoutStats } from '../../store/slices/workoutSlice';
import {
  Modal,
  Typography,
  Button,
  Card,
  CardContent,
  Flex,
} from '../ui';
import { Trophy, Clock, Target, TrendingUp, Star } from 'lucide-react';

interface WorkoutCompletionProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WorkoutCompletion: React.FC<WorkoutCompletionProps> = ({
  isOpen,
  onClose,
}) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { activeWorkout } = useSelector((state: RootState) => state.workout);

  if (!activeWorkout) return null;

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    }
    return `${minutes}m ${secs}s`;
  };

  const getWorkoutStats = () => {
    let completedSets = 0;
    let totalSets = 0;
    let failedSets = 0;
    let totalVolume = 0;
    let totalRPE = 0;
    let rpeCount = 0;

    activeWorkout.exercises.forEach(exercise => {
      exercise.sets.forEach(set => {
        totalSets++;
        if (set.completed) {
          completedSets++;
          if (set.failed) {
            failedSets++;
          }
          if (set.actualWeight && set.actualReps) {
            totalVolume += set.actualWeight * set.actualReps;
          }
          if (set.rpe) {
            totalRPE += set.rpe;
            rpeCount++;
          }
        }
      });
    });

    const averageRPE = rpeCount > 0 ? (totalRPE / rpeCount).toFixed(1) : 'N/A';
    const completionRate = totalSets > 0 ? Math.round((completedSets / totalSets) * 100) : 0;

    return {
      completedSets,
      totalSets,
      failedSets,
      totalVolume: Math.round(totalVolume),
      averageRPE,
      completionRate,
    };
  };

  const handleFinishWorkout = () => {
    // Update workout stats before ending
    dispatch(updateWorkoutStats());
    dispatch(endWorkout());
    navigate('/');
  };

  const stats = getWorkoutStats();
  const workoutQuality = stats.completionRate >= 90 ? 'Excellent' : 
                        stats.completionRate >= 75 ? 'Good' : 
                        stats.completionRate >= 50 ? 'Fair' : 'Needs Improvement';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Workout Complete!"
      size="lg"
    >
      <div className="space-y-6">
        {/* Celebration Header */}
        <div className="text-center py-4">
          <Trophy className="w-16 h-16 text-yellow-500 mx-auto mb-3" />
          <Typography variant="h4" className="font-bold text-green-700 mb-1">
            Great Job!
          </Typography>
          <Typography variant="body1" color="secondary">
            You've completed your {activeWorkout.name} workout
          </Typography>
        </div>

        {/* Workout Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <Clock className="w-8 h-8 text-blue-500 mx-auto mb-2" />
              <Typography variant="h6" className="font-bold">
                {formatTime(activeWorkout.totalDuration)}
              </Typography>
              <Typography variant="body2" color="secondary">
                Total Time
              </Typography>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <Target className="w-8 h-8 text-green-500 mx-auto mb-2" />
              <Typography variant="h6" className="font-bold">
                {stats.completedSets}/{stats.totalSets}
              </Typography>
              <Typography variant="body2" color="secondary">
                Sets Completed
              </Typography>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <TrendingUp className="w-8 h-8 text-purple-500 mx-auto mb-2" />
              <Typography variant="h6" className="font-bold">
                {stats.totalVolume.toLocaleString()} lbs
              </Typography>
              <Typography variant="body2" color="secondary">
                Total Volume
              </Typography>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <Star className="w-8 h-8 text-orange-500 mx-auto mb-2" />
              <Typography variant="h6" className="font-bold">
                {stats.averageRPE}
              </Typography>
              <Typography variant="body2" color="secondary">
                Average RPE
              </Typography>
            </CardContent>
          </Card>
        </div>

        {/* Workout Quality Assessment */}
        <Card className={`border-l-4 ${
          workoutQuality === 'Excellent' ? 'border-l-green-500 bg-green-50' :
          workoutQuality === 'Good' ? 'border-l-blue-500 bg-blue-50' :
          workoutQuality === 'Fair' ? 'border-l-yellow-500 bg-yellow-50' :
          'border-l-red-500 bg-red-50'
        }`}>
          <CardContent className="p-4">
            <Typography variant="h6" className="font-semibold mb-2">
              Workout Quality: {workoutQuality}
            </Typography>
            <div className="text-sm space-y-1">
              <div>Completion Rate: {stats.completionRate}%</div>
              {stats.failedSets > 0 && (
                <div className="text-orange-600">
                  Failed Sets: {stats.failedSets} (weights auto-adjusted)
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Exercise Breakdown */}
        <div>
          <Typography variant="h6" className="font-semibold mb-3">
            Exercise Summary
          </Typography>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {activeWorkout.exercises.map((exercise, index) => {
              const completedSetsCount = exercise.sets.filter(set => set.completed).length;
              const failedSetsCount = exercise.sets.filter(set => set.failed).length;
              
              return (
                <div key={exercise.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                  <div>
                    <Typography variant="body2" className="font-medium">
                      {exercise.exerciseName}
                    </Typography>
                    <Typography variant="body2" color="secondary">
                      {completedSetsCount}/{exercise.sets.length} sets
                      {failedSetsCount > 0 && (
                        <span className="text-orange-600 ml-2">
                          ({failedSetsCount} failed)
                        </span>
                      )}
                    </Typography>
                  </div>
                  <div className={`px-2 py-1 rounded text-xs font-medium ${
                    exercise.completed ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {exercise.completed ? 'Complete' : 'Partial'}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Action Buttons */}
        <Flex gap="sm" justify="end">
          <Button
            variant="outline"
            onClick={onClose}
          >
            Continue Workout
          </Button>
          <Button
            variant="primary"
            onClick={handleFinishWorkout}
            className="px-6"
          >
            Finish & Save
          </Button>
        </Flex>
      </div>
    </Modal>
  );
};