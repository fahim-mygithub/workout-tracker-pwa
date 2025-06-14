import React from 'react';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { 
  setTheme, 
  toggleNotifications, 
  setDefaultRestTime 
} from '../../store/slices/userSlice';
import { 
  showSuccess, 
  showError,
  setOnlineStatus 
} from '../../store/slices/appSlice';

const StateDemo: React.FC = () => {
  const dispatch = useAppDispatch();
  
  // Access state from different slices
  const userPreferences = useAppSelector(state => state.user.preferences);
  const userStats = useAppSelector(state => state.user.stats);
  const appState = useAppSelector(state => state.app);
  const workoutState = useAppSelector(state => state.workout);

  const handleThemeChange = (theme: 'light' | 'dark' | 'system') => {
    dispatch(setTheme(theme));
    dispatch(showSuccess({
      title: 'Theme Updated',
      message: `Theme changed to ${theme}`,
      duration: 3000
    }));
  };

  const handleToggleNotifications = () => {
    dispatch(toggleNotifications());
    const newStatus = !userPreferences.enableNotifications;
    dispatch(showSuccess({
      title: 'Notifications',
      message: `Notifications ${newStatus ? 'enabled' : 'disabled'}`,
      duration: 3000
    }));
  };

  const handleRestTimeChange = (seconds: number) => {
    dispatch(setDefaultRestTime(seconds));
    dispatch(showSuccess({
      title: 'Rest Time Updated',
      message: `Default rest time set to ${seconds} seconds`,
      duration: 3000
    }));
  };

  const simulateError = () => {
    dispatch(showError({
      title: 'Error Demo',
      message: 'This is a simulated error message',
      duration: 5000
    }));
  };

  const toggleOnlineStatus = () => {
    dispatch(setOnlineStatus(!appState.isOnline));
  };

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <h2>Redux State Management Demo</h2>
      
      <div style={{ marginBottom: '20px', padding: '15px', border: '1px solid #ccc', borderRadius: '8px' }}>
        <h3>User Preferences</h3>
        <p><strong>Theme:</strong> {userPreferences.theme}</p>
        <p><strong>Units:</strong> {userPreferences.units}</p>
        <p><strong>Default Rest Time:</strong> {userPreferences.defaultRestTime}s</p>
        <p><strong>Notifications:</strong> {userPreferences.enableNotifications ? 'Enabled' : 'Disabled'}</p>
        
        <div style={{ marginTop: '10px' }}>
          <button onClick={() => handleThemeChange('light')} style={{ margin: '5px' }}>
            Light Theme
          </button>
          <button onClick={() => handleThemeChange('dark')} style={{ margin: '5px' }}>
            Dark Theme
          </button>
          <button onClick={() => handleThemeChange('system')} style={{ margin: '5px' }}>
            System Theme
          </button>
        </div>
        
        <div style={{ marginTop: '10px' }}>
          <button onClick={handleToggleNotifications} style={{ margin: '5px' }}>
            Toggle Notifications
          </button>
          <button onClick={() => handleRestTimeChange(60)} style={{ margin: '5px' }}>
            60s Rest
          </button>
          <button onClick={() => handleRestTimeChange(90)} style={{ margin: '5px' }}>
            90s Rest
          </button>
          <button onClick={() => handleRestTimeChange(120)} style={{ margin: '5px' }}>
            120s Rest
          </button>
        </div>
      </div>

      <div style={{ marginBottom: '20px', padding: '15px', border: '1px solid #ccc', borderRadius: '8px' }}>
        <h3>User Stats</h3>
        <p><strong>Total Workouts:</strong> {userStats.totalWorkouts}</p>
        <p><strong>Total Time:</strong> {userStats.totalTimeMinutes} minutes</p>
        <p><strong>Total Sets:</strong> {userStats.totalSets}</p>
        <p><strong>Total Reps:</strong> {userStats.totalReps}</p>
        <p><strong>Streak:</strong> {userStats.streakDays} days</p>
      </div>

      <div style={{ marginBottom: '20px', padding: '15px', border: '1px solid #ccc', borderRadius: '8px' }}>
        <h3>App State</h3>
        <p><strong>Online:</strong> {appState.isOnline ? 'Yes' : 'No'}</p>
        <p><strong>Sync Status:</strong> {appState.syncStatus}</p>
        <p><strong>Device Type:</strong> {appState.deviceType}</p>
        <p><strong>Orientation:</strong> {appState.orientation}</p>
        <p><strong>Notifications:</strong> {appState.notifications.length}</p>
        
        <div style={{ marginTop: '10px' }}>
          <button onClick={toggleOnlineStatus} style={{ margin: '5px' }}>
            Toggle Online Status
          </button>
          <button onClick={simulateError} style={{ margin: '5px' }}>
            Show Error
          </button>
        </div>
      </div>

      <div style={{ marginBottom: '20px', padding: '15px', border: '1px solid #ccc', borderRadius: '8px' }}>
        <h3>Workout State</h3>
        <p><strong>Active Workout:</strong> {workoutState.activeWorkout ? workoutState.activeWorkout.name : 'None'}</p>
        <p><strong>Rest Timer Active:</strong> {workoutState.restTimer.isActive ? 'Yes' : 'No'}</p>
        <p><strong>Loading:</strong> {workoutState.isLoading ? 'Yes' : 'No'}</p>
      </div>

      {appState.notifications.length > 0 && (
        <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#f0f0f0', borderRadius: '8px' }}>
          <h3>Active Notifications</h3>
          {appState.notifications.map(notification => (
            <div key={notification.id} style={{ 
              margin: '5px 0', 
              padding: '10px', 
              backgroundColor: notification.type === 'error' ? '#ffebee' : '#e8f5e8',
              borderRadius: '4px'
            }}>
              <strong>{notification.title}</strong>: {notification.message}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default StateDemo;