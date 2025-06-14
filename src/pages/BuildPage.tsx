import React from 'react';
import { Container, Typography, Card, CardContent, Alert } from '../components/ui';

export const BuildPage: React.FC = () => {
  return (
    <Container maxWidth="xl" padding="lg">
      <div className="space-y-6">
        <Typography variant="h1" className="text-center">
          Build Workout
        </Typography>

        <Alert variant="info" title="Coming Soon">
          The workout builder interface is being developed. This will include:
          <ul className="mt-2 ml-4 list-disc">
            <li>Text-based workout input with live preview</li>
            <li>Natural language parsing</li>
            <li>Exercise selection and autocomplete</li>
            <li>Workout templates and saved routines</li>
          </ul>
        </Alert>

        <Card>
          <CardContent>
            <Typography variant="h4" className="mb-4">
              Text Mode Workout Builder
            </Typography>
            <Typography variant="body1" color="muted">
              Enter workouts using natural language like "5x5 Bench Press ss 3x10 Push-ups"
            </Typography>
          </CardContent>
        </Card>
      </div>
    </Container>
  );
};