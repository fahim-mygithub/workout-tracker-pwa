import React, { useState, useEffect } from 'react';

// Hook to detect if we're on a mobile device
export const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return isMobile;
};

// Responsive component wrapper
interface ResponsiveComponentProps {
  mobile: React.ComponentType;
  desktop: React.ComponentType;
}

export const ResponsiveComponent: React.FC<ResponsiveComponentProps> = ({ mobile: Mobile, desktop: Desktop }) => {
  const isMobile = useIsMobile();
  
  return isMobile ? <Mobile /> : <Desktop />;
};