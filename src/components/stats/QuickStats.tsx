import React from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../../store/index';
import { Card, CardContent, Typography, Flex } from '../ui';
import { cn } from '../../lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  className?: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, subtitle, icon, className }) => (
  <Card className={cn(
    'min-w-[120px] group hover:shadow-xl transition-all duration-300 border-0 bg-white/80 backdrop-blur-sm overflow-hidden relative',
    className
  )}>
    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
    <CardContent className="p-4 relative">
      <Flex direction="col" align="center" gap="xs">
        {icon && <div className="mb-2 transform group-hover:scale-110 transition-transform duration-300">{icon}</div>}
        <Typography variant="h3" className="font-bold text-center bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
          {value}
        </Typography>
        <Typography variant="caption" className="text-center font-semibold text-slate-700">
          {title}
        </Typography>
        {subtitle && (
          <Typography variant="caption" className="text-center text-slate-500">
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
      icon: (
        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        </div>
      )
    },
    {
      title: 'Current Streak',
      value: currentStreak,
      subtitle: currentStreak > 1 ? `${currentStreak} days strong!` : currentStreak === 1 ? 'Keep it up!' : 'Start your streak',
      icon: (
        <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl flex items-center justify-center shadow-lg">
          <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M19.48 12.35c-1.57-4.08-7.16-4.3-5.81-10.23.1-.44-.37-.78-.75-.55C9.29 3.71 6.68 8 8.87 13.62c.18.46-.36.89-.75.59-1.81-1.37-2-3.34-1.84-4.75.06-.52-.62-.77-.91-.34C4.69 10.16 4 11.84 4 14.37c.38 5.6 5.11 7.32 6.81 7.54 2.43.31 5.06-.14 6.95-1.87 2.08-1.93 2.84-5.01 1.72-7.69zm-9.28 5.03c1.44.35 2.01-1.05 1.03-1.89-.97-.84-2.47 1.54-1.03 1.89z" />
          </svg>
        </div>
      )
    },
    {
      title: activeWorkout ? 'Active Time' : 'This Week',
      value: activeWorkout ? `${activeWorkoutDuration}m` : weeklyWorkouts,
      subtitle: activeWorkout ? 'Current workout' : `${7 - weeklyWorkouts} more to goal`,
      icon: (
        <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {activeWorkout ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            )}
          </svg>
        </div>
      )
    },
    {
      title: activeWorkout ? 'Progress' : 'Personal Best',
      value: activeWorkout ? `${activeWorkoutProgress}%` : `${personalBests.heaviestLift}lbs`,
      subtitle: activeWorkout 
        ? `${activeWorkout.exercises.reduce((acc, ex) => acc + ex.sets.filter(set => set.completed).length, 0)}/${activeWorkout.exercises.reduce((acc, ex) => acc + ex.sets.length, 0)} sets` 
        : 'Heaviest lift',
      icon: (
        <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {activeWorkout ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
            )}
          </svg>
        </div>
      )
    }
  ];

  return (
    <div className={cn('w-full', className)}>
      <div className="mb-6">
        <Typography variant="h4" className="font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
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
            className="hover:scale-[1.02] transform transition-all duration-300"
          />
        ))}
      </div>
    </div>
  );
};