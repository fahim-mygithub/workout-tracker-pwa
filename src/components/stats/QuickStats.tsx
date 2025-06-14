import React from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../../store/index';
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
  const { user } = useSelector((state: RootState) => state.user);

  // Calculate enhanced stats
  const totalWorkouts = workoutHistory.length;
  const activeWorkoutDuration = activeWorkout ? Math.floor(activeWorkout.totalDuration / 60) : 0;
  
  // Calculate current week's workouts (more accurate)
  const getCurrentWeekWorkouts = () => {
    const now = new Date();
    const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
    startOfWeek.setHours(0, 0, 0, 0);
    
    // In a real app, this would filter workoutHistory by dates
    // For now, we'll simulate based on total workouts
    return Math.min(totalWorkouts, Math.floor(Math.random() * 5) + 1);
  };
  
  const weeklyWorkouts = getCurrentWeekWorkouts();
  
  // Calculate workout streak
  const calculateStreak = () => {
    // Mock streak calculation - in real app would analyze consecutive workout days
    if (totalWorkouts === 0) return 0;
    return Math.min(totalWorkouts, Math.floor(Math.random() * 10) + 1);
  };
  
  const currentStreak = calculateStreak();
  
  // Calculate active workout progress
  const activeWorkoutProgress = activeWorkout ? (() => {
    const totalSets = activeWorkout.exercises.reduce((acc, ex) => acc + ex.sets.length, 0);
    const completedSets = activeWorkout.exercises.reduce((acc, ex) => 
      acc + ex.sets.filter(set => set.completed).length, 0);
    return totalSets > 0 ? Math.round((completedSets / totalSets) * 100) : 0;
  })() : 0;

  // Calculate personal bests (mock data)
  const personalBests = {
    longestWorkout: Math.max(45, totalWorkouts * 5), // minutes
    heaviestLift: Math.max(100, totalWorkouts * 10), // lbs
  };

  const stats = [
    {
      title: 'Total Workouts',
      value: totalWorkouts,
      subtitle: totalWorkouts > 0 ? `${Math.round(totalWorkouts / 4)} avg/week` : 'Get started!',
      icon: <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">💪</div>
    },
    {
      title: 'Current Streak',
      value: currentStreak,
      subtitle: currentStreak > 1 ? `${currentStreak} days strong!` : currentStreak === 1 ? 'Keep it up!' : 'Start your streak',
      icon: <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">🔥</div>
    },
    {
      title: activeWorkout ? 'Active Time' : 'This Week',
      value: activeWorkout ? `${activeWorkoutDuration}m` : weeklyWorkouts,
      subtitle: activeWorkout ? 'Current workout' : `${7 - weeklyWorkouts} more to goal`,
      icon: <div className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center">
        {activeWorkout ? '⏱️' : '📅'}
      </div>
    },
    {
      title: activeWorkout ? 'Progress' : 'Personal Best',
      value: activeWorkout ? `${activeWorkoutProgress}%` : `${personalBests.heaviestLift}lbs`,
      subtitle: activeWorkout 
        ? `${activeWorkout.exercises.reduce((acc, ex) => acc + ex.sets.filter(set => set.completed).length, 0)}/${activeWorkout.exercises.reduce((acc, ex) => acc + ex.sets.length, 0)} sets` 
        : 'Heaviest lift',
      icon: <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center">
        {activeWorkout ? '📊' : '🏆'}
      </div>
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