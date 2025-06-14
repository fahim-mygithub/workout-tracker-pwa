import React from 'react';
import { Container, Typography, Card, CardContent, Flex, Button } from '../components/ui';
import StateDemo from '../components/state/StateDemo';

export const HomePage: React.FC = () => {
  return (
    <Container maxWidth="xl" padding="lg">
      <div className="space-y-6">
        <div className="text-center">
          <Typography variant="h1" className="mb-2">
            Workout Tracker
          </Typography>
          <Typography variant="body1" color="secondary" className="mb-4">
            Your Progressive Web App for Smart Workout Tracking
          </Typography>
          <Typography variant="body2" color="muted">
            Create workouts with natural language like "5x5 Bench ss 3x10 pushups"
          </Typography>
        </div>

        <Card>
          <CardContent>
            <Flex direction="col" gap="md" align="center">
              <Typography variant="h4" className="text-center">
                Quick Actions
              </Typography>
              <Flex gap="md" justify="center" wrap>
                <Button variant="primary" size="lg">
                  Start Workout
                </Button>
                <Button variant="outline" size="lg">
                  Build Workout
                </Button>
              </Flex>
            </Flex>
          </CardContent>
        </Card>

        <StateDemo />
      </div>
    </Container>
  );
};