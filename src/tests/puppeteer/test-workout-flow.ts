import { PuppeteerTestFramework } from './framework';
import puppeteer from 'puppeteer';

async function testWorkoutFlow() {
  const framework = new PuppeteerTestFramework('Complete Workout Flow Test');
  
  try {
    const browser = await puppeteer.launch({
      executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      headless: false,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      devtools: true
    });
    
    const page = await browser.newPage();
    await page.setViewport({ width: 390, height: 844 }); // iPhone 14 Pro size
    
    // Enable console logging
    page.on('console', msg => console.log('Browser console:', msg.text()));
    page.on('pageerror', error => console.error('Page error:', error.message));
    
    // Navigate to build screen
    await page.goto('http://localhost:5175/build', { waitUntil: 'networkidle2' });
    await framework.screenshot('01-build-screen', page);
    
    // Enter a workout in text mode
    const workoutText = '3x10 bench press @ 135lbs rest 90s\n3x12 dumbbell rows @ 50lbs rest 60s';
    await page.waitForSelector('textarea', { timeout: 10000 });
    await page.type('textarea', workoutText);
    await framework.screenshot('02-workout-entered', page);
    
    // Parse the workout
    await page.keyboard.press('Enter');
    await page.waitForTimeout(1000);
    
    // Start workout
    const startButton = await page.waitForSelector('button:has-text("Start Workout")', { timeout: 5000 });
    if (startButton) {
      await startButton.click();
      await page.waitForTimeout(1000);
    }
    
    // Should navigate to workout page
    await page.waitForNavigation({ waitUntil: 'networkidle2' });
    await framework.screenshot('03-workout-page', page);
    
    // Start the workout
    const playButton = await page.waitForSelector('button:has-text("Start Workout")', { timeout: 5000 });
    if (playButton) {
      await playButton.click();
      await framework.screenshot('04-workout-started', page);
    }
    
    // Test completing multiple sets
    for (let i = 1; i <= 3; i++) {
      console.log(`Completing set ${i} of bench press`);
      
      // Get current set info before completing
      const setInfoBefore = await page.evaluate(() => {
        const header = document.querySelector('.workout-header');
        const setInfo = header?.querySelector('[class*="Set"]')?.textContent || '';
        const exerciseInfo = header?.querySelector('h5')?.textContent || '';
        return { setInfo, exerciseInfo };
      });
      console.log('Before completing:', setInfoBefore);
      
      // Complete the set
      const completeButton = await page.waitForSelector('button:has-text("Complete Set")', { timeout: 5000 });
      if (completeButton) {
        await completeButton.click();
        await page.waitForTimeout(500);
        await framework.screenshot(`05-set-${i}-completed`, page);
      }
      
      // Check if rest timer started (except for last set)
      if (i < 3) {
        const restTimerExists = await page.evaluate(() => {
          return document.querySelector('.rest-timer-display') !== null || 
                 document.querySelector('[class*="Rest Time"]') !== null;
        });
        console.log(`Rest timer active after set ${i}:`, restTimerExists);
        
        if (restTimerExists) {
          await framework.screenshot(`06-rest-timer-set-${i}`, page);
          
          // Skip rest
          const skipButton = await page.waitForSelector('button:has-text("Skip Rest")', { timeout: 5000 });
          if (skipButton) {
            await skipButton.click();
            await page.waitForTimeout(500);
          }
        }
      }
      
      // Get set info after completing
      const setInfoAfter = await page.evaluate(() => {
        const header = document.querySelector('.workout-header');
        const setInfo = header?.querySelector('[class*="Set"]')?.textContent || '';
        const exerciseInfo = header?.querySelector('h5')?.textContent || '';
        return { setInfo, exerciseInfo };
      });
      console.log('After completing:', setInfoAfter);
      
      // Verify progression
      if (i < 3 && setInfoBefore.setInfo === setInfoAfter.setInfo) {
        throw new Error(`Set did not progress from set ${i}! Still showing: ${setInfoAfter.setInfo}`);
      }
    }
    
    // After completing all bench press sets, should move to dumbbell rows
    await page.waitForTimeout(1000);
    const currentExercise = await page.evaluate(() => {
      const header = document.querySelector('.workout-header');
      return header?.querySelector('h5')?.textContent || '';
    });
    console.log('Current exercise after bench press:', currentExercise);
    
    if (!currentExercise.toLowerCase().includes('row')) {
      throw new Error('Did not progress to next exercise (dumbbell rows)');
    }
    
    await framework.screenshot('07-moved-to-next-exercise', page);
    
    await framework.logResult('Workout flow completed successfully - sets progress correctly!', true);
    
    await browser.close();
    
  } catch (error) {
    await framework.logResult(`Test failed: ${error.message}`, false);
    await framework.screenshot('error-state');
  }
}

// Run the test
testWorkoutFlow().catch(console.error);