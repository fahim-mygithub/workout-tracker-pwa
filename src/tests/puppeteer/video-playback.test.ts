import { PuppeteerTestFramework } from './test-framework';

async function runVideoPlaybackTests() {
  const framework = new PuppeteerTestFramework();
  await framework.connect();
  
  const results = [];
  
  // Test 1: Navigate to demo page
  results.push(await framework.runTest('Navigate to Demo Page', async (page) => {
    await framework.navigateTo('http://localhost:5173/workout-v2-demo');
    await framework.wait(2000);
    
    const pageTitle = await page.title();
    const hasStartButton = await framework.clickButtonWithText('Start Demo Workout');
    
    if (!hasStartButton) {
      throw new Error('Start Demo Workout button not found');
    }
    
    return { pageTitle, buttonClicked: true };
  }));
  
  // Test 2: Check workout page loads
  results.push(await framework.runTest('Workout Page Loads', async (page) => {
    await page.waitForNavigation({ waitUntil: 'networkidle2' });
    await framework.wait(2000);
    
    const exerciseCards = await page.$$('[class*="transition-all duration-300"]');
    const exerciseCount = exerciseCards.length;
    
    return { exerciseCount };
  }));
  
  // Test 3: Check video elements
  results.push(await framework.runTest('Video Elements Present', async (page) => {
    const videoCheck = await framework.evaluate(() => {
      const iframe = document.querySelector('iframe[src*="youtube.com/embed"]');
      const thumbnail = document.querySelector('img[src*="youtube.com/vi"]');
      const videoSection = document.querySelector('.aspect-video');
      
      return {
        hasIframe: !!iframe,
        iframeSrc: iframe?.getAttribute('src') || null,
        hasThumbnail: !!thumbnail,
        thumbnailSrc: thumbnail?.getAttribute('src') || null,
        hasVideoSection: !!videoSection,
      };
    });
    
    if (!videoCheck.hasIframe && !videoCheck.hasThumbnail) {
      throw new Error('No video elements found');
    }
    
    return videoCheck;
  }));
  
  // Test 4: Exercise info displays correctly
  results.push(await framework.runTest('Exercise Info Displays', async (page) => {
    const exerciseInfo = await framework.evaluate(() => {
      const exerciseName = document.querySelector('.font-bold.line-clamp-1')?.textContent;
      const setInfo = document.querySelector('[class*="sets"]')?.textContent;
      const weightInfo = document.querySelector('[class*="Weight"]')?.textContent;
      
      return {
        exerciseName,
        setInfo,
        weightInfo,
        hasExerciseName: !!exerciseName,
      };
    });
    
    if (!exerciseInfo.hasExerciseName) {
      throw new Error('Exercise name not found');
    }
    
    return exerciseInfo;
  }));
  
  // Test 5: Workout controls work
  results.push(await framework.runTest('Workout Controls Function', async (page) => {
    const startClicked = await framework.clickButtonWithText('Start Workout');
    
    if (startClicked) {
      await framework.wait(1000);
    }
    
    const hasCompleteButton = await framework.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      return buttons.some(b => b.textContent?.includes('Complete Set'));
    });
    
    return {
      startButtonClicked: startClicked,
      completeSetButtonAppeared: hasCompleteButton,
    };
  }));
  
  // Test 6: Video autoplay for active exercise
  results.push(await framework.runTest('Video Autoplay Check', async (page) => {
    const autoplayCheck = await framework.evaluate(() => {
      const iframe = document.querySelector('iframe[src*="youtube.com/embed"]');
      const iframeSrc = iframe?.getAttribute('src') || '';
      
      return {
        hasAutoplayParam: iframeSrc.includes('autoplay=1'),
        iframeSrc,
      };
    });
    
    return autoplayCheck;
  }));
  
  framework.printTestResults(results);
  
  // Return overall success
  return results.every(r => r.success);
}

// Run the tests
runVideoPlaybackTests()
  .then(success => {
    console.log(`\n${success ? '✅ All tests passed!' : '❌ Some tests failed'}`);
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Test execution failed:', error);
    process.exit(1);
  });