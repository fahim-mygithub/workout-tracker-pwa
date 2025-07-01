const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  
  // Capture console messages
  page.on('console', msg => {
    const type = msg.type();
    const text = msg.text();
    console.log(`[${type.toUpperCase()}] ${text}`);
  });
  
  // Capture page errors
  page.on('pageerror', error => {
    console.error('[PAGE ERROR]', error.message);
  });
  
  // Capture request failures
  page.on('requestfailed', request => {
    console.error('[REQUEST FAILED]', request.url(), request.failure().errorText);
  });
  
  try {
    console.log('Navigating to login page...');
    await page.goto('http://localhost:5173/login', {
      waitUntil: 'networkidle0',
      timeout: 30000
    });
    
    console.log('\nPage loaded. Checking content...');
    
    // Get page title
    const title = await page.title();
    console.log('Page title:', title);
    
    // Check if login form exists
    const hasLoginForm = await page.evaluate(() => {
      const elements = {
        emailInput: !!document.querySelector('input[type="email"]'),
        passwordInput: !!document.querySelector('input[type="password"]'),
        submitButton: !!document.querySelector('button[type="submit"]'),
        googleButton: !!document.querySelector('button:has-text("Google")') || 
                      !!Array.from(document.querySelectorAll('button')).find(b => b.textContent?.includes('Google'))
      };
      return elements;
    });
    
    console.log('\nLogin form elements found:', hasLoginForm);
    
    // Get all text content on the page
    const pageText = await page.evaluate(() => {
      return document.body.innerText;
    });
    
    console.log('\nPage content preview (first 500 chars):');
    console.log(pageText.substring(0, 500));
    
    // Check for error messages
    const errors = await page.evaluate(() => {
      const errorElements = Array.from(document.querySelectorAll('[class*="error"], .error, pre'));
      return errorElements.map(el => el.textContent?.trim()).filter(Boolean);
    });
    
    if (errors.length > 0) {
      console.log('\nError messages found:');
      errors.forEach(err => console.log('-', err));
    }
    
    // Check page structure
    const pageStructure = await page.evaluate(() => {
      return {
        hasReactRoot: !!document.getElementById('root'),
        bodyClasses: document.body.className,
        childElementCount: document.body.children.length,
        forms: document.querySelectorAll('form').length,
        inputs: document.querySelectorAll('input').length,
        buttons: document.querySelectorAll('button').length
      };
    });
    
    console.log('\nPage structure:', pageStructure);
    
    // Try to take a screenshot
    await page.screenshot({ path: 'login-page-screenshot.png' });
    console.log('\nScreenshot saved as login-page-screenshot.png');
    
  } catch (error) {
    console.error('Error during page check:', error);
  } finally {
    await browser.close();
  }
})();