import React from 'react';
import { useSelector } from 'react-redux';
import { useLocation } from 'react-router-dom';
import type { RootState } from '../store';
import { WorkoutPage } from './WorkoutPage';
import { WorkoutLandingPage } from './WorkoutLandingPage';

export const WorkoutRouter: React.FC = () => {
  const activeWorkout = useSelector((state: RootState) => state.workout.activeWorkout);
  const location = useLocation();
  
  console.log('[WorkoutRouter] activeWorkout:', activeWorkout);
  console.log('[WorkoutRouter] location.state?.workout:', location.state?.workout);
  
  // Check if there's a VALID active workout (not just truthy, but has required properties)
  const hasValidActiveWorkout = activeWorkout && 
    activeWorkout.exercises && 
    activeWorkout.exercises.length > 0 &&
    activeWorkout.id;
    
  // Check if workout data is being passed via navigation
  const hasNavigationWorkout = location.state?.workout;
  
  const shouldShowWorkout = hasValidActiveWorkout || hasNavigationWorkout;
  
  console.log('[WorkoutRouter] hasValidActiveWorkout:', hasValidActiveWorkout);
  console.log('[WorkoutRouter] hasNavigationWorkout:', hasNavigationWorkout);
  console.log('[WorkoutRouter] showing:', shouldShowWorkout ? 'WorkoutPage' : 'WorkoutLandingPage');
  
  // Show landing page if no valid workout, otherwise show workout page
  // Important: Don't pass location state to WorkoutPage to prevent auto-start
  return shouldShowWorkout ? <WorkoutPage key={activeWorkout?.id} /> : <WorkoutLandingPage />;
};