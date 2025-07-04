import React from 'react';
import { Card, CardContent, Typography, Button } from '../ui';
import { PlayCircle, Info, Plus, Play } from 'lucide-react';
import type { Exercise } from '../../types/exercise';

interface ExerciseDirectoryCardProps {
  exercise: Exercise;
  onViewDetails: (exercise: Exercise) => void;
  onAddToWorkout: (exercise: Exercise) => void;
  onFilterByMuscleGroup?: (muscleGroup: string) => void;
  onFilterByDifficulty?: (difficulty: string) => void;
  isCompact?: boolean;
}

export const ExerciseDirectoryCard: React.FC<ExerciseDirectoryCardProps> = ({
  exercise,
  onViewDetails,
  onAddToWorkout,
  onFilterByMuscleGroup,
  onFilterByDifficulty,
  isCompact = false,
}) => {
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

  if (isCompact) {
    return (
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <Typography 
                variant="h6" 
                className="truncate cursor-pointer hover:text-blue-600 transition-colors"
                onClick={() => onViewDetails(exercise)}
              >
                {exercise.name}
              </Typography>
              <div className="flex items-center gap-2 mt-1">
                <span 
                  className={`text-xs px-2 py-1 rounded-full cursor-pointer hover:opacity-80 transition-opacity ${getMuscleGroupColor(exercise.muscleGroup)}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onFilterByMuscleGroup?.(exercise.muscleGroup);
                  }}
                >
                  {exercise.muscleGroup}
                </span>
                <span className="text-xs text-gray-500">
                  {exercise.equipment}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1 ml-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onViewDetails(exercise)}
                className="p-2"
              >
                <Info className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onAddToWorkout(exercise)}
                className="p-2"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="hover:shadow-lg transition-shadow group">
      <CardContent className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <Typography 
              variant="h5" 
              className="group-hover:text-blue-600 transition-colors cursor-pointer"
              onClick={() => onViewDetails(exercise)}
            >
              {exercise.name}
            </Typography>
            
            {/* Tags */}
            <div className="flex flex-wrap gap-2 mt-2">
              <span 
                className={`text-sm px-3 py-1 rounded-full font-medium cursor-pointer hover:opacity-80 transition-opacity ${getMuscleGroupColor(exercise.muscleGroup)}`}
                onClick={(e) => {
                  e.stopPropagation();
                  onFilterByMuscleGroup?.(exercise.muscleGroup);
                }}
              >
                {exercise.muscleGroup}
              </span>
              
              <span 
                className={`text-sm px-3 py-1 rounded-full font-medium cursor-pointer hover:opacity-80 transition-opacity ${getDifficultyColor(exercise.difficulty)}`}
                onClick={(e) => {
                  e.stopPropagation();
                  onFilterByDifficulty?.(exercise.difficulty);
                }}
              >
                {exercise.difficulty}
              </span>
            </div>
          </div>

          {/* Video indicator */}
          {exercise.videoLinks.length > 0 && (
            <div className="flex-shrink-0 ml-4">
              <div 
                className="flex items-center gap-1 text-blue-600 bg-blue-50 px-2 py-1 rounded cursor-pointer hover:bg-blue-100 transition-colors"
                onClick={() => onViewDetails(exercise)}
              >
                <PlayCircle className="w-4 h-4" />
                <span className="text-xs font-medium">Video</span>
              </div>
            </div>
          )}
        </div>

        {/* Main content area with video thumbnail */}
        <div className="flex gap-4 mb-4">
          {/* Left content */}
          <div className="flex-1">
            {/* Equipment and mechanics */}
            <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
              <div>
                <Typography variant="body2" color="muted" className="font-medium mb-1">
                  Equipment
                </Typography>
                <Typography variant="body2">
                  {exercise.equipment}
                </Typography>
              </div>
              
              {exercise.mechanic && (
                <div>
                  <Typography variant="body2" color="muted" className="font-medium mb-1">
                    Type
                  </Typography>
                  <Typography variant="body2">
                    {exercise.mechanic}
                  </Typography>
                </div>
              )}
            </div>

            {/* Instructions preview */}
            {exercise.instructions.length > 0 && (
              <div className="cursor-pointer" onClick={() => onViewDetails(exercise)}>
                <Typography variant="body2" color="muted" className="font-medium mb-1">
                  Instructions
                </Typography>
                <Typography variant="body2" className="line-clamp-2 hover:text-blue-600 transition-colors">
                  {exercise.instructions[0]}
                </Typography>
              </div>
            )}
          </div>

          {/* Video thumbnail */}
          {exercise.videoLinks.length > 0 && (
            <div className="flex-shrink-0">
              <div 
                className="w-32 h-20 bg-gray-900 rounded-lg overflow-hidden relative cursor-pointer group shadow-md"
                onClick={() => onViewDetails(exercise)}
              >
                <video
                  className="w-full h-full object-cover"
                  preload="metadata"
                  muted
                  poster=""
                >
                  <source src={exercise.videoLinks[0]} type="video/mp4" />
                </video>
                
                {/* Overlay */}
                <div className="absolute inset-0 bg-black bg-opacity-20 group-hover:bg-opacity-10 transition-all duration-200 flex items-center justify-center">
                  <div className="text-center text-white">
                    <Play className="w-6 h-6 opacity-80" />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onViewDetails(exercise)}
            className="flex items-center gap-2"
          >
            <Info className="w-4 h-4" />
            View Details
          </Button>
          
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onAddToWorkout(exercise)}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add to Workout
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};