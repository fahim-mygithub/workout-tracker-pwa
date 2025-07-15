import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { AppLayout } from '../components/layout';
import { 
  HomePage, 
  WorkoutRouter,
  WorkoutPageV2,
  WorkoutV2Demo,
  WorkoutLandingPage, 
  BuildPage, 
  ExercisesPage, 
  ProfilePage,
  DevPage,
  LoginPage,
  SignUpPage,
  SharedWorkoutPage
} from '../pages';

const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      {
        index: true,
        element: <HomePage />,
      },
      {
        path: 'workout',
        element: <WorkoutRouter />,
      },
      {
        path: 'workout-v2',
        element: <WorkoutPageV2 />,
      },
      {
        path: 'workout-v2-demo',
        element: <WorkoutV2Demo />,
      },
      {
        path: 'build',
        element: <BuildPage />,
      },
      {
        path: 'exercises',
        element: <ExercisesPage />,
      },
      {
        path: 'profile',
        element: <ProfilePage />,
      },
      {
        path: 'dev',
        element: <DevPage />,
      },
      {
        path: 'login',
        element: <LoginPage />,
      },
      {
        path: 'signup',
        element: <SignUpPage />,
      },
      {
        path: 'shared/:shareId',
        element: <SharedWorkoutPage />,
      },
    ],
  },
]);

export const AppRouter = () => <RouterProvider router={router} />;