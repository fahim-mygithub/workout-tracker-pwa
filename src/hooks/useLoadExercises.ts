import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setExercises, setLoading, setError } from '../store/slices/exerciseSlice';
import { loadExercisesFromCSV } from '../utils/loadExercises';
import type { RootState } from '../store';

export const useLoadExercises = () => {
  const dispatch = useDispatch();
  const { exercises, lastUpdated } = useSelector((state: RootState) => state.exercise);

  useEffect(() => {
    // Only load if we haven't loaded exercises yet
    if (exercises.length === 0 && !lastUpdated) {
      const loadExercises = async () => {
        dispatch(setLoading(true));
        try {
          const loadedExercises = await loadExercisesFromCSV();
          dispatch(setExercises(loadedExercises));
          console.log(`Loaded ${loadedExercises.length} exercises`);
        } catch (error) {
          console.error('Failed to load exercises:', error);
          dispatch(setError('Failed to load exercises. Please try again later.'));
        } finally {
          dispatch(setLoading(false));
        }
      };

      loadExercises();
    }
  }, [dispatch, exercises.length, lastUpdated]);
};