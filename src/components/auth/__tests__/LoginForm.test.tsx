import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { LoginForm } from '../LoginForm';
import { useAuth } from '../../../contexts/AuthContext';

// Mock the auth context
vi.mock('../../../contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}));

const MockedUseAuth = useAuth as Mock;

// Wrapper component with router
const RouterWrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>{children}</BrowserRouter>
);

describe('LoginForm', () => {
  const mockSignIn = vi.fn();
  const mockSignInWithGoogle = vi.fn();
  const mockClearError = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    
    MockedUseAuth.mockReturnValue({
      signIn: mockSignIn,
      signInWithGoogle: mockSignInWithGoogle,
      loading: false,
      error: null,
      clearError: mockClearError,
    });
  });

  it('should render login form correctly', () => {
    render(
      <RouterWrapper>
        <LoginForm />
      </RouterWrapper>
    );

    expect(screen.getByText('Sign in to your account')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Email address')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sign in' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sign in with Google' })).toBeInTheDocument();
  });

  it('should validate required fields', async () => {
    render(
      <RouterWrapper>
        <LoginForm />
      </RouterWrapper>
    );

    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));

    await waitFor(() => {
      expect(screen.getByText('Email is required')).toBeInTheDocument();
      expect(screen.getByText('Password is required')).toBeInTheDocument();
    });

    expect(mockSignIn).not.toHaveBeenCalled();
  });

  it('should validate email format', async () => {
    render(
      <RouterWrapper>
        <LoginForm />
      </RouterWrapper>
    );

    fireEvent.change(screen.getByPlaceholderText('Email address'), {
      target: { value: 'invalid-email' }
    });
    fireEvent.change(screen.getByPlaceholderText('Password'), {
      target: { value: 'password123' }
    });
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));

    await waitFor(() => {
      expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument();
    });

    expect(mockSignIn).not.toHaveBeenCalled();
  });

  it('should validate minimum password length', async () => {
    render(
      <RouterWrapper>
        <LoginForm />
      </RouterWrapper>
    );

    fireEvent.change(screen.getByPlaceholderText('Email address'), {
      target: { value: 'test@example.com' }
    });
    fireEvent.change(screen.getByPlaceholderText('Password'), {
      target: { value: '123' }
    });
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));

    await waitFor(() => {
      expect(screen.getByText('Password must be at least 6 characters')).toBeInTheDocument();
    });

    expect(mockSignIn).not.toHaveBeenCalled();
  });

  it('should submit form with valid data', async () => {
    mockSignIn.mockResolvedValue({ success: true });

    render(
      <RouterWrapper>
        <LoginForm />
      </RouterWrapper>
    );

    fireEvent.change(screen.getByPlaceholderText('Email address'), {
      target: { value: 'test@example.com' }
    });
    fireEvent.change(screen.getByPlaceholderText('Password'), {
      target: { value: 'password123' }
    });
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith('test@example.com', 'password123');
    });
  });

  it('should handle Google sign in', async () => {
    mockSignInWithGoogle.mockResolvedValue({ success: true });

    render(
      <RouterWrapper>
        <LoginForm />
      </RouterWrapper>
    );

    fireEvent.click(screen.getByRole('button', { name: 'Sign in with Google' }));

    await waitFor(() => {
      expect(mockSignInWithGoogle).toHaveBeenCalled();
    });
  });

  it('should display general error from context', () => {
    MockedUseAuth.mockReturnValue({
      signIn: mockSignIn,
      signInWithGoogle: mockSignInWithGoogle,
      loading: false,
      error: 'Authentication failed',
      clearError: mockClearError,
    });

    render(
      <RouterWrapper>
        <LoginForm />
      </RouterWrapper>
    );

    expect(screen.getByText('Authentication failed')).toBeInTheDocument();
  });

  it('should handle specific Firebase errors', async () => {
    mockSignIn.mockResolvedValue({
      success: false,
      error: 'Firebase: Error (auth/user-not-found).'
    });

    render(
      <RouterWrapper>
        <LoginForm />
      </RouterWrapper>
    );

    fireEvent.change(screen.getByPlaceholderText('Email address'), {
      target: { value: 'test@example.com' }
    });
    fireEvent.change(screen.getByPlaceholderText('Password'), {
      target: { value: 'password123' }
    });
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));

    await waitFor(() => {
      expect(screen.getByText('No account found with this email address')).toBeInTheDocument();
    });
  });

  it('should clear field errors when user types', async () => {
    render(
      <RouterWrapper>
        <LoginForm />
      </RouterWrapper>
    );

    // Trigger validation errors
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));

    await waitFor(() => {
      expect(screen.getByText('Email is required')).toBeInTheDocument();
    });

    // Start typing in email field
    fireEvent.change(screen.getByPlaceholderText('Email address'), {
      target: { value: 't' }
    });

    expect(screen.queryByText('Email is required')).not.toBeInTheDocument();
  });

  it('should clear general error when user types', () => {
    MockedUseAuth.mockReturnValue({
      signIn: mockSignIn,
      signInWithGoogle: mockSignInWithGoogle,
      loading: false,
      error: 'Authentication failed',
      clearError: mockClearError,
    });

    render(
      <RouterWrapper>
        <LoginForm />
      </RouterWrapper>
    );

    fireEvent.change(screen.getByPlaceholderText('Email address'), {
      target: { value: 't' }
    });

    expect(mockClearError).toHaveBeenCalled();
  });

  it('should show loading state', () => {
    MockedUseAuth.mockReturnValue({
      signIn: mockSignIn,
      signInWithGoogle: mockSignInWithGoogle,
      loading: true,
      error: null,
      clearError: mockClearError,
    });

    render(
      <RouterWrapper>
        <LoginForm />
      </RouterWrapper>
    );

    expect(screen.getByRole('button', { name: 'Sign in' })).toBeDisabled();
  });

  it('should render navigation links', () => {
    render(
      <RouterWrapper>
        <LoginForm />
      </RouterWrapper>
    );

    expect(screen.getByText('Forgot your password?')).toBeInTheDocument();
    expect(screen.getByText('Sign up')).toBeInTheDocument();
  });
});