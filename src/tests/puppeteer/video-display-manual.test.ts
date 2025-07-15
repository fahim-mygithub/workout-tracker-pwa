import puppeteer from 'puppeteer';

async function testVideoDisplay() {
  console.log('🧪 Testing Video Display Feature\n');
  console.log('Prerequisites:');
  console.log('1. Chrome must be running with debugging on port 9222');
  console.log('2. Dev server must be running on http://localhost:5173');
  console.log('3. Manually navigate to the workout page with some exercises\n');
  
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
    
    // Get current URL
    const currentUrl = await page.url();
    console.log('Current page URL:', currentUrl);
    
    // Check if we're on workout page
    if (!currentUrl.includes('/workout')) {
      console.log('\n⚠️  Please navigate to the workout page first!');
      console.log('Steps:');
      console.log('1. Go to Build page');
      console.log('2. Enter: "Barbell Curl 3x10, Squat 5x5, Unknown Exercise 3x12"');
      console.log('3. Click Start Workout');
      console.log('4. Run this test again\n');
      return;
    }
    
    console.log('\n✅ On workout page, checking video functionality...\n');
    
    // Check for video elements
    const videoSections = await page.$$('.relative.aspect-video');
    console.log(`1. Found ${videoSections.length} video sections`);
    
    // Check for exercise cards
    const exerciseCards = await page.$$('[class*="card"]');
    console.log(`2. Found ${exerciseCards.length} exercise cards`);
    
    // Check for "Not Found In Directory" message
    const notFoundElements = await page.evaluate(() => {
      const elements = Array.from(document.querySelectorAll('*'));
      return elements.filter(el => 
        el.textContent?.includes('Not Found In Directory')
      ).length;
    });
    console.log(`3. "Not Found In Directory" messages: ${notFoundElements}`);
    
    // Check for video elements
    const videoElements = await page.$$('video');
    console.log(`4. Video elements found: ${videoElements.length}`);
    
    // Check video component details
    const videoComponentInfo = await page.evaluate(() => {
      const videoSections = document.querySelectorAll('.relative.aspect-video');
      const info: any[] = [];
      
      videoSections.forEach((section, index) => {
        const hasVideo = section.querySelector('video') !== null;
        const hasNotFound = section.textContent?.includes('Not Found In Directory') || false;
        const hasMultiView = section.querySelector('button[aria-label*="view"]') !== null;
        const videoSrc = section.querySelector('video')?.getAttribute('src') || '';
        
        info.push({
          index,
          hasVideo,
          hasNotFound,
          hasMultiView,
          videoSrc,
          text: section.textContent?.substring(0, 50) || ''
        });
      });
      
      return info;
    });
    
    console.log('\n5. Video component details:');
    videoComponentInfo.forEach((info, i) => {
      console.log(`   Section ${i + 1}:`);
      if (info.hasVideo) {
        console.log(`     - Has Video: ${info.videoSrc}`);
      } else if (info.hasNotFound) {
        console.log(`     - Shows "Not Found In Directory"`);
      } else {
        console.log(`     - Empty/Loading`);
      }
      if (info.hasMultiView) {
        console.log(`     - Multiple views available`);
      }
    });
    
    // Check exercise names
    const exerciseNames = await page.evaluate(() => {
      const names = Array.from(document.querySelectorAll('h6')).map(el => el.textContent);
      return names.filter(name => name && name.length > 0);
    });
    console.log(`\n6. Exercise names found: ${exerciseNames.join(', ')}`);
    
    // Take screenshot
    await page.screenshot({ 
      path: 'test-video-display.png',
      fullPage: true 
    });
    console.log('\n7. Screenshot saved as test-video-display.png');
    
    // Check console errors
    if (consoleErrors.length > 0) {
      console.log('\n⚠️  Console Errors:');
      consoleErrors.forEach(err => console.log(`   - ${err}`));
    } else {
      console.log('\n✅ No console errors');
    }
    
    // Summary
    console.log('\n📊 Test Summary:');
    console.log(`   - Expected: At least 1 video section per exercise`);
    console.log(`   - Expected: "Not Found In Directory" for unknown exercises`);
    console.log(`   - Expected: Video elements for known exercises`);
    console.log(`   - Expected: No console errors`);
    
    const hasVideoSections = videoSections.length > 0;
    const hasNotFoundMessage = notFoundElements > 0;
    const hasVideos = videoElements.length > 0 || hasNotFoundMessage;
    const noErrors = consoleErrors.length === 0;
    
    if (hasVideoSections && hasVideos && noErrors) {
      console.log('\n✅ Video display feature is working correctly!');
    } else {
      console.log('\n❌ Issues detected:');
      if (!hasVideoSections) console.log('   - No video sections found');
      if (!hasVideos) console.log('   - No videos or "Not Found" messages');
      if (!noErrors) console.log('   - Console errors present');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testVideoDisplay();