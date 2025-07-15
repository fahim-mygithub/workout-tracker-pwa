import React, { useState, useRef, useEffect } from 'react';
import { Modal, Typography, Button, Card, CardContent } from '../ui';
import { PlayCircle, Plus, X, ExternalLink, Target, Zap, Settings, AlertCircle } from 'lucide-react';
import type { Exercise } from '../../types/exercise';

interface ExerciseDetailModalProps {
  exercise: Exercise | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToWorkout: (exercise: Exercise) => void;
}

export const ExerciseDetailModal: React.FC<ExerciseDetailModalProps> = ({
  exercise,
  isOpen,
  onClose,
  onAddToWorkout,
}) => {
  const [activeVideoIndex, setActiveVideoIndex] = useState(0);
  const [videoError, setVideoError] = useState(false);
  const [videoLoading, setVideoLoading] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Reset video states when exercise changes
  useEffect(() => {
    if (exercise?.videoLinks && exercise.videoLinks.length > 0) {
      setActiveVideoIndex(0);
      setVideoError(false);
      setVideoLoading(true);
    }
  }, [exercise?.id]);

  if (!exercise) return null;

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'beginner':
      case 'easy':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'intermediate':
      case 'medium':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'advanced':
      case 'hard':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getMuscleGroupColor = (muscleGroup: string) => {
    const colors = [
      'text-blue-600 bg-blue-50 border-blue-200',
      'text-purple-600 bg-purple-50 border-purple-200',
      'text-indigo-600 bg-indigo-50 border-indigo-200',
      'text-pink-600 bg-pink-50 border-pink-200',
      'text-teal-600 bg-teal-50 border-teal-200',
    ];
    
    const hash = muscleGroup.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };

  const handleAddToWorkout = () => {
    onAddToWorkout(exercise);
    onClose();
  };

  const handleVideoSelect = (index: number) => {
    if (index !== activeVideoIndex) {
      setActiveVideoIndex(index);
      setVideoError(false);
      setVideoLoading(true);
      
      // Reset video element
      if (videoRef.current) {
        videoRef.current.load();
      }
    }
  };

  const handleVideoLoad = () => {
    setVideoLoading(false);
    setVideoError(false);
  };

  const handleVideoError = () => {
    setVideoLoading(false);
    setVideoError(true);
  };

  const handleOpenExternalVideo = (link: string) => {
    window.open(link, '_blank', 'noopener,noreferrer');
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg" className="max-w-4xl">
      <div className="flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-gray-200">
          <div className="flex-1 min-w-0">
            <Typography variant="h3" className="mb-3">
              {exercise.name}
            </Typography>
            
            {/* Tags */}
            <div className="flex flex-wrap gap-2">
              <span className={`text-sm px-3 py-1 rounded-full font-medium border ${getMuscleGroupColor(exercise.muscleGroup)}`}>
                <Target className="w-3 h-3 inline mr-1" />
                {exercise.muscleGroup}
              </span>
              
              <span className={`text-sm px-3 py-1 rounded-full font-medium border ${getDifficultyColor(exercise.difficulty)}`}>
                <Zap className="w-3 h-3 inline mr-1" />
                {exercise.difficulty}
              </span>
              
              <span className="text-sm px-3 py-1 rounded-full font-medium text-gray-600 bg-gray-50 border border-gray-200">
                <Settings className="w-3 h-3 inline mr-1" />
                {exercise.equipment}
              </span>
            </div>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="ml-4 p-2"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-6">
            {/* Video Section */}
            {exercise.videoLinks.length > 0 && (
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-4">
                    <PlayCircle className="w-5 h-5 text-blue-600" />
                    <Typography variant="h5">Exercise Videos</Typography>
                  </div>
                  
                  <div className="space-y-4">
                    {/* Video player */}
                    <div className="aspect-video bg-gray-900 rounded-lg overflow-hidden relative">
                      {videoError ? (
                        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                          <div className="text-center">
                            <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-2" />
                            <Typography variant="body2" color="muted" className="mb-2">
                              Video failed to load
                            </Typography>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleOpenExternalVideo(exercise.videoLinks[activeVideoIndex])}
                              className="flex items-center gap-2"
                            >
                              <ExternalLink className="w-4 h-4" />
                              Open in new tab
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <>
                          {videoLoading && (
                            <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-10">
                              <div className="text-center">
                                <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-2"></div>
                                <Typography variant="body2" color="muted">
                                  Loading video...
                                </Typography>
                              </div>
                            </div>
                          )}
                          <video
                            ref={videoRef}
                            className="w-full h-full object-contain"
                            controls
                            preload="metadata"
                            onLoadedData={handleVideoLoad}
                            onError={handleVideoError}
                            onLoadStart={() => setVideoLoading(true)}
                          >
                            <source src={exercise.videoLinks[activeVideoIndex]} type="video/mp4" />
                            Your browser does not support the video tag.
                          </video>
                        </>
                      )}
                    </div>
                    
                    {/* Video selection buttons */}
                    <div className="flex flex-wrap gap-2">
                      {exercise.videoLinks.map((_link, index) => (
                        <Button
                          key={index}
                          variant="outline"
                          size="sm"
                          onClick={() => handleVideoSelect(index)}
                          className={`flex items-center gap-2 ${
                            activeVideoIndex === index 
                              ? 'bg-gray-100 border-gray-300 text-gray-900 font-medium' 
                              : 'hover:bg-gray-50'
                          }`}
                        >
                          <PlayCircle className="w-4 h-4" />
                          Video {index + 1}
                        </Button>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Exercise Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Basic Information */}
              <Card>
                <CardContent className="p-4">
                  <Typography variant="h5" className="mb-4">
                    Exercise Details
                  </Typography>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <Typography variant="body2" color="muted">
                        Primary Muscle
                      </Typography>
                      <Typography variant="body2" className="font-medium">
                        {exercise.muscleGroup}
                      </Typography>
                    </div>
                    
                    <div className="flex justify-between">
                      <Typography variant="body2" color="muted">
                        Equipment
                      </Typography>
                      <Typography variant="body2" className="font-medium">
                        {exercise.equipment}
                      </Typography>
                    </div>
                    
                    <div className="flex justify-between">
                      <Typography variant="body2" color="muted">
                        Difficulty
                      </Typography>
                      <Typography variant="body2" className="font-medium">
                        {exercise.difficulty}
                      </Typography>
                    </div>
                    
                    {exercise.force && (
                      <div className="flex justify-between">
                        <Typography variant="body2" color="muted">
                          Force Type
                        </Typography>
                        <Typography variant="body2" className="font-medium">
                          {exercise.force}
                        </Typography>
                      </div>
                    )}
                    
                    {exercise.mechanic && (
                      <div className="flex justify-between">
                        <Typography variant="body2" color="muted">
                          Mechanic
                        </Typography>
                        <Typography variant="body2" className="font-medium">
                          {exercise.mechanic}
                        </Typography>
                      </div>
                    )}
                    
                    {exercise.grips && (
                      <div className="flex justify-between">
                        <Typography variant="body2" color="muted">
                          Grip
                        </Typography>
                        <Typography variant="body2" className="font-medium">
                          {exercise.grips}
                        </Typography>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Search Keywords */}
              {exercise.searchKeywords.length > 0 && (
                <Card>
                  <CardContent className="p-4">
                    <Typography variant="h5" className="mb-4">
                      Alternative Names
                    </Typography>
                    
                    <div className="flex flex-wrap gap-2">
                      {exercise.searchKeywords.slice(0, 10).map((keyword, index) => (
                        <span
                          key={index}
                          className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded"
                        >
                          {keyword}
                        </span>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Instructions */}
            {exercise.instructions.length > 0 && (
              <Card>
                <CardContent className="p-4">
                  <Typography variant="h5" className="mb-4">
                    Instructions
                  </Typography>
                  
                  <div className="space-y-3">
                    {exercise.instructions.map((instruction, index) => (
                      <div key={index} className="flex gap-3">
                        <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                          {index + 1}
                        </div>
                        <Typography variant="body2" className="flex-1">
                          {instruction}
                        </Typography>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
          <Button
            variant="primary"
            onClick={handleAddToWorkout}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add to Workout
          </Button>
        </div>
      </div>
    </Modal>
  );
};