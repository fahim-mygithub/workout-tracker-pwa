import puppeteer from 'puppeteer';

async function debugExerciseLoading() {
  console.log('🔍 Debugging Exercise Loading\n');
  
  try {
    // Connect to Chrome
    const browser = await puppeteer.connect({
      browserURL: 'http://localhost:9222',
      defaultViewport: null,
    });
    
    const pages = await browser.pages();
    let page = pages.find(p => p.url().includes('localhost:5173'));
    if (!page) {
      page = await browser.newPage();
      await page.goto('http://localhost:5173');
    }
    
    // Check Redux state for exercises
    console.log('1. Checking Redux exercise state...');
    const exerciseState = await page.evaluate(() => {
      try {
        // Try to access Redux store
        const state = (window as any).__REDUX_DEVTOOLS_EXTENSION__?.getState?.() || 
                     (window as any).store?.getState?.();
        
        if (state?.exercise) {
          const exercises = state.exercise.exercises || [];
          const inclineExercises = exercises.filter((ex: any) => 
            ex.name.toLowerCase().includes('incline')
          );
          
          return {
            totalExercises: exercises.length,
            inclineExercises: inclineExercises.map((ex: any) => ({
              name: ex.name,
              videoLinks: ex.videoLinks
            })),
            lastUpdated: state.exercise.lastUpdated,
            isLoading: state.exercise.isLoading,
            error: state.exercise.error
          };
        }
        return null;
      } catch (e) {
        return { error: e.toString() };
      }
    });
    
    console.log('Exercise State:');
    if (exerciseState) {
      console.log('- Total exercises:', exerciseState.totalExercises);
      console.log('- Loading:', exerciseState.isLoading);
      console.log('- Error:', exerciseState.error);
      console.log('- Last updated:', exerciseState.lastUpdated);
      
      if (exerciseState.inclineExercises?.length > 0) {
        console.log('\nIncline exercises found:');
        exerciseState.inclineExercises.forEach((ex: any) => {
          console.log(`  - ${ex.name}`);
          console.log(`    Videos: ${ex.videoLinks?.length || 0}`);
        });
      } else {
        console.log('\n❌ No incline exercises found in state');
      }
    } else {
      console.log('❌ Could not access Redux state');
    }
    
    // Check if CSV was loaded
    console.log('\n2. Checking CSV loading...');
    const csvLoaded = await page.evaluate(() => {
      const resources = performance.getEntriesByType('resource');
      const csvRequests = resources.filter((r: any) => 
        r.name.includes('muscle_exercises.csv')
      );
      return csvRequests.map((r: any) => ({
        url: r.name,
        status: r.responseStatus,
        duration: r.duration
      }));
    });
    
    if (csvLoaded.length > 0) {
      console.log('CSV requests:');
      csvLoaded.forEach((req: any) => {
        console.log(`  - ${req.url}`);
        console.log(`    Status: ${req.status || 'unknown'}`);
        console.log(`    Duration: ${req.duration}ms`);
      });
    } else {
      console.log('❌ No CSV requests found');
    }
    
    // Navigate to workout page if not there
    if (!page.url().includes('/workout')) {
      console.log('\n3. Navigating to workout page...');
      // First go to build page and create a workout
      await page.goto('http://localhost:5173/build');
      await page.waitForSelector('textarea', { timeout: 5000 });
      
      await page.evaluate(() => {
        const textarea = document.querySelector('textarea') as HTMLTextAreaElement;
        if (textarea) {
          textarea.value = 'Incline Bench Press 3x10';
          textarea.dispatchEvent(new Event('input', { bubbles: true }));
        }
      });
      
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Start workout
      await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const startBtn = buttons.find(btn => btn.textContent?.includes('Start Workout'));
        if (startBtn) (startBtn as HTMLButtonElement).click();
      });
      
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
    
    // Check exercise state again after navigation
    console.log('\n4. Checking exercise state after navigation...');
    const finalState = await page.evaluate(() => {
      const state = (window as any).__REDUX_DEVTOOLS_EXTENSION__?.getState?.() || 
                   (window as any).store?.getState?.();
      
      if (state?.exercise) {
        return {
          totalExercises: state.exercise.exercises.length,
          hasInclineBenchPress: state.exercise.exercises.some((ex: any) => 
            ex.name.toLowerCase().includes('incline') && 
            ex.name.toLowerCase().includes('bench')
          )
        };
      }
      return null;
    });
    
    if (finalState) {
      console.log('- Total exercises:', finalState.totalExercises);
      console.log('- Has incline bench press:', finalState.hasInclineBenchPress);
    }
    
    // Take screenshot
    await page.screenshot({ 
      path: 'debug-exercise-loading.png',
      fullPage: true 
    });
    console.log('\n📸 Screenshot saved as debug-exercise-loading.png');
    
  } catch (error) {
    console.error('❌ Debug failed:', error);
  }
}

// Run the debug
debugExerciseLoading();