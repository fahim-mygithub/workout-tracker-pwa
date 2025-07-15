const puppeteer = require('puppeteer');

(async () => {
  try {
    console.log('Connecting to Chrome...');
    const browser = await puppeteer.connect({ browserURL: 'http://localhost:9222' });
    const pages = await browser.pages();
    
    // Find or create a page
    let page = pages.find(p => p.url().includes('localhost:517')) || pages[0];
    if (!page) {
      page = await browser.newPage();
    }
    
    // Capture console messages
    const consoleMessages = [];
    page.on('console', msg => {
      const text = msg.text();
      consoleMessages.push({ type: msg.type(), text });
      if (msg.type() === 'error' && (text.includes('Firebase') || text.includes('permissions'))) {
        console.log(`Firebase Error: ${text}`);
      }
    });

    console.log('Navigating to profile page...');
    await page.goto('http://localhost:5174/profile', { 
      waitUntil: 'networkidle0',
      timeout: 15000 
    });

    // Wait for potential Firebase operations
    await page.waitForTimeout(2000);

    // Check authentication status
    const authStatus = await page.evaluate(() => {
      // Check for common auth indicators
      const bodyText = document.body.textContent || '';
      return {
        hasLoginForm: !!document.querySelector('form input[type="email"]'),
        hasSignInButton: bodyText.includes('Sign In') || bodyText.includes('Log In'),
        hasProfileContent: bodyText.includes('Profile') || bodyText.includes('Settings'),
        hasErrorMessage: bodyText.includes('Failed to load profile') || bodyText.includes('insufficient permissions')
      };
    });
    
    console.log('\nAuthentication Status:', authStatus);

    // Check for Firebase configuration
    const firebaseConfig = await page.evaluate(() => {
      try {
        // Check if Firebase is initialized
        return {
          hasFirebase: typeof window !== 'undefined' && !!(window as any).firebase,
          authDomain: (window as any)._firebaseConfig?.authDomain || 'not found'
        };
      } catch (e) {
        return { error: e.message };
      }
    });
    
    console.log('Firebase Config:', firebaseConfig);

    // Take screenshot
    await page.screenshot({ 
      path: 'screenshots/profile-page-current.png',
      fullPage: true 
    });
    console.log('\nScreenshot saved: screenshots/profile-page-current.png');

    // Get Firebase errors from console
    const firebaseErrors = consoleMessages.filter(msg => 
      msg.type === 'error' && (msg.text.includes('Firebase') || msg.text.includes('permissions'))
    );
    
    console.log('\nFirebase Errors Found:', firebaseErrors.length);
    firebaseErrors.forEach(err => console.log(' -', err.text));

    // Check if user needs to log in
    if (authStatus.hasSignInButton || authStatus.hasLoginForm) {
      console.log('\nUser is not authenticated. The profile page requires authentication.');
      console.log('Security rules are working correctly - blocking unauthenticated access.');
    } else if (authStatus.hasErrorMessage) {
      console.log('\nUser may be authenticated but lacking permissions.');
      console.log('Check Firebase security rules for the users and workouts collections.');
    }

    await browser.disconnect();
  } catch (error) {
    console.error('Test error:', error.message);
  }
})();