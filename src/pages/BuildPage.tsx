import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Typography, Button, Flex } from '../components/ui';
import { TextWorkoutBuilder } from '../components/workout/TextWorkoutBuilder';
import { FileText, Shapes, Download } from 'lucide-react';

type BuildMode = 'text' | 'visual' | 'templates';

export const BuildPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeMode, setActiveMode] = useState<BuildMode>('text');

  const handleWorkoutStart = () => {
    navigate('/workout');
  };

  return (
    <Container maxWidth="xl" padding="lg">
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center">
          <Typography variant="h1" className="mb-2">
            Build Workout
          </Typography>
          <Typography variant="body1" color="secondary">
            Create your custom workout routine
          </Typography>
        </div>

        {/* Mode Selection */}
        <div className="flex justify-center">
          <Flex gap="sm" className="bg-gray-100 p-1 rounded-lg">
            <Button
              variant={activeMode === 'text' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setActiveMode('text')}
              className="px-4"
            >
              <FileText className="w-4 h-4 mr-2" />
              Text Mode
            </Button>
            <Button
              variant={activeMode === 'visual' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setActiveMode('visual')}
              className="px-4"
              disabled
            >
              <Shapes className="w-4 h-4 mr-2" />
              Visual Mode
              <span className="ml-1 text-xs opacity-60">(Soon)</span>
            </Button>
            <Button
              variant={activeMode === 'templates' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setActiveMode('templates')}
              className="px-4"
              disabled
            >
              <Download className="w-4 h-4 mr-2" />
              Templates
              <span className="ml-1 text-xs opacity-60">(Soon)</span>
            </Button>
          </Flex>
        </div>

        {/* Content */}
        {activeMode === 'text' && (
          <TextWorkoutBuilder onWorkoutStart={handleWorkoutStart} />
        )}

        {activeMode === 'visual' && (
          <div className="text-center py-12">
            <Typography variant="h4" className="mb-4">
              Visual Builder Coming Soon
            </Typography>
            <Typography variant="body1" color="secondary">
              A drag-and-drop interface for building workouts visually is in development.
            </Typography>
          </div>
        )}

        {activeMode === 'templates' && (
          <div className="text-center py-12">
            <Typography variant="h4" className="mb-4">
              Workout Templates Coming Soon
            </Typography>
            <Typography variant="body1" color="secondary">
              Pre-built workout templates for different goals and experience levels.
            </Typography>
          </div>
        )}
      </div>
    </Container>
  );
};