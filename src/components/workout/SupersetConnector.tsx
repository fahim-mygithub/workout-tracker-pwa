import React from 'react';
import { cn } from '../../lib/utils';

interface SupersetConnectorProps {
  exerciseCount: number;
  label?: string;
  className?: string;
}

export const SupersetConnector: React.FC<SupersetConnectorProps> = ({
  exerciseCount,
  label = 'SUPERSET',
  className
}) => {
  return (
    <div className={cn(
      'absolute left-0 top-0 h-full flex items-center pointer-events-none',
      className
    )}>
      {/* Left bracket/connector */}
      <div className="relative h-full flex items-center">
        {/* Vertical line */}
        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-blue-500" />
        
        {/* Top cap */}
        <div className="absolute left-4 top-0 w-3 h-0.5 bg-blue-500" />
        
        {/* Bottom cap */}
        <div className="absolute left-4 bottom-0 w-3 h-0.5 bg-blue-500" />
        
        {/* Middle label */}
        <div className="absolute left-8 top-1/2 -translate-y-1/2 -rotate-90 origin-center">
          <div className="bg-blue-500 text-white text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap">
            {label}
          </div>
        </div>
      </div>
    </div>
  );
};

export const SupersetBracket: React.FC<{ position: 'top' | 'middle' | 'bottom' }> = ({ position }) => {
  return (
    <div className={cn(
      'absolute left-0 w-8 flex items-center justify-center',
      position === 'top' && 'top-0 h-1/2',
      position === 'middle' && 'top-0 h-full',
      position === 'bottom' && 'bottom-0 h-1/2'
    )}>
      <svg
        viewBox="0 0 24 100"
        className="w-6 h-full"
        preserveAspectRatio="none"
      >
        <path
          d={position === 'top' 
            ? 'M 20 100 L 20 10 Q 20 0 10 0 L 0 0'
            : position === 'bottom'
            ? 'M 20 0 L 20 90 Q 20 100 10 100 L 0 100'
            : 'M 20 0 L 20 100'
          }
          fill="none"
          stroke="#3B82F6"
          strokeWidth="3"
        />
      </svg>
    </div>
  );
};