import React from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { Card, CardContent, Typography, Flex } from '../ui';
import { cn } from '../../utils/cn';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  className?: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, subtitle, icon, className }) => (
  <Card className={cn('min-w-[120px]', className)}>
    <CardContent className="p-4">
      <Flex direction="col" align="center" gap="xs">
        {icon && <div className="text-blue-500 mb-1">{icon}</div>}
        <Typography variant="h3" className="font-bold text-center">
          {value}
        </Typography>
        <Typography variant="caption" color="secondary" className="text-center font-medium">
          {title}
        </Typography>
        {subtitle && (
          <Typography variant="caption" color="muted" className="text-center">
            {subtitle}
          </Typography>
        )}
      </Flex>
    </CardContent>
  </Card>
);

export interface QuickStatsProps {
  className?: string;
}

export const QuickStats: React.FC<QuickStatsProps> = ({ className }) => {
  const { activeWorkout, workoutHistory } = useSelector((state: RootState) => state.workout);

  // Calculate basic stats (in a real app, this would come from user data)
  const totalWorkouts = workoutHistory.length;
  const activeWorkoutDuration = activeWorkout ? Math.floor(activeWorkout.totalDuration / 60) : 0;
  const weeklyWorkouts = Math.min(totalWorkouts, 7); // Mock this week's workouts
  
  // Calculate active workout progress
  const activeWorkoutProgress = activeWorkout ? (() => {
    const totalExercises = activeWorkout.exercises.length;
    const completedExercises = activeWorkout.exercises.filter(ex => ex.completed).length;
    return totalExercises > 0 ? Math.round((completedExercises / totalExercises) * 100) : 0;
  })() : 0;

  const stats = [
    {
      title: 'Total Workouts',
      value: totalWorkouts,
      subtitle: 'All time',
      icon: <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">💪</div>
    },
    {
      title: 'This Week',
      value: weeklyWorkouts,
      subtitle: `${7 - weeklyWorkouts} days left`,
      icon: <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">📅</div>
    },
    {
      title: 'Active Time',
      value: activeWorkout ? `${activeWorkoutDuration}m` : '-',
      subtitle: activeWorkout ? 'Current workout' : 'No active workout',
      icon: <div className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center">⏱️</div>
    },
    {
      title: 'Progress',
      value: activeWorkout ? `${activeWorkoutProgress}%` : '-',
      subtitle: activeWorkout ? `${activeWorkout.exercises.filter(ex => ex.completed).length}/${activeWorkout.exercises.length} exercises` : 'Start a workout',
      icon: <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center">📊</div>
    }
  ];

  return (
    <div className={cn('w-full', className)}>
      <div className="mb-4">
        <Typography variant="h4" className="font-semibold">
          Quick Stats
        </Typography>
        <Typography variant="body2" color="secondary">
          Your workout overview at a glance
        </Typography>
      </div>
      
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <StatCard
            key={index}
            title={stat.title}
            value={stat.value}
            subtitle={stat.subtitle}
            icon={stat.icon}
            className="hover:shadow-md transition-shadow"
          />
        ))}
      </div>
    </div>
  );
};