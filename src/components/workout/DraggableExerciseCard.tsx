import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { Card, CardContent, Typography } from '../ui';
import { GripVertical, Dumbbell, Plus } from 'lucide-react';
import { cn } from '../../lib/utils';
import type { Exercise } from '../../types/exercise';

interface DraggableExerciseCardProps {
  exercise: Exercise;
  isDragging?: boolean;
  onAddClick?: () => void;
}

export const DraggableExerciseCard: React.FC<DraggableExerciseCardProps> = ({
  exercise,
  isDragging = false,
  onAddClick,
}) => {
  const { attributes, listeners, setNodeRef } = useDraggable({
    id: exercise.id,
  });

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'beginner':
      case 'easy':
        return 'text-green-600 bg-green-50';
      case 'intermediate':
      case 'medium':
        return 'text-yellow-600 bg-yellow-50';
      case 'advanced':
      case 'hard':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getMuscleGroupColor = (muscleGroup: string) => {
    const colors = [
      'text-blue-600 bg-blue-50',
      'text-purple-600 bg-purple-50',
      'text-indigo-600 bg-indigo-50',
      'text-pink-600 bg-pink-50',
      'text-teal-600 bg-teal-50',
    ];
    
    const hash = muscleGroup.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };

  return (
    <div ref={setNodeRef}>
      <Card 
        {...listeners}
        {...attributes}
        className={cn(
          'cursor-grab active:cursor-grabbing transition-all hover:shadow-md select-none',
          isDragging && 'opacity-50 shadow-lg',
          'bg-white'
        )}
      >
        <CardContent className="p-3">
          <div className="flex items-center gap-3">
            <div className="text-gray-400">
              <GripVertical className="w-4 h-4" />
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <Dumbbell className="w-4 h-4 text-gray-500 flex-shrink-0" />
                <Typography variant="body2" className="font-medium truncate">
                  {exercise.name}
                </Typography>
              </div>
              
              <div className="flex items-center gap-2 mt-1">
                <span className={cn(
                  'text-xs px-2 py-0.5 rounded-full',
                  getMuscleGroupColor(exercise.muscleGroup)
                )}>
                  {exercise.muscleGroup}
                </span>
                
                <span className={cn(
                  'text-xs px-2 py-0.5 rounded-full',
                  getDifficultyColor(exercise.difficulty)
                )}>
                  {exercise.difficulty}
                </span>
                
                {exercise.equipment && (
                  <span className="text-xs text-gray-500">
                    {exercise.equipment}
                  </span>
                )}
              </div>
            </div>
            
            {onAddClick && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onAddClick();
                }}
                onPointerDown={(e) => e.stopPropagation()}
                className="p-1.5 hover:bg-gray-100 rounded text-gray-600 hover:text-gray-800"
                title="Add to workout"
              >
                <Plus className="w-4 h-4" />
              </button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};