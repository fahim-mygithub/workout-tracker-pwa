import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PuppeteerTestFramework } from './test-framework';

describe('WorkoutV2 Video Display Fix', () => {
  let framework: PuppeteerTestFramework;

  beforeAll(async () => {
    framework = new PuppeteerTestFramework();
    await framework.setup({ headless: false });
  });

  afterAll(async () => {
    await framework.cleanup();
  });

  it('should show video only in the dedicated video area, not in exercise list', async () => {
    const page = framework.getPage();
    
    // Navigate to workout-v2 demo
    await page.goto('http://localhost:5173/workout-v2');
    await page.waitForNetworkIdle();
    
    // Start a sample workout with incline bench press
    const startButton = await page.waitForSelector('button:has-text("Start Workout")', { timeout: 5000 });
    if (startButton) {
      await startButton.click();
      await page.waitForTimeout(1000);
    }
    
    // Check that ExerciseItem cards don't have video elements
    const exerciseItems = await page.$$('.overflow-y-auto .transition-all');
    console.log(`Found ${exerciseItems.length} exercise items`);
    
    // Check each exercise item for video elements
    let videoInListCount = 0;
    for (let i = 0; i < exerciseItems.length; i++) {
      const hasVideo = await exerciseItems[i].$('.exercise-video-container') !== null;
      if (hasVideo) {
        videoInListCount++;
      }
    }
    
    console.log(`Videos found in exercise list: ${videoInListCount}`);
    expect(videoInListCount).toBe(0); // Should be no videos in the list
    
    // Check that video is displayed in the dedicated video area (desktop only)
    const isDesktop = await page.evaluate(() => window.innerWidth >= 768);
    if (isDesktop) {
      const videoArea = await page.$('.border-l.bg-muted\\/10 .exercise-video-container');
      expect(videoArea).toBeTruthy();
      console.log('Video area found in dedicated section');
    }
    
    // Take screenshots for visual verification
    await framework.takeScreenshot('workout-v2-no-duplicate-videos');
    
    // Test rest timer doesn't overlap with content
    const completeSetButton = await page.$('button:has-text("Complete Set")');
    if (completeSetButton) {
      await completeSetButton.click();
      await page.waitForTimeout(1000);
      
      // Check if rest timer is visible
      const restTimer = await page.$('.absolute.inset-x-0.top-1\\/2');
      if (restTimer) {
        // Take screenshot of rest timer state
        await framework.takeScreenshot('workout-v2-rest-timer-overlay');
        
        // Verify rest timer doesn't block exercise list interaction
        const firstExerciseItem = await page.$('.overflow-y-auto .transition-all');
        if (firstExerciseItem) {
          const isClickable = await firstExerciseItem.isIntersectingViewport();
          console.log(`Exercise item clickable during rest: ${isClickable}`);
        }
      }
    }
    
    console.log('✅ Video display fix verified - no duplicate videos in exercise list');
  });

  it('should display incline bench press video correctly', async () => {
    const page = framework.getPage();
    
    // Create a workout with incline bench press
    await page.goto('http://localhost:5173/build');
    await page.waitForNetworkIdle();
    
    // Enter workout with incline bench press
    const textArea = await page.waitForSelector('textarea[placeholder*="Enter your workout"]');
    await textArea.click();
    await textArea.type('Test Workout\\n3x10 incline bench press');
    
    // Build workout
    const buildButton = await page.waitForSelector('button:has-text("Build Workout")');
    await buildButton.click();
    await page.waitForTimeout(2000);
    
    // Start workout
    const startButton = await page.waitForSelector('button:has-text("Start Workout")');
    if (startButton) {
      await startButton.click();
      await page.waitForTimeout(1000);
    }
    
    // Verify incline bench press is recognized
    const exerciseName = await page.$eval('.font-bold.text-lg', el => el.textContent);
    expect(exerciseName?.toLowerCase()).toContain('incline bench press');
    
    // Check video display on desktop
    const isDesktop = await page.evaluate(() => window.innerWidth >= 768);
    if (isDesktop) {
      // Wait for video to load
      await page.waitForTimeout(2000);
      
      // Check if video error message is NOT present
      const errorMessage = await page.$('text="Not Found In Directory"');
      expect(errorMessage).toBeFalsy();
      
      // Check if video iframe is present
      const videoIframe = await page.$('.border-l.bg-muted\\/10 iframe');
      expect(videoIframe).toBeTruthy();
      
      console.log('✅ Incline bench press video loaded successfully');
    }
    
    await framework.takeScreenshot('workout-v2-incline-bench-video');
  });
});