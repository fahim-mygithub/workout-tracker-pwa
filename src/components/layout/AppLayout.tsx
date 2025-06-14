import React from 'react';
import { Outlet } from 'react-router-dom';
import { BottomNavigation } from '../navigation/BottomNavigation';
import PWAInstallPrompt from '../PWAInstallPrompt';
import OfflineIndicator from '../OfflineIndicator';

export const AppLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Main Content Area */}
      <main className="flex-1 pb-20 overflow-auto">
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