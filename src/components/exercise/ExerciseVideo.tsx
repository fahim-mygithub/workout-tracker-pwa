import React, { useState } from 'react';
import { Button } from '../ui/Button';
import { Typography } from '../ui/Typography';
import { Card, CardContent } from '../ui/Card';
import { cn } from '../../lib/utils';
import { Play, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';

interface ExerciseVideoProps {
  videoLinks?: string[];
  exerciseName: string;
  className?: string;
}

export const ExerciseVideo: React.FC<ExerciseVideoProps> = ({
  videoLinks = [],
  exerciseName,
  className,
}) => {
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [hasError, setHasError] = useState(false);

  const hasVideos = videoLinks.length > 0;
  const hasMultipleVideos = videoLinks.length > 1;

  const handlePreviousVideo = () => {
    setCurrentVideoIndex((prev) => (prev === 0 ? videoLinks.length - 1 : prev - 1));
    setHasError(false);
  };

  const handleNextVideo = () => {
    setCurrentVideoIndex((prev) => (prev === videoLinks.length - 1 ? 0 : prev + 1));
    setHasError(false);
  };

  const getVideoLabel = (index: number): string => {
    // Try to determine if it's front/side view from URL
    const url = videoLinks[index]?.toLowerCase() || '';
    if (url.includes('front')) return 'Front View';
    if (url.includes('side')) return 'Side View';
    if (url.includes('back')) return 'Back View';
    return `View ${index + 1}`;
  };

  if (!hasVideos) {
    return (
      <Card className={cn('bg-muted/20', className)}>
        <CardContent className="p-6">
          <div className="flex flex-col items-center justify-center text-center space-y-3">
            <AlertCircle className="w-12 h-12 text-muted-foreground" />
            <div>
              <Typography variant="body1" className="font-medium text-muted-foreground">
                Not Found In Directory
              </Typography>
              <Typography variant="body2" color="secondary" className="mt-1">
                No video available for {exerciseName}
              </Typography>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (hasError) {
    return (
      <Card className={cn('bg-orange-50 border-orange-200', className)}>
        <CardContent className="p-6">
          <div className="flex flex-col items-center justify-center text-center space-y-3">
            <AlertCircle className="w-12 h-12 text-orange-500" />
            <div>
              <Typography variant="body1" className="font-medium text-orange-900">
                Video Failed to Load
              </Typography>
              <Typography variant="body2" className="text-orange-700 mt-1">
                Check your internet connection
              </Typography>
            </div>
            {hasMultipleVideos && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleNextVideo}
                className="mt-2"
              >
                Try Another View
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn('overflow-hidden', className)}>
      <div className="relative bg-black">
        <video
          key={videoLinks[currentVideoIndex]}
          className="w-full h-full max-h-[400px] object-contain"
          autoPlay={isPlaying}
          loop
          muted
          playsInline
          onError={() => setHasError(true)}
        >
          <source src={videoLinks[currentVideoIndex]} type="video/mp4" />
          Your browser does not support the video tag.
        </video>

        {/* Video Controls Overlay */}
        {hasMultipleVideos && (
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                size="sm"
                onClick={handlePreviousVideo}
                className="text-white hover:bg-white/20"
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Previous
              </Button>
              
              <Typography variant="body2" className="text-white font-medium">
                {getVideoLabel(currentVideoIndex)} ({currentVideoIndex + 1}/{videoLinks.length})
              </Typography>

              <Button
                variant="ghost"
                size="sm"
                onClick={handleNextVideo}
                className="text-white hover:bg-white/20"
              >
                Next
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        )}

        {/* Play/Pause Button */}
        <button
          onClick={() => {
            const video = document.querySelector('video');
            if (video) {
              if (video.paused) {
                video.play();
                setIsPlaying(true);
              } else {
                video.pause();
                setIsPlaying(false);
              }
            }
          }}
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 
                     bg-black/40 text-white rounded-full p-4 opacity-0 hover:opacity-100 
                     transition-opacity duration-200"
        >
          {isPlaying ? (
            <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
              <rect x="6" y="4" width="4" height="16" />
              <rect x="14" y="4" width="4" height="16" />
            </svg>
          ) : (
            <Play className="w-8 h-8 ml-1" />
          )}
        </button>
      </div>

      {/* View Indicators */}
      {hasMultipleVideos && (
        <CardContent className="p-3 bg-muted/30">
          <div className="flex justify-center space-x-1">
            {videoLinks.map((_, index) => (
              <button
                key={index}
                onClick={() => {
                  setCurrentVideoIndex(index);
                  setHasError(false);
                }}
                className={cn(
                  'w-2 h-2 rounded-full transition-colors',
                  index === currentVideoIndex
                    ? 'bg-primary'
                    : 'bg-muted-foreground/30 hover:bg-muted-foreground/50'
                )}
                aria-label={`Switch to ${getVideoLabel(index)}`}
              />
            ))}
          </div>
        </CardContent>
      )}
    </Card>
  );
};