import puppeteer from 'puppeteer';
import { PuppeteerTestFramework } from './test-framework';
import { navigateToWorkout } from './test-utils';

describe('Workout Progress Bar Tests', () => {
  const framework = new PuppeteerTestFramework();
  let page: puppeteer.Page;

  beforeEach(async () => {
    page = await framework.setup();
  });

  afterEach(async () => {
    await framework.cleanup();
  });

  test('Progress circles should update correctly when completing sets', async () => {
    // Navigate to workout page with a test workout
    await navigateToWorkout(page, {
      name: 'Progress Test Workout',
      exercises: [
        {
          exerciseName: 'Bench Press',
          sets: [
            { targetReps: 10, targetWeight: 135 },
            { targetReps: 10, targetWeight: 135 },
            { targetReps: 10, targetWeight: 135 }
          ]
        }
      ]
    });

    // Take initial screenshot
    await framework.takeScreenshot(page, 'progress-initial');

    // Check initial state - first set should be active
    const firstSetCircle = await page.$('.rounded-full.bg-primary');
    expect(firstSetCircle).toBeTruthy();

    // Complete first set
    await page.click('button:has-text("Complete")');
    await page.waitForTimeout(500);

    // Enter actual values in the modal
    const repsInput = await page.$('input[type="number"]');
    await repsInput?.clear();
    await repsInput?.type('10');
    
    await page.click('button:has-text("Save")');
    await page.waitForTimeout(1000);

    // Take screenshot after first set completion
    await framework.takeScreenshot(page, 'progress-after-first-set');

    // Check that first set shows completed (green checkmark)
    const completedSets = await page.$$('.bg-green-500\\/20');
    expect(completedSets.length).toBe(1);

    // Check that second set is now active
    const activeSetText = await page.$eval('.bg-primary', el => el.textContent);
    expect(activeSetText).toBe('2');

    // Complete second set
    await page.click('button:has-text("Complete")');
    await page.waitForTimeout(500);
    
    const repsInput2 = await page.$('input[type="number"]');
    await repsInput2?.clear();
    await repsInput2?.type('10');
    
    await page.click('button:has-text("Save")');
    await page.waitForTimeout(1000);

    // Take screenshot after second set completion
    await framework.takeScreenshot(page, 'progress-after-second-set');

    // Check that two sets are completed
    const completedSetsAfter = await page.$$('.bg-green-500\\/20');
    expect(completedSetsAfter.length).toBe(2);

    // Check that third set is now active
    const activeSetText2 = await page.$eval('.bg-primary', el => el.textContent);
    expect(activeSetText2).toBe('3');

    // Check console for errors
    const errors = await framework.getConsoleErrors();
    expect(errors.length).toBe(0);
  });

  test('Rest timer should start automatically after completing a set', async () => {
    // Navigate to workout page with a test workout
    await navigateToWorkout(page, {
      name: 'Rest Timer Test Workout',
      exercises: [
        {
          exerciseName: 'Squats',
          sets: [
            { targetReps: 5, targetWeight: 225 },
            { targetReps: 5, targetWeight: 225 }
          ],
          restBetweenSets: 120 // 2 minutes
        }
      ]
    });

    // Complete first set
    await page.click('button:has-text("Complete")');
    await page.waitForTimeout(500);

    const repsInput = await page.$('input[type="number"]');
    await repsInput?.clear();
    await repsInput?.type('5');
    
    await page.click('button:has-text("Save")');
    await page.waitForTimeout(1000);

    // Take screenshot showing rest timer
    await framework.takeScreenshot(page, 'rest-timer-active');

    // Check that rest timer is visible
    const restTimerElement = await page.$('text=/Rest Time/');
    expect(restTimerElement).toBeTruthy();

    // Check that timer shows 2:00 or close to it
    const timerText = await page.$eval('.text-3xl.text-orange-600', el => el.textContent);
    expect(timerText).toMatch(/1:5[0-9]|2:00/); // Allow for some time passing

    // Check skip rest button is present
    const skipButton = await page.$('button:has-text("Skip Rest")');
    expect(skipButton).toBeTruthy();

    // Test skip rest functionality
    await skipButton?.click();
    await page.waitForTimeout(500);

    // Take screenshot after skipping rest
    await framework.takeScreenshot(page, 'rest-timer-skipped');

    // Verify rest timer is no longer visible
    const restTimerAfterSkip = await page.$('text=/Rest Time/');
    expect(restTimerAfterSkip).toBeFalsy();

    // Check console for errors
    const errors = await framework.getConsoleErrors();
    expect(errors.length).toBe(0);
  });

  test('Progress bar should show correct percentage completion', async () => {
    // Navigate to workout page with multiple exercises
    await navigateToWorkout(page, {
      name: 'Multi Exercise Workout',
      exercises: [
        {
          exerciseName: 'Bench Press',
          sets: [
            { targetReps: 10, targetWeight: 135 },
            { targetReps: 10, targetWeight: 135 }
          ]
        },
        {
          exerciseName: 'Rows',
          sets: [
            { targetReps: 10, targetWeight: 100 },
            { targetReps: 10, targetWeight: 100 }
          ]
        }
      ]
    });

    // Check initial progress (0/4 sets)
    const progressText = await page.$eval('text=/Progress/', el => {
      const parent = el.parentElement;
      return parent?.querySelector('.text-lg')?.textContent;
    });
    expect(progressText).toBe('0/4 sets');

    // Complete first set
    await page.click('button:has-text("Complete")');
    await page.waitForTimeout(500);
    const repsInput = await page.$('input[type="number"]');
    await repsInput?.clear();
    await repsInput?.type('10');
    await page.click('button:has-text("Save")');
    await page.waitForTimeout(1000);

    // Skip rest timer
    const skipButton = await page.$('button:has-text("Skip Rest")');
    await skipButton?.click();
    await page.waitForTimeout(500);

    // Check progress (1/4 sets = 25%)
    const progressText2 = await page.$eval('text=/Progress/', el => {
      const parent = el.parentElement;
      return parent?.querySelector('.text-lg')?.textContent;
    });
    expect(progressText2).toBe('1/4 sets');

    // Take screenshot of progress bar
    await framework.takeScreenshot(page, 'progress-bar-25-percent');

    // Check progress bar width
    const progressBar = await page.$('.bg-blue-600.h-2');
    const progressBarStyle = await progressBar?.evaluate(el => el.getAttribute('style'));
    expect(progressBarStyle).toContain('width: 25%');

    // Check console for errors
    const errors = await framework.getConsoleErrors();
    expect(errors.length).toBe(0);
  });
});