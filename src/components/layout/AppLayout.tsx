import React from 'react';
import { Outlet } from 'react-router-dom';
import { BottomNavigation } from '../navigation/BottomNavigation';
import PWAInstallPrompt from '../PWAInstallPrompt';
import OfflineIndicator from '../OfflineIndicator';
import { cn } from '../../lib/utils';

export const AppLayout: React.FC = () => {
  return (
    <div className={cn(
      'min-h-screen bg-background text-foreground',
      'flex flex-col',
      'antialiased'
    )}>
      {/* Main Content Area */}
      <main className={cn(
        'flex-1',
        'pb-24', // Increased padding for bottom navigation
        'overflow-auto',
        'relative'
      )}>
        <Outlet />
      </main>

      {/* Bottom Navigation */}
      <BottomNavigation />

      {/* PWA Components */}
      <PWAInstallPrompt />
      <OfflineIndicator />
    </div>
  );
};