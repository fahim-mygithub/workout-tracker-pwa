import React from 'react';
import { Container, Typography } from '../components/ui';
import { UIComponentDemo } from '../components/ui/UIComponentDemo';
import { ExerciseCardDemo } from '../components/exercise';
import { RestTimerDemo } from '../components/timer';

export const DevPage: React.FC = () => {
  return (
    <Container maxWidth="xl" padding="lg">
      <div className="space-y-8">
        <Typography variant="h1" className="text-center">
          Development Components
        </Typography>
        
        <RestTimerDemo />
        
        <div className="mt-12">
          <ExerciseCardDemo />
        </div>
        
        <div className="mt-12">
          <UIComponentDemo />
        </div>
      </div>
    </Container>
  );
};