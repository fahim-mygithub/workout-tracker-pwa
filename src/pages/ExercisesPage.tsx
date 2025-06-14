import React from 'react';
import { Container, Typography, Card, CardContent, Alert } from '../components/ui';

export const ExercisesPage: React.FC = () => {
  return (
    <Container maxWidth="xl" padding="lg">
      <div className="space-y-6">
        <Typography variant="h1" className="text-center">
          Exercise Directory
        </Typography>

        <Alert variant="info" title="Coming Soon">
          The exercise directory interface is being developed. This will include:
          <ul className="mt-2 ml-4 list-disc">
            <li>Searchable exercise database</li>
            <li>Exercise details and instructions</li>
            <li>Muscle group filtering</li>
            <li>Exercise videos and images</li>
          </ul>
        </Alert>

        <Card>
          <CardContent>
            <Typography variant="h4" className="mb-4">
              Exercise Database
            </Typography>
            <Typography variant="body1" color="muted">
              Browse and search through thousands of exercises
            </Typography>
          </CardContent>
        </Card>
      </div>
    </Container>
  );
};