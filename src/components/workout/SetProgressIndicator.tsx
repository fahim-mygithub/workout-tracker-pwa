import React from 'react';
import { cn } from '../../lib/utils';
import type { WorkoutSet } from '../../store/slices/workoutSlice';
import { Check } from 'lucide-react';

export interface SetProgressIndicatorProps {
  sets: WorkoutSet[];
  currentSetIndex?: number;
  className?: string;
}

export const SetProgressIndicator: React.FC<SetProgressIndicatorProps> = ({
  sets,
  currentSetIndex,
  className,
}) => {
  const getSetStatus = (set: WorkoutSet): 'pending' | 'completed' | 'partial' | 'failed' => {
    if (!set.completed) return 'pending';
    
    const targetReps = set.reps || 0;
    const actualReps = set.actualReps || 0;
    
    if (actualReps >= targetReps) return 'completed';
    if (actualReps >= targetReps * 0.5) return 'partial';
    return 'failed';
  };

  const getSetColor = (status: string, isActive: boolean) => {
    if (isActive) return 'bg-primary border-primary text-primary-foreground';
    
    switch (status) {
      case 'completed':
        return 'bg-green-500 border-green-500 text-white';
      case 'partial':
        return 'bg-yellow-500 border-yellow-500 text-white';
      case 'failed':
        return 'bg-red-500 border-red-500 text-white';
      default:
        return 'bg-white border-gray-300 text-gray-600';
    }
  };

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {sets.map((set, index) => {
        const status = getSetStatus(set);
        const isActive = currentSetIndex === index && !set.completed;
        const isLast = index === sets.length - 1;

        return (
          <React.Fragment key={set.id}>
            {/* Set Circle */}
            <div
              className={cn(
                'relative flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-300',
                getSetColor(status, isActive),
                {
                  'scale-110 shadow-lg': isActive,
                  'animate-pulse': isActive,
                }
              )}
            >
              {status === 'completed' ? (
                <Check className="w-5 h-5" />
              ) : status === 'partial' || status === 'failed' ? (
                <span className="text-sm font-bold">
                  {set.actualReps}
                </span>
              ) : (
                <span className="text-sm font-bold">
                  {set.reps}
                </span>
              )}
              
              {/* Active indicator dot */}
              {isActive && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full animate-ping" />
              )}
            </div>

            {/* Connecting Line */}
            {!isLast && (
              <div
                className={cn(
                  'flex-1 h-0.5 transition-all duration-500',
                  {
                    'bg-green-500': sets[index + 1].completed,
                    'bg-gray-300': !sets[index + 1].completed,
                  }
                )}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};