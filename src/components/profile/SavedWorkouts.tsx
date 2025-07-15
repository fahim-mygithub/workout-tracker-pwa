import React, { useState } from 'react';
import { Dumbbell, Edit3, Trash2, Share2, Calendar, Tag } from 'lucide-react';
import { Card, CardContent, CardHeader, Typography, Button } from '../ui';
import type { WorkoutData } from '../../types';
import { userProfileService } from '../../services/userProfile.service';
import { useNavigate } from 'react-router-dom';

interface SavedWorkoutsProps {
  workouts: WorkoutData[];
  onEdit: (workout: WorkoutData) => void;
  onDelete: (workoutId: string) => void;
  onShare: (workoutId: string) => void;
}

export const SavedWorkouts: React.FC<SavedWorkoutsProps> = ({
  workouts,
  onEdit,
  onDelete,
  onShare
}) => {
  const navigate = useNavigate();
  const [expandedWorkout, setExpandedWorkout] = useState<string | null>(null);

  const getCategoryColor = (category?: WorkoutData['category']) => {
    switch (category) {
      case 'strength': return 'bg-red-100 text-red-700';
      case 'cardio': return 'bg-blue-100 text-blue-700';
      case 'flexibility': return 'bg-green-100 text-green-700';
      case 'sports': return 'bg-purple-100 text-purple-700';
      case 'rehabilitation': return 'bg-yellow-100 text-yellow-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const handleStartWorkout = (workout: WorkoutData) => {
    // Navigate to new workout screen with this workout loaded
    navigate('/workout-v2', { state: { workout } });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Dumbbell className="w-5 h-5 text-gray-600" />
          <Typography variant="h3">My Workouts</Typography>
        </div>
      </CardHeader>
      <CardContent>
        {workouts.length === 0 ? (
          <div className="text-center py-8">
            <Typography variant="body1" color="muted">
              You haven't saved any workouts yet.
            </Typography>
            <Button
              variant="primary"
              size="sm"
              className="mt-4"
              onClick={() => navigate('/build')}
            >
              Create Your First Workout
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {workouts.map((workout) => (
              <div
                key={workout.id}
                className="border rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4 mb-2">
                  <div className="flex-1">
                    <Typography variant="h4" className="mb-1">
                      {workout.name}
                    </Typography>
                    {workout.description && (
                      <Typography variant="body2" color="muted" className="mb-2">
                        {workout.description}
                      </Typography>
                    )}
                    
                    <div className="flex flex-wrap gap-2 mt-2">
                      {workout.category && (
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(workout.category)}`}>
                          {workout.category}
                        </span>
                      )}
                      {workout.tags.map((tag) => (
                        <span key={tag} className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                          <Tag className="w-3 h-3" />
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleStartWorkout(workout)}
                      leftIcon={<Dumbbell className="w-4 h-4" />}
                    >
                      Start
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEdit(workout)}
                      leftIcon={<Edit3 className="w-4 h-4" />}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onShare(workout.id)}
                      leftIcon={<Share2 className="w-4 h-4" />}
                    >
                      Share
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDelete(workout.id)}
                      leftIcon={<Trash2 className="w-4 h-4" />}
                      className="text-red-600 hover:bg-red-50"
                    >
                      Delete
                    </Button>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 md:gap-4 text-sm text-gray-500 mt-3">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    Created {formatDate(workout.createdAt)}
                  </span>
                  {workout.lastPerformedAt && (
                    <span>Last performed {formatDate(workout.lastPerformedAt)}</span>
                  )}
                  <span>{workout.performanceCount} times completed</span>
                </div>

                {/* Expandable Exercise List */}
                <button
                  onClick={() => setExpandedWorkout(expandedWorkout === workout.id ? null : workout.id)}
                  className="text-sm text-primary-600 hover:text-primary-700 mt-2"
                >
                  {expandedWorkout === workout.id ? 'Hide' : 'Show'} {workout.exercises.length} exercises
                </button>

                {expandedWorkout === workout.id && (
                  <div className="mt-3 pl-4 border-l-2 border-gray-200">
                    {workout.exercises.map((exercise, index) => (
                      <div key={index} className="py-2">
                        <Typography variant="body2" className="font-medium">
                          {exercise.exerciseName}
                        </Typography>
                        <Typography variant="body2" color="muted">
                          {exercise.sets.map((set, i) => (
                            <span key={i}>
                              {set.targetReps && `${set.targetReps} reps`}
                              {set.targetWeight && ` @ ${set.targetWeight}kg`}
                              {set.targetTime && `${set.targetTime}s`}
                              {set.rpe && ` @RPE${set.rpe}`}
                              {i < exercise.sets.length - 1 && ', '}
                            </span>
                          ))}
                        </Typography>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};