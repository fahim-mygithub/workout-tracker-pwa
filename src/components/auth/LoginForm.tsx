import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { AuthLayout } from './AuthLayout';
import { AuthInput } from './AuthInput';
import { AuthButton } from './AuthButton';

interface FormData {
  email: string;
  password: string;
}

interface FormErrors {
  email?: string;
  password?: string;
}

export const LoginForm: React.FC = () => {
  const { signIn, signInWithGoogle, loading, error, clearError } = useAuth();
  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: ''
  });
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const validateForm = (): boolean => {
    const errors: FormErrors = {};

    if (!formData.email) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }

    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
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

    const result = await signIn(formData.email, formData.password);
    
    if (!result.success) {
      // Handle specific Firebase auth errors
      if (result.error?.includes('user-not-found')) {
        setFormErrors({ email: 'No account found with this email address' });
      } else if (result.error?.includes('wrong-password')) {
        setFormErrors({ password: 'Incorrect password' });
      } else if (result.error?.includes('invalid-email')) {
        setFormErrors({ email: 'Invalid email address' });
      } else if (result.error?.includes('too-many-requests')) {
        setFormErrors({ password: 'Too many failed attempts. Please try again later.' });
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

  return (
    <AuthLayout 
      title="Sign in to your account"
      subtitle="Or start your workout tracking journey"
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
          
          <AuthInput
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            label="Password"
            value={formData.password}
            onChange={handleChange}
            error={formErrors.password}
            required
          />
        </div>

        {error && !formErrors.email && !formErrors.password && (
          <div className="rounded-md bg-red-50 p-4">
            <div className="text-sm text-red-700">{error}</div>
          </div>
        )}

        <div className="text-right">
          <Link 
            to="/reset-password" 
            className="text-sm font-medium text-primary-600 hover:text-primary-500"
          >
            Forgot your password?
          </Link>
        </div>

        <div className="space-y-4">
          <AuthButton 
            type="submit" 
            loading={loading && !isGoogleLoading}
          >
            Sign in
          </AuthButton>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Or continue with</span>
            </div>
          </div>

          <AuthButton 
            type="button"
            variant="google"
            onClick={handleGoogleSignIn}
            loading={isGoogleLoading}
          >
            Sign in with Google
          </AuthButton>
        </div>

        <div className="text-center">
          <span className="text-sm text-gray-600">
            Don't have an account?{' '}
            <Link 
              to="/signup" 
              className="font-medium text-primary-600 hover:text-primary-500"
            >
              Sign up
            </Link>
          </span>
        </div>
      </form>
    </AuthLayout>
  );
};