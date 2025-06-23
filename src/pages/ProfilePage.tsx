import React from 'react';
import { Container, Typography, Card, CardContent, Alert } from '../components/ui';

export const ProfilePage: React.FC = () => {
  return (
    <Container maxWidth="4xl" padding="lg">
      <div className="space-y-6">
        <Typography variant="h1" className="text-center">
          Profile & Settings
        </Typography>

        <Alert variant="info" title="Coming Soon">
          The profile and settings interface is being developed. This will include:
          <ul className="mt-2 ml-4 list-disc">
            <li>User profile management</li>
            <li>Workout statistics and analytics</li>
            <li>App preferences and settings</li>
            <li>Data export and backup options</li>
          </ul>
        </Alert>

        <Card>
          <CardContent>
            <Typography variant="h4" className="mb-4">
              User Profile
            </Typography>
            <Typography variant="body1" color="muted">
              Manage your profile and app settings
            </Typography>
          </CardContent>
        </Card>
      </div>
    </Container>
  );
};