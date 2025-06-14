import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { SignupForm } from '../SignupForm';
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

describe('SignupForm', () => {
  const mockSignUp = vi.fn();
  const mockSignInWithGoogle = vi.fn();
  const mockClearError = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    
    MockedUseAuth.mockReturnValue({
      signUp: mockSignUp,
      signInWithGoogle: mockSignInWithGoogle,
      loading: false,
      error: null,
      clearError: mockClearError,
    });
  });

  it('should render signup form correctly', () => {
    render(
      <RouterWrapper>
        <SignupForm />
      </RouterWrapper>
    );

    expect(screen.getByText('Create your account')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Email address')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Password')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Confirm password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Create account' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sign up with Google' })).toBeInTheDocument();
  });

  it('should validate required fields', async () => {
    render(
      <RouterWrapper>
        <SignupForm />
      </RouterWrapper>
    );

    fireEvent.click(screen.getByRole('button', { name: 'Create account' }));

    await waitFor(() => {
      expect(screen.getByText('Email is required')).toBeInTheDocument();
      expect(screen.getByText('Password is required')).toBeInTheDocument();
      expect(screen.getByText('Please confirm your password')).toBeInTheDocument();
    });

    expect(mockSignUp).not.toHaveBeenCalled();
  });

  it('should validate email format', async () => {
    render(
      <RouterWrapper>
        <SignupForm />
      </RouterWrapper>
    );

    fireEvent.change(screen.getByPlaceholderText('Email address'), {
      target: { value: 'invalid-email' }
    });
    fireEvent.change(screen.getByPlaceholderText('Password'), {
      target: { value: 'Password123' }
    });
    fireEvent.change(screen.getByPlaceholderText('Confirm password'), {
      target: { value: 'Password123' }
    });
    fireEvent.click(screen.getByRole('button', { name: 'Create account' }));

    await waitFor(() => {
      expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument();
    });

    expect(mockSignUp).not.toHaveBeenCalled();
  });

  it('should validate password strength', async () => {
    render(
      <RouterWrapper>
        <SignupForm />
      </RouterWrapper>
    );

    fireEvent.change(screen.getByPlaceholderText('Email address'), {
      target: { value: 'test@example.com' }
    });
    fireEvent.change(screen.getByPlaceholderText('Password'), {
      target: { value: 'weakpass' }
    });
    fireEvent.change(screen.getByPlaceholderText('Confirm password'), {
      target: { value: 'weakpass' }
    });
    fireEvent.click(screen.getByRole('button', { name: 'Create account' }));

    await waitFor(() => {
      expect(screen.getByText(/Password must contain at least one uppercase letter/)).toBeInTheDocument();
    });

    expect(mockSignUp).not.toHaveBeenCalled();
  });

  it('should validate password confirmation', async () => {
    render(
      <RouterWrapper>
        <SignupForm />
      </RouterWrapper>
    );

    fireEvent.change(screen.getByPlaceholderText('Email address'), {
      target: { value: 'test@example.com' }
    });
    fireEvent.change(screen.getByPlaceholderText('Password'), {
      target: { value: 'Password123' }
    });
    fireEvent.change(screen.getByPlaceholderText('Confirm password'), {
      target: { value: 'Password456' }
    });
    fireEvent.click(screen.getByRole('button', { name: 'Create account' }));

    await waitFor(() => {
      expect(screen.getByText('Passwords do not match')).toBeInTheDocument();
    });

    expect(mockSignUp).not.toHaveBeenCalled();
  });

  it('should show password strength indicator', () => {
    render(
      <RouterWrapper>
        <SignupForm />
      </RouterWrapper>
    );

    const passwordInput = screen.getByPlaceholderText('Password');

    // Weak password
    fireEvent.change(passwordInput, { target: { value: 'weak' } });
    expect(screen.getByText('Weak')).toBeInTheDocument();

    // Medium password
    fireEvent.change(passwordInput, { target: { value: 'Medium1' } });
    expect(screen.getByText('Medium')).toBeInTheDocument();

    // Strong password
    fireEvent.change(passwordInput, { target: { value: 'Strong1!' } });
    expect(screen.getByText('Strong')).toBeInTheDocument();
  });

  it('should submit form with valid data', async () => {
    mockSignUp.mockResolvedValue({ success: true });

    render(
      <RouterWrapper>
        <SignupForm />
      </RouterWrapper>
    );

    fireEvent.change(screen.getByPlaceholderText('Email address'), {
      target: { value: 'test@example.com' }
    });
    fireEvent.change(screen.getByPlaceholderText('Password'), {
      target: { value: 'Password123' }
    });
    fireEvent.change(screen.getByPlaceholderText('Confirm password'), {
      target: { value: 'Password123' }
    });
    fireEvent.click(screen.getByRole('button', { name: 'Create account' }));

    await waitFor(() => {
      expect(mockSignUp).toHaveBeenCalledWith('test@example.com', 'Password123');
    });
  });

  it('should handle Google sign up', async () => {
    mockSignInWithGoogle.mockResolvedValue({ success: true });

    render(
      <RouterWrapper>
        <SignupForm />
      </RouterWrapper>
    );

    fireEvent.click(screen.getByRole('button', { name: 'Sign up with Google' }));

    await waitFor(() => {
      expect(mockSignInWithGoogle).toHaveBeenCalled();
    });
  });

  it('should handle specific Firebase errors', async () => {
    mockSignUp.mockResolvedValue({
      success: false,
      error: 'Firebase: Error (auth/email-already-in-use).'
    });

    render(
      <RouterWrapper>
        <SignupForm />
      </RouterWrapper>
    );

    fireEvent.change(screen.getByPlaceholderText('Email address'), {
      target: { value: 'test@example.com' }
    });
    fireEvent.change(screen.getByPlaceholderText('Password'), {
      target: { value: 'Password123' }
    });
    fireEvent.change(screen.getByPlaceholderText('Confirm password'), {
      target: { value: 'Password123' }
    });
    fireEvent.click(screen.getByRole('button', { name: 'Create account' }));

    await waitFor(() => {
      expect(screen.getByText('An account with this email already exists')).toBeInTheDocument();
    });
  });

  it('should clear field errors when user types', async () => {
    render(
      <RouterWrapper>
        <SignupForm />
      </RouterWrapper>
    );

    // Trigger validation errors
    fireEvent.click(screen.getByRole('button', { name: 'Create account' }));

    await waitFor(() => {
      expect(screen.getByText('Email is required')).toBeInTheDocument();
    });

    // Start typing in email field
    fireEvent.change(screen.getByPlaceholderText('Email address'), {
      target: { value: 't' }
    });

    expect(screen.queryByText('Email is required')).not.toBeInTheDocument();
  });

  it('should show loading state', () => {
    MockedUseAuth.mockReturnValue({
      signUp: mockSignUp,
      signInWithGoogle: mockSignInWithGoogle,
      loading: true,
      error: null,
      clearError: mockClearError,
    });

    render(
      <RouterWrapper>
        <SignupForm />
      </RouterWrapper>
    );

    expect(screen.getByRole('button', { name: 'Create account' })).toBeDisabled();
  });

  it('should render navigation links', () => {
    render(
      <RouterWrapper>
        <SignupForm />
      </RouterWrapper>
    );

    expect(screen.getByText('Sign in')).toBeInTheDocument();
  });
});