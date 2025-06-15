import React, { useEffect, useCallback, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Button, Card, CardContent, Typography, Flex } from '../ui';
import { cn } from '../../utils/cn';
import type { RootState } from '../../store/index';
import { updateRestTimer, stopRestTimer, toggleAutoStartTimer } from '../../store/slices/workoutSlice';

export interface RestTimerProps {
  className?: string;
  showMinimal?: boolean;
  onTimerComplete?: () => void;
  onTimerSkip?: () => void;
}

interface TimerDisplayProps {
  timeRemaining: number;
  totalTime: number;
  isActive: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const TimerDisplay: React.FC<TimerDisplayProps> = ({ 
  timeRemaining, 
  totalTime, 
  isActive, 
  size = 'md' 
}) => {
  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;
  const progress = totalTime > 0 ? ((totalTime - timeRemaining) / totalTime) * 100 : 0;

  const sizeClasses = {
    sm: 'text-2xl',
    md: 'text-4xl',
    lg: 'text-6xl'
  };

  const containerClasses = {
    sm: 'w-20 h-20',
    md: 'w-32 h-32',
    lg: 'w-48 h-48'
  };

  return (
    <div className={cn('relative flex items-center justify-center', containerClasses[size])}>
      {/* Circular Progress Background */}
      <svg 
        className="absolute inset-0 w-full h-full transform -rotate-90" 
        viewBox="0 0 100 100"
      >
        <circle
          cx="50"
          cy="50"
          r="45"
          fill="none"
          stroke="currentColor"
          strokeWidth="4"
          className="text-gray-200"
        />
        <circle
          cx="50"
          cy="50"
          r="45"
          fill="none"
          stroke="currentColor"
          strokeWidth="4"
          strokeDasharray={`${2 * Math.PI * 45}`}
          strokeDashoffset={`${2 * Math.PI * 45 * (1 - progress / 100)}`}
          className={cn(
            'transition-all duration-1000 ease-linear',
            isActive ? 'text-blue-500' : 'text-gray-400'
          )}
          strokeLinecap="round"
        />
      </svg>
      
      {/* Timer Text */}
      <div className="relative z-10 text-center">
        <div className={cn('font-mono font-bold', sizeClasses[size], {
          'text-blue-600': isActive && timeRemaining > 10,
          'text-orange-600': isActive && timeRemaining <= 10 && timeRemaining > 0,
          'text-green-600': timeRemaining === 0,
          'text-gray-500': !isActive
        })}>
          {minutes}:{seconds.toString().padStart(2, '0')}
        </div>
        {size !== 'sm' && (
          <div className="text-xs text-gray-500 mt-1">
            {Math.round(progress)}% complete
          </div>
        )}
      </div>
    </div>
  );
};

const playNotificationSound = () => {
  // Create an audio context for the notification sound
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(400, audioContext.currentTime + 0.1);
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
  } catch (error) {
    console.log('Audio notification not available:', error);
  }
};

const requestNotificationPermission = async () => {
  if ('Notification' in window && Notification.permission === 'default') {
    return await Notification.requestPermission();
  }
  return Notification.permission;
};

const showNotification = (title: string, body: string) => {
  if ('Notification' in window && Notification.permission === 'granted') {
    const notification = new Notification(title, {
      body,
      icon: '/pwa-192x192.png',
      badge: '/pwa-192x192.png',
      tag: 'rest-timer',
      requireInteraction: true,
    });

    // Auto-close after 5 seconds
    setTimeout(() => notification.close(), 5000);
    
    return notification;
  }
  return null;
};

