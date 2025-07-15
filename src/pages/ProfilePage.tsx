import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Typography, Alert, LoadingSpinner } from '../components/ui';
import { ProfileInfo, BMICalculator, SavedWorkouts, AppPreferences, ExerciseHistoryView } from '../components/profile';
import { useAuth } from '../contexts/AuthContext';
import { userProfileService } from '../services/userProfile.service';
import { exportService } from '../services/export.service';
import { exerciseHistoryService } from '../services/exerciseHistory.service';
import type { UserProfile, WorkoutData } from '../types';

export const ProfilePage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [workouts, setWorkouts] = useState<WorkoutData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    loadProfile();
    loadWorkouts();
  }, [user, navigate]);

  const loadProfile = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      let userProfile = await userProfileService.getUserProfile(user.uid);
      
      // Create profile if it doesn't exist
      if (!userProfile) {
        userProfile = await userProfileService.createUserProfile(
          user.uid,
          user.email || '',
          user.displayName || 'User'
        );
      }
      
      setProfile(userProfile);
    } catch (err) {
      console.error('Error loading profile:', err);
      setError('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const loadWorkouts = async () => {
    if (!user) return;
    
    try {
      const userWorkouts = await userProfileService.getUserWorkouts(user.uid);
      setWorkouts(userWorkouts);
    } catch (err) {
      console.error('Error loading workouts:', err);
    }
  };

  const handleProfileUpdate = async (updates: Partial<UserProfile>) => {
    if (!user || !profile) return;
    
    try {
      await userProfileService.updateUserProfile(user.uid, updates);
      setProfile({ ...profile, ...updates });
    } catch (err) {
      console.error('Error updating profile:', err);
      setError('Failed to update profile');
    }
  };

  const handleEditWorkout = (workout: WorkoutData) => {
    navigate('/build', { state: { workout } });
  };

  const handleDeleteWorkout = async (workoutId: string) => {
    if (window.confirm('Are you sure you want to delete this workout?')) {
      try {
        await userProfileService.deleteWorkout(workoutId);
        setWorkouts(workouts.filter(w => w.id !== workoutId));
      } catch (err) {
        console.error('Error deleting workout:', err);
        setError('Failed to delete workout');
      }
    }
  };

  const handleShareWorkout = async (workoutId: string) => {
    if (!user) return;
    
    try {
      const shareableId = await userProfileService.shareWorkout(workoutId, user.uid);
      const shareUrl = `${window.location.origin}/shared/${shareableId}`;
      
      // Copy to clipboard
      await navigator.clipboard.writeText(shareUrl);
      alert('Workout link copied to clipboard!');
    } catch (err) {
      console.error('Error sharing workout:', err);
      setError('Failed to share workout');
    }
  };

  const handleExport = async (format: 'csv' | 'pdf') => {
    if (!user || !profile) return;

    try {
      // Show loading state
      const loadingMessage = `Preparing ${format.toUpperCase()} export...`;
      
      // Load exercise history
      const history = await exerciseHistoryService.getUserHistory(user.uid, 100);
      
      // Export based on format
      if (format === 'csv') {
        await exportService.exportToCSV(profile, workouts, history);
      } else {
        await exportService.exportToPDF(profile, workouts, history);
      }
      
      // Success feedback could be added here
    } catch (error) {
      console.error('Error exporting data:', error);
      setError(`Failed to export as ${format.toUpperCase()}`);
    }
  };

  if (loading) {
    return (
      <Container maxWidth="4xl" padding="lg">
        <div className="flex justify-center items-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="4xl" padding="lg">
        <Alert variant="error" title="Error">
          {error}
        </Alert>
      </Container>
    );
  }

  if (!user || !profile) {
    return null;
  }

  return (
    <Container maxWidth="7xl" padding="lg" className="min-h-screen">
      <div className="max-w-6xl mx-auto">
        <Typography variant="h1" className="text-center mb-8 font-bold">
          Profile & Settings
        </Typography>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Profile Info */}
          <div className="lg:col-span-1 space-y-6">
            <ProfileInfo profile={profile} onUpdate={handleProfileUpdate} />
            <BMICalculator profile={profile} onUpdate={handleProfileUpdate} />
          </div>

          {/* Right Column - Workouts and Settings */}
          <div className="lg:col-span-2 space-y-6">
            {/* Workout Statistics Coming Soon */}
            <Alert variant="info" title="Workout Statistics">
              Detailed workout analytics and progress tracking coming soon! This will include:
              <ul className="mt-2 ml-4 list-disc text-sm">
                <li>Exercise personal records and progression charts</li>
                <li>Workout frequency and consistency metrics</li>
                <li>Volume and intensity tracking</li>
                <li>Muscle group distribution analysis</li>
              </ul>
            </Alert>

            {/* Saved Workouts Section */}
            <SavedWorkouts
              workouts={workouts}
              onEdit={handleEditWorkout}
              onDelete={handleDeleteWorkout}
              onShare={handleShareWorkout}
            />

            {/* Exercise History Section */}
            <ExerciseHistoryView limit={10} />

            {/* App Preferences Section */}
            <AppPreferences
              profile={profile}
              onUpdate={handleProfileUpdate}
              onExport={handleExport}
            />
          </div>
        </div>
      </div>
    </Container>
  );
};