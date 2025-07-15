import puppeteer from 'puppeteer';

async function checkWorkoutPage() {
  console.log('🔍 Checking which workout page is rendered\n');
  
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
    
    const currentUrl = await page.url();
    console.log('Current URL:', currentUrl);
    
    // Check page structure
    const pageInfo = await page.evaluate(() => {
      const info: any = {
        hasExerciseList: false,
        hasWorkoutControls: false,
        hasWorkoutHeader: false,
        exerciseCards: 0,
        pageTitle: document.title,
        mainContainerClass: '',
        workoutPageVersion: 'unknown'
      };
      
      // Check for ExerciseList component (WorkoutPageV2)
      const exerciseList = document.querySelector('[class*="ExerciseList"], .exercise-list, .overflow-y-auto');
      info.hasExerciseList = exerciseList !== null;
      
      // Check for WorkoutControls (WorkoutPageV2)
      const workoutControls = document.querySelector('[class*="WorkoutControls"], .workout-controls');
      info.hasWorkoutControls = workoutControls !== null;
      
      // Check for WorkoutHeader (WorkoutPageV2)
      const workoutHeader = document.querySelector('[class*="WorkoutHeader"], .workout-header');
      info.hasWorkoutHeader = workoutHeader !== null;
      
      // Count exercise cards
      info.exerciseCards = document.querySelectorAll('[class*="card"]').length;
      
      // Get main container class
      const mainContainer = document.querySelector('.flex.flex-col.h-screen');
      info.mainContainerClass = mainContainer?.className || '';
      
      // Determine version
      if (info.hasExerciseList && info.hasWorkoutControls && info.hasWorkoutHeader) {
        info.workoutPageVersion = 'V2';
      } else if (document.querySelector('.max-w-4xl.mx-auto')) {
        info.workoutPageVersion = 'V1';
      }
      
      // Get component structure
      info.components = Array.from(document.querySelectorAll('[class*="Component"], [class*="component"]'))
        .map(el => el.className);
        
      // Check for specific V2 layout
      const hasV2Layout = document.querySelector('.flex.flex-col.h-screen.bg-background');
      info.hasV2Layout = hasV2Layout !== null;
      
      return info;
    });
    
    console.log('\nPage Analysis:');
    console.log('- Workout Page Version:', pageInfo.workoutPageVersion);
    console.log('- Has V2 Layout:', pageInfo.hasV2Layout);
    console.log('- Has Exercise List:', pageInfo.hasExerciseList);
    console.log('- Has Workout Controls:', pageInfo.hasWorkoutControls);
    console.log('- Has Workout Header:', pageInfo.hasWorkoutHeader);
    console.log('- Exercise Cards:', pageInfo.exerciseCards);
    console.log('- Main Container Class:', pageInfo.mainContainerClass);
    
    // Take screenshot
    await page.screenshot({ 
      path: 'workout-page-check.png',
      fullPage: true 
    });
    console.log('\n📸 Screenshot saved as workout-page-check.png');
    
    // Check React component tree if possible
    const reactInfo = await page.evaluate(() => {
      try {
        // Try to find React fiber
        const rootElement = document.getElementById('root');
        if (rootElement) {
          const reactFiberKey = Object.keys(rootElement).find(key => key.startsWith('__reactFiber'));
          if (reactFiberKey) {
            const fiber = (rootElement as any)[reactFiberKey];
            // Try to find component names in the tree
            const components: string[] = [];
            let current = fiber;
            while (current && components.length < 10) {
              if (current.elementType?.name) {
                components.push(current.elementType.name);
              }
              current = current.child || current.sibling;
            }
            return { hasReactFiber: true, components };
          }
        }
        return { hasReactFiber: false };
      } catch (e) {
        return { error: e.toString() };
      }
    });
    
    if (reactInfo.hasReactFiber) {
      console.log('\nReact Components Found:');
      reactInfo.components?.forEach((comp: string) => console.log(`  - ${comp}`));
    }
    
    // Final diagnosis
    console.log('\n🩺 Diagnosis:');
    if (pageInfo.workoutPageVersion === 'V1') {
      console.log('❌ Using old WorkoutPage (V1) instead of WorkoutPageV2');
      console.log('→ Check router configuration and navigation logic');
    } else if (pageInfo.workoutPageVersion === 'V2') {
      console.log('✅ Using correct WorkoutPageV2');
      console.log('→ Video display issues might be in ExerciseItem component');
    } else {
      console.log('⚠️  Could not determine workout page version');
    }
    
  } catch (error) {
    console.error('❌ Check failed:', error);
  }
}

// Run the check
checkWorkoutPage();