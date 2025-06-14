import React from 'react';
import { Container, Typography } from '../components/ui';
import { UIComponentDemo } from '../components/ui/UIComponentDemo';

export const DevPage: React.FC = () => {
  return (
    <Container maxWidth="xl" padding="lg">
      <div className="space-y-6">
        <Typography variant="h1" className="text-center">
          Development Components
        </Typography>
        
        <UIComponentDemo />
      </div>
    </Container>
  );
};