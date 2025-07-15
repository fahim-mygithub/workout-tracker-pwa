import puppeteer from 'puppeteer';

async function testVideoDisplay() {
  console.log('🎬 Testing Video Display Feature\n');
  
  let browser;
  const results = {
    passed: 0,
    failed: 0,
    consoleErrors: [] as string[]
  };

  try {
    // Connect to existing Chrome
    browser = await puppeteer.connect({
      browserURL: 'http://localhost:9222',
      defaultViewport: { width: 1280, height: 720 }
    });

    const page = await browser.newPage();
    
    // Filter out expected errors
    page.on('console', (msg) => {
      const text = msg.text();
      if (msg.type() === 'error' && 
          !text.includes('icon from the Manifest') && 
          !text.includes('favicon.ico')) {
        results.consoleErrors.push(text);
        console.log('❌ Console Error:', text);
      }
    });

    // Test 1: Navigate to build page and create workout
    console.log('Test 1: Creating workout with video exercises...');
    try {
      await page.goto('http://localhost:5173/build', { waitUntil: 'networkidle2' });
      
      // Wait for page to load
      await page.waitForSelector('textarea', { timeout: 5000 });
      
      // Type workout with exercises from CSV
      await page.type('textarea', 'Barbell Curl 3x10\nDumbbell Curl 3x12');
      
      // Click preview button using evaluate
      await page.evaluate(() => {
        const buttons = document.querySelectorAll('button');
        for (const button of buttons) {
          if (button.textContent?.includes('Preview')) {
            button.click();
            break;
          }
        }
      });
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Click start workout
      await page.evaluate(() => {
        const buttons = document.querySelectorAll('button');
        for (const button of buttons) {
          if (button.textContent?.includes('Start Workout')) {
            button.click();
            break;
          }
        }
      });
      
      // Wait for workout page
      await page.waitForSelector('.exercise-card', { timeout: 5000 });
      
      // Check for video
      const videoExists = await page.evaluate(() => {
        const video = document.querySelector('video');
        return {
          exists: video !== null,
          src: video?.getAttribute('src') || '',
          isPlaying: video && !video.paused
        };
      });
      
      if (videoExists.exists) {
        console.log('✅ Video element found');
        console.log(`   Source: ${videoExists.src}`);
        console.log(`   Playing: ${videoExists.isPlaying}`);
        
        // Take screenshot
        await page.screenshot({ 
          path: 'screenshots/workout-with-video.png',
          fullPage: false 
        });
        
        results.passed++;
      } else {
        console.log('❌ No video found for exercise with videos');
        await page.screenshot({ 
          path: 'screenshots/workout-no-video-error.png',
          fullPage: false 
        });
        results.failed++;
      }
      
    } catch (error) {
      console.log('❌ Test 1 failed:', error.message);
      results.failed++;
    }

    // Test 2: Test "Not Found" message
    console.log('\nTest 2: Testing "Not Found In Directory" message...');
    try {
      await page.goto('http://localhost:5173/build', { waitUntil: 'networkidle2' });
      await page.waitForSelector('textarea', { timeout: 5000 });
      
      // Clear textarea
      await page.evaluate(() => {
        (document.querySelector('textarea') as HTMLTextAreaElement).value = '';
      });
      
      // Type unknown exercise
      await page.type('textarea', 'Unknown Exercise 3x10');
      
      // Preview and start
      await page.evaluate(() => {
        const buttons = document.querySelectorAll('button');
        for (const button of buttons) {
          if (button.textContent?.includes('Preview')) {
            button.click();
            break;
          }
        }
      });
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      await page.evaluate(() => {
        const buttons = document.querySelectorAll('button');
        for (const button of buttons) {
          if (button.textContent?.includes('Start Workout')) {
            button.click();
            break;
          }
        }
      });
      
      await page.waitForSelector('.exercise-card', { timeout: 5000 });
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Check for not found message
      const notFoundText = await page.evaluate(() => {
        return document.body.textContent?.includes('Not Found In Directory');
      });
      
      if (notFoundText) {
        console.log('✅ "Not Found In Directory" message displayed');
        await page.screenshot({ 
          path: 'screenshots/video-not-found-message.png',
          fullPage: false 
        });
        results.passed++;
      } else {
        console.log('❌ "Not Found In Directory" message missing');
        results.failed++;
      }
      
    } catch (error) {
      console.log('❌ Test 2 failed:', error.message);
      results.failed++;
    }

    // Test 3: Responsive viewports
    console.log('\nTest 3: Testing responsive viewports...');
    const viewports = [
      { name: 'iPhone', width: 375, height: 667 },
      { name: 'Desktop', width: 1920, height: 1080 }
    ];
    
    for (const viewport of viewports) {
      try {
        await page.setViewport({ width: viewport.width, height: viewport.height });
        await page.goto('http://localhost:5173', { waitUntil: 'networkidle2' });
        
        await page.screenshot({ 
          path: `screenshots/home-${viewport.name.toLowerCase()}.png`
        });
        
        console.log(`✅ ${viewport.name} screenshot captured`);
      } catch (error) {
        console.log(`❌ ${viewport.name} test failed:`, error.message);
      }
    }
    results.passed++;

    // Final results
    console.log('\n📊 Test Summary:');
    console.log(`✅ Passed: ${results.passed}`);
    console.log(`❌ Failed: ${results.failed}`);
    console.log(`🔍 Console Errors: ${results.consoleErrors.length}`);
    
    if (results.consoleErrors.length > 0) {
      console.log('\nConsole errors found:');
      results.consoleErrors.forEach((err, i) => {
        console.log(`  ${i + 1}. ${err}`);
      });
    }
    
    console.log('\n📸 Screenshots saved in ./screenshots/');
    
    if (results.failed === 0 && results.consoleErrors.length === 0) {
      console.log('\n🎉 All tests passed successfully!');
      process.exit(0);
    } else {
      console.log('\n⚠️  Some issues detected');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('❌ Test execution failed:', error);
    process.exit(1);
  }
}

// Run the test
testVideoDisplay();