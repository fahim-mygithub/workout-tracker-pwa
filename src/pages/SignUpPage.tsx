import React from 'react';
import { useNavigate } from 'react-router-dom';
import { SignupForm } from '../components/auth/SignupForm';
import { useAuth } from '../contexts/AuthContext';

export const SignUpPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  React.useEffect(() => {
    // If already logged in, redirect to home
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  return <SignupForm />;
};