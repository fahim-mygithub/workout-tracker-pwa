import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { AuthLayout } from './AuthLayout';
import { AuthInput } from './AuthInput';
import { AuthButton } from './AuthButton';

interface FormData {
  email: string;
}

interface FormErrors {
  email?: string;
}

export const ResetPasswordForm: React.FC = () => {
  const { resetPassword, loading, error, clearError } = useAuth();
  const [formData, setFormData] = useState<FormData>({ email: '' });
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [isSuccess, setIsSuccess] = useState(false);

  const validateForm = (): boolean => {
    const errors: FormErrors = {};

    if (!formData.email) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
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
    
    // Reset success state
    if (isSuccess) {
      setIsSuccess(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const result = await resetPassword(formData.email);
    
    if (result.success) {
      setIsSuccess(true);
      setFormData({ email: '' });
    } else {
      // Handle specific Firebase auth errors
      if (result.error?.includes('user-not-found')) {
        setFormErrors({ email: 'No account found with this email address' });
      } else if (result.error?.includes('invalid-email')) {
        setFormErrors({ email: 'Invalid email address' });
      } else if (result.error?.includes('too-many-requests')) {
        setFormErrors({ email: 'Too many requests. Please try again later.' });
      }
    }
  };

  if (isSuccess) {
    return (
      <AuthLayout 
        title="Check your email"
        subtitle="We've sent password reset instructions"
      >
        <div className="mt-8 space-y-6">
          <div className="rounded-md bg-green-50 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg 
                  className="h-5 w-5 text-green-400" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" 
                  />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-green-800">
                  Email sent successfully
                </h3>
                <div className="mt-2 text-sm text-green-700">
                  <p>
                    We've sent a password reset link to <strong>{formData.email || 'your email address'}</strong>. 
                    Please check your inbox and follow the instructions to reset your password.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="text-sm text-gray-600">
              <p>Didn't receive the email?</p>
              <ul className="mt-2 list-disc list-inside space-y-1">
                <li>Check your spam or junk folder</li>
                <li>Make sure you entered the correct email address</li>
                <li>Wait a few minutes for the email to arrive</li>
              </ul>
            </div>

            <AuthButton 
              type="button"
              onClick={() => setIsSuccess(false)}
            >
              Try again
            </AuthButton>
          </div>

          <div className="text-center">
            <Link 
              to="/login" 
              className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
            >
              Back to sign in
            </Link>
          </div>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout 
      title="Reset your password"
      subtitle="Enter your email address and we'll send you a reset link"
    >
      <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
        <div>
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
        </div>

        {error && !formErrors.email && (
          <div className="rounded-md bg-red-50 p-4">
            <div className="text-sm text-red-700">{error}</div>
          </div>
        )}

        <div className="space-y-4">
          <AuthButton 
            type="submit" 
            loading={loading}
          >
            Send reset link
          </AuthButton>
        </div>

        <div className="text-center space-y-2">
          <Link 
            to="/login" 
            className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
          >
            Back to sign in
          </Link>
          <div className="text-sm text-gray-600">
            Don't have an account?{' '}
            <Link 
              to="/signup" 
              className="font-medium text-indigo-600 hover:text-indigo-500"
            >
              Sign up
            </Link>
          </div>
        </div>
      </form>
    </AuthLayout>
  );
};