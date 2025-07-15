import puppeteer from 'puppeteer';

async function finalVideoTest() {
  console.log('🧪 Final Video Display Test\n');
  
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
    }
    
    // Monitor console errors
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    // Navigate to Build page
    console.log('1. Navigating to Build page...');
    await page.goto('http://localhost:5173/build');
    await page.waitForSelector('textarea', { timeout: 5000 });
    
    // Enter workout with known and unknown exercises
    console.log('2. Entering workout text...');
    await page.evaluate(() => {
      const textarea = document.querySelector('textarea') as HTMLTextAreaElement;
      if (textarea) {
        textarea.value = '';
        textarea.focus();
      }
    });
    
    const workoutText = 'Barbell Curl 3x10, Incline Barbell Press 4x8, Squat 5x5, Unknown Exercise 3x12';
    await page.type('textarea', workoutText);
    await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for parsing
    
    // Click Start Workout button
    console.log('3. Clicking Start Workout button...');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const startBtn = buttons.find(btn => btn.textContent?.includes('Start Workout'));
      if (startBtn) {
        (startBtn as HTMLButtonElement).click();
      }
    });
    
    // Wait for navigation
    console.log('4. Waiting for navigation to workout page...');
    try {
      await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 5000 });
    } catch (e) {
      console.log('   Navigation timeout - checking current state...');
    }
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const currentUrl = await page.url();
    console.log('   Current URL:', currentUrl);
    
    // Check WorkoutPageV2 components
    console.log('\n5. Checking WorkoutPageV2 components...');
    const v2Components = await page.evaluate(() => {
      const components: any = {
        hasV2Layout: false,
        hasExerciseList: false,
        exerciseCount: 0,
        videoSections: [],
        notFoundCount: 0,
        currentExercise: '',
        workoutHeader: false,
        workoutControls: false
      };
      
      // Check V2 layout
      components.hasV2Layout = document.querySelector('.flex.flex-col.h-screen.bg-background') !== null;
      
      // Check exercise list
      const exerciseList = document.querySelector('.overflow-y-auto.scrollbar-thin');
      components.hasExerciseList = exerciseList !== null;
      
      // Count exercises in list
      const exerciseCards = document.querySelectorAll('.transition-all.duration-300');
      components.exerciseCount = exerciseCards.length;
      
      // Check each exercise for video
      exerciseCards.forEach((card, index) => {
        const exerciseName = card.querySelector('h6')?.textContent || 'Unknown';
        const hasVideo = card.querySelector('video') !== null;
        const hasNotFound = card.textContent?.includes('Not Found In Directory') || false;
        const videoSrc = card.querySelector('video')?.getAttribute('src') || '';
        
        components.videoSections.push({
          index,
          exerciseName,
          hasVideo,
          hasNotFound,
          videoSrc
        });
      });
      
      // Count total "Not Found" messages
      components.notFoundCount = (document.body.textContent?.match(/Not Found In Directory/g) || []).length;
      
      // Get current exercise
      const activeCard = document.querySelector('.ring-2.ring-primary');
      components.currentExercise = activeCard?.querySelector('h6')?.textContent || '';
      
      // Check for header and controls
      components.workoutHeader = document.querySelector('[class*="timer"], [class*="Timer"]') !== null;
      components.workoutControls = document.querySelector('.fixed.bottom-0') !== null;
      
      return components;
    });
    
    console.log('WorkoutPageV2 Components:');
    console.log('- Has V2 Layout:', v2Components.hasV2Layout);
    console.log('- Has Exercise List:', v2Components.hasExerciseList);
    console.log('- Exercise Count:', v2Components.exerciseCount);
    console.log('- Current Exercise:', v2Components.currentExercise);
    console.log('- Has Workout Header:', v2Components.workoutHeader);
    console.log('- Has Workout Controls:', v2Components.workoutControls);
    
    console.log('\n6. Video Display Results:');
    v2Components.videoSections.forEach((section: any) => {
      console.log(`   Exercise ${section.index + 1}: ${section.exerciseName}`);
      if (section.hasVideo) {
        console.log(`     ✅ Has video: ${section.videoSrc}`);
      } else if (section.hasNotFound) {
        console.log(`     ℹ️  Shows "Not Found In Directory"`);
      } else {
        console.log(`     ❌ No video or message`);
      }
    });
    
    console.log(`\n   Total "Not Found" messages: ${v2Components.notFoundCount}`);
    
    // Take screenshot
    await page.screenshot({ 
      path: 'final-video-test.png',
      fullPage: true 
    });
    console.log('\n📸 Screenshot saved as final-video-test.png');
    
    // Check console errors
    if (consoleErrors.length > 0) {
      console.log('\n⚠️  Console Errors:');
      consoleErrors.forEach(err => console.log(`   - ${err}`));
    } else {
      console.log('\n✅ No console errors');
    }
    
    // Final verdict
    console.log('\n🏁 Final Verdict:');
    if (currentUrl.includes('/workout') && v2Components.hasV2Layout && v2Components.exerciseCount > 0) {
      console.log('✅ WorkoutPageV2 loaded successfully');
      
      const videosFound = v2Components.videoSections.filter((s: any) => s.hasVideo).length;
      const notFoundMessages = v2Components.videoSections.filter((s: any) => s.hasNotFound).length;
      
      console.log(`✅ ${videosFound} exercises have videos`);
      console.log(`✅ ${notFoundMessages} exercises show "Not Found In Directory"`);
      
      if (videosFound === 0 && notFoundMessages === v2Components.exerciseCount) {
        console.log('⚠️  All exercises show "Not Found" - check if exercise directory is loaded');
      } else if (videosFound > 0) {
        console.log('✅ Video display feature is working!');
      }
    } else {
      console.log('❌ WorkoutPageV2 did not load properly');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
finalVideoTest();