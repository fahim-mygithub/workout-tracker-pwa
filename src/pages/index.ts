// Desktop Components
export { HomePage as DesktopHomePage } from './HomePage';
export { WorkoutPage as DesktopWorkoutPage } from './WorkoutPage';
export { BuildPage } from './BuildPage';
export { ExercisesPage } from './ExercisesPage';
export { ProfilePage } from './ProfilePage';
export { DevPage } from './DevPage';

// Mobile Components
export { MobileHomePage } from './MobileHomePage';
export { MobileWorkoutPage } from './MobileWorkoutPage';

// Responsive Exports
import { ResponsiveComponent } from '../utils/responsive';
import { HomePage as DesktopHomePageImport } from './HomePage';
import { MobileHomePage as MobileHomePageImport } from './MobileHomePage';
import { WorkoutPage as DesktopWorkoutPageImport } from './WorkoutPage';
import { MobileWorkoutPage as MobileWorkoutPageImport } from './MobileWorkoutPage';

export const HomePage = () => ResponsiveComponent({ 
  mobile: MobileHomePageImport, 
  desktop: DesktopHomePageImport 
});

export const WorkoutPage = () => ResponsiveComponent({ 
  mobile: MobileWorkoutPageImport, 
  desktop: DesktopWorkoutPageImport 
});