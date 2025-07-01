import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LoginForm } from '../components/auth/LoginForm';
import { useAuth } from '../contexts/AuthContext';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  React.useEffect(() => {
    // If already logged in, redirect to home
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  return <LoginForm />;
};