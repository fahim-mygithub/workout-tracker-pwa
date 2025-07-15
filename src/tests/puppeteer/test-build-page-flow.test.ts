import puppeteer from 'puppeteer';

async function testBuildPageFlow() {
  console.log('🧪 Testing Build Page Flow\n');
  
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
    
    // Clear and enter workout
    console.log('2. Entering workout text...');
    await page.evaluate(() => {
      const textarea = document.querySelector('textarea') as HTMLTextAreaElement;
      if (textarea) {
        textarea.value = '';
        textarea.focus();
      }
    });
    
    await page.type('textarea', 'Barbell Curl 3x10, Squat 5x5');
    await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for parsing
    
    // Scroll to see if preview appears
    console.log('3. Scrolling to check for preview...');
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight);
    });
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Check page state
    const pageState = await page.evaluate(() => {
      const state: any = {
        textareaValue: (document.querySelector('textarea') as HTMLTextAreaElement)?.value,
        buttons: [],
        hasPreview: false,
        previewText: '',
        pageHeight: document.body.scrollHeight,
        viewportHeight: window.innerHeight,
        errorMessages: []
      };
      
      // Get all buttons
      const buttons = document.querySelectorAll('button');
      buttons.forEach(btn => {
        const text = btn.textContent?.trim();
        if (text) {
          state.buttons.push({
            text,
            disabled: btn.disabled,
            visible: btn.offsetParent !== null
          });
        }
      });
      
      // Check for preview section
      const previewSection = document.querySelector('[class*="preview"], [class*="Preview"]');
      state.hasPreview = previewSection !== null;
      if (previewSection) {
        state.previewText = previewSection.textContent?.substring(0, 100) || '';
      }
      
      // Check for error messages
      const alerts = document.querySelectorAll('[role="alert"], .alert, [class*="error"]');
      alerts.forEach(alert => {
        const text = alert.textContent?.trim();
        if (text) state.errorMessages.push(text);
      });
      
      return state;
    });
    
    console.log('\n4. Page State:');
    console.log('- Textarea value:', pageState.textareaValue?.substring(0, 50) + '...');
    console.log('- Page height:', pageState.pageHeight);
    console.log('- Viewport height:', pageState.viewportHeight);
    console.log('- Has preview:', pageState.hasPreview);
    if (pageState.hasPreview) {
      console.log('- Preview text:', pageState.previewText);
    }
    
    console.log('\n5. Buttons found:');
    pageState.buttons.forEach((btn: any) => {
      console.log(`   - "${btn.text}" (disabled: ${btn.disabled}, visible: ${btn.visible})`);
    });
    
    if (pageState.errorMessages.length > 0) {
      console.log('\n6. Error messages:');
      pageState.errorMessages.forEach((msg: string) => {
        console.log(`   - ${msg}`);
      });
    }
    
    // Take full page screenshot
    await page.screenshot({ 
      path: 'test-build-page-full.png',
      fullPage: true 
    });
    console.log('\n📸 Full page screenshot saved as test-build-page-full.png');
    
    // Try to find and click Start Workout button
    console.log('\n7. Looking for Start Workout button...');
    const startButtonFound = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const startBtn = buttons.find(btn => 
        btn.textContent?.toLowerCase().includes('start') && 
        btn.textContent?.toLowerCase().includes('workout')
      );
      if (startBtn) {
        console.log('Start button found:', startBtn.textContent);
        return true;
      }
      return false;
    });
    
    console.log('- Start Workout button found:', startButtonFound);
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testBuildPageFlow();