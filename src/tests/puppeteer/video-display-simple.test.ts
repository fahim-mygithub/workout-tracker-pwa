import puppeteer from 'puppeteer';

async function testVideoDisplay() {
  console.log('🧪 Testing Video Display Feature\n');
  
  try {
    // Connect to Chrome
    const browser = await puppeteer.connect({
      browserURL: 'http://localhost:9222',
      defaultViewport: null,
    });
    
    const pages = await browser.pages();
    const page = pages[0] || await browser.newPage();
    
    // Set up console error monitoring
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    // Navigate to app
    console.log('1. Navigating to app...');
    await page.goto('http://localhost:5173');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Navigate to Build screen
    console.log('2. Navigating to Build screen...');
    await page.click('nav a[href="/build"]');
    await page.waitForSelector('h1');
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Enter workout with known exercises
    console.log('3. Creating workout with exercise variations...');
    const workoutInput = 'Barbell Curl 3x10, Incline Barbell Press 4x8, Squat 5x5, Unknown Exercise 3x12';
    await page.type('textarea', workoutInput);
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Start workout
    console.log('4. Starting workout...');
    // Use evaluate to click button with text
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const startBtn = buttons.find(btn => btn.textContent?.includes('Start Workout'));
      if (startBtn) {
        startBtn.click();
      } else {
        console.error('Start Workout button not found');
      }
    });
    
    await page.waitForNavigation({ waitUntil: 'networkidle2' });
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Check if workout page loaded
    console.log('5. Checking workout page elements...');
    
    // Check for video elements
    const videoSections = await page.$$('.relative.aspect-video');
    console.log(`   - Found ${videoSections.length} video sections`);
    
    // Check for exercise cards
    const exerciseCards = await page.$$('[class*="card"]');
    console.log(`   - Found ${exerciseCards.length} exercise cards`);
    
    // Check specific video display elements
    console.log('6. Verifying video display functionality...');
    
    // Check for "Not Found In Directory" message
    const notFoundElements = await page.evaluate(() => {
      const elements = Array.from(document.querySelectorAll('*'));
      return elements.filter(el => 
        el.textContent?.includes('Not Found In Directory')
      ).length;
    });
    console.log(`   - "Not Found In Directory" messages: ${notFoundElements}`);
    
    // Check for video elements
    const videoElements = await page.$$('video');
    console.log(`   - Video elements found: ${videoElements.length}`);
    
    // Check if ExerciseVideo component is rendering
    const videoComponentInfo = await page.evaluate(() => {
      const videoSections = document.querySelectorAll('.relative.aspect-video');
      const info: any[] = [];
      
      videoSections.forEach((section, index) => {
        const hasVideo = section.querySelector('video') !== null;
        const hasNotFound = section.textContent?.includes('Not Found In Directory') || false;
        const hasMultiView = section.querySelector('button[aria-label*="view"]') !== null;
        
        info.push({
          index,
          hasVideo,
          hasNotFound,
          hasMultiView,
          text: section.textContent?.substring(0, 50) || ''
        });
      });
      
      return info;
    });
    
    console.log('7. Video component details:');
    videoComponentInfo.forEach((info, i) => {
      console.log(`   - Section ${i + 1}: ${info.hasVideo ? 'Has Video' : info.hasNotFound ? 'Not Found Message' : 'Empty'}`);
      if (info.hasMultiView) console.log(`     * Multiple views available`);
    });
    
    // Take screenshot
    console.log('\n8. Taking screenshot...');
    await page.screenshot({ 
      path: 'test-video-display.png',
      fullPage: true 
    });
    
    // Test exercise name matching
    console.log('\n9. Testing exercise name matching...');
    const exerciseNames = await page.evaluate(() => {
      const names = Array.from(document.querySelectorAll('h6')).map(el => el.textContent);
      return names.filter(name => name && name.length > 0);
    });
    console.log(`   - Exercise names found: ${exerciseNames.join(', ')}`);
    
    // Summary
    console.log('\n✅ Test Summary:');
    console.log(`   - Video sections: ${videoSections.length}`);
    console.log(`   - Exercise cards: ${exerciseCards.length}`);
    console.log(`   - "Not Found" messages: ${notFoundElements} (expected 1 for "Unknown Exercise")`);
    console.log(`   - Video elements: ${videoElements.length} (expected 3 for known exercises)`);
    console.log(`   - Console errors: ${consoleErrors.length}`);
    
    if (consoleErrors.length > 0) {
      console.log('\n⚠️  Console Errors:');
      consoleErrors.forEach(err => console.log(`   - ${err}`));
    }
    
    // Test results
    const testPassed = 
      videoSections.length > 0 && 
      notFoundElements >= 1 && 
      videoElements.length >= 1 &&
      consoleErrors.length === 0;
    
    if (testPassed) {
      console.log('\n✅ Video display test PASSED!');
    } else {
      console.log('\n❌ Video display test FAILED!');
      console.log('   Expected:');
      console.log('   - At least 1 video section');
      console.log('   - At least 1 "Not Found" message');
      console.log('   - At least 1 video element');
      console.log('   - No console errors');
    }
    
    console.log('\n📸 Screenshot saved as test-video-display.png');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    
    // Take failure screenshot
    try {
      const browser = await puppeteer.connect({
        browserURL: 'http://localhost:9222',
        defaultViewport: null,
      });
      const pages = await browser.pages();
      const page = pages[0];
      if (page) {
        await page.screenshot({ 
          path: 'test-failure-screenshot.png',
          fullPage: true 
        });
        console.log('📸 Failure screenshot saved');
      }
    } catch (screenshotError) {
      console.error('Could not capture failure screenshot:', screenshotError);
    }
    
    throw error;
  }
}

// Run the test
testVideoDisplay();