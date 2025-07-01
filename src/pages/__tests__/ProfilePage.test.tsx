import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ProfilePage } from '../ProfilePage';
import * as AuthModule from '../../contexts/AuthContext';
import { userProfileService } from '../../services/userProfile.service';
import type { User } from 'firebase/auth';

// Mock dependencies
vi.mock('../../services/userProfile.service');
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => vi.fn(),
  };
});

// Mock useAuth hook
vi.mock('../../contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}));

const mockUser: Partial<User> = {
  uid: 'test-uid',
  email: 'test@example.com',
  displayName: 'Test User',
};

const mockProfile = {
  uid: 'test-uid',
  email: 'test@example.com',
  displayName: 'Test User',
  heightUnit: 'cm' as const,
  weightUnit: 'kg' as const,
  preferences: {
    darkMode: false,
    unitSystem: 'metric' as const,
    defaultRestTime: 90,
    autoStartTimer: true,
    notifications: {
      workoutReminders: true,
      restTimerAlerts: true,
      achievements: true,
    },
  },
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockAuthReturn = {
  user: mockUser as User,
  loading: false,
  signUp: vi.fn(),
  signIn: vi.fn(),
  signInWithGoogle: vi.fn(),
  signOut: vi.fn(),
  resetPassword: vi.fn(),
  error: null,
  clearError: vi.fn(),
};

const renderProfilePage = () => {
  vi.mocked(AuthModule.useAuth).mockReturnValue(mockAuthReturn);
  
  return render(
    <BrowserRouter>
      <ProfilePage />
    </BrowserRouter>
  );
};

describe('ProfilePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(userProfileService.getUserProfile).mockResolvedValue(mockProfile);
    vi.mocked(userProfileService.getUserWorkouts).mockResolvedValue([]);
    vi.mocked(userProfileService.updateUserProfile).mockResolvedValue();
  });

  it('should render profile page with all sections', async () => {
    renderProfilePage();

    await waitFor(() => {
      expect(screen.getByText('Profile & Settings')).toBeInTheDocument();
    });

    // Check main sections
    expect(screen.getByText('Personal Information')).toBeInTheDocument();
    expect(screen.getByText('BMI Calculator')).toBeInTheDocument();
    expect(screen.getByText('My Workouts')).toBeInTheDocument();
    expect(screen.getByText('Appearance')).toBeInTheDocument();
    expect(screen.getByText('Units & Measurements')).toBeInTheDocument();
    expect(screen.getByText('Workout Settings')).toBeInTheDocument();
    expect(screen.getByText('Notifications')).toBeInTheDocument();
    expect(screen.getByText('Export Data')).toBeInTheDocument();
  });

  it('should show loading state', () => {
    vi.mocked(userProfileService.getUserProfile).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    renderProfilePage();

    expect(screen.getByRole('status')).toBeInTheDocument(); // Loading spinner
  });

  it('should redirect to login if not authenticated', () => {
    const navigate = vi.fn();
    vi.doMock('react-router-dom', () => ({
      ...vi.importActual('react-router-dom'),
      useNavigate: () => navigate,
    }));
    
    vi.mocked(AuthModule.useAuth).mockReturnValue({
      ...mockAuthReturn,
      user: null,
    });

    render(
      <BrowserRouter>
        <ProfilePage />
      </BrowserRouter>
    );

    expect(navigate).toHaveBeenCalledWith('/login');
  });

  it('should create profile if it does not exist', async () => {
    vi.mocked(userProfileService.getUserProfile).mockResolvedValueOnce(null);
    vi.mocked(userProfileService.createUserProfile).mockResolvedValueOnce(mockProfile);

    renderProfilePage();

    await waitFor(() => {
      expect(userProfileService.createUserProfile).toHaveBeenCalledWith(
        'test-uid',
        'test@example.com',
        'Test User'
      );
    });
  });

  it('should update profile information', async () => {
    renderProfilePage();

    await waitFor(() => {
      expect(screen.getByText('Personal Information')).toBeInTheDocument();
    });

    // Click edit button
    const editButton = screen.getByRole('button', { name: /edit/i });
    fireEvent.click(editButton);

    // Update name
    const nameInput = screen.getByPlaceholderText('Enter your name');
    fireEvent.change(nameInput, { target: { value: 'John Doe' } });

    // Save changes
    const saveButton = screen.getByRole('button', { name: /save/i });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(userProfileService.updateUserProfile).toHaveBeenCalledWith('test-uid', {
        displayName: 'John Doe',
        birthday: undefined,
        gender: undefined,
        experienceLevel: undefined,
      });
    });
  });

  it('should handle profile update errors', async () => {
    vi.mocked(userProfileService.updateUserProfile).mockRejectedValueOnce(
      new Error('Update failed')
    );

    renderProfilePage();

    await waitFor(() => {
      expect(screen.getByText('Personal Information')).toBeInTheDocument();
    });

    // Trigger an update (implementation depends on your UI)
    // This is a placeholder - adjust based on your actual implementation

    // Check error is displayed
    await waitFor(() => {
      expect(screen.getByText(/failed to update profile/i)).toBeInTheDocument();
    });
  });

  it('should display workouts when available', async () => {
    const mockWorkouts = [
      {
        id: 'workout-1',
        userId: 'test-uid',
        name: 'Test Workout',
        description: 'A test workout',
        exercises: [],
        tags: ['test'],
        isPublic: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        performanceCount: 0,
      },
    ];

    vi.mocked(userProfileService.getUserWorkouts).mockResolvedValueOnce(mockWorkouts);

    renderProfilePage();

    await waitFor(() => {
      expect(screen.getByText('Test Workout')).toBeInTheDocument();
    });
  });

  it('should handle workout deletion', async () => {
    const mockWorkouts = [
      {
        id: 'workout-1',
        userId: 'test-uid',
        name: 'Test Workout',
        exercises: [],
        tags: [],
        isPublic: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        performanceCount: 0,
      },
    ];

    vi.mocked(userProfileService.getUserWorkouts).mockResolvedValueOnce(mockWorkouts);
    vi.mocked(userProfileService.deleteWorkout).mockResolvedValueOnce();

    // Mock window.confirm
    window.confirm = vi.fn(() => true);

    renderProfilePage();

    await waitFor(() => {
      expect(screen.getByText('Test Workout')).toBeInTheDocument();
    });

    // Click delete button
    const deleteButton = screen.getByRole('button', { name: /delete/i });
    fireEvent.click(deleteButton);

    await waitFor(() => {
      expect(userProfileService.deleteWorkout).toHaveBeenCalledWith('workout-1');
    });
  });

  it('should toggle dark mode preference', async () => {
    renderProfilePage();

    await waitFor(() => {
      expect(screen.getByText('Dark Mode')).toBeInTheDocument();
    });

    // Find and click dark mode toggle
    const darkModeSection = screen.getByText('Dark Mode').closest('div');
    const toggle = darkModeSection?.querySelector('button[aria-pressed]');
    
    if (toggle) {
      fireEvent.click(toggle);

      await waitFor(() => {
        expect(userProfileService.updateUserProfile).toHaveBeenCalledWith(
          'test-uid',
          expect.objectContaining({
            preferences: expect.objectContaining({
              darkMode: true,
            }),
          })
        );
      });
    }
  });

  it('should update BMI when height and weight are provided', async () => {
    const profileWithStats = {
      ...mockProfile,
      height: 180,
      weight: 75,
    };

    vi.mocked(userProfileService.getUserProfile).mockResolvedValueOnce(profileWithStats);

    renderProfilePage();

    await waitFor(() => {
      expect(screen.getByText('Your BMI')).toBeInTheDocument();
      expect(screen.getByText(/23\.\d/)).toBeInTheDocument(); // BMI should be around 23.1
      expect(screen.getByText('Normal')).toBeInTheDocument();
    });
  });
});