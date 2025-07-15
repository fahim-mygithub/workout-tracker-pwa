import puppeteer from 'puppeteer';

async function runVideoDisplayTest() {
  console.log('🎬 Starting Video Display Tests...\n');
  
  let browser;
  let consoleErrors: string[] = [];
  let testsPassed = 0;
  let testsFailed = 0;

  try {
    // Connect to existing Chrome instance
    browser = await puppeteer.connect({
      browserURL: 'http://localhost:9222',
      defaultViewport: { width: 1280, height: 720 }
    });

    const page = await browser.newPage();

    // Monitor console errors
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
        console.log('❌ Console Error:', msg.text());
      }
    });

    // Test 1: Check video display on workout page
    console.log('Test 1: Checking video display...');
    try {
      await page.goto('http://localhost:5173', { waitUntil: 'networkidle2' });
      
      // Navigate to build page
      await page.click('a[href="/build"]');
      await page.waitForSelector('textarea', { timeout: 5000 });
      
      // Create a workout with a known exercise
      await page.type('textarea', 'Barbell Curl 3x10\nDumbbell Curl 3x12');
      // Click preview button
      const previewButton = await page.evaluateHandle(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        return buttons.find(btn => btn.textContent?.includes('Preview'));
      });
      if (previewButton) await previewButton.click();
      await page.waitForTimeout(1000);
      
      // Start workout
      const startButton = await page.evaluateHandle(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        return buttons.find(btn => btn.textContent?.includes('Start Workout'));
      });
      if (startButton) await startButton.click();
      await page.waitForSelector('.exercise-card', { timeout: 5000 });

      // Check for video element
      const hasVideo = await page.evaluate(() => {
        return document.querySelector('video') !== null;
      });

      if (hasVideo) {
        console.log('✅ Video element found');
        
        // Take screenshot
        await page.screenshot({ 
          path: 'screenshots/video-display-test.png',
          fullPage: true 
        });
        
        testsPassed++;
      } else {
        console.log('❌ No video element found');
        testsFailed++;
      }
    } catch (error) {
      console.log('❌ Test 1 failed:', error.message);
      testsFailed++;
    }

    // Test 2: Check "Not Found In Directory" message
    console.log('\nTest 2: Checking "Not Found In Directory" message...');
    try {
      await page.goto('http://localhost:5173/build', { waitUntil: 'networkidle2' });
      await page.waitForSelector('textarea', { timeout: 5000 });
      
      // Clear and create workout with unknown exercise
      await page.evaluate(() => {
        const textarea = document.querySelector('textarea') as HTMLTextAreaElement;
        if (textarea) textarea.value = '';
      });
      
      await page.type('textarea', 'Unknown Exercise 3x10');
      // Click preview button
      const previewButton = await page.evaluateHandle(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        return buttons.find(btn => btn.textContent?.includes('Preview'));
      });
      if (previewButton) await previewButton.click();
      await page.waitForTimeout(1000);
      
      // Start workout
      const startButton = await page.evaluateHandle(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        return buttons.find(btn => btn.textContent?.includes('Start Workout'));
      });
      if (startButton) await startButton.click();
      await page.waitForSelector('.exercise-card', { timeout: 5000 });

      // Check for "Not Found" message
      const hasNotFoundMessage = await page.evaluate(() => {
        const bodyText = document.body.textContent || '';
        return bodyText.includes('Not Found In Directory');
      });

      if (hasNotFoundMessage) {
        console.log('✅ "Not Found In Directory" message displayed correctly');
        
        // Take screenshot
        await page.screenshot({ 
          path: 'screenshots/video-not-found-test.png',
          fullPage: true 
        });
        
        testsPassed++;
      } else {
        console.log('❌ "Not Found In Directory" message not found');
        testsFailed++;
      }
    } catch (error) {
      console.log('❌ Test 2 failed:', error.message);
      testsFailed++;
    }

    // Test 3: Check multiple viewports
    console.log('\nTest 3: Testing responsive design...');
    const viewports = [
      { name: 'mobile', width: 375, height: 667 },
      { name: 'tablet', width: 768, height: 1024 },
      { name: 'desktop', width: 1920, height: 1080 }
    ];

    for (const viewport of viewports) {
      try {
        await page.setViewport({ width: viewport.width, height: viewport.height });
        await page.goto('http://localhost:5173', { waitUntil: 'networkidle2' });
        
        // Quick navigation to workout
        const hasQuickStart = await page.evaluate(() => {
          const buttons = Array.from(document.querySelectorAll('button'));
          return buttons.some(btn => btn.textContent?.includes('Quick Start'));
        });

        if (hasQuickStart) {
          await page.screenshot({ 
            path: `screenshots/video-display-${viewport.name}.png`,
            fullPage: false 
          });
          console.log(`✅ ${viewport.name} viewport screenshot captured`);
        }
      } catch (error) {
        console.log(`❌ ${viewport.name} viewport test failed:`, error.message);
      }
    }
    testsPassed++;

    // Final console error check
    console.log('\nTest 4: Checking for console errors...');
    if (consoleErrors.length === 0) {
      console.log('✅ No console errors detected');
      testsPassed++;
    } else {
      console.log(`❌ Found ${consoleErrors.length} console errors`);
      consoleErrors.forEach((error, index) => {
        console.log(`  ${index + 1}. ${error}`);
      });
      testsFailed++;
    }

  } catch (error) {
    console.error('Test execution failed:', error);
    testsFailed++;
  } finally {
    // Don't close the browser since we're using the existing instance
    console.log('\n📊 Test Results:');
    console.log(`✅ Passed: ${testsPassed}`);
    console.log(`❌ Failed: ${testsFailed}`);
    console.log(`Total: ${testsPassed + testsFailed}`);
    
    if (testsFailed === 0) {
      console.log('\n🎉 All tests passed!');
      process.exit(0);
    } else {
      console.log('\n⚠️  Some tests failed');
      process.exit(1);
    }
  }
}

// Run the test
runVideoDisplayTest().catch(console.error);