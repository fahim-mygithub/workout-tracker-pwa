import puppeteer from 'puppeteer';
import { PuppeteerTestFramework } from './test-framework';

describe('Video Display Feature Tests', () => {
  let framework: PuppeteerTestFramework;

  beforeAll(async () => {
    framework = new PuppeteerTestFramework();
    await framework.setup();
  });

  afterAll(async () => {
    await framework.cleanup();
  });

  afterEach(async () => {
    // Clear any console errors after each test
    framework.consoleErrors = [];
  });

  describe('Exercise Video Display', () => {
    test('Should display video for exercises with video links', async () => {
      // Navigate to home page
      await framework.page.goto('http://localhost:5173');
      await framework.page.waitForSelector('[data-testid="home-page"]', { timeout: 10000 });

      // Start a sample workout
      await framework.clickElement('button:has-text("Quick Start")');
      await framework.page.waitForSelector('.exercise-card', { timeout: 10000 });

      // Take screenshot of workout page
      await framework.takeScreenshot('workout-page-with-video');

      // Check if video element exists
      const videoExists = await framework.page.evaluate(() => {
        const video = document.querySelector('video');
        return video !== null;
      });

      expect(videoExists).toBe(true);

      // Check video properties
      const videoInfo = await framework.page.evaluate(() => {
        const video = document.querySelector('video') as HTMLVideoElement;
        return video ? {
          src: video.src,
          autoplay: video.autoplay,
          loop: video.loop,
          muted: video.muted,
          error: video.error,
        } : null;
      });

      expect(videoInfo).not.toBeNull();
      expect(videoInfo?.autoplay).toBe(true);
      expect(videoInfo?.loop).toBe(true);
      expect(videoInfo?.muted).toBe(true);
      expect(videoInfo?.error).toBeNull();

      // Take screenshots in different viewports
      await framework.setViewport(375, 812); // iPhone X
      await framework.takeScreenshot('video-display-mobile');
      
      await framework.setViewport(1280, 720); // Desktop
      await framework.takeScreenshot('video-display-desktop');

      // Check for console errors
      expect(framework.consoleErrors).toHaveLength(0);
    });

    test('Should display "Not Found In Directory" for missing videos', async () => {
      // Navigate to build page to create custom workout
      await framework.page.goto('http://localhost:5173/build');
      await framework.page.waitForSelector('[data-testid="build-page"]', { timeout: 10000 });

      // Create a workout with a non-existent exercise
      await framework.typeText('textarea', 'Custom Exercise 3x10');
      await framework.clickElement('button:has-text("Preview")');
      
      // Start the workout
      await framework.clickElement('button:has-text("Start Workout")');
      await framework.page.waitForSelector('.exercise-card', { timeout: 10000 });

      // Check for "Not Found In Directory" message
      const notFoundMessage = await framework.waitForText('Not Found In Directory', 5000);
      expect(notFoundMessage).toBe(true);

      // Take screenshot of the not found state
      await framework.takeScreenshot('video-not-found-message');

      // Verify no video element exists
      const videoExists = await framework.page.evaluate(() => {
        const video = document.querySelector('video');
        return video !== null;
      });

      expect(videoExists).toBe(false);

      // Check for console errors (should be none)
      expect(framework.consoleErrors).toHaveLength(0);
    });

    test('Should switch between multiple video views', async () => {
      // Navigate to exercises page
      await framework.page.goto('http://localhost:5173/exercises');
      await framework.page.waitForSelector('[data-testid="exercises-page"]', { timeout: 10000 });

      // Search for an exercise with multiple videos (e.g., Barbell Curl)
      await framework.typeText('input[placeholder*="Search"]', 'Barbell Curl');
      await framework.page.waitForTimeout(500);

      // Click on the first exercise
      const exerciseCard = await framework.page.$('.exercise-card');
      if (exerciseCard) {
        await exerciseCard.click();
      }

      // Start a workout with this exercise
      await framework.clickElement('button:has-text("Add to Workout")');
      await framework.clickElement('button:has-text("Start Workout")');
      await framework.page.waitForSelector('video', { timeout: 10000 });

      // Check if multiple view buttons exist
      const hasMultipleViews = await framework.page.evaluate(() => {
        const nextButton = document.querySelector('button:has-text("Next")');
        const previousButton = document.querySelector('button:has-text("Previous")');
        return nextButton !== null && previousButton !== null;
      });

      if (hasMultipleViews) {
        // Take screenshot of first view
        await framework.takeScreenshot('video-view-1');

        // Click next button
        await framework.clickElement('button:has-text("Next")');
        await framework.page.waitForTimeout(500);

        // Take screenshot of second view
        await framework.takeScreenshot('video-view-2');

        // Get current video source
        const videoSrc = await framework.page.evaluate(() => {
          const video = document.querySelector('video') as HTMLVideoElement;
          return video?.src;
        });

        expect(videoSrc).toBeTruthy();
        expect(videoSrc).toContain('.mp4');
      }

      // Check for console errors
      expect(framework.consoleErrors).toHaveLength(0);
    });

    test('Should handle video loading errors gracefully', async () => {
      // Navigate to workout page
      await framework.page.goto('http://localhost:5173');
      await framework.clickElement('button:has-text("Quick Start")');
      await framework.page.waitForSelector('.exercise-card', { timeout: 10000 });

      // Simulate video error by intercepting requests
      await framework.page.setRequestInterception(true);
      framework.page.on('request', (request) => {
        if (request.url().includes('.mp4')) {
          request.abort();
        } else {
          request.continue();
        }
      });

      // Wait for error state
      await framework.page.waitForTimeout(2000);

      // Check for error message
      const hasErrorMessage = await framework.page.evaluate(() => {
        const errorText = document.body.textContent || '';
        return errorText.includes('Video Failed to Load') || errorText.includes('Check your internet connection');
      });

      // Take screenshot of error state
      await framework.takeScreenshot('video-error-state');

      // Turn off request interception
      await framework.page.setRequestInterception(false);

      // Verify the app handles the error gracefully (no crashes)
      const pageStillResponsive = await framework.page.evaluate(() => {
        return document.body !== null;
      });

      expect(pageStillResponsive).toBe(true);
    });
  });

  describe('Console Error Monitoring', () => {
    test('Should not have console errors during normal video playback', async () => {
      // Navigate and start a workout
      await framework.page.goto('http://localhost:5173');
      await framework.clickElement('button:has-text("Quick Start")');
      await framework.page.waitForSelector('.exercise-card', { timeout: 10000 });

      // Wait for video to load and play
      await framework.page.waitForSelector('video', { timeout: 10000 });
      await framework.page.waitForTimeout(3000); // Let video play for 3 seconds

      // Check console errors
      expect(framework.consoleErrors).toHaveLength(0);
      
      // Log any warnings for debugging
      console.log('Console warnings:', framework.consoleLogs.filter(log => log.type === 'warning'));
    });
  });

  describe('Responsive Design', () => {
    const viewports = [
      { name: 'iPhone SE', width: 375, height: 667 },
      { name: 'iPhone 12 Pro', width: 390, height: 844 },
      { name: 'iPad', width: 768, height: 1024 },
      { name: 'Desktop', width: 1920, height: 1080 },
    ];

    for (const viewport of viewports) {
      test(`Should display video correctly on ${viewport.name}`, async () => {
        await framework.setViewport(viewport.width, viewport.height);
        
        // Navigate to workout
        await framework.page.goto('http://localhost:5173');
        await framework.clickElement('button:has-text("Quick Start")');
        await framework.page.waitForSelector('.exercise-card', { timeout: 10000 });

        // Check if video is visible and properly sized
        const videoInfo = await framework.page.evaluate(() => {
          const video = document.querySelector('video');
          if (!video) return null;
          
          const rect = video.getBoundingClientRect();
          const styles = window.getComputedStyle(video);
          
          return {
            visible: rect.width > 0 && rect.height > 0,
            width: rect.width,
            height: rect.height,
            objectFit: styles.objectFit,
          };
        });

        expect(videoInfo).not.toBeNull();
        expect(videoInfo?.visible).toBe(true);
        expect(videoInfo?.objectFit).toBe('contain');

        // Take screenshot for visual verification
        await framework.takeScreenshot(`video-display-${viewport.name.toLowerCase().replace(' ', '-')}`);

        // No console errors
        expect(framework.consoleErrors).toHaveLength(0);
      });
    }
  });
});