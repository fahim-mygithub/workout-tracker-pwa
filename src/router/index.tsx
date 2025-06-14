import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { AppLayout } from '../components/layout';
import { 
  HomePage, 
  WorkoutPage, 
  BuildPage, 
  ExercisesPage, 
  ProfilePage,
  DevPage
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
    ],
  },
]);

export const AppRouter = () => <RouterProvider router={router} />;