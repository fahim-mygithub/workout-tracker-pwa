import { useLoadExercises } from '../hooks/useLoadExercises';

export const ExerciseLoader: React.FC = () => {
  useLoadExercises();
  return null; // This component doesn't render anything
};