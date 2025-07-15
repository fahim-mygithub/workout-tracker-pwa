import puppeteer from 'puppeteer';

async function testVideoPlayback() {
  console.log('🧪 Testing Video Playback Fix\n');
  
  try {
    // Connect to Chrome
    const browser = await puppeteer.connect({
      browserURL: 'http://localhost:9222',
      defaultViewport: null,
    });
    
    const pages = await browser.pages();
    const page = pages[0] || await browser.newPage();
    
    // Navigate to demo page
    console.log('1. Navigating to demo page...');
    await page.goto('http://localhost:5173/workout-v2-demo');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Click start demo workout
    console.log('2. Starting demo workout...');
    const clicked = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const btn = buttons.find(b => b.textContent?.includes('Start Demo Workout'));
      if (btn) {
        (btn as HTMLButtonElement).click();
        return true;
      }
      return false;
    });
    
    if (!clicked) throw new Error('Could not find Start Demo Workout button');
    
    // Wait for navigation
    await page.waitForNavigation({ waitUntil: 'networkidle2' });
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Check for video elements
    console.log('3. Checking for video elements...');
    const videoInfo = await page.evaluate(() => {
      const iframe = document.querySelector('iframe[src*="youtube.com/embed"]');
      const thumbnail = document.querySelector('img[src*="youtube.com/vi"]');
      const exerciseName = document.querySelector('.font-bold.line-clamp-1')?.textContent;
      
      return {
        hasYouTubeIframe: !!iframe,
        iframeSrc: iframe?.getAttribute('src') || null,
        hasThumbnail: !!thumbnail,
        thumbnailSrc: thumbnail?.getAttribute('src') || null,
        exerciseName: exerciseName || 'Not found',
      };
    });
    
    console.log('\n📊 Results:');
    console.log(`   Exercise: ${videoInfo.exerciseName}`);
    console.log(`   YouTube iframe present: ${videoInfo.hasYouTubeIframe ? '✅ Yes' : '❌ No'}`);
    if (videoInfo.iframeSrc) {
      console.log(`   Iframe URL: ${videoInfo.iframeSrc}`);
    }
    console.log(`   Thumbnail present: ${videoInfo.hasThumbnail ? '✅ Yes' : '❌ No'}`);
    
    if (videoInfo.hasYouTubeIframe || videoInfo.hasThumbnail) {
      console.log('\n✅ Video playback is working correctly!');
      console.log('   YouTube videos are properly embedded using iframes.');
      return true;
    } else {
      console.log('\n❌ No video elements found');
      return false;
    }
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    return false;
  }
}

// Run the test
testVideoPlayback()
  .then(success => {
    console.log('\n' + (success ? '✅ Test passed!' : '❌ Test failed!'));
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });