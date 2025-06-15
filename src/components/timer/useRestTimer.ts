import { useEffect, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState } from '../../store/index';
import { startRestTimer, updateRestTimer, stopRestTimer } from '../../store/slices/workoutSlice';

export interface UseRestTimerProps {
  onTimerComplete?: () => void;
  onTimerWarning?: (secondsRemaining: number) => void;
  autoStart?: boolean;
}

export const useRestTimer = ({
  onTimerComplete,
  onTimerWarning,
  autoStart = true,
}: UseRestTimerProps = {}) => {
  const dispatch = useDispatch();
  const { restTimer } = useSelector((state: RootState) => state.workout);

  const startTimer = useCallback((seconds: number, exerciseId?: string) => {
    dispatch(startRestTimer({ seconds, exerciseId }));
  }, [dispatch]);

  const stopTimer = useCallback(() => {
    dispatch(stopRestTimer());
  }, [dispatch]);

  const addTime = useCallback((seconds: number) => {
    if (restTimer.isActive) {
      const newTime = restTimer.timeRemaining + seconds;
      dispatch(updateRestTimer(newTime));
    }
  }, [dispatch, restTimer.isActive, restTimer.timeRemaining]);

  const subtractTime = useCallback((seconds: number) => {
    if (restTimer.isActive) {
      const newTime = Math.max(0, restTimer.timeRemaining - seconds);
      dispatch(updateRestTimer(newTime));
    }
  }, [dispatch, restTimer.isActive, restTimer.timeRemaining]);

  // Handle timer completion
  useEffect(() => {
    if (restTimer.timeRemaining === 0 && restTimer.totalTime > 0) {
      onTimerComplete?.();
    }
  }, [restTimer.timeRemaining, restTimer.totalTime, onTimerComplete]);

  // Handle timer warnings
  useEffect(() => {
    if (restTimer.isActive && restTimer.timeRemaining > 0) {
      // Warn at 30, 10, and 5 seconds
      if ([30, 10, 5].includes(restTimer.timeRemaining)) {
        onTimerWarning?.(restTimer.timeRemaining);
      }
    }
  }, [restTimer.isActive, restTimer.timeRemaining, onTimerWarning]);

  return {
    restTimer,
    startTimer,
    stopTimer,
    addTime,
    subtractTime,
    isActive: restTimer.isActive,
    timeRemaining: restTimer.timeRemaining,
    totalTime: restTimer.totalTime,
    progress: restTimer.totalTime > 0 ? ((restTimer.totalTime - restTimer.timeRemaining) / restTimer.totalTime) * 100 : 0,
  };
};