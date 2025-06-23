import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { cn } from '../../lib/utils';

interface NavItem {
  path: string;
  label: string;
  icon: React.ReactNode;
  activeIcon?: React.ReactNode;
}

export interface MobileBottomNavProps {
  className?: string;
}

const navItems: NavItem[] = [
  {
    path: '/',
    label: 'Home',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
    activeIcon: (
      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
        <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
      </svg>
    )
  },
  {
    path: '/workout',
    label: 'Workout',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
    activeIcon: (
      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
        <path d="M11 21h-1l1-7H7.5c-.58 0-.57-.32-.38-.66.19-.34.05-.08.07-.12C8.48 10.94 10.42 7.54 13 3h1l-1 7h3.5c.49 0 .56.33.47.51l-.07.15C12.96 17.55 11 21 11 21z" />
      </svg>
    )
  },
  {
    path: '/build',
    label: 'Build',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
      </svg>
    ),
    activeIcon: (
      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
        <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
      </svg>
    )
  },
  {
    path: '/exercises',
    label: 'Exercises',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
      </svg>
    ),
    activeIcon: (
      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
        <path d="M20.57 14.86L22 13.43 20.57 12 17 15.57 8.43 7 12 3.43 10.57 2 9.14 3.43 7.71 2 5.57 4.14 4.14 2.71 2.71 4.14l1.43 1.43L2 7.71l1.43 1.43L2 10.57 3.43 12 7 8.43 15.57 17 12 20.57 13.43 22l1.43-1.43L16.29 22l2.14-2.14 1.43 1.43 1.43-1.43-1.43-1.43L22 16.29z" />
      </svg>
    )
  },
  {
    path: '/profile',
    label: 'Profile',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
    activeIcon: (
      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" />
      </svg>
    )
  }
];

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({ className }) => {
  const location = useLocation();

  return (
    <nav 
      className={cn(
        'fixed bottom-0 left-0 right-0 z-50',
        'bg-background border-t border-border',
        'h-[calc(4.5rem+env(safe-area-inset-bottom))]',
        'pb-[env(safe-area-inset-bottom)]',
        'shadow-lg',
        className
      )}
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="h-full flex items-center justify-around px-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={cn(
                'flex flex-col items-center justify-center',
                'relative group',
                'min-w-[4rem] h-full px-3 py-2',
                'transition-all duration-200 ease-out',
                'touch-manipulation',
                '-webkit-tap-highlight-color-transparent',
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )}
              aria-label={item.label}
              aria-current={isActive ? 'page' : undefined}
            >
              {/* Active indicator */}
              <div 
                className={cn(
                  'absolute top-0 left-1/2 -translate-x-1/2',
                  'h-0.5 bg-primary rounded-full',
                  'transition-all duration-300 ease-out',
                  isActive ? 'w-12' : 'w-0'
                )}
              />
              
              {/* Icon container with touch feedback */}
              <div className={cn(
                'relative flex items-center justify-center',
                'w-12 h-12 rounded-full',
                'transition-all duration-200',
                'group-active:scale-90',
                isActive && 'bg-primary/10'
              )}>
                <div className={cn(
                  'transition-all duration-200',
                  isActive ? 'scale-110' : 'scale-100'
                )}>
                  {isActive && item.activeIcon ? item.activeIcon : item.icon}
                </div>
              </div>
              
              {/* Label */}
              <span className={cn(
                'text-[0.625rem] font-medium mt-1',
                'transition-all duration-200',
                isActive ? 'opacity-100' : 'opacity-70'
              )}>
                {item.label}
              </span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};