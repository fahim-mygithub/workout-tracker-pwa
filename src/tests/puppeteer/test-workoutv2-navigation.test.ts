import puppeteer from 'puppeteer';

async function testWorkoutV2Navigation() {
  console.log('🧪 Testing WorkoutPageV2 Navigation Fix\n');
  
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
    
    // Navigate to Build page
    console.log('1. Navigating to Build page...');
    await page.goto('http://localhost:5173/build');
    await page.waitForSelector('textarea', { timeout: 5000 });
    
    // Enter workout
    console.log('2. Entering workout text...');
    const workoutText = 'Barbell Curl 3x10, Squat 5x5, Unknown Exercise 3x12';
    await page.evaluate((text) => {
      const textarea = document.querySelector('textarea');
      if (textarea) {
        textarea.value = text;
        textarea.dispatchEvent(new Event('input', { bubbles: true }));
        textarea.dispatchEvent(new Event('change', { bubbles: true }));
      }
    }, workoutText);
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Click Start Workout
    console.log('3. Starting workout...');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const startBtn = buttons.find(btn => btn.textContent?.includes('Start Workout'));
      if (startBtn) {
        console.log('Found Start Workout button, clicking...');
        startBtn.click();
      } else {
        console.error('Start Workout button not found');
      }
    });
    
    // Wait for navigation
    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 10000 }).catch(() => {
      console.log('Navigation timeout - checking current state...');
    });
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Check which workout page loaded
    console.log('\n4. Checking workout page version...');
    const pageInfo = await page.evaluate(() => {
      const info: any = {
        url: window.location.href,
        hasExerciseList: false,
        hasWorkoutControls: false,
        hasWorkoutHeader: false,
        exerciseListItems: 0,
        videoSections: 0,
        notFoundMessages: 0,
        isV2Layout: false
      };
      
      // Check for V2 components
      const exerciseList = document.querySelector('.overflow-y-auto.scrollbar-thin');
      info.hasExerciseList = exerciseList !== null;
      
      if (exerciseList) {
        info.exerciseListItems = exerciseList.querySelectorAll('[class*="card"]').length;
      }
      
      // Check for WorkoutHeader (V2 specific)
      const headerWithTimer = document.querySelector('[class*="timer"], [class*="Timer"]');
      info.hasWorkoutHeader = headerWithTimer !== null;
      
      // Check for WorkoutControls (V2 specific)
      const controlsSection = document.querySelector('.fixed.bottom-0, [class*="WorkoutControls"]');
      info.hasWorkoutControls = controlsSection !== null;
      
      // Check for V2 layout
      const v2Layout = document.querySelector('.flex.flex-col.h-screen.bg-background');
      info.isV2Layout = v2Layout !== null;
      
      // Count video sections
      info.videoSections = document.querySelectorAll('.aspect-video').length;
      
      // Count "Not Found" messages
      const allText = document.body.innerText;
      info.notFoundMessages = (allText.match(/Not Found In Directory/g) || []).length;
      
      return info;
    });
    
    console.log('Page Info:');
    console.log('- URL:', pageInfo.url);
    console.log('- Is V2 Layout:', pageInfo.isV2Layout);
    console.log('- Has Exercise List:', pageInfo.hasExerciseList);
    console.log('- Exercise List Items:', pageInfo.exerciseListItems);
    console.log('- Has Workout Header:', pageInfo.hasWorkoutHeader);
    console.log('- Has Workout Controls:', pageInfo.hasWorkoutControls);
    console.log('- Video Sections:', pageInfo.videoSections);
    console.log('- "Not Found" Messages:', pageInfo.notFoundMessages);
    
    // Take screenshot
    await page.screenshot({ 
      path: 'test-workoutv2-navigation.png',
      fullPage: true 
    });
    console.log('\n📸 Screenshot saved as test-workoutv2-navigation.png');
    
    // Diagnosis
    console.log('\n🩺 Diagnosis:');
    if (pageInfo.isV2Layout && pageInfo.hasExerciseList && pageInfo.exerciseListItems > 0) {
      console.log('✅ WorkoutPageV2 loaded successfully!');
      console.log(`✅ ${pageInfo.exerciseListItems} exercises in the list`);
      
      if (pageInfo.videoSections > 0) {
        console.log(`✅ ${pageInfo.videoSections} video sections rendered`);
      } else {
        console.log('❌ No video sections found - check ExerciseItem integration');
      }
      
      if (pageInfo.notFoundMessages > 0) {
        console.log(`ℹ️  ${pageInfo.notFoundMessages} exercises not found in directory`);
      }
    } else {
      console.log('❌ WorkoutPageV2 did not load properly');
      console.log('→ Check navigation state passing');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testWorkoutV2Navigation();