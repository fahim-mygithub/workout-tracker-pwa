import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { userProfileService } from '../services/userProfile.service';
import { 
  Dumbbell, 
  Clock, 
  TrendingUp, 
  Plus, 
  History,
  BookOpen,
  Star,
  ChevronRight,
  Calendar,
  Tag,
  AlertCircle
} from 'lucide-react';
import type { WorkoutData } from '../types';

export const WorkoutLandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [workouts, setWorkouts] = useState<WorkoutData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedWorkout, setExpandedWorkout] = useState<string | null>(null);

  useEffect(() => {
    loadWorkouts();
  }, [user]);

  const loadWorkouts = async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      const userWorkouts = await userProfileService.getUserWorkouts(user.uid);
      setWorkouts(userWorkouts);
    } catch (err) {
      console.error('Error loading workouts:', err);
      setError('Failed to load workouts');
    } finally {
      setLoading(false);
    }
  };

  const handleBuildWorkout = () => {
    navigate('/build');
  };

  const handleBrowseExercises = () => {
    navigate('/exercises');
  };

  const handleStartWorkout = (workout: WorkoutData) => {
    // Navigate to workout page with pre-loaded workout
    navigate('/workout-v2', { state: { workout } });
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
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

  // Get the 5 most recent workouts
  const recentWorkouts = workouts
    .sort((a, b) => new Date(b.lastPerformedAt || b.createdAt).getTime() - new Date(a.lastPerformedAt || a.createdAt).getTime())
    .slice(0, 5);

  // Get frequently used workouts (performed more than once)
  const frequentWorkouts = workouts
    .filter(w => w.performanceCount > 1)
    .sort((a, b) => b.performanceCount - a.performanceCount)
    .slice(0, 3);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-black text-white px-4 py-6">
        <h1 className="text-2xl font-bold">Start Your Workout</h1>
        <p className="text-sm text-gray-400 mt-1">Choose how you want to train today</p>
      </div>

      {/* Main Content */}
      <main className="px-4 py-6 space-y-6">
        {/* Quick Start Options */}
        <div className="space-y-3">
          {/* Build New Workout */}
          <button
            onClick={handleBuildWorkout}
            className="w-full bg-black text-white rounded-xl p-5 flex items-center justify-between hover:bg-gray-800 transition-all transform hover:scale-[1.02] shadow-lg"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
                <Plus className="w-6 h-6 text-black" />
              </div>
              <div className="text-left">
                <h3 className="font-bold text-lg">Build New Workout</h3>
                <p className="text-sm text-gray-300">Use natural language to create your workout</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-white" />
          </button>

          {/* Browse Exercises */}
          <button
            onClick={handleBrowseExercises}
            className="w-full bg-white rounded-xl p-5 flex items-center justify-between hover:bg-gray-50 transition-all transform hover:scale-[1.02] shadow-sm border border-gray-200"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-gray-700" />
              </div>
              <div className="text-left">
                <h3 className="font-bold text-lg text-gray-900">Browse Exercise Directory</h3>
                <p className="text-sm text-gray-600">Explore our complete exercise library</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Frequently Used Workouts */}
        {!loading && frequentWorkouts.length > 0 && (
          <div>
            <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-500" />
              Frequently Used
            </h2>
            <div className="space-y-3">
              {frequentWorkouts.map((workout) => (
                <div
                  key={workout.id}
                  className="bg-white rounded-lg p-4 border border-gray-200 hover:shadow-md transition-all"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{workout.name}</h3>
                      {workout.description && (
                        <p className="text-sm text-gray-600 mt-1">{workout.description}</p>
                      )}
                    </div>
                    <button
                      onClick={() => handleStartWorkout(workout)}
                      className="bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium"
                    >
                      Start
                    </button>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 mt-2">
                    {workout.category && (
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(workout.category)}`}>
                        {workout.category}
                      </span>
                    )}
                    {workout.tags?.map((tag) => (
                      <span key={tag} className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                        <Tag className="w-3 h-3" />
                        {tag}
                      </span>
                    ))}
                  </div>
                  
                  <div className="flex items-center gap-4 text-xs text-gray-500 mt-3">
                    <span>{workout.exercises.length} exercises</span>
                    <span>Used {workout.performanceCount} times</span>
                    {workout.lastPerformedAt && (
                      <span>Last: {formatDate(workout.lastPerformedAt)}</span>
                    )}
                  </div>
                  
                  {/* Expandable Exercise List */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setExpandedWorkout(expandedWorkout === workout.id ? null : workout.id);
                    }}
                    className="text-sm text-black hover:text-gray-700 mt-2 font-medium"
                  >
                    {expandedWorkout === workout.id ? 'Hide' : 'Show'} exercises
                  </button>
                  
                  {expandedWorkout === workout.id && (
                    <div className="mt-3 pl-4 border-l-2 border-gray-200">
                      {workout.exercises.map((exercise, index) => (
                        <div key={index} className="py-1">
                          <p className="text-sm font-medium text-gray-900">
                            {exercise.exerciseName}
                          </p>
                          <p className="text-xs text-gray-600">
                            {exercise.sets.map((set, i) => (
                              <span key={i}>
                                {set.targetReps && `${set.targetReps} reps`}
                                {set.targetWeight && ` @ ${set.targetWeight}kg`}
                                {set.targetTime && `${set.targetTime}s`}
                                {i < exercise.sets.length - 1 && ', '}
                              </span>
                            ))}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Activity */}
        {!loading && recentWorkouts.length > 0 && (
          <div>
            <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
              <History className="w-5 h-5 text-gray-600" />
              Recent Activity
            </h2>
            <div className="space-y-3">
              {recentWorkouts.map((workout) => (
                <div
                  key={workout.id}
                  className="bg-white rounded-lg p-4 border border-gray-200"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{workout.name}</h3>
                      <p className="text-sm text-gray-500 mt-1">
                        {formatDate(workout.lastPerformedAt || workout.createdAt)} • {workout.exercises.length} exercises
                      </p>
                    </div>
                    <button
                      onClick={() => handleStartWorkout(workout)}
                      className="bg-gray-100 text-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
                    >
                      Start
                    </button>
                  </div>
                  
                  {/* Category tags */}
                  {(workout.category || workout.tags?.length > 0) && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {workout.category && (
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(workout.category)}`}>
                          {workout.category}
                        </span>
                      )}
                      {workout.tags?.slice(0, 2).map((tag) => (
                        <span key={tag} className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && workouts.length === 0 && user && (
          <div className="bg-white rounded-xl p-8 text-center border border-gray-200">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Dumbbell className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No workouts yet</h3>
            <p className="text-gray-600 mb-6">Start your fitness journey by creating your first workout!</p>
            <button
              onClick={handleBuildWorkout}
              className="bg-black text-white px-6 py-2 rounded-lg hover:bg-gray-800 transition-colors font-medium"
            >
              Build Your First Workout
            </button>
          </div>
        )}

        {/* Login Prompt */}
        {!loading && !user && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 text-center">
            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-yellow-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Sign in to see your workouts</h3>
            <p className="text-gray-600 mb-4">Log in to access your saved workouts and training history</p>
            <button
              onClick={() => navigate('/login')}
              className="bg-black text-white px-6 py-2 rounded-lg hover:bg-gray-800 transition-colors font-medium"
            >
              Sign In
            </button>
          </div>
        )}
      </main>
    </div>
  );
};