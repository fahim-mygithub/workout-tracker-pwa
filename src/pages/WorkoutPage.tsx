import React from 'react';
import { Container, Typography, Card, CardContent, Alert } from '../components/ui';

export const WorkoutPage: React.FC = () => {
  return (
    <Container maxWidth="xl" padding="lg">
      <div className="space-y-6">
        <Typography variant="h1" className="text-center">
          Workout Tracker
        </Typography>

        <Alert variant="info" title="Coming Soon">
          The workout tracking interface is being developed. This will include:
          <ul className="mt-2 ml-4 list-disc">
            <li>Active workout session management</li>
            <li>Exercise card components</li>
            <li>Rest timer functionality</li>
            <li>Set and rep tracking</li>
          </ul>
        </Alert>

        <Card>
          <CardContent>
            <Typography variant="h4" className="mb-4">
              Current Workout Session
            </Typography>
            <Typography variant="body1" color="muted">
              No active workout session
            </Typography>
          </CardContent>
        </Card>
      </div>
    </Container>
  );
};