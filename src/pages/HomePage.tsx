import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Container, Typography, Card, CardContent, Flex, Button, Calendar, Grid } from '../components/ui';
import { QuickStats } from '../components/stats';
import type { RootState } from '../store/index';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { activeWorkout, workoutHistory } = useSelector((state: RootState) => state.workout);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  // Generate workout dates based on workout history
  const generateWorkoutDates = () => {
    const dates = [];
    const today = new Date();
    
    // Generate some recent workout dates based on workout history length
    for (let i = 0; i < Math.min(workoutHistory.length, 8); i++) {
      const workoutDate = new Date(today);
      workoutDate.setDate(today.getDate() - (i * 2 + Math.floor(Math.random() * 3)));
      dates.push(workoutDate);
    }
    
    return dates;
  };
  
  const workoutDates = generateWorkoutDates();

  const handleStartWorkout = () => {
    navigate('/workout');
  };

  const handleBuildWorkout = () => {
    navigate('/build');
  };

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    // TODO: Load workouts for selected date
  };

  return (
    <Container maxWidth="xl" padding="lg">
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center">
          <Typography variant="h1" className="mb-2">
            Workout Tracker
          </Typography>
          <Typography variant="body1" color="secondary" className="mb-4">
            Your Progressive Web App for Smart Workout Tracking
          </Typography>
          <Typography variant="body2" color="muted">
            Create workouts with natural language like "5x5 Bench ss 3x10 pushups"
          </Typography>
        </div>

        {/* Active Workout Alert */}
        {activeWorkout && (
          <Card className="border-l-4 border-l-blue-500 bg-blue-50">
            <CardContent className="p-4">
              <Flex justify="between" align="center">
                <div>
                  <Typography variant="h6" className="font-semibold text-blue-900">
                    Active Workout: {activeWorkout.name}
                  </Typography>
                  <Typography variant="body2" color="secondary">
                    Started {new Date(activeWorkout.startTime).toLocaleTimeString()}
                  </Typography>
                </div>
                <Button 
                  variant="primary" 
                  size="sm"
                  onClick={() => navigate('/workout')}
                >
                  Resume
                </Button>
              </Flex>
            </CardContent>
          </Card>
        )}

        {/* Quick Stats */}
        <QuickStats />

        {/* Main Content Grid */}
        <Grid cols={1} lgCols={2} gap="lg">
          {/* Calendar Widget */}
          <Card>
            <CardContent className="p-6">
              <div className="mb-4">
                <Typography variant="h4" className="font-semibold mb-2">
                  Workout Calendar
                </Typography>
                <Typography variant="body2" color="secondary">
                  Track your workout schedule
                </Typography>
              </div>
              
              <Flex justify="center">
                <Calendar
                  selectedDate={selectedDate}
                  onDateSelect={handleDateSelect}
                  highlightedDates={workoutDates}
                  className="w-full max-w-none"
                />
              </Flex>

              {/* Selected Date Info */}
              <div className="mt-4 p-3 bg-slate-50 rounded-lg">
                <Typography variant="body2" className="font-medium">
                  {selectedDate.toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </Typography>
                <Typography variant="caption" color="secondary">
                  {workoutDates.some(date => 
                    date.getDate() === selectedDate.getDate() &&
                    date.getMonth() === selectedDate.getMonth() &&
                    date.getFullYear() === selectedDate.getFullYear()
                  ) ? 'Workout completed' : 'No workout recorded'}
                </Typography>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardContent className="p-6">
              <Typography variant="h4" className="font-semibold mb-4">
                Quick Actions
              </Typography>
              
              <div className="space-y-4">
                <Button 
                  variant="primary" 
                  size="lg" 
                  className="w-full"
                  onClick={handleStartWorkout}
                >
                  {activeWorkout ? 'Resume Workout' : 'Start Workout'}
                </Button>
                
                <Button 
                  variant="outline" 
                  size="lg" 
                  className="w-full"
                  onClick={handleBuildWorkout}
                >
                  Build New Workout
                </Button>
                
                <Button 
                  variant="ghost" 
                  size="lg" 
                  className="w-full"
                  onClick={() => navigate('/exercises')}
                >
                  Browse Exercises
                </Button>
              </div>

              {/* Recent Activity */}
              <div className="mt-6 pt-4 border-t">
                <Typography variant="h6" className="font-medium mb-3">
                  Recent Activity
                </Typography>
                <div className="space-y-2">
                  {workoutHistory.length > 0 ? (
                    workoutHistory.slice(0, 3).map((workoutId, index) => {
                      // Mock workout names and durations based on workout ID
                      const workoutNames = [
                        'Upper Body Strength',
                        'Lower Body Power',
                        'Full Body Circuit',
                        'Push Day',
                        'Pull Day',
                        'Leg Day'
                      ];
                      const workoutName = workoutNames[index % workoutNames.length];
                      const duration = 35 + Math.floor(Math.random() * 30); // 35-65 minutes
                      
                      return (
                        <div key={workoutId} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer">
                          <div>
                            <Typography variant="body2" className="font-medium">
                              {workoutName}
                            </Typography>
                            <Typography variant="caption" color="secondary">
                              {index + 1} {index === 0 ? 'day' : 'days'} ago
                            </Typography>
                          </div>
                          <div className="text-right">
                            <Typography variant="body2" className="font-medium">
                              {duration} min
                            </Typography>
                            <Typography variant="caption" color="secondary">
                              {Math.floor(Math.random() * 8) + 4} exercises
                            </Typography>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-4">
                      <Typography variant="body2" color="secondary">
                        No recent workouts
                      </Typography>
                      <Typography variant="caption" color="muted">
                        Start your first workout to see activity here
                      </Typography>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </Grid>
      </div>
    </Container>
  );
};