export const RestTimer: React.FC<RestTimerProps> = ({
  className,
  showMinimal = false,
  onTimerComplete,
  onTimerSkip,
}) => {
  const dispatch = useDispatch();
  const { restTimer } = useSelector((state: RootState) => state.workout);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const hasNotifiedRef = useRef(false);

  const handleTimerTick = useCallback(() => {
    if (restTimer.isActive && restTimer.timeRemaining > 0) {
      const newTime = restTimer.timeRemaining - 1;
      dispatch(updateRestTimer(newTime));
      
      // Notification at 10 seconds remaining
      if (newTime === 10 && !hasNotifiedRef.current) {
        playNotificationSound();
        showNotification('Rest Timer', '10 seconds remaining!');
        hasNotifiedRef.current = true;
      }
      
      // Timer completed
      if (newTime === 0) {
        playNotificationSound();
        showNotification('Rest Complete!', 'Time to start your next set');
        onTimerComplete?.();
        hasNotifiedRef.current = false;
      }
    }
  }, [restTimer.isActive, restTimer.timeRemaining, dispatch, onTimerComplete]);

  const handleSkip = () => {
    dispatch(stopRestTimer());
    onTimerSkip?.();
    hasNotifiedRef.current = false;
  };

  const handlePause = () => {
    // We'll implement pause/resume by controlling the interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const handleResume = () => {
    if (!intervalRef.current && restTimer.isActive) {
      intervalRef.current = setInterval(handleTimerTick, 1000);
    }
  };

  const toggleAutoStart = () => {
    dispatch(toggleAutoStartTimer());
  };

  // Request notification permission on mount
  useEffect(() => {
    requestNotificationPermission();
  }, []);

  // Handle timer interval
  useEffect(() => {
    if (restTimer.isActive && restTimer.timeRemaining > 0) {
      intervalRef.current = setInterval(handleTimerTick, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [restTimer.isActive, handleTimerTick]);

  // Reset notification flag when timer starts
  useEffect(() => {
    if (restTimer.isActive && restTimer.timeRemaining === restTimer.totalTime) {
      hasNotifiedRef.current = false;
    }
  }, [restTimer.isActive, restTimer.timeRemaining, restTimer.totalTime]);

  if (!restTimer.isActive && restTimer.timeRemaining === 0) {
    return null;
  }

  if (showMinimal) {
    return (
      <div className={cn('flex items-center space-x-3 p-2 bg-orange-50 rounded-lg border border-orange-200', className)}>
        <TimerDisplay
          timeRemaining={restTimer.timeRemaining}
          totalTime={restTimer.totalTime}
          isActive={restTimer.isActive}
          size="sm"
        />
        <div className="flex-1">
          <Typography variant="body2" className="font-medium text-orange-800">
            Rest Time
          </Typography>
          <Typography variant="caption" color="secondary">
            {restTimer.exerciseId ? `Exercise break` : 'Rest period'}
          </Typography>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleSkip}
          className="text-orange-700 hover:bg-orange-100"
        >
          Skip
        </Button>
      </div>
    );
  }

  return (
    <Card className={cn('border-orange-200 bg-orange-50', className)}>
      <CardContent className="p-6">
        <div className="text-center space-y-4">
          <div>
            <Typography variant="h4" className="font-bold text-orange-800 mb-2">
              Rest Time
            </Typography>
            <Typography variant="body2" color="secondary">
              {restTimer.exerciseId ? `Break between sets` : 'Rest period active'}
            </Typography>
          </div>

          <div className="flex justify-center">
            <TimerDisplay
              timeRemaining={restTimer.timeRemaining}
              totalTime={restTimer.totalTime}
              isActive={restTimer.isActive}
              size="lg"
            />
          </div>

          {/* Timer Controls */}
          <div className="flex justify-center space-x-3">
            {restTimer.isActive ? (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePause}
                  className="border-orange-300 text-orange-700 hover:bg-orange-100"
                >
                  Pause
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleSkip}
                  className="bg-orange-600 hover:bg-orange-700"
                >
                  Skip Rest
                </Button>
              </>
            ) : (
              <Button
                variant="primary"
                size="sm"
                onClick={handleResume}
                className="bg-orange-600 hover:bg-orange-700"
              >
                Resume
              </Button>
            )}
          </div>

          {/* Auto-start setting */}
          <div className="pt-3 border-t border-orange-200">
            <Flex justify="between" align="center">
              <div>
                <Typography variant="body2" className="font-medium">
                  Auto-start timer
                </Typography>
                <Typography variant="caption" color="secondary">
                  Automatically start rest timer after sets
                </Typography>
              </div>
              <Button
                variant={restTimer.autoStart ? "primary" : "outline"}
                size="sm"
                onClick={toggleAutoStart}
                className={restTimer.autoStart 
                  ? "bg-orange-600 hover:bg-orange-700" 
                  : "border-orange-300 text-orange-700 hover:bg-orange-100"
                }
              >
                {restTimer.autoStart ? 'ON' : 'OFF'}
              </Button>
            </Flex>
          </div>

          {/* Timer Stats */}
          <div className="grid grid-cols-2 gap-4 pt-3 border-t border-orange-200">
            <div className="text-center">
              <Typography variant="h6" className="font-bold text-orange-800">
                {Math.floor(restTimer.totalTime / 60)}:{(restTimer.totalTime % 60).toString().padStart(2, '0')}
              </Typography>
              <Typography variant="caption" color="secondary">
                Total time
              </Typography>
            </div>
            <div className="text-center">
              <Typography variant="h6" className="font-bold text-orange-800">
                {Math.round(((restTimer.totalTime - restTimer.timeRemaining) / restTimer.totalTime) * 100)}%
              </Typography>
              <Typography variant="caption" color="secondary">
                Progress
              </Typography>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};