import { PuppeteerTestFramework } from './framework';

async function testSetProgression() {
  const framework = new PuppeteerTestFramework('Set Progression Test');
  
  try {
    const page = await framework.setup();
    
    // Navigate to workout page v2
    await page.goto('http://localhost:5175/workout-v2', { waitUntil: 'networkidle2' });
    await page.waitForSelector('.start-workout-button', { timeout: 10000 });
    
    // Take screenshot of initial state
    await framework.screenshot('01-initial-state');
    
    // Click start workout
    await page.click('.start-workout-button');
    await page.waitForTimeout(1000);
    
    // Get initial set info
    const initialSetInfo = await page.evaluate(() => {
      const setElement = document.querySelector('.current-set-info');
      return setElement?.textContent || '';
    });
    console.log('Initial set:', initialSetInfo);
    
    // Complete first set
    await page.click('.complete-set-button');
    await page.waitForTimeout(1000);
    await framework.screenshot('02-after-first-set');
    
    // Check if we're in rest timer state
    const isResting = await page.evaluate(() => {
      return document.querySelector('.rest-timer-display') !== null;
    });
    console.log('Is resting:', isResting);
    
    // Skip rest if in rest timer
    if (isResting) {
      await page.click('.skip-rest-button');
      await page.waitForTimeout(1000);
    }
    
    // Get current set info after completion
    const currentSetInfo = await page.evaluate(() => {
      const setElement = document.querySelector('.current-set-info');
      return setElement?.textContent || '';
    });
    console.log('Current set after completion:', currentSetInfo);
    
    // Take screenshot showing current state
    await framework.screenshot('03-current-state');
    
    // Verify that we've moved to the next set
    if (initialSetInfo === currentSetInfo) {
      throw new Error('Set did not progress! Still on the same set.');
    }
    
    await framework.logResult('Set progression works correctly', true);
    
  } catch (error) {
    await framework.logResult(`Test failed: ${error.message}`, false);
    await framework.screenshot('error-state');
  } finally {
    await framework.cleanup();
  }
}

// Run the test
testSetProgression().catch(console.error);