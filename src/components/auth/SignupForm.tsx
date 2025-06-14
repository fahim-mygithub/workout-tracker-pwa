import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { AuthLayout } from './AuthLayout';
import { AuthInput } from './AuthInput';
import { AuthButton } from './AuthButton';

interface FormData {
  email: string;
  password: string;
  confirmPassword: string;
}

interface FormErrors {
  email?: string;
  password?: string;
  confirmPassword?: string;
}

export const SignupForm: React.FC = () => {
  const { signUp, signInWithGoogle, loading, error, clearError } = useAuth();
  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const validateForm = (): boolean => {
    const errors: FormErrors = {};

    // Email validation
    if (!formData.email) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }

    // Password validation
    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      errors.password = 'Password must contain at least one uppercase letter, one lowercase letter, and one number';
    }

    // Confirm password validation
    if (!formData.confirmPassword) {
      errors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear specific field error when user starts typing
    if (formErrors[name as keyof FormErrors]) {
      setFormErrors(prev => ({ ...prev, [name]: undefined }));
    }
    
    // Clear general error
    if (error) {
      clearError();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const result = await signUp(formData.email, formData.password);
    
    if (!result.success) {
      // Handle specific Firebase auth errors
      if (result.error?.includes('email-already-in-use')) {
        setFormErrors({ email: 'An account with this email already exists' });
      } else if (result.error?.includes('invalid-email')) {
        setFormErrors({ email: 'Invalid email address' });
      } else if (result.error?.includes('weak-password')) {
        setFormErrors({ password: 'Password is too weak' });
      }
    }
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    try {
      await signInWithGoogle();
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const getPasswordStrength = (password: string): { score: number; text: string; color: string } => {
    if (!password) return { score: 0, text: '', color: '' };
    
    let score = 0;
    
    if (password.length >= 6) score++;
    if (password.length >= 8) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    
    if (score <= 2) return { score, text: 'Weak', color: 'text-red-600' };
    if (score <= 4) return { score, text: 'Medium', color: 'text-yellow-600' };
    return { score, text: 'Strong', color: 'text-green-600' };
  };

  const passwordStrength = getPasswordStrength(formData.password);

  return (
    <AuthLayout 
      title="Create your account"
      subtitle="Join thousands of users tracking their fitness journey"
    >
      <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
        <div className="space-y-4">
          <AuthInput
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            label="Email address"
            value={formData.email}
            onChange={handleChange}
            error={formErrors.email}
            required
          />
          
          <div>
            <AuthInput
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              label="Password"
              value={formData.password}
              onChange={handleChange}
              error={formErrors.password}
              required
            />
            {formData.password && (
              <div className="mt-1">
                <div className="flex items-center space-x-2">
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-300 ${
                        passwordStrength.score <= 2 ? 'bg-red-500' :
                        passwordStrength.score <= 4 ? 'bg-yellow-500' : 'bg-green-500'
                      }`}
                      style={{ width: `${(passwordStrength.score / 6) * 100}%` }}
                    ></div>
                  </div>
                  <span className={`text-xs ${passwordStrength.color}`}>
                    {passwordStrength.text}
                  </span>
                </div>
              </div>
            )}
          </div>
          
          <AuthInput
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            label="Confirm password"
            value={formData.confirmPassword}
            onChange={handleChange}
            error={formErrors.confirmPassword}
            required
          />
        </div>

        {error && !Object.values(formErrors).some(Boolean) && (
          <div className="rounded-md bg-red-50 p-4">
            <div className="text-sm text-red-700">{error}</div>
          </div>
        )}

        <div className="space-y-4">
          <AuthButton 
            type="submit" 
            loading={loading && !isGoogleLoading}
          >
            Create account
          </AuthButton>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-gray-50 text-gray-500">Or continue with</span>
            </div>
          </div>

          <AuthButton 
            type="button"
            variant="google"
            onClick={handleGoogleSignIn}
            loading={isGoogleLoading}
          >
            Sign up with Google
          </AuthButton>
        </div>

        <div className="text-center">
          <span className="text-sm text-gray-600">
            Already have an account?{' '}
            <Link 
              to="/login" 
              className="font-medium text-indigo-600 hover:text-indigo-500"
            >
              Sign in
            </Link>
          </span>
        </div>
      </form>
    </AuthLayout>
  );
};