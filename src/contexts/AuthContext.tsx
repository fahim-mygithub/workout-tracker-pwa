import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { 
  onAuthStateChanged, 
  sendPasswordResetEmail,
  type User 
} from 'firebase/auth';
import { auth } from '../firebase/config';
import { authService, type AuthResult } from '../firebase/auth';

interface AuthContextType {
  // User state
  user: User | null;
  loading: boolean;
  
  // Authentication methods
  signUp: (email: string, password: string) => Promise<AuthResult>;
  signIn: (email: string, password: string) => Promise<AuthResult>;
  signInWithGoogle: () => Promise<AuthResult>;
  signOut: () => Promise<AuthResult>;
  resetPassword: (email: string) => Promise<AuthResult>;
  
  // Error state
  error: string | null;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const clearError = () => {
    setError(null);
  };

  const handleAuthResult = (result: AuthResult): AuthResult => {
    if (result.success) {
      setError(null);
    } else {
      setError(result.error || 'An error occurred');
    }
    return result;
  };

  const signUp = async (email: string, password: string): Promise<AuthResult> => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await authService.signUpWithEmail(email, password);
      return handleAuthResult(result);
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string): Promise<AuthResult> => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await authService.signInWithEmail(email, password);
      return handleAuthResult(result);
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = async (): Promise<AuthResult> => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await authService.signInWithGoogle();
      return handleAuthResult(result);
    } finally {
      setLoading(false);
    }
  };

  const signOut = async (): Promise<AuthResult> => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await authService.signOut();
      return handleAuthResult(result);
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (email: string): Promise<AuthResult> => {
    setLoading(true);
    setError(null);
    
    try {
      await sendPasswordResetEmail(auth, email);
      return {
        success: true
      };
    } catch (error: unknown) {
      const result = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
      return handleAuthResult(result);
    } finally {
      setLoading(false);
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    signUp,
    signIn,
    signInWithGoogle,
    signOut,
    resetPassword,
    error,
    clearError
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};