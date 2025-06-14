import React from 'react';
import type { ReactNode } from 'react';
import { StoreProvider } from './StoreProvider';
import { AuthProvider } from '../contexts/AuthContext';

interface AppProvidersProps {
  children: ReactNode;
}

export const AppProviders: React.FC<AppProvidersProps> = ({ children }) => {
  return (
    <StoreProvider>
      <AuthProvider>
        {children}
      </AuthProvider>
    </StoreProvider>
  );
};