import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useNavigate } from 'react-router-dom';
import { useAuthGuard, useRequireAuth, usePublicRoute } from '../useAuthGuard';
import { useAuth } from '../../contexts/AuthContext';

// Mock dependencies
vi.mock('react-router-dom', () => ({
  useNavigate: vi.fn(),
}));

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}));

const MockedUseNavigate = useNavigate as Mock;
const MockedUseAuth = useAuth as Mock;

describe('useAuthGuard', () => {
  const mockNavigate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    MockedUseNavigate.mockReturnValue(mockNavigate);
  });

  it('should redirect unauthenticated user to login when requireAuth is true', () => {
    MockedUseAuth.mockReturnValue({
      user: null,
      loading: false,
    });

    renderHook(() => useAuthGuard({ requireAuth: true }));

    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });

  it('should redirect authenticated user to dashboard when requireAuth is false', () => {
    const mockUser = { uid: '123', email: 'test@example.com' };
    MockedUseAuth.mockReturnValue({
      user: mockUser,
      loading: false,
    });

    renderHook(() => useAuthGuard({ requireAuth: false }));

    expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
  });

  it('should use custom redirect path', () => {
    MockedUseAuth.mockReturnValue({
      user: null,
      loading: false,
    });

    renderHook(() => useAuthGuard({ 
      requireAuth: true, 
      redirectTo: '/custom-login' 
    }));

    expect(mockNavigate).toHaveBeenCalledWith('/custom-login');
  });

  it('should not redirect while loading', () => {
    MockedUseAuth.mockReturnValue({
      user: null,
      loading: true,
    });

    renderHook(() => useAuthGuard({ requireAuth: true }));

    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('should return correct auth state', () => {
    const mockUser = { uid: '123', email: 'test@example.com' };
    MockedUseAuth.mockReturnValue({
      user: mockUser,
      loading: false,
    });

    const { result } = renderHook(() => useAuthGuard({ requireAuth: true }));

    expect(result.current).toEqual({
      user: mockUser,
      loading: false,
      isAuthenticated: true,
      canAccess: true,
    });
  });

  it('should return false for canAccess when user is not authenticated and auth is required', () => {
    MockedUseAuth.mockReturnValue({
      user: null,
      loading: false,
    });

    const { result } = renderHook(() => useAuthGuard({ requireAuth: true }));

    expect(result.current.canAccess).toBe(false);
  });

  it('should return true for canAccess when loading', () => {
    MockedUseAuth.mockReturnValue({
      user: null,
      loading: true,
    });

    const { result } = renderHook(() => useAuthGuard({ requireAuth: true }));

    expect(result.current.canAccess).toBe(true);
  });
});

describe('useRequireAuth', () => {
  const mockNavigate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    MockedUseNavigate.mockReturnValue(mockNavigate);
  });

  it('should require authentication', () => {
    MockedUseAuth.mockReturnValue({
      user: null,
      loading: false,
    });

    renderHook(() => useRequireAuth());

    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });

  it('should not redirect when user is authenticated', () => {
    const mockUser = { uid: '123', email: 'test@example.com' };
    MockedUseAuth.mockReturnValue({
      user: mockUser,
      loading: false,
    });

    renderHook(() => useRequireAuth());

    expect(mockNavigate).not.toHaveBeenCalled();
  });
});

describe('usePublicRoute', () => {
  const mockNavigate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    MockedUseNavigate.mockReturnValue(mockNavigate);
  });

  it('should redirect authenticated user to dashboard', () => {
    const mockUser = { uid: '123', email: 'test@example.com' };
    MockedUseAuth.mockReturnValue({
      user: mockUser,
      loading: false,
    });

    renderHook(() => usePublicRoute());

    expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
  });

  it('should not redirect when user is not authenticated', () => {
    MockedUseAuth.mockReturnValue({
      user: null,
      loading: false,
    });

    renderHook(() => usePublicRoute());

    expect(mockNavigate).not.toHaveBeenCalled();
  });
});