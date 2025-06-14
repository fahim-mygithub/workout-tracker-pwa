import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from '../AuthContext';
import { authService } from '../../firebase/auth';
import { onAuthStateChanged, sendPasswordResetEmail } from 'firebase/auth';

// Mock Firebase auth
vi.mock('firebase/auth', () => ({
  onAuthStateChanged: vi.fn(),
  sendPasswordResetEmail: vi.fn(),
}));

// Mock auth service
vi.mock('../../firebase/auth', () => ({
  authService: {
    signUpWithEmail: vi.fn(),
    signInWithEmail: vi.fn(),
    signInWithGoogle: vi.fn(),
    signOut: vi.fn(),
  },
}));

// Mock Firebase config
vi.mock('../../firebase/config', () => ({
  auth: {},
}));

// Test component to access auth context
const TestComponent = () => {
  const auth = useAuth();
  
  return (
    <div>
      <div data-testid="user">{auth.user ? 'authenticated' : 'not authenticated'}</div>
      <div data-testid="loading">{auth.loading ? 'loading' : 'not loading'}</div>
      <div data-testid="error">{auth.error || 'no error'}</div>
      <button onClick={() => auth.signIn('test@example.com', 'password')}>
        Sign In
      </button>
      <button onClick={() => auth.signUp('test@example.com', 'password')}>
        Sign Up
      </button>
      <button onClick={() => auth.signInWithGoogle()}>
        Google Sign In
      </button>
      <button onClick={() => auth.signOut()}>
        Sign Out
      </button>
      <button onClick={() => auth.resetPassword('test@example.com')}>
        Reset Password
      </button>
      <button onClick={() => auth.clearError()}>
        Clear Error
      </button>
    </div>
  );
};

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup auth service mocks
    (authService.signUpWithEmail as Mock).mockResolvedValue({ success: true });
    (authService.signInWithEmail as Mock).mockResolvedValue({ success: true });
    (authService.signInWithGoogle as Mock).mockResolvedValue({ success: true });
    (authService.signOut as Mock).mockResolvedValue({ success: true });
  });

  it('should throw error when useAuth is used outside provider', () => {
    // Temporarily suppress console.error for this test
    const originalError = console.error;
    console.error = vi.fn();
    
    expect(() => {
      render(<TestComponent />);
    }).toThrow('useAuth must be used within an AuthProvider');
    
    console.error = originalError;
  });

  it('should provide auth context to children', () => {
    // Mock onAuthStateChanged to call callback with null user
    (onAuthStateChanged as Mock).mockImplementation((auth, callback) => {
      callback(null);
      return vi.fn(); // unsubscribe function
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    expect(screen.getByTestId('user')).toHaveTextContent('not authenticated');
    expect(screen.getByTestId('loading')).toHaveTextContent('not loading');
    expect(screen.getByTestId('error')).toHaveTextContent('no error');
  });

  it('should handle user authentication state changes', () => {
    const mockUser = { uid: '123', email: 'test@example.com' };
    
    (onAuthStateChanged as Mock).mockImplementation((auth, callback) => {
      callback(mockUser);
      return vi.fn();
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    expect(screen.getByTestId('user')).toHaveTextContent('authenticated');
  });

  it('should handle successful sign in', async () => {
    (onAuthStateChanged as Mock).mockImplementation((auth, callback) => {
      callback(null);
      return vi.fn();
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    fireEvent.click(screen.getByText('Sign In'));
    
    await waitFor(() => {
      expect(authService.signInWithEmail).toHaveBeenCalledWith('test@example.com', 'password');
    });
  });

  it('should handle sign in error', async () => {
    (onAuthStateChanged as Mock).mockImplementation((auth, callback) => {
      callback(null);
      return vi.fn();
    });

    (authService.signInWithEmail as Mock).mockResolvedValue({
      success: false,
      error: 'Invalid credentials'
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    fireEvent.click(screen.getByText('Sign In'));
    
    await waitFor(() => {
      expect(screen.getByTestId('error')).toHaveTextContent('Invalid credentials');
    });
  });

  it('should handle successful sign up', async () => {
    (onAuthStateChanged as Mock).mockImplementation((auth, callback) => {
      callback(null);
      return vi.fn();
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    fireEvent.click(screen.getByText('Sign Up'));
    
    await waitFor(() => {
      expect(authService.signUpWithEmail).toHaveBeenCalledWith('test@example.com', 'password');
    });
  });

  it('should handle Google sign in', async () => {
    (onAuthStateChanged as Mock).mockImplementation((auth, callback) => {
      callback(null);
      return vi.fn();
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    fireEvent.click(screen.getByText('Google Sign In'));
    
    await waitFor(() => {
      expect(authService.signInWithGoogle).toHaveBeenCalled();
    });
  });

  it('should handle sign out', async () => {
    (onAuthStateChanged as Mock).mockImplementation((auth, callback) => {
      callback(null);
      return vi.fn();
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    fireEvent.click(screen.getByText('Sign Out'));
    
    await waitFor(() => {
      expect(authService.signOut).toHaveBeenCalled();
    });
  });

  it('should handle password reset', async () => {
    (onAuthStateChanged as Mock).mockImplementation((auth, callback) => {
      callback(null);
      return vi.fn();
    });

    (sendPasswordResetEmail as Mock).mockResolvedValue(undefined);

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    fireEvent.click(screen.getByText('Reset Password'));
    
    await waitFor(() => {
      expect(sendPasswordResetEmail).toHaveBeenCalledWith({}, 'test@example.com');
    });
  });

  it('should handle password reset error', async () => {
    (onAuthStateChanged as Mock).mockImplementation((auth, callback) => {
      callback(null);
      return vi.fn();
    });

    (sendPasswordResetEmail as Mock).mockRejectedValue(new Error('User not found'));

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    fireEvent.click(screen.getByText('Reset Password'));
    
    await waitFor(() => {
      expect(screen.getByTestId('error')).toHaveTextContent('User not found');
    });
  });

  it('should clear error', async () => {
    (onAuthStateChanged as Mock).mockImplementation((auth, callback) => {
      callback(null);
      return vi.fn();
    });

    (authService.signInWithEmail as Mock).mockResolvedValue({
      success: false,
      error: 'Test error'
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    // Trigger error
    fireEvent.click(screen.getByText('Sign In'));
    
    await waitFor(() => {
      expect(screen.getByTestId('error')).toHaveTextContent('Test error');
    });

    // Clear error
    fireEvent.click(screen.getByText('Clear Error'));
    
    expect(screen.getByTestId('error')).toHaveTextContent('no error');
  });
});