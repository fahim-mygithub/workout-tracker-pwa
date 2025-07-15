import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Typography, Container, Card, CardContent } from '../components/ui';
import type { WorkoutData } from '../types';

export const WorkoutV2Demo: React.FC = () => {
  const navigate = useNavigate();

  // Demo workout data with video URLs
  const demoWorkout: WorkoutData = {
    id: 'demo-workout-1',
    userId: 'demo-user',
    name: 'Full Body Strength Training',
    description: 'A comprehensive full body workout targeting all major muscle groups',
    exercises: [
      {
        exerciseId: 'bench-press',
        exerciseName: 'Barbell Bench Press',
        sets: [
          { targetReps: 5, targetWeight: 135, restBetweenSets: 180 },
          { targetReps: 5, targetWeight: 155, restBetweenSets: 180 },
          { targetReps: 5, targetWeight: 175, restBetweenSets: 180 },
          { targetReps: 5, targetWeight: 185, restBetweenSets: 180 },
          { targetReps: 5, targetWeight: 195, restBetweenSets: 180 },
        ],
        notes: 'Pause at bottom, explosive up',
        videoUrl: 'https://www.youtube.com/watch?v=SCVCLChPQFY',
      },
      {
        exerciseId: 'squat',
        exerciseName: 'Barbell Back Squat',
        sets: [
          { targetReps: 8, targetWeight: 225, restBetweenSets: 120 },
          { targetReps: 8, targetWeight: 245, restBetweenSets: 120 },
          { targetReps: 8, targetWeight: 265, restBetweenSets: 120 },
        ],
        notes: 'Below parallel, control the descent',
        videoUrl: 'https://www.youtube.com/watch?v=bEv6CCg2BC8',
      },
      {
        exerciseId: 'deadlift',
        exerciseName: 'Conventional Deadlift',
        sets: [
          { targetReps: 5, targetWeight: 315, restBetweenSets: 240 },
          { targetReps: 5, targetWeight: 335, restBetweenSets: 240 },
          { targetReps: 5, targetWeight: 355, restBetweenSets: 240 },
        ],
        notes: 'Reset each rep, maintain neutral spine',
      },
      {
        exerciseId: 'pullup',
        exerciseName: 'Pull-ups',
        sets: [
          { targetReps: 10, targetWeight: 0, restBetweenSets: 90 },
          { targetReps: 8, targetWeight: 0, restBetweenSets: 90 },
          { targetReps: 6, targetWeight: 0, restBetweenSets: 90 },
        ],
        notes: 'AMRAP on last set',
      },
      {
        exerciseId: 'ohp',
        exerciseName: 'Overhead Press',
        sets: [
          { targetReps: 8, targetWeight: 95, restBetweenSets: 120 },
          { targetReps: 8, targetWeight: 105, restBetweenSets: 120 },
          { targetReps: 8, targetWeight: 115, restBetweenSets: 120 },
        ],
        notes: 'Strict form, no leg drive',
      },
    ],
    tags: ['strength', 'full-body', 'compound'],
    category: 'strength',
    isPublic: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    performanceCount: 0,
  };

  const handleStartDemo = () => {
    navigate('/workout-v2', { state: { workout: demoWorkout } });
  };

  return (
    <Container maxWidth="4xl" padding="lg">
      <div className="space-y-6">
        <div className="text-center space-y-4">
          <Typography variant="h1" className="font-bold">
            New Workout Experience Demo
          </Typography>
          <Typography variant="body1" color="secondary" className="max-w-2xl mx-auto">
            Experience the redesigned workout page that functions like a personal trainer, 
            guiding you through each set with video demonstrations, visual progress tracking, 
            and intelligent rest timers.
          </Typography>
        </div>

        <Card className="max-w-2xl mx-auto">
          <CardContent className="space-y-4">
            <Typography variant="h4" className="font-semibold">
              Demo Workout: {demoWorkout.name}
            </Typography>
            
            <div className="space-y-2">
              <Typography variant="body2" color="secondary">
                This demo includes:
              </Typography>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>{demoWorkout.exercises.length} exercises with progressive weight increases</li>
                <li>Video demonstrations for select exercises</li>
                <li>Rest timers with rep modification</li>
                <li>Visual set progress tracking</li>
                <li>Personal trainer-style guidance</li>
              </ul>
            </div>

            <div className="pt-4">
              <Button
                variant="primary"
                size="lg"
                onClick={handleStartDemo}
                className="w-full"
              >
                Start Demo Workout
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="text-center">
          <Button
            variant="outline"
            onClick={() => navigate('/')}
          >
            Back to Home
          </Button>
        </div>
      </div>
    </Container>
  );
};