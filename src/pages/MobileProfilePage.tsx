import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Typography, Alert, LoadingSpinner, Card } from '../components/ui';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/Tabs';
import { ProfileInfo, BMICalculator, SavedWorkouts, AppPreferences, ExerciseHistoryView } from '../components/profile';
import { useAuth } from '../contexts/AuthContext';
import { userProfileService } from '../services/userProfile.service';
import { exportService } from '../services/export.service';
import { exerciseHistoryService } from '../services/exerciseHistory.service';
import type { UserProfile, WorkoutData } from '../types';
import { cn } from '../lib/utils';

export const MobileProfilePage: React.FC = () => {
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
      <Container maxWidth="full" padding="sm" className="min-h-screen">
        <div className="flex justify-center items-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="full" padding="sm" className="min-h-screen">
        <Alert variant="error" title="Error">
          {error}
        </Alert>
      </Container>
    );
  }

  if (!profile) {
    return null;
  }

  return (
    <Container maxWidth="full" padding="sm" className="min-h-screen pb-20">
      <div className="space-y-4">
        <Typography variant="h2" className="text-center font-bold">
          Profile
        </Typography>

        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="profile" className="text-xs">Profile</TabsTrigger>
            <TabsTrigger value="health" className="text-xs">Health</TabsTrigger>
            <TabsTrigger value="workouts" className="text-xs">Workouts</TabsTrigger>
            <TabsTrigger value="history" className="text-xs">History</TabsTrigger>
            <TabsTrigger value="settings" className="text-xs">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-4 mt-4">
            <ProfileInfo profile={profile} onUpdate={handleProfileUpdate} />
          </TabsContent>

          <TabsContent value="health" className="space-y-4 mt-4">
            <BMICalculator profile={profile} onUpdate={handleProfileUpdate} />
            
            <Card padding="md">
              <Typography variant="h3" className="mb-3">
                Workout Statistics
              </Typography>
              <Alert variant="info" title="Coming Soon">
                <Typography variant="body2" className="text-sm">
                  Personal records, progress tracking, and detailed analytics will be available soon!
                </Typography>
              </Alert>
            </Card>
          </TabsContent>

          <TabsContent value="workouts" className="space-y-4 mt-4">
            <SavedWorkouts
              workouts={workouts}
              onEdit={handleEditWorkout}
              onDelete={handleDeleteWorkout}
              onShare={handleShareWorkout}
            />
          </TabsContent>

          <TabsContent value="history" className="space-y-4 mt-4">
            <ExerciseHistoryView limit={10} />
          </TabsContent>

          <TabsContent value="settings" className="space-y-4 mt-4">
            <AppPreferences
              profile={profile}
              onUpdate={handleProfileUpdate}
              onExport={handleExport}
            />
          </TabsContent>
        </Tabs>
      </div>
    </Container>
  );
};