import React, { useRef, useEffect } from 'react';
import { ExerciseItem } from './ExerciseItem';
import type { WorkoutExercise } from '../../store/slices/workoutSlice';
import { cn } from '../../lib/utils';

export interface ExerciseListProps {
  exercises: WorkoutExercise[];
  currentExerciseIndex: number;
  currentSetIndex: number;
  onExerciseClick?: (index: number) => void;
}

export const ExerciseList: React.FC<ExerciseListProps> = ({
  exercises,
  currentExerciseIndex,
  currentSetIndex,
  onExerciseClick,
}) => {
  const listRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Scroll to current exercise when it changes
  useEffect(() => {
    const currentItem = itemRefs.current[currentExerciseIndex];
    if (currentItem && listRef.current) {
      const listRect = listRef.current.getBoundingClientRect();
      const itemRect = currentItem.getBoundingClientRect();
      
      // Check if item is not fully visible
      if (itemRect.top < listRect.top || itemRect.bottom > listRect.bottom) {
        currentItem.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
      }
    }
  }, [currentExerciseIndex]);

  const getExerciseState = (index: number): 'pending' | 'active' | 'completed' => {
    const exercise = exercises[index];
    if (exercise.completed || exercise.sets.every(set => set.completed)) {
      return 'completed';
    }
    if (index === currentExerciseIndex) {
      return 'active';
    }
    return 'pending';
  };

  return (
    <div
      ref={listRef}
      className="h-full overflow-y-auto overflow-x-hidden px-4 py-4 space-y-4 scrollbar-thin scrollbar-thumb-primary/20 scrollbar-track-transparent"
      style={{
        scrollBehavior: 'smooth',
        WebkitOverflowScrolling: 'touch',
      }}
    >
      {exercises.map((exercise, index) => (
        <div
          key={exercise.id}
          ref={(el) => (itemRefs.current[index] = el)}
          className={cn(
            "transition-all duration-300",
            {
              "scale-[0.98] opacity-50": getExerciseState(index) === 'pending' && index !== currentExerciseIndex,
              "scale-100 opacity-100": getExerciseState(index) === 'active',
              "scale-[0.98] opacity-70": getExerciseState(index) === 'completed',
            }
          )}
        >
          <ExerciseItem
            exercise={exercise}
            exerciseIndex={index}
            state={getExerciseState(index)}
            isCurrentExercise={index === currentExerciseIndex}
            currentSetIndex={index === currentExerciseIndex ? currentSetIndex : undefined}
            onClick={() => onExerciseClick?.(index)}
          />
        </div>
      ))}
      
      {/* Bottom padding for safe area and controls */}
      <div className="h-32" />
    </div>
  );
};