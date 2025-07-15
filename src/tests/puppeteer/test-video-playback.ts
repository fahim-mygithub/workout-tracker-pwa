import puppeteer from 'puppeteer';

async function testVideoPlayback() {
  let browser;
  let page;
  
  try {
    console.log('🧪 Starting Video Playback Test...\n');
    
    // Connect to the already running Chrome instance
    browser = await puppeteer.connect({
      browserURL: 'http://localhost:9222',
      defaultViewport: null,
    });
    
    // Get the first page or create a new one
    const pages = await browser.pages();
    page = pages[0] || await browser.newPage();
    
    // Set up console message capture
    const consoleLogs: string[] = [];
    page.on('console', (msg) => {
      consoleLogs.push(`[${msg.type()}] ${msg.text()}`);
    });
    
    // Set up error capture
    const pageErrors: string[] = [];
    page.on('pageerror', (error) => {
      pageErrors.push(error.message);
    });
    
    // Navigate to the demo page
    console.log('1️⃣ Navigating to workout demo page...');
    await page.goto('http://localhost:5173/workout-v2-demo', {
      waitUntil: 'networkidle2',
      timeout: 30000,
    });
    
    // Wait for the page to load and find the button
    console.log('   Waiting for page to load...');
    await new Promise(resolve => setTimeout(resolve, 2000)); // Give React time to render
    
    // Try different selectors
    const buttonSelectors = [
      'button',  // Find all buttons first
    ];
    
    let buttonFound = false;
    for (const selector of buttonSelectors) {
      try {
        const buttons = await page.$$(selector);
        for (const button of buttons) {
          const buttonText = await page.evaluate(el => el.textContent, button);
          console.log(`   Found button with text: "${buttonText}"`);
          if (buttonText?.includes('Start Demo Workout')) {
            buttonFound = true;
            console.log('✅ Demo page loaded successfully\n');
            
            // Click the start demo workout button
            console.log('2️⃣ Starting demo workout...');
            await button.click();
            break;
          }
        }
        if (buttonFound) break;
      } catch (e) {
        // Continue trying other selectors
      }
    }
    
    if (!buttonFound) {
      // Log page content for debugging
      const pageTitle = await page.title();
      const pageUrl = page.url();
      console.log(`   Page title: ${pageTitle}`);
      console.log(`   Page URL: ${pageUrl}`);
      
      // Get all button texts
      const buttons = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('button')).map(b => b.textContent?.trim());
      });
      console.log(`   Buttons found: ${JSON.stringify(buttons)}`);
      
      throw new Error('Could not find Start Demo Workout button');
    }
    
    // Wait for navigation to workout page
    await page.waitForNavigation({ waitUntil: 'networkidle2' });
    console.log('✅ Navigated to workout page\n');
    
    // Wait for the workout page to load
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Check if exercises are loaded - look for exercise cards
    const exerciseCards = await page.$$('[class*="transition-all duration-300"]');
    console.log(`3️⃣ Found ${exerciseCards.length} exercise cards\n`);
    
    // Check for video elements in the first exercise (should be active)
    console.log('4️⃣ Checking video elements...');
    
    // Look for YouTube iframe
    const hasYouTubeIframe = await page.evaluate(() => {
      const iframe = document.querySelector('iframe[src*="youtube.com/embed"]');
      return {
        exists: !!iframe,
        src: iframe?.getAttribute('src') || null,
      };
    });
    
    if (hasYouTubeIframe.exists) {
      console.log(`✅ YouTube iframe found: ${hasYouTubeIframe.src}\n`);
    } else {
      // Check for video thumbnail with play button
      const hasThumbnail = await page.evaluate(() => {
        const thumbnail = document.querySelector('img[src*="youtube.com/vi"]');
        return {
          exists: !!thumbnail,
          src: thumbnail?.getAttribute('src') || null,
        };
      });
      
      if (hasThumbnail.exists) {
        console.log(`✅ YouTube thumbnail found: ${hasThumbnail.src}`);
        console.log('   (Video will load when play button is clicked)\n');
      } else {
        console.log('❌ No video elements found\n');
      }
    }
    
    // Check the exercise info
    const exerciseInfo = await page.evaluate(() => {
      const exerciseName = document.querySelector('.font-bold.line-clamp-1')?.textContent;
      const hasVideoSection = !!document.querySelector('.aspect-video');
      return { exerciseName, hasVideoSection };
    });
    
    console.log('5️⃣ Exercise Info:');
    console.log(`   Exercise: ${exerciseInfo.exerciseName || 'Not found'}`);
    console.log(`   Has video section: ${exerciseInfo.hasVideoSection ? 'Yes' : 'No'}\n`);
    
    // Try clicking the video thumbnail if it exists
    const playButton = await page.$('button:has(.aspect-video)');
    if (playButton) {
      console.log('6️⃣ Clicking video thumbnail to load player...');
      await playButton.click();
      await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for iframe to load
      
      // Check if iframe loaded after click
      const iframeAfterClick = await page.evaluate(() => {
        const iframe = document.querySelector('iframe[src*="youtube.com/embed"]');
        return !!iframe;
      });
      
      console.log(`   YouTube player loaded: ${iframeAfterClick ? 'Yes' : 'No'}\n`);
    }
    
    // Check workout controls
    console.log('7️⃣ Checking workout controls...');
    const startButtonText = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const startBtn = buttons.find(b => b.textContent?.includes('Start Workout'));
      return startBtn ? startBtn.textContent : null;
    });
    const completeSetButtonText = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const completeBtn = buttons.find(b => b.textContent?.includes('Complete Set'));
      return completeBtn ? completeBtn.textContent : null;
    });
    const hasStartButton = !!startButtonText;
    const hasCompleteSetButton = !!completeSetButtonText;
    
    if (hasStartButton) {
      console.log('✅ Found "Start Workout" button');
      await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const startBtn = buttons.find(b => b.textContent?.includes('Start Workout'));
        if (startBtn) (startBtn as HTMLButtonElement).click();
      });
      await new Promise(resolve => setTimeout(resolve, 1000));
      const hasCompleteAfterStart = await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        return buttons.some(b => b.textContent?.includes('Complete Set'));
      });
      console.log(`   After clicking start: ${hasCompleteAfterStart ? 'Complete Set button appeared' : 'Button not found'}\n`);
    } else if (hasCompleteSetButton) {
      console.log('✅ Workout already started - "Complete Set" button found\n');
    }
    
    // Print console logs
    if (consoleLogs.length > 0) {
      console.log('📋 Console logs from page:');
      consoleLogs.forEach(log => console.log(`   ${log}`));
      console.log('');
    }
    
    // Print any errors
    if (pageErrors.length > 0) {
      console.log('❌ Page errors:');
      pageErrors.forEach(error => console.log(`   ${error}`));
      console.log('');
    }
    
    console.log('✅ Video playback test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    
    // Take a screenshot on failure
    if (page) {
      try {
        await page.screenshot({ 
          path: 'test-failure-screenshot.png',
          fullPage: true 
        });
        console.log('📸 Screenshot saved as test-failure-screenshot.png');
      } catch (screenshotError) {
        console.error('Failed to take screenshot:', screenshotError);
      }
    }
    
    throw error;
  } finally {
    // Don't close the browser since it's the dev instance
    console.log('\n🏁 Test execution finished');
  }
}

// Run the test
testVideoPlayback().catch(console.error);