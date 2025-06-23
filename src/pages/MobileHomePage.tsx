import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';
import type { RootState } from '../store/index';

export const MobileHomePage: React.FC = () => {
  const navigate = useNavigate();
  const { activeWorkout, workoutHistory } = useSelector((state: RootState) => state.workout);

  const getWorkoutStreak = () => {
    // TODO: Implement proper workout history with full workout objects
    return 0;
  };

  const getTodayWorkouts = () => {
    // TODO: Implement proper workout history with full workout objects
    return [];
  };

  const getWeekProgress = () => {
    // TODO: Implement proper workout history with full workout objects
    return {
      current: 0,
      target: 4, // Default target
    };
  };

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const weekProgress = getWeekProgress();
  const todayWorkouts = getTodayWorkouts();
  const streak = getWorkoutStreak();

  return (
    <div className="min-h-screen p-4 pb-20 bg-background">
      {/* Header */}
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">
          Good {new Date().getHours() < 12 ? 'Morning' : 'Afternoon'}! 💪
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </p>
      </header>

      {/* Active Workout Card */}
      {activeWorkout && (
        <Card variant="interactive" className="mb-4 border-primary bg-primary/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-primary">Active Workout</p>
                <h3 className="text-lg font-semibold line-clamp-1">{activeWorkout.name}</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Started {new Date(activeWorkout.startTime).toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </p>
              </div>
              <Button
                variant="default"
                size="sm"
                onClick={() => navigate('/workout')}
                className="ml-4"
              >
                Resume
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        {/* Streak Card */}
        <Card variant="default" className="relative overflow-hidden">
          <CardContent className="p-4">
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-1">
                <span className="text-2xl">🔥</span>
                <span className="text-3xl font-bold text-primary">{streak}</span>
              </div>
              <p className="text-xs text-muted-foreground">Day Streak</p>
            </div>
            <div className="absolute -right-6 -bottom-6 opacity-5">
              <span className="text-8xl">🔥</span>
            </div>
          </CardContent>
        </Card>

        {/* Week Progress Card */}
        <Card variant="default" className="relative overflow-hidden">
          <CardContent className="p-4">
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-1">
                <span className="text-2xl">📊</span>
                <span className="text-3xl font-bold text-primary">
                  {weekProgress.current}/{weekProgress.target}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">This Week</p>
            </div>
            <div className="absolute -right-6 -bottom-6 opacity-5">
              <span className="text-8xl">📊</span>
            </div>
          </CardContent>
        </Card>

        {/* Today's Workouts Card */}
        <Card variant="default" className="col-span-2">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-foreground">Today's Activity</h3>
              <span className="text-xs text-muted-foreground">
                {todayWorkouts.length} workout{todayWorkouts.length !== 1 ? 's' : ''}
              </span>
            </div>
            {todayWorkouts.length > 0 ? (
              <div className="space-y-2">
                {todayWorkouts.slice(0, 2).map((workout, index) => (
                  <div key={workout.id} className="flex items-center justify-between py-2 border-t border-border">
                    <div className="flex-1">
                      <p className="text-sm font-medium line-clamp-1">{workout.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {workout.exercises.length} exercises • {formatTime(workout.duration)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No workouts yet today</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="space-y-3">
        <Button
          variant="default"
          size="lg"
          className="w-full h-16 text-lg font-semibold"
          onClick={() => navigate('/workout')}
          disabled={!!activeWorkout}
        >
          <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          Start Workout
        </Button>

        <div className="grid grid-cols-2 gap-3">
          <Button
            variant="outline"
            size="lg"
            className="h-14"
            onClick={() => navigate('/build')}
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Build
          </Button>

          <Button
            variant="outline"
            size="lg"
            className="h-14"
            onClick={() => navigate('/exercises')}
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
            </svg>
            Browse
          </Button>
        </div>
      </div>

      {/* Recent Workouts */}
      {workoutHistory.length > 0 && (
        <div className="mt-8">
          <h2 className="text-lg font-semibold mb-3">Recent Workouts</h2>
          <div className="space-y-2">
            {workoutHistory.slice(0, 3).map((workoutId, index) => (
              <Card key={workoutId} variant="default" padding="sm">
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className="text-sm font-medium line-clamp-1">Workout {index + 1}</h4>
                      <p className="text-xs text-muted-foreground mt-1">
                        ID: {workoutId}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">--:--</p>
                      <p className="text-xs text-muted-foreground">duration</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* PWA Install Tip */}
      <div className="mt-8 p-4 bg-muted/50 rounded-lg text-center">
        <p className="text-xs text-muted-foreground">
          💡 Add to home screen for the best experience
        </p>
      </div>
    </div>
  );
};