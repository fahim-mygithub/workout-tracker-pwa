import puppeteer from 'puppeteer';

async function debugVideoDisplay() {
  console.log('🔍 Debugging Video Display Feature\n');
  
  try {
    // Connect to Chrome
    const browser = await puppeteer.connect({
      browserURL: 'http://localhost:9222',
      defaultViewport: null,
    });
    
    const pages = await browser.pages();
    // Find the app page, not devtools
    let page = pages.find(p => p.url().includes('localhost:5173'));
    if (!page) {
      page = await browser.newPage();
      await page.goto('http://localhost:5173');
    }
    
    // Get current URL
    const currentUrl = await page.url();
    console.log('Current page URL:', currentUrl);
    
    if (!currentUrl.includes('/workout')) {
      console.log('\n⚠️  Please navigate to the workout page first!');
      return;
    }
    
    // Check Redux state
    console.log('\n1. Checking Redux state...');
    const reduxState = await page.evaluate(() => {
      // Try to access Redux state from the window
      const state = (window as any).__REDUX_DEVTOOLS_EXTENSION__?.getState?.() || 
                   (window as any).store?.getState?.();
      
      if (state) {
        return {
          exerciseCount: state.exercise?.exercises?.length || 0,
          activeWorkout: state.workout?.activeWorkout ? {
            name: state.workout.activeWorkout.name,
            exerciseCount: state.workout.activeWorkout.exercises.length,
            currentExercise: state.workout.activeWorkout.exercises[state.workout.activeWorkout.currentExerciseIndex]?.exerciseName
          } : null
        };
      }
      return null;
    });
    
    if (reduxState) {
      console.log('   - Exercises in directory:', reduxState.exerciseCount);
      if (reduxState.activeWorkout) {
        console.log('   - Active workout:', reduxState.activeWorkout.name);
        console.log('   - Workout exercises:', reduxState.activeWorkout.exerciseCount);
        console.log('   - Current exercise:', reduxState.activeWorkout.currentExercise);
      }
    } else {
      console.log('   - Could not access Redux state');
    }
    
    // Check for exercise components
    console.log('\n2. Checking exercise components...');
    const componentInfo = await page.evaluate(() => {
      const info: any = {
        exerciseItems: [],
        videoComponents: [],
        notFoundMessages: []
      };
      
      // Find all exercise items
      const exerciseElements = document.querySelectorAll('[class*="ExerciseItem"], [class*="exercise-item"]');
      exerciseElements.forEach((el, i) => {
        const name = el.querySelector('h6')?.textContent || 'Unknown';
        const hasVideo = el.querySelector('video') !== null;
        const hasNotFound = el.textContent?.includes('Not Found In Directory') || false;
        
        info.exerciseItems.push({
          index: i,
          name,
          hasVideo,
          hasNotFound
        });
      });
      
      // Find all video components
      const videoContainers = document.querySelectorAll('.aspect-video, [class*="video"]');
      videoContainers.forEach((el, i) => {
        const hasVideo = el.querySelector('video') !== null;
        const hasNotFound = el.textContent?.includes('Not Found In Directory') || false;
        const text = el.textContent?.substring(0, 50) || '';
        
        info.videoComponents.push({
          index: i,
          hasVideo,
          hasNotFound,
          text
        });
      });
      
      // Find all "Not Found" messages
      const allElements = document.querySelectorAll('*');
      allElements.forEach(el => {
        if (el.textContent?.includes('Not Found In Directory') && 
            !el.children.length) { // Only leaf nodes
          info.notFoundMessages.push(el.textContent);
        }
      });
      
      return info;
    });
    
    console.log('   - Exercise items found:', componentInfo.exerciseItems.length);
    componentInfo.exerciseItems.forEach((item: any) => {
      console.log(`     * ${item.name}: ${item.hasVideo ? 'Has Video' : item.hasNotFound ? 'Not Found' : 'No Video'}`);
    });
    
    console.log('\n   - Video containers found:', componentInfo.videoComponents.length);
    console.log('   - "Not Found" messages:', componentInfo.notFoundMessages.length);
    
    // Check network requests for CSV
    console.log('\n3. Checking if CSV was loaded...');
    const csvRequests = await page.evaluate(() => {
      return performance.getEntriesByType('resource')
        .filter((entry: any) => entry.name.includes('muscle_exercises.csv'))
        .map((entry: any) => ({
          url: entry.name,
          status: entry.responseStatus || 'unknown',
          duration: entry.duration
        }));
    });
    
    if (csvRequests.length > 0) {
      console.log('   - CSV requests found:');
      csvRequests.forEach((req: any) => {
        console.log(`     * ${req.url} - Status: ${req.status}, Duration: ${req.duration}ms`);
      });
    } else {
      console.log('   - No CSV requests found');
    }
    
    // Check console logs
    console.log('\n4. Checking console logs...');
    await page.evaluate(() => {
      console.log('TEST: Current exercises in Redux:', (window as any).store?.getState?.()?.exercise?.exercises?.length || 0);
    });
    
    // Take detailed screenshot
    await page.screenshot({ 
      path: 'debug-video-display.png',
      fullPage: true 
    });
    console.log('\n📸 Debug screenshot saved as debug-video-display.png');
    
    // Final diagnosis
    console.log('\n🩺 Diagnosis:');
    if (reduxState && reduxState.exerciseCount === 0) {
      console.log('   ❌ Exercise directory is empty - CSV not loaded');
      console.log('   → Solution: Ensure loadExercisesFromCSV is called on app startup');
    } else if (componentInfo.notFoundMessages.length === componentInfo.exerciseItems.length && componentInfo.exerciseItems.length > 0) {
      console.log('   ❌ All exercises show "Not Found" - matching logic issue');
      console.log('   → Solution: Check fuzzy matching implementation');
    } else if (componentInfo.videoComponents.length === 0) {
      console.log('   ❌ No video components rendered - component integration issue');
      console.log('   → Solution: Check ExerciseVideo component integration in ExerciseItem');
    } else {
      console.log('   ✅ Video display appears to be working');
    }
    
  } catch (error) {
    console.error('❌ Debug failed:', error);
  }
}

// Run the debug
debugVideoDisplay();