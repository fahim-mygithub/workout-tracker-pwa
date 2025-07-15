import React, { useState } from 'react';
import { ExerciseCard } from './ExerciseCard';
import { Button, Typography, Container, Card, CardContent } from '../ui';
import type { WorkoutExercise, WorkoutSet } from '../../store/slices/workoutSlice';
import type { ExerciseCardState } from './ExerciseCard';

// Demo exercise data
const createMockExercise = (
  id: string,
  name: string,
  type: 'strength' | 'time' | 'distance' = 'strength'
): WorkoutExercise => {
  let sets: WorkoutSet[] = [];
  
  switch (type) {
    case 'strength':
      sets = [
        { id: `${id}-set-1`, reps: 8, weight: 135, completed: false },
        { id: `${id}-set-2`, reps: 8, weight: 135, completed: false },
        { id: `${id}-set-3`, reps: 8, weight: 135, completed: false },
      ];
      break;
    case 'time':
      sets = [
        { id: `${id}-set-1`, time: 60, completed: false },
        { id: `${id}-set-2`, time: 60, completed: false },
        { id: `${id}-set-3`, time: 60, completed: false },
      ];
      break;
    case 'distance':
      sets = [
        { id: `${id}-set-1`, distance: 400, completed: false },
        { id: `${id}-set-2`, distance: 400, completed: false },
      ];
      break;
  }

  return {
    id,
    exerciseId: id.toLowerCase().replace(/\s+/g, '-'),
    exerciseName: name,
    sets,
    restTimeSeconds: type === 'strength' ? 180 : 60,
    notes: type === 'strength' ? 'Focus on form and controlled movement' : undefined,
    completed: false,
  };
};

const demoExercises = [
  createMockExercise('bench-press', 'Bench Press', 'strength'),
  createMockExercise('plank', 'Plank Hold', 'time'),
  createMockExercise('running', '400m Sprint', 'distance'),
];

export const ExerciseCardDemo: React.FC = () => {
  const [exercises, setExercises] = useState<WorkoutExercise[]>(demoExercises);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [currentSetIndex, setCurrentSetIndex] = useState(0);
  const [restTimeRemaining, setRestTimeRemaining] = useState<number | undefined>();
  const [restInterval, setRestInterval] = useState<NodeJS.Timeout | null>(null);

  const isResting = restTimeRemaining !== undefined && restTimeRemaining > 0;

  const handleSetComplete = (exerciseId: string, setId: string, setData: Partial<WorkoutSet>) => {
    setExercises(prev => prev.map(exercise => {
      if (exercise.id === exerciseId) {
        return {
          ...exercise,
          sets: exercise.sets.map(set => 
            set.id === setId ? { ...set, ...setData, completed: true } : set
          ),
        };
      }
      return exercise;
    }));

    // Move to next set
    const exercise = exercises.find(ex => ex.id === exerciseId);
    if (exercise) {
      const setIndex = exercise.sets.findIndex(s => s.id === setId);
      if (setIndex < exercise.sets.length - 1) {
        setCurrentSetIndex(setIndex + 1);
      }
    }
  };

  const handleExerciseComplete = (exerciseId: string) => {
    setExercises(prev => prev.map(exercise => 
      exercise.id === exerciseId ? { ...exercise, completed: true } : exercise
    ));

    // Move to next exercise
    if (currentExerciseIndex < exercises.length - 1) {
      setCurrentExerciseIndex(prev => prev + 1);
      setCurrentSetIndex(0);
    }
  };

  const handleStartRest = (_exerciseId: string, duration: number) => {
    setRestTimeRemaining(duration);
    
    const interval = setInterval(() => {
      setRestTimeRemaining(prev => {
        if (prev === undefined || prev <= 1) {
          setRestInterval(null);
          return undefined;
        }
        return prev - 1;
      });
    }, 1000);
    
    setRestInterval(interval);
  };

  const handleSkipRest = () => {
    if (restInterval) {
      clearInterval(restInterval);
      setRestInterval(null);
    }
    setRestTimeRemaining(undefined);
  };

  const handleEditSet = (exerciseId: string, setId: string, setData: Partial<WorkoutSet>) => {
    setExercises(prev => prev.map(exercise => {
      if (exercise.id === exerciseId) {
        return {
          ...exercise,
          sets: exercise.sets.map(set => 
            set.id === setId ? { ...set, ...setData } : set
          ),
        };
      }
      return exercise;
    }));
  };

  const resetDemo = () => {
    setExercises(demoExercises.map(ex => ({
      ...ex,
      completed: false,
      sets: ex.sets.map(set => ({
        ...set,
        completed: false,
        actualReps: undefined,
        actualWeight: undefined,
        actualTime: undefined,
        actualDistance: undefined,
      })),
    })));
    setCurrentExerciseIndex(0);
    setCurrentSetIndex(0);
    setRestTimeRemaining(undefined);
    if (restInterval) {
      clearInterval(restInterval);
      setRestInterval(null);
    }
  };

  const getExerciseState = (exercise: WorkoutExercise, index: number): ExerciseCardState => {
    if (exercise.completed) return 'completed';
    if (index === currentExerciseIndex) {
      if (isResting) return 'resting';
      return 'active';
    }
    return 'pending';
  };

  return (
    <Container maxWidth="xl" padding="lg">
      <div className="space-y-6">
        <div className="text-center">
          <Typography variant="h1" className="mb-2">
            Exercise Card Component Demo
          </Typography>
          <Typography variant="body1" color="secondary">
            Interactive demo showing different exercise card states and variants
          </Typography>
        </div>

        {/* Demo Controls */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <Typography variant="h6" className="font-medium">
                  Demo Controls
                </Typography>
                <Typography variant="body2" color="secondary">
                  Current: Exercise {currentExerciseIndex + 1}, Set {currentSetIndex + 1}
                  {isResting && ` • Resting: ${restTimeRemaining}s`}
                </Typography>
              </div>
              <Button onClick={resetDemo} variant="outline">
                Reset Demo
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Exercise Cards */}
        <div className="space-y-4">
          {exercises.map((exercise, index) => (
            <ExerciseCard
              key={exercise.id}
              exercise={exercise}
              state={getExerciseState(exercise, index)}
              isCurrentExercise={index === currentExerciseIndex}
              currentSetIndex={currentSetIndex}
              restTimeRemaining={isResting && index === currentExerciseIndex ? restTimeRemaining : undefined}
              onSetComplete={(setId, setData) => handleSetComplete(exercise.id, setId, setData)}
              onExerciseComplete={handleExerciseComplete}
              onStartRest={handleStartRest}
              onSkipRest={handleSkipRest}
              onEditSet={(setId, setData) => handleEditSet(exercise.id, setId, setData)}
            />
          ))}
        </div>

        {/* Demo Information */}
        <Card>
          <CardContent className="p-4">
            <Typography variant="h6" className="font-medium mb-3">
              Demo Features
            </Typography>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Typography variant="body2" className="font-medium mb-2">
                  Exercise States:
                </Typography>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>⭕ Pending - Not yet started</li>
                  <li>🏋️ Active - Currently in progress</li>
                  <li>⏳ Resting - Between sets</li>
                  <li>✅ Completed - All sets finished</li>
                </ul>
              </div>
              <div>
                <Typography variant="body2" className="font-medium mb-2">
                  Exercise Types:
                </Typography>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>Strength - Reps × Weight</li>
                  <li>Time-based - Duration in seconds</li>
                  <li>Distance-based - Distance in meters</li>
                  <li>Bodyweight - Reps only</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Container>
  );
};