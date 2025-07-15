import { PuppeteerTestFramework } from './test-framework';

describe('WorkoutPageV2 End Workout Button', () => {
  let framework: PuppeteerTestFramework;
  
  beforeAll(async () => {
    framework = new PuppeteerTestFramework();
    await framework.setup();
  });
  
  afterAll(async () => {
    await framework.cleanup();
  });
  
  beforeEach(async () => {
    await framework.resetForTest();
  });
  
  it('should navigate to home page when X button is clicked without errors', async () => {
    console.log('Starting WorkoutPageV2 end workout test...');
    
    // Navigate to WorkoutV2Demo
    await framework.navigateTo('http://localhost:5173/workout-v2-demo');
    await framework.waitForElement('[data-testid="demo-intro"]');
    
    // Take screenshot of demo page
    await framework.takeScreenshot('01-workout-v2-demo-page');
    
    // Click start demo button
    const startButton = await framework.waitForElement('[data-testid="start-demo-button"]');
    await startButton.click();
    
    // Wait for WorkoutPageV2 to load
    await framework.waitForNavigation('/workout-v2');
    await framework.waitForElement('[data-testid="workout-header"]');
    
    // Take screenshot of active workout
    await framework.takeScreenshot('02-active-workout-page');
    
    // Set up console monitoring
    const consoleLogs: string[] = [];
    framework.page.on('console', msg => {
      const text = msg.text();
      consoleLogs.push(text);
      console.log(`[Browser Console]: ${text}`);
    });
    
    // Monitor for any errors
    const errors: string[] = [];
    framework.page.on('pageerror', error => {
      errors.push(error.message);
      console.error(`[Page Error]: ${error.message}`);
    });
    
    // Click the X (end workout) button
    console.log('Clicking end workout button...');
    const endWorkoutButton = await framework.waitForElement('[data-testid="end-workout-button"]');
    await endWorkoutButton.click();
    
    // Wait for navigation to complete
    await framework.waitForNavigation('/');
    
    // Take screenshot of home page after ending workout
    await framework.takeScreenshot('03-home-page-after-end');
    
    // Verify we're on the home page
    const currentUrl = framework.page.url();
    expect(currentUrl).toBe('http://localhost:5173/');
    
    // Check console logs for our debug messages
    const endWorkoutLogs = consoleLogs.filter(log => log.includes('[WorkoutPageV2] handleEndWorkout'));
    expect(endWorkoutLogs.length).toBeGreaterThan(0);
    console.log('End workout logs:', endWorkoutLogs);
    
    // Verify no errors occurred
    expect(errors).toHaveLength(0);
    
    // Verify the workout state was cleared
    const storeState = await framework.page.evaluate(() => {
      return (window as any).__REDUX_STORE__?.getState?.()?.workout || null;
    });
    
    if (storeState) {
      expect(storeState.activeWorkout).toBeNull();
      console.log('✓ Active workout successfully cleared from Redux store');
    }
    
    console.log('✓ End workout button test completed successfully');
  });
  
  it('should handle rapid clicking of end workout button', async () => {
    console.log('Starting rapid click test...');
    
    // Navigate to WorkoutV2Demo and start workout
    await framework.navigateTo('http://localhost:5173/workout-v2-demo');
    await framework.waitForElement('[data-testid="demo-intro"]');
    
    const startButton = await framework.waitForElement('[data-testid="start-demo-button"]');
    await startButton.click();
    
    await framework.waitForNavigation('/workout-v2');
    await framework.waitForElement('[data-testid="workout-header"]');
    
    // Monitor for errors
    const errors: string[] = [];
    framework.page.on('pageerror', error => {
      errors.push(error.message);
    });
    
    // Rapidly click the end workout button multiple times
    console.log('Rapid clicking end workout button...');
    const endWorkoutButton = await framework.waitForElement('[data-testid="end-workout-button"]');
    
    // Click 3 times quickly
    await Promise.all([
      endWorkoutButton.click(),
      endWorkoutButton.click(),
      endWorkoutButton.click()
    ]);
    
    // Wait a bit for any errors to surface
    await framework.page.waitForTimeout(1000);
    
    // Verify no errors occurred
    expect(errors).toHaveLength(0);
    
    // Verify we ended up on the home page
    const currentUrl = framework.page.url();
    expect(currentUrl).toBe('http://localhost:5173/');
    
    console.log('✓ Rapid click test completed successfully');
  });
});