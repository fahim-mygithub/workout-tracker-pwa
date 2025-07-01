const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  
  // Capture console messages
  const consoleMessages = [];
  page.on('console', msg => {
    const type = msg.type();
    const text = msg.text();
    consoleMessages.push({ type, text });
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
    console.log('Navigating to http://localhost:5173...');
    const response = await page.goto('http://localhost:5173', {
      waitUntil: 'networkidle0',
      timeout: 30000
    });
    
    console.log('\nResponse status:', response.status());
    
    // Wait a bit for any async errors
    await page.waitForTimeout(2000);
    
    // Get page title
    const title = await page.title();
    console.log('\nPage title:', title);
    
    // Check if page has any content
    const bodyContent = await page.evaluate(() => document.body.innerHTML);
    console.log('\nPage has content:', bodyContent.length > 0 ? 'Yes' : 'No');
    
    // Look for React root
    const hasReactRoot = await page.evaluate(() => {
      return !!document.getElementById('root');
    });
    console.log('Has React root element:', hasReactRoot);
    
    // Check for any error messages in the DOM
    const errorElements = await page.evaluate(() => {
      const errors = [];
      // Check for common error patterns
      const errorSelectors = [
        '.error',
        '[class*="error"]',
        '[data-error]',
        'pre', // Often contains stack traces
      ];
      
      errorSelectors.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        elements.forEach(el => {
          if (el.textContent && el.textContent.toLowerCase().includes('error')) {
            errors.push(el.textContent.trim());
          }
        });
      });
      
      return errors;
    });
    
    if (errorElements.length > 0) {
      console.log('\nError elements found in DOM:');
      errorElements.forEach(err => console.log('-', err));
    }
    
    // Filter console messages for errors and warnings
    const issues = consoleMessages.filter(msg => 
      ['error', 'warning', 'warn'].includes(msg.type)
    );
    
    if (issues.length > 0) {
      console.log('\n\nConsole issues summary:');
      issues.forEach(issue => {
        console.log(`[${issue.type.toUpperCase()}] ${issue.text}`);
      });
    } else {
      console.log('\nNo console errors or warnings found.');
    }
    
  } catch (error) {
    console.error('Navigation error:', error);
  } finally {
    await browser.close();
  }
})();