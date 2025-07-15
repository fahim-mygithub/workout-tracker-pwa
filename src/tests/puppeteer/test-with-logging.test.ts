import puppeteer from 'puppeteer';

async function testWithLogging() {
  console.log('🧪 Testing with Console Logging\n');
  
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
    
    // Listen to console logs
    const logs: string[] = [];
    page.on('console', msg => {
      const text = msg.text();
      if (text.includes('[WorkoutPageV2]') || text.includes('[ExerciseVideo]')) {
        logs.push(text);
        console.log('Console:', text);
      }
    });
    
    // Navigate to Build page
    console.log('1. Navigating to Build page...');
    await page.goto('http://localhost:5173/build');
    await page.waitForSelector('textarea', { timeout: 5000 });
    
    // Enter workout
    console.log('2. Entering workout...');
    await page.evaluate(() => {
      const textarea = document.querySelector('textarea') as HTMLTextAreaElement;
      if (textarea) {
        textarea.value = 'Incline Bench Press 3x10, Barbell Curl 4x12';
        textarea.dispatchEvent(new Event('input', { bubbles: true }));
      }
    });
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Click Start Workout
    console.log('3. Starting workout...');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const startBtn = buttons.find(btn => btn.textContent?.includes('Start Workout'));
      if (startBtn) (startBtn as HTMLButtonElement).click();
    });
    
    console.log('4. Waiting for navigation and component render...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Check final state
    const currentUrl = await page.url();
    console.log('\n5. Final state:');
    console.log('- URL:', currentUrl);
    console.log('- Console logs captured:', logs.length);
    
    // Take screenshot
    await page.screenshot({ 
      path: 'test-with-logging.png',
      fullPage: true 
    });
    console.log('\n📸 Screenshot saved as test-with-logging.png');
    
    console.log('\n6. Summary of logs:');
    logs.forEach(log => console.log(`  ${log}`));
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testWithLogging();