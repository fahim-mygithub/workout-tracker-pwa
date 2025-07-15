import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PuppeteerTestFramework } from './test-framework';

describe('Rest Timer Fix Test', () => {
  let framework: PuppeteerTestFramework;

  beforeAll(async () => {
    framework = new PuppeteerTestFramework();
    await framework.setup({ headless: false });
  });

  afterAll(async () => {
    await framework.cleanup();
  });

  it('should countdown rest timer properly', async () => {
    const page = framework.getPage();
    
    // Navigate to workout-v2 demo
    await page.goto('http://localhost:5173/workout-v2');
    await page.waitForNetworkIdle();
    
    // Start workout
    const startButton = await page.waitForSelector('button:has-text("Start Workout")', { timeout: 5000 });
    if (startButton) {
      await startButton.click();
      await page.waitForTimeout(1000);
    }
    
    // Complete a set to trigger rest timer
    const completeSetButton = await page.waitForSelector('button:has-text("Complete Set")');
    if (completeSetButton) {
      await completeSetButton.click();
      await page.waitForTimeout(500);
    }
    
    // Check if rest timer is visible
    const restTimerText = await page.$('.text-orange-800:has-text("Rest Time")');
    expect(restTimerText).toBeTruthy();
    console.log('Rest timer UI is visible');
    
    // Get initial timer value
    const initialTime = await page.$eval('.font-mono.font-bold.text-orange-600', el => el.textContent);
    console.log(`Initial rest time: ${initialTime}`);
    
    // Wait 3 seconds
    await page.waitForTimeout(3000);
    
    // Get timer value after 3 seconds
    const afterTime = await page.$eval('.font-mono.font-bold.text-orange-600', el => el.textContent);
    console.log(`Rest time after 3 seconds: ${afterTime}`);
    
    // Parse time values (format is M:SS)
    const parseTime = (timeStr: string | null) => {
      if (!timeStr) return 0;
      const [minutes, seconds] = timeStr.split(':').map(n => parseInt(n, 10));
      return minutes * 60 + seconds;
    };
    
    const initialSeconds = parseTime(initialTime);
    const afterSeconds = parseTime(afterTime);
    
    // Timer should have decreased by approximately 3 seconds
    expect(initialSeconds - afterSeconds).toBeGreaterThanOrEqual(2);
    expect(initialSeconds - afterSeconds).toBeLessThanOrEqual(4);
    
    console.log(`✅ Rest timer decreased by ${initialSeconds - afterSeconds} seconds`);
    
    // Test skip rest functionality
    const skipButton = await page.$('button:has-text("Skip Rest")');
    if (skipButton) {
      await skipButton.click();
      await page.waitForTimeout(500);
      
      // Rest timer should no longer be visible
      const restTimerGone = await page.$('.text-orange-800:has-text("Rest Time")');
      expect(restTimerGone).toBeFalsy();
      console.log('✅ Skip rest button works correctly');
    }
    
    await framework.takeScreenshot('rest-timer-working');
  });
});