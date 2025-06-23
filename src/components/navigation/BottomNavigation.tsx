import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Dumbbell, Plus, List, BarChart3, User } from 'lucide-react';
import { cn } from '../../lib/utils';

interface NavItem {
  path: string;
  label: string;
  icon: React.ReactNode;
}

export interface BottomNavigationProps {
  className?: string;
}

const navItems: NavItem[] = [
  {
    path: '/',
    label: 'Home',
    icon: <Home className="w-5 h-5" strokeWidth={2} />
  },
  {
    path: '/workout',
    label: 'Workout',
    icon: <Dumbbell className="w-5 h-5" strokeWidth={2} />
  },
  {
    path: '/build',
    label: 'Build',
    icon: <Plus className="w-5 h-5" strokeWidth={2} />
  },
  {
    path: '/exercises',
    label: 'Directory',
    icon: <List className="w-5 h-5" strokeWidth={2} />
  },
  {
    path: '/profile',
    label: 'Profile',
    icon: <User className="w-5 h-5" strokeWidth={2} />
  }
];

export const BottomNavigation: React.FC<BottomNavigationProps> = ({ className }) => {
  return (
    <nav className={cn(
      'fixed bottom-0 left-0 right-0 z-50',
      'bg-black',
      'px-4 pb-safe pt-2',
      className
    )}>
      <div className="flex justify-around items-center mx-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              cn(
                'relative flex flex-col items-center justify-center',
                'px-3 py-2 rounded-xl',
                'transition-all duration-200',
                'min-w-[60px] flex-1',
                'active:scale-95',
                'group',
                isActive
                  ? 'text-white'
                  : 'text-gray-400 hover:text-gray-300'
              )
            }
          >
            {({ isActive }) => (
              <>
                <div className={cn(
                  'relative mb-1 transition-all duration-200',
                  isActive ? 'scale-110' : 'group-hover:scale-105'
                )}>
                  {item.icon}
                </div>
                <span className={cn(
                  'relative text-[10px] leading-none transition-all duration-200',
                  isActive ? 'font-medium text-white' : 'font-normal'
                )}>
                  {item.label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
};