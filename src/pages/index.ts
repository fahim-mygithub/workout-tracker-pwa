// Desktop Components
export { HomePage as DesktopHomePage } from './HomePage';
export { WorkoutPage as DesktopWorkoutPage } from './WorkoutPage';
export { BuildPage } from './BuildPage';
export { ExercisesPage } from './ExercisesPage';
export { ProfilePage as DesktopProfilePage } from './ProfilePage';
export { DevPage } from './DevPage';
export { LoginPage } from './LoginPage';
export { SignUpPage } from './SignUpPage';
export { SharedWorkoutPage } from './SharedWorkoutPage';

// Mobile Components
export { MobileHomePage } from './MobileHomePage';
export { MobileWorkoutPage } from './MobileWorkoutPage';
export { MobileProfilePage } from './MobileProfilePage';

// Responsive Exports
import { ResponsiveComponent } from '../utils/responsive';
import { HomePage as DesktopHomePageImport } from './HomePage';
import { MobileHomePage as MobileHomePageImport } from './MobileHomePage';
import { WorkoutPage as DesktopWorkoutPageImport } from './WorkoutPage';
import { MobileWorkoutPage as MobileWorkoutPageImport } from './MobileWorkoutPage';
import { ProfilePage as DesktopProfilePageImport } from './ProfilePage';
import { MobileProfilePage as MobileProfilePageImport } from './MobileProfilePage';

export const HomePage = () => ResponsiveComponent({ 
  mobile: MobileHomePageImport, 
  desktop: DesktopHomePageImport 
});

export const WorkoutPage = () => ResponsiveComponent({ 
  mobile: MobileWorkoutPageImport, 
  desktop: DesktopWorkoutPageImport 
});

export const ProfilePage = () => ResponsiveComponent({ 
  mobile: MobileProfilePageImport, 
  desktop: DesktopProfilePageImport 
});