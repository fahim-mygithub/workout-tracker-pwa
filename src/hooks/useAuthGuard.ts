import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface UseAuthGuardOptions {
  redirectTo?: string;
  requireAuth?: boolean;
}

/**
 * Hook to protect routes based on authentication status
 * @param options Configuration options
 * @returns Auth state and utilities
 */
export const useAuthGuard = (options: UseAuthGuardOptions = {}) => {
  const { 
    redirectTo = '/login', 
    requireAuth = true 
  } = options;
  
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading) {
      if (requireAuth && !user) {
        navigate(redirectTo);
      } else if (!requireAuth && user) {
        navigate('/dashboard');
      }
    }
  }, [user, loading, navigate, redirectTo, requireAuth]);

  return {
    user,
    loading,
    isAuthenticated: !!user,
    canAccess: loading || (requireAuth ? !!user : !user)
  };
};

/**
 * Hook for protected routes that require authentication
 */
export const useRequireAuth = () => {
  return useAuthGuard({ requireAuth: true });
};

/**
 * Hook for public routes that redirect authenticated users
 */
export const usePublicRoute = () => {
  return useAuthGuard({ requireAuth: false, redirectTo: '/dashboard' });
};