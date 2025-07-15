import puppeteer from 'puppeteer';

async function manualVideoTest() {
  console.log('🎬 Manual Video Display Test\n');
  
  try {
    // Connect to existing Chrome
    const browser = await puppeteer.connect({
      browserURL: 'http://localhost:9222',
      defaultViewport: null
    });

    // Get the first page or create new one
    const pages = await browser.pages();
    const page = pages[0] || await browser.newPage();
    
    console.log('1. Navigating to build page...');
    await page.goto('http://localhost:5173/build', { waitUntil: 'networkidle2' });
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Take screenshot of build page
    await page.screenshot({ 
      path: 'screenshots/1-build-page.png',
      fullPage: false 
    });
    console.log('   ✅ Screenshot: 1-build-page.png');
    
    console.log('\n2. Creating workout with Barbell Curl (has video)...');
    // Clear and type in textarea
    await page.evaluate(() => {
      const textarea = document.querySelector('textarea') as HTMLTextAreaElement;
      if (textarea) {
        textarea.value = 'Barbell Curl 3x10';
        textarea.dispatchEvent(new Event('input', { bubbles: true }));
      }
    });
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Click preview
    await page.evaluate(() => {
      const buttons = document.querySelectorAll('button');
      for (const button of buttons) {
        if (button.textContent?.toLowerCase().includes('preview')) {
          console.log('Clicking preview button');
          button.click();
          break;
        }
      }
    });
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    await page.screenshot({ 
      path: 'screenshots/2-workout-preview.png',
      fullPage: false 
    });
    console.log('   ✅ Screenshot: 2-workout-preview.png');
    
    console.log('\n3. Starting workout...');
    // Click start workout
    const startClicked = await page.evaluate(() => {
      const buttons = document.querySelectorAll('button');
      for (const button of buttons) {
        if (button.textContent?.toLowerCase().includes('start workout')) {
          console.log('Clicking start workout button');
          button.click();
          return true;
        }
      }
      return false;
    });
    
    if (!startClicked) {
      console.log('   ❌ Could not find Start Workout button');
    }
    
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    console.log('\n4. Checking for video on workout page...');
    const videoInfo = await page.evaluate(() => {
      const video = document.querySelector('video');
      const exerciseCard = document.querySelector('.ExerciseCard, [class*="exercise"], [class*="Exercise"]');
      const pageUrl = window.location.href;
      
      return {
        url: pageUrl,
        hasVideo: video !== null,
        videoSrc: video?.src || null,
        hasExerciseCard: exerciseCard !== null,
        exerciseCardClasses: exerciseCard?.className || null,
        bodyText: document.body.textContent?.substring(0, 500)
      };
    });
    
    console.log('   Current URL:', videoInfo.url);
    console.log('   Has video element:', videoInfo.hasVideo);
    console.log('   Video source:', videoInfo.videoSrc);
    console.log('   Has exercise card:', videoInfo.hasExerciseCard);
    
    await page.screenshot({ 
      path: 'screenshots/3-workout-page.png',
      fullPage: false 
    });
    console.log('   ✅ Screenshot: 3-workout-page.png');
    
    if (videoInfo.hasVideo) {
      console.log('\n   🎉 Video display is working!');
    } else {
      console.log('\n   ⚠️  No video found on workout page');
      
      // Check for "Not Found" message
      const hasNotFound = await page.evaluate(() => {
        return document.body.textContent?.includes('Not Found In Directory') || false;
      });
      
      if (hasNotFound) {
        console.log('   ℹ️  "Not Found In Directory" message is displayed');
      }
    }
    
    console.log('\n5. Testing with unknown exercise...');
    await page.goto('http://localhost:5173/build', { waitUntil: 'networkidle2' });
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Type unknown exercise
    await page.evaluate(() => {
      const textarea = document.querySelector('textarea') as HTMLTextAreaElement;
      if (textarea) {
        textarea.value = 'Unknown Exercise 3x10';
        textarea.dispatchEvent(new Event('input', { bubbles: true }));
      }
    });
    
    // Preview and start
    await page.evaluate(() => {
      const buttons = document.querySelectorAll('button');
      for (const button of buttons) {
        if (button.textContent?.toLowerCase().includes('preview')) {
          button.click();
          break;
        }
      }
    });
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    await page.evaluate(() => {
      const buttons = document.querySelectorAll('button');
      for (const button of buttons) {
        if (button.textContent?.toLowerCase().includes('start workout')) {
          button.click();
          break;
        }
      }
    });
    
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const notFoundInfo = await page.evaluate(() => {
      const hasNotFound = document.body.textContent?.includes('Not Found In Directory') || false;
      const hasVideo = document.querySelector('video') !== null;
      
      return { hasNotFound, hasVideo };
    });
    
    console.log('   Has "Not Found" message:', notFoundInfo.hasNotFound);
    console.log('   Has video element:', notFoundInfo.hasVideo);
    
    await page.screenshot({ 
      path: 'screenshots/4-unknown-exercise.png',
      fullPage: false 
    });
    console.log('   ✅ Screenshot: 4-unknown-exercise.png');
    
    if (notFoundInfo.hasNotFound && !notFoundInfo.hasVideo) {
      console.log('\n   🎉 "Not Found In Directory" feature is working!');
    }
    
    console.log('\n✅ Manual test completed. Check screenshots folder for results.');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

manualVideoTest();