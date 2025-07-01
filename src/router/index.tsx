import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { AppLayout } from '../components/layout';
import { 
  HomePage, 
  WorkoutPage, 
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
        element: <WorkoutPage />,
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