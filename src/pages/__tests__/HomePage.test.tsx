import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import { HomePage } from '../HomePage';
import workoutReducer, { ActiveWorkout } from '../../store/slices/workoutSlice';

// Mock react-router-dom
const mockedNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockedNavigate,
  };
});

// Mock store factory
const createMockStore = (workoutState = {}) => {
  return configureStore({
    reducer: {
      workout: workoutReducer,
      app: (state = {}) => state,
      user: (state = {}) => state,
      exercise: (state = {}) => state,
    },
    preloadedState: {
      workout: {
        activeWorkout: null,
        restTimer: {
          isActive: false,
          timeRemaining: 0,
          totalTime: 0,
          autoStart: true,
        },
        workoutHistory: [],
        isLoading: false,
        error: null,
        ...workoutState,
      },
    },
  });
};

const renderHomePage = (workoutState = {}) => {
  const store = createMockStore(workoutState);
  return render(
    <BrowserRouter>
      <Provider store={store}>
        <HomePage />
      </Provider>
    </BrowserRouter>
  );
};

describe('HomePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders main header and description', () => {
    renderHomePage();
    
    expect(screen.getByText('Workout Tracker')).toBeInTheDocument();
    expect(screen.getByText('Your Progressive Web App for Smart Workout Tracking')).toBeInTheDocument();
    expect(screen.getByText(/Create workouts with natural language/)).toBeInTheDocument();
  });

  it('renders quick stats component', () => {
    renderHomePage();
    
    expect(screen.getByText('Quick Stats')).toBeInTheDocument();
    expect(screen.getByText('Total Workouts')).toBeInTheDocument();
  });

  it('renders calendar widget', () => {
    renderHomePage();
    
    expect(screen.getByText('Workout Calendar')).toBeInTheDocument();
    expect(screen.getByText('Track your workout schedule')).toBeInTheDocument();
    
    // Should have calendar navigation
    expect(screen.getByRole('button', { name: '←' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '→' })).toBeInTheDocument();
  });

  it('renders quick action buttons', () => {
    renderHomePage();
    
    expect(screen.getByRole('button', { name: 'Start Workout' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Build New Workout' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Browse Exercises' })).toBeInTheDocument();
  });

  it('shows active workout alert when workout is active', () => {
    const mockActiveWorkout: ActiveWorkout = {
      id: 'test-workout',
      name: 'Test Active Workout',
      exercises: [],
      startTime: new Date().toISOString(),
      currentExerciseIndex: 0,
      currentSetIndex: 0,
      totalDuration: 0,
      isActive: true,
    };

    renderHomePage({ activeWorkout: mockActiveWorkout });
    
    expect(screen.getByText('Active Workout: Test Active Workout')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Resume' })).toBeInTheDocument();
  });

  it('changes start workout button text when workout is active', () => {
    const mockActiveWorkout: ActiveWorkout = {
      id: 'test-workout',
      name: 'Test Active Workout',
      exercises: [],
      startTime: new Date().toISOString(),
      currentExerciseIndex: 0,
      currentSetIndex: 0,
      totalDuration: 0,
      isActive: true,
    };

    renderHomePage({ activeWorkout: mockActiveWorkout });
    
    expect(screen.getByRole('button', { name: 'Resume Workout' })).toBeInTheDocument();
  });

  it('navigates to workout page when start workout clicked', () => {
    renderHomePage();
    
    fireEvent.click(screen.getByRole('button', { name: 'Start Workout' }));
    expect(mockedNavigate).toHaveBeenCalledWith('/workout');
  });

  it('navigates to build page when build workout clicked', () => {
    renderHomePage();
    
    fireEvent.click(screen.getByRole('button', { name: 'Build New Workout' }));
    expect(mockedNavigate).toHaveBeenCalledWith('/build');
  });

  it('navigates to exercises page when browse exercises clicked', () => {
    renderHomePage();
    
    fireEvent.click(screen.getByRole('button', { name: 'Browse Exercises' }));
    expect(mockedNavigate).toHaveBeenCalledWith('/exercises');
  });

  it('navigates to workout page when resume button clicked', () => {
    const mockActiveWorkout: ActiveWorkout = {
      id: 'test-workout',
      name: 'Test Active Workout',
      exercises: [],
      startTime: new Date().toISOString(),
      currentExerciseIndex: 0,
      currentSetIndex: 0,
      totalDuration: 0,
      isActive: true,
    };

    renderHomePage({ activeWorkout: mockActiveWorkout });
    
    fireEvent.click(screen.getByRole('button', { name: 'Resume' }));
    expect(mockedNavigate).toHaveBeenCalledWith('/workout');
  });

  it('shows recent activity section', () => {
    renderHomePage();
    
    expect(screen.getByText('Recent Activity')).toBeInTheDocument();
    expect(screen.getAllByText('Upper Body Strength')).toHaveLength(3);
    expect(screen.getByText('1 days ago')).toBeInTheDocument();
    expect(screen.getByText('2 days ago')).toBeInTheDocument();
    expect(screen.getByText('3 days ago')).toBeInTheDocument();
  });

  it('displays selected date information', () => {
    renderHomePage();
    
    // Should show today's date by default
    const today = new Date();
    const formattedDate = today.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    
    expect(screen.getByText(formattedDate)).toBeInTheDocument();
  });

  it('updates selected date when calendar date is clicked', () => {
    renderHomePage();
    
    // Click on day 15 (assuming it exists)
    const dayButton = screen.getByRole('button', { name: '15' });
    fireEvent.click(dayButton);
    
    // Should update the selected date display
    // The exact text depends on current month/year, but should contain '15'
    expect(screen.getByText(/15/)).toBeInTheDocument();
  });
});