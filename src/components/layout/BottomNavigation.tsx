import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Dumbbell, Plus, List, BarChart3, Settings } from 'lucide-react';

interface NavItem {
  path: string;
  icon: React.ReactNode;
  label: string;
}

export const BottomNavigation: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems: NavItem[] = [
    {
      path: '/',
      icon: <Home className="w-6 h-6" />,
      label: 'Home'
    },
    {
      path: '/workout',
      icon: <Dumbbell className="w-6 h-6" />,
      label: 'My Workout'
    },
    {
      path: '/build',
      icon: <Plus className="w-6 h-6" />,
      label: 'Build'
    },
    {
      path: '/exercises',
      icon: <List className="w-6 h-6" />,
      label: 'Directory'
    },
    {
      path: '/stats',
      icon: <BarChart3 className="w-6 h-6" />,
      label: 'Stats'
    },
    {
      path: '/profile',
      icon: <Settings className="w-6 h-6" />,
      label: 'Settings'
    }
  ];

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50">
      {/* Background blur effect */}
      <div className="absolute inset-0 bg-white/80 backdrop-blur-lg border-t border-gray-200" />
      
      {/* Navigation content */}
      <div className="relative px-2 py-2 pb-safe">
        <nav className="flex items-center justify-around">
          {navItems.map((item) => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`
                flex flex-col items-center justify-center
                min-w-[60px] py-2 px-3 rounded-xl
                transition-all duration-200
                ${isActive(item.path) 
                  ? 'text-black' 
                  : 'text-gray-400 hover:text-gray-600'
                }
              `}
            >
              <div className={`
                ${isActive(item.path) ? 'scale-110' : 'scale-100'}
                transition-transform duration-200
              `}>
                {item.icon}
              </div>
              <span className={`
                text-[10px] mt-1 font-medium
                ${isActive(item.path) ? 'text-black' : 'text-gray-400'}
              `}>
                {item.label}
              </span>
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
};