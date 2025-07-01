import React from 'react';
import { Moon, Ruler, Timer, Bell, Download } from 'lucide-react';
import { Card, CardContent, CardHeader, Typography } from '../ui';
import type { UserProfile } from '../../types';

interface AppPreferencesProps {
  profile: UserProfile;
  onUpdate: (updates: Partial<UserProfile>) => void;
  onExport: (format: 'csv' | 'pdf') => void;
}

export const AppPreferences: React.FC<AppPreferencesProps> = ({
  profile,
  onUpdate,
  onExport
}) => {
  const handlePreferenceChange = (path: string[], value: boolean | string | number) => {
    const updates = { ...profile };
    let current: Record<string, any> = updates as any;
    
    for (let i = 0; i < path.length - 1; i++) {
      current = current[path[i]];
    }
    
    current[path[path.length - 1]] = value;
    onUpdate({ preferences: updates.preferences });
  };

  const Toggle: React.FC<{ checked: boolean; onChange: (checked: boolean) => void }> = ({ checked, onChange }) => (
    <button
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
        checked ? 'bg-primary-600' : 'bg-gray-200'
      }`}
      aria-pressed={checked}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          checked ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  );

  return (
    <div className="space-y-6">
      {/* Appearance */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Moon className="w-5 h-5 text-gray-600" />
            <Typography variant="h3">Appearance</Typography>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Typography variant="body1">Dark Mode</Typography>
                <Typography variant="body2" color="muted">
                  Use dark theme for the app
                </Typography>
              </div>
              <Toggle
                checked={profile.preferences.darkMode}
                onChange={(checked) => handlePreferenceChange(['preferences', 'darkMode'], checked)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Units & Measurements */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Ruler className="w-5 h-5 text-gray-600" />
            <Typography variant="h3">Units & Measurements</Typography>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Typography variant="body1" className="mb-2">Unit System</Typography>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handlePreferenceChange(['preferences', 'unitSystem'], 'metric')}
                  className={`px-4 py-2 rounded-md border transition-colors ${
                    profile.preferences.unitSystem === 'metric'
                      ? 'bg-primary-600 text-white border-primary-600'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  Metric (kg, cm)
                </button>
                <button
                  onClick={() => handlePreferenceChange(['preferences', 'unitSystem'], 'imperial')}
                  className={`px-4 py-2 rounded-md border transition-colors ${
                    profile.preferences.unitSystem === 'imperial'
                      ? 'bg-primary-600 text-white border-primary-600'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  Imperial (lbs, ft)
                </button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Workout Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Timer className="w-5 h-5 text-gray-600" />
            <Typography variant="h3">Workout Settings</Typography>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Typography variant="body1" className="mb-2">
                Default Rest Time (seconds)
              </Typography>
              <input
                type="number"
                value={profile.preferences.defaultRestTime}
                onChange={(e) => handlePreferenceChange(['preferences', 'defaultRestTime'], parseInt(e.target.value) || 90)}
                className="w-32 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                min="30"
                max="300"
                step="15"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Typography variant="body1">Auto-start Timer</Typography>
                <Typography variant="body2" color="muted">
                  Automatically start rest timer after completing a set
                </Typography>
              </div>
              <Toggle
                checked={profile.preferences.autoStartTimer}
                onChange={(checked) => handlePreferenceChange(['preferences', 'autoStartTimer'], checked)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-gray-600" />
            <Typography variant="h3">Notifications</Typography>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Typography variant="body1">Workout Reminders</Typography>
                <Typography variant="body2" color="muted">
                  Get reminded to complete your workouts
                </Typography>
              </div>
              <Toggle
                checked={profile.preferences.notifications.workoutReminders}
                onChange={(checked) => handlePreferenceChange(['preferences', 'notifications', 'workoutReminders'], checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Typography variant="body1">Rest Timer Alerts</Typography>
                <Typography variant="body2" color="muted">
                  Sound and vibration when rest timer ends
                </Typography>
              </div>
              <Toggle
                checked={profile.preferences.notifications.restTimerAlerts}
                onChange={(checked) => handlePreferenceChange(['preferences', 'notifications', 'restTimerAlerts'], checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Typography variant="body1">Achievement Notifications</Typography>
                <Typography variant="body2" color="muted">
                  Celebrate your personal records and milestones
                </Typography>
              </div>
              <Toggle
                checked={profile.preferences.notifications.achievements}
                onChange={(checked) => handlePreferenceChange(['preferences', 'notifications', 'achievements'], checked)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Export Data */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Download className="w-5 h-5 text-gray-600" />
            <Typography variant="h3">Export Data</Typography>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Typography variant="body2" color="muted">
              Download your workout history and personal data
            </Typography>
            <div className="flex gap-3">
              <button
                onClick={() => onExport('csv')}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                <Download className="w-4 h-4" />
                Export as CSV
              </button>
              <button
                onClick={() => onExport('pdf')}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                <Download className="w-4 h-4" />
                Export as PDF
              </button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};