import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Typography, Card, CardContent, CardHeader, Button, LoadingSpinner, Alert } from '../components/ui';
import { Dumbbell, Clock, Tag, User, Copy, LogIn } from 'lucide-react';
import { userProfileService } from '../services/userProfile.service';
import { useAuth } from '../contexts/AuthContext';
import type { SharedWorkout, WorkoutData } from '../types';
import { cn } from '../lib/utils';

export const SharedWorkoutPage: React.FC = () => {
  const { shareId } = useParams<{ shareId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [sharedWorkout, setSharedWorkout] = useState<SharedWorkout | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedToProfile, setCopiedToProfile] = useState(false);

  useEffect(() => {
    if (shareId) {
      loadSharedWorkout();
    }
  }, [shareId]);

  const loadSharedWorkout = async () => {
    if (!shareId) return;

    try {
      setLoading(true);
      const workout = await userProfileService.getSharedWorkout(shareId);
      setSharedWorkout(workout);
    } catch (error) {
      console.error('Error loading shared workout:', error);
      setError('Workout not found or link has expired');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyToProfile = async () => {
    if (!user || !sharedWorkout) {
      navigate('/login', { state: { returnTo: `/shared/${shareId}` } });
      return;
    }

    try {
      const workoutData: Omit<WorkoutData, 'id' | 'createdAt' | 'updatedAt'> = {
        userId: user.uid,
        name: `${sharedWorkout.workoutData.name} (Copy)`,
        description: sharedWorkout.workoutData.description,
        exercises: sharedWorkout.workoutData.exercises,
        tags: sharedWorkout.workoutData.tags,
        category: sharedWorkout.workoutData.category,
        isPublic: false,
        performanceCount: 0
      };

      await userProfileService.saveWorkout(workoutData);
      setCopiedToProfile(true);
      
      // Redirect to profile after a short delay
      setTimeout(() => {
        navigate('/profile');
      }, 1500);
    } catch (error) {
      console.error('Error copying workout:', error);
      setError('Failed to copy workout to your profile');
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

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

  if (loading) {
    return (
      <Container maxWidth="4xl" padding="lg" className="min-h-screen">
        <div className="flex justify-center items-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      </Container>
    );
  }

  if (error || !sharedWorkout) {
    return (
      <Container maxWidth="4xl" padding="lg" className="min-h-screen">
        <div className="text-center py-16">
          <Alert variant="error" title="Workout Not Found">
            {error || 'The workout you are looking for does not exist or has been removed.'}
          </Alert>
          <Button
            variant="primary"
            onClick={() => navigate('/')}
            className="mt-6"
          >
            Go to Home
          </Button>
        </div>
      </Container>
    );
  }

  const { workoutData, sharedBy, sharedAt } = sharedWorkout;

  return (
    <Container maxWidth="4xl" padding="lg" className="min-h-screen">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <Card>
          <CardContent className="text-center py-8">
            <Typography variant="h1" className="mb-4 font-bold">
              {workoutData.name}
            </Typography>
            
            {workoutData.description && (
              <Typography variant="body1" color="muted" className="mb-6 max-w-2xl mx-auto">
                {workoutData.description}
              </Typography>
            )}

            <div className="flex flex-wrap justify-center items-center gap-4 mb-6">
              {workoutData.category && (
                <span className={cn(
                  "px-3 py-1 rounded-full text-sm font-medium",
                  getCategoryColor(workoutData.category)
                )}>
                  {workoutData.category}
                </span>
              )}
              
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Dumbbell className="w-4 h-4" />
                <span>{workoutData.exercises.length} exercises</span>
              </div>

              <div className="flex items-center gap-2 text-sm text-gray-600">
                <User className="w-4 h-4" />
                <span>Shared by {sharedBy.displayName}</span>
              </div>

              <div className="text-sm text-gray-600">
                {formatDate(sharedAt)}
              </div>
            </div>

            {/* Tags */}
            {workoutData.tags.length > 0 && (
              <div className="flex flex-wrap justify-center gap-2 mb-6">
                {workoutData.tags.map((tag) => (
                  <span key={tag} className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                    <Tag className="w-3 h-3" />
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              {copiedToProfile ? (
                <Alert variant="success" title="Success">
                  Workout copied to your profile!
                </Alert>
              ) : (
                <Button
                  variant="primary"
                  size="lg"
                  onClick={handleCopyToProfile}
                  leftIcon={user ? <Copy className="w-5 h-5" /> : <LogIn className="w-5 h-5" />}
                >
                  {user ? 'Copy to My Workouts' : 'Sign In to Save Workout'}
                </Button>
              )}
              
              <Button
                variant="outline"
                size="lg"
                onClick={() => navigate('/build', { state: { workout: workoutData } })}
                leftIcon={<Dumbbell className="w-5 h-5" />}
              >
                Try This Workout
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Exercise List */}
        <Card>
          <CardHeader>
            <Typography variant="h3" className="font-semibold">
              Exercises
            </Typography>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {workoutData.exercises.map((exercise, index) => (
                <div
                  key={index}
                  className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <Typography variant="h4" className="mb-2">
                        {index + 1}. {exercise.exerciseName}
                      </Typography>
                      
                      <div className="space-y-2">
                        {exercise.sets.map((set, setIndex) => (
                          <div key={setIndex} className="flex items-center gap-2 text-sm text-gray-600">
                            <span className="font-medium">Set {setIndex + 1}:</span>
                            {set.targetReps && <span>{set.targetReps} reps</span>}
                            {set.targetWeight && <span>@ {set.targetWeight}kg</span>}
                            {set.targetTime && <span>{set.targetTime}s</span>}
                            {set.targetDistance && <span>{set.targetDistance}m</span>}
                            {set.rpe && <span>RPE {set.rpe}</span>}
                          </div>
                        ))}
                      </div>

                      {exercise.notes && (
                        <Typography variant="body2" color="muted" className="mt-2 italic">
                          Note: {exercise.notes}
                        </Typography>
                      )}

                      {exercise.restTime && (
                        <div className="flex items-center gap-1 text-sm text-gray-500 mt-2">
                          <Clock className="w-3 h-3" />
                          <span>Rest: {exercise.restTime}s</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center py-8">
          <Typography variant="body2" color="muted">
            Want to create and share your own workouts?
          </Typography>
          <Button
            variant="link"
            onClick={() => navigate('/signup')}
            className="mt-2"
          >
            Sign up for free
          </Button>
        </div>
      </div>
    </Container>
  );
};