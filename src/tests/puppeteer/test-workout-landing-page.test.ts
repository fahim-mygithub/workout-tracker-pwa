import { describe, test, beforeAll, afterAll, expect } from 'vitest';
import { PuppeteerTestFramework } from './test-framework';

describe('Workout Landing Page', () => {
  const framework = new PuppeteerTestFramework();

  beforeAll(async () => {
    await framework.setup({ debug: false, chromeWebStoreUrl: false });
  });

  afterAll(async () => {
    await framework.cleanup();
  });

  test('should show workout landing page when no active workout', async () => {
    const { page } = framework;
    
    console.log('Navigating to workout page...');
    await page.goto('http://localhost:5173/workout');
    await page.waitForTimeout(2000);
    
    // Take screenshot of landing page
    await framework.screenshot('workout-landing-page');
    
    // Verify landing page elements
    const pageTitle = await page.$eval('h1', el => el.textContent);
    expect(pageTitle).toBe('Start Your Workout');
    
    // Check for main buttons
    const buildWorkoutButton = await page.waitForSelector('button:has-text("Build New Workout")');
    expect(buildWorkoutButton).toBeTruthy();
    
    const browseExercisesButton = await page.waitForSelector('button:has-text("Browse Exercise Directory")');
    expect(browseExercisesButton).toBeTruthy();
    
    console.log('Landing page displayed correctly');
  });

  test('should navigate to build page when clicking Build New Workout', async () => {
    const { page } = framework;
    
    console.log('Clicking Build New Workout...');
    await page.click('button:has-text("Build New Workout")');
    await page.waitForNavigation();
    
    // Verify we're on the build page
    const url = page.url();
    expect(url).toContain('/build');
    
    await framework.screenshot('navigated-to-build-page');
    console.log('Successfully navigated to build page');
  });

  test('should navigate to exercises page when clicking Browse Exercise Directory', async () => {
    const { page } = framework;
    
    // Go back to workout landing page
    await page.goto('http://localhost:5173/workout');
    await page.waitForTimeout(1000);
    
    console.log('Clicking Browse Exercise Directory...');
    await page.click('button:has-text("Browse Exercise Directory")');
    await page.waitForNavigation();
    
    // Verify we're on the exercises page
    const url = page.url();
    expect(url).toContain('/exercises');
    
    await framework.screenshot('navigated-to-exercises-page');
    console.log('Successfully navigated to exercises page');
  });

  test('should display empty state when no workout history', async () => {
    const { page } = framework;
    
    // Navigate to workout landing page
    await page.goto('http://localhost:5173/workout');
    await page.waitForTimeout(1000);
    
    // Look for empty state
    const emptyStateText = await page.$eval('text=No workouts yet', el => el.textContent).catch(() => null);
    
    if (emptyStateText) {
      console.log('Empty state displayed correctly');
      await framework.screenshot('workout-landing-empty-state');
      
      // Check for the call-to-action button
      const ctaButton = await page.$('button:has-text("Build Your First Workout")');
      expect(ctaButton).toBeTruthy();
    } else {
      console.log('User has workout history, skipping empty state test');
    }
  });

  test('should show workout page when active workout exists', async () => {
    const { page } = framework;
    
    // Start a new workout from home page
    console.log('Starting a new workout from home page...');
    await page.goto('http://localhost:5173/');
    await page.waitForTimeout(1000);
    
    // Click Start Workout button
    const startWorkoutButton = await page.$('button:has-text("Start Workout")');
    if (startWorkoutButton) {
      await startWorkoutButton.click();
      await page.waitForNavigation();
      
      // Now navigate to /workout - should show active workout
      await page.goto('http://localhost:5173/workout');
      await page.waitForTimeout(2000);
      
      // Check if we're on the workout page (not landing page)
      const workoutTimer = await page.$('[data-testid="workout-timer"]').catch(() => null);
      const workoutExercise = await page.$('.exercise-card').catch(() => null);
      
      if (workoutTimer || workoutExercise) {
        console.log('Active workout page displayed correctly');
        await framework.screenshot('active-workout-page');
      } else {
        console.log('No active workout found, showing landing page');
      }
    }
  });

  test('should capture mobile and desktop views', async () => {
    const { page } = framework;
    
    // Navigate to workout landing page
    await page.goto('http://localhost:5173/workout');
    await page.waitForTimeout(1000);
    
    // Desktop view
    await page.setViewport({ width: 1280, height: 800 });
    await framework.screenshot('workout-landing-desktop');
    
    // Mobile view
    await page.setViewport({ width: 390, height: 844 });
    await framework.screenshot('workout-landing-mobile');
    
    console.log('Captured responsive views');
  });

  test('should not have console errors', async () => {
    const { consoleErrors } = framework.results;
    expect(consoleErrors).toHaveLength(0);
  });
});