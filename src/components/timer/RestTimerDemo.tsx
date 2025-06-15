import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { RestTimer } from './RestTimer';
import { useRestTimer } from './useRestTimer';
import { Button, Card, CardContent, Typography, Container, Input, Flex, Alert } from '../ui';
import { startRestTimer } from '../../store/slices/workoutSlice';

export const RestTimerDemo: React.FC = () => {
  const dispatch = useDispatch();
  const [customDuration, setCustomDuration] = useState('60');
  const [notifications, setNotifications] = useState<string[]>([]);

  const { restTimer, startTimer, stopTimer, addTime, subtractTime } = useRestTimer({
    onTimerComplete: () => {
      addNotification('✅ Rest timer completed!');
    },
    onTimerWarning: (seconds) => {
      addNotification(`⚠️ ${seconds} seconds remaining`);
    },
  });

  const addNotification = (message: string) => {
    setNotifications(prev => [message, ...prev.slice(0, 4)]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n !== message));
    }, 3000);
  };

  const handleStartCustomTimer = () => {
    const duration = parseInt(customDuration);
    if (duration > 0) {
      startTimer(duration, 'demo-exercise');
      addNotification(`🏁 Started ${duration}s rest timer`);
    }
  };

  const handleQuickStart = (seconds: number) => {
    startTimer(seconds, 'quick-timer');
    addNotification(`🏁 Started ${seconds}s quick timer`);
  };

  const handleStop = () => {
    stopTimer();
    addNotification('⏹️ Timer stopped');
  };

  const handleAddTime = (seconds: number) => {
    addTime(seconds);
    addNotification(`⏰ Added ${seconds}s to timer`);
  };

  const handleSubtractTime = (seconds: number) => {
    subtractTime(seconds);
    addNotification(`⏰ Removed ${seconds}s from timer`);
  };

  return (
    <Container maxWidth="xl" padding="lg">
      <div className="space-y-6">
        <div className="text-center">
          <Typography variant="h1" className="mb-2">
            Rest Timer Component Demo
          </Typography>
          <Typography variant="body1" color="secondary">
            Interactive demo of the rest timer with notifications and controls
          </Typography>
        </div>

        {/* Notifications */}
        {notifications.length > 0 && (
          <div className="space-y-2">
            {notifications.map((notification, index) => (
              <Alert
                key={index}
                variant="info"
                title={notification}
                className="animate-in slide-in-from-top duration-300"
              />
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Timer Display */}
          <div>
            <Typography variant="h4" className="font-semibold mb-4">
              Rest Timer
            </Typography>
            <RestTimer
              onTimerComplete={() => addNotification('🎉 Timer finished!')}
              onTimerSkip={() => addNotification('⏭️ Timer skipped')}
            />

            {/* Minimal Timer Display */}
            {restTimer.isActive && (
              <div className="mt-4">
                <Typography variant="h6" className="font-medium mb-2">
                  Minimal Timer (for embedded use)
                </Typography>
                <RestTimer
                  showMinimal={true}
                  onTimerSkip={() => addNotification('⏭️ Minimal timer skipped')}
                />
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="space-y-4">
            <Card>
              <CardContent className="p-4">
                <Typography variant="h6" className="font-medium mb-4">
                  Timer Controls
                </Typography>

                {/* Quick Start Buttons */}
                <div className="mb-4">
                  <Typography variant="body2" className="font-medium mb-2">
                    Quick Start
                  </Typography>
                  <div className="grid grid-cols-3 gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleQuickStart(10)}
                      disabled={restTimer.isActive}
                    >
                      10s
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleQuickStart(30)}
                      disabled={restTimer.isActive}
                    >
                      30s
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleQuickStart(60)}
                      disabled={restTimer.isActive}
                    >
                      1m
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleQuickStart(90)}
                      disabled={restTimer.isActive}
                    >
                      90s
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleQuickStart(120)}
                      disabled={restTimer.isActive}
                    >
                      2m
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleQuickStart(180)}
                      disabled={restTimer.isActive}
                    >
                      3m
                    </Button>
                  </div>
                </div>

                {/* Custom Duration */}
                <div className="mb-4">
                  <Typography variant="body2" className="font-medium mb-2">
                    Custom Duration
                  </Typography>
                  <Flex gap="sm">
                    <Input
                      type="number"
                      placeholder="Seconds"
                      value={customDuration}
                      onChange={(e) => setCustomDuration(e.target.value)}
                      className="flex-1"
                      min="1"
                      max="3600"
                    />
                    <Button
                      variant="primary"
                      onClick={handleStartCustomTimer}
                      disabled={restTimer.isActive}
                    >
                      Start
                    </Button>
                  </Flex>
                </div>

                {/* Timer Modifications */}
                {restTimer.isActive && (
                  <div className="mb-4">
                    <Typography variant="body2" className="font-medium mb-2">
                      Modify Timer
                    </Typography>
                    <div className="grid grid-cols-2 gap-2 mb-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleAddTime(15)}
                      >
                        +15s
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleAddTime(30)}
                      >
                        +30s
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSubtractTime(15)}
                        disabled={restTimer.timeRemaining <= 15}
                      >
                        -15s
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSubtractTime(30)}
                        disabled={restTimer.timeRemaining <= 30}
                      >
                        -30s
                      </Button>
                    </div>
                  </div>
                )}

                {/* Stop Timer */}
                {restTimer.isActive && (
                  <Button
                    variant="secondary"
                    onClick={handleStop}
                    className="w-full"
                  >
                    Stop Timer
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Timer Information */}
            <Card>
              <CardContent className="p-4">
                <Typography variant="h6" className="font-medium mb-4">
                  Timer Information
                </Typography>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Status:</span>
                    <span className={restTimer.isActive ? 'text-green-600 font-medium' : 'text-gray-500'}>
                      {restTimer.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Time Remaining:</span>
                    <span className="font-mono">
                      {Math.floor(restTimer.timeRemaining / 60)}:{(restTimer.timeRemaining % 60).toString().padStart(2, '0')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Duration:</span>
                    <span className="font-mono">
                      {Math.floor(restTimer.totalTime / 60)}:{(restTimer.totalTime % 60).toString().padStart(2, '0')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Progress:</span>
                    <span>
                      {restTimer.totalTime > 0 
                        ? Math.round(((restTimer.totalTime - restTimer.timeRemaining) / restTimer.totalTime) * 100)
                        : 0
                      }%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Exercise ID:</span>
                    <span className="text-gray-600">
                      {restTimer.exerciseId || 'None'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Auto-start:</span>
                    <span className={restTimer.autoStart ? 'text-green-600' : 'text-gray-500'}>
                      {restTimer.autoStart ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Features List */}
            <Card>
              <CardContent className="p-4">
                <Typography variant="h6" className="font-medium mb-3">
                  Timer Features
                </Typography>
                <ul className="text-sm space-y-1 text-gray-600">
                  <li>🔔 Audio notifications at 10s and completion</li>
                  <li>📱 Browser notifications (with permission)</li>
                  <li>⏸️ Pause and resume functionality</li>
                  <li>🎯 Visual progress indicator</li>
                  <li>⚙️ Auto-start toggle setting</li>
                  <li>📊 Real-time progress tracking</li>
                  <li>🎨 Different display modes (full/minimal)</li>
                  <li>⏰ Customizable duration</li>
                  <li>🔄 Timer modification (+/- time)</li>
                  <li>💾 Redux state integration</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Container>
  );
};