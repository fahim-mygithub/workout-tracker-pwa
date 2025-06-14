import { useState, useEffect } from 'react';
import { isOnline, addOfflineListener } from '../utils/pwa';

export default function OfflineIndicator() {
  const [online, setOnline] = useState(isOnline());
  const [showIndicator, setShowIndicator] = useState(false);

  useEffect(() => {
    const removeListener = addOfflineListener((isOnline) => {
      setOnline(isOnline);
      setShowIndicator(true);
      
      // Hide indicator after 3 seconds when back online
      if (isOnline) {
        setTimeout(() => setShowIndicator(false), 3000);
      }
    });

    return removeListener;
  }, []);

  if (!showIndicator) {
    return null;
  }

  return (
    <div className={`offline-indicator ${online ? 'online-indicator' : ''}`}>
      {online ? '✓ Back Online' : '⚠ Offline Mode'}
    </div>
  );
}