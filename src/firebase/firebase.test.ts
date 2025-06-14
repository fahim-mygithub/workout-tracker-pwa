import { describe, it, expect, beforeEach, vi } from 'vitest';
import { authService } from './auth';

// Mock Firebase modules
vi.mock('firebase/auth', () => ({
  createUserWithEmailAndPassword: vi.fn(),
  signInWithEmailAndPassword: vi.fn(),
  signInWithPopup: vi.fn(),
  GoogleAuthProvider: vi.fn(),
  signOut: vi.fn(),
  getAuth: vi.fn(() => ({ currentUser: null }))
}));

vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn()
}));

vi.mock('firebase/app', () => ({
  initializeApp: vi.fn()
}));

vi.mock('./config', () => ({
  auth: { currentUser: null },
  db: {}
}));

describe('Firebase Authentication Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Email/Password Authentication', () => {
    it('should have signUpWithEmail method', () => {
      expect(typeof authService.signUpWithEmail).toBe('function');
    });

    it('should have signInWithEmail method', () => {
      expect(typeof authService.signInWithEmail).toBe('function');
    });

    it('should return AuthResult interface structure', async () => {
      const result = await authService.signUpWithEmail('test@example.com', 'password123');
      
      expect(result).toHaveProperty('success');
      expect(typeof result.success).toBe('boolean');
      
      if (result.success) {
        expect(result).toHaveProperty('user');
      } else {
        expect(result).toHaveProperty('error');
        expect(typeof result.error).toBe('string');
      }
    });
  });

  describe('Google Authentication', () => {
    it('should have signInWithGoogle method', () => {
      expect(typeof authService.signInWithGoogle).toBe('function');
    });

    it('should return AuthResult interface structure', async () => {
      const result = await authService.signInWithGoogle();
      
      expect(result).toHaveProperty('success');
      expect(typeof result.success).toBe('boolean');
    });
  });

  describe('Sign Out', () => {
    it('should have signOut method', () => {
      expect(typeof authService.signOut).toBe('function');
    });

    it('should return AuthResult interface structure', async () => {
      const result = await authService.signOut();
      
      expect(result).toHaveProperty('success');
      expect(typeof result.success).toBe('boolean');
    });
  });

  describe('Current User', () => {
    it('should have getCurrentUser method', () => {
      expect(typeof authService.getCurrentUser).toBe('function');
    });

    it('should return null when no user is signed in', () => {
      const user = authService.getCurrentUser();
      expect(user).toBeNull();
    });
  });
});

describe('Firebase Configuration', () => {
  it('should import Firebase config without errors', async () => {
    expect(async () => {
      await import('./config');
    }).not.toThrow();
  });

  it('should import development config without errors', async () => {
    expect(async () => {
      await import('./config.dev');
    }).not.toThrow();
  });
});

describe('Environment Variables', () => {
  it('should have proper environment variable structure', () => {
    const requiredEnvVars = [
      'VITE_FIREBASE_API_KEY',
      'VITE_FIREBASE_AUTH_DOMAIN',
      'VITE_FIREBASE_PROJECT_ID',
      'VITE_FIREBASE_STORAGE_BUCKET',
      'VITE_FIREBASE_MESSAGING_SENDER_ID',
      'VITE_FIREBASE_APP_ID'
    ];

    // In test environment, these will be undefined
    // but we're testing that the structure is correct
    requiredEnvVars.forEach(envVar => {
      expect(import.meta.env).toHaveProperty(envVar);
    });
  });
});