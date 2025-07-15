const puppeteer = require('puppeteer');

(async () => {
  try {
    console.log('Testing Firebase authentication and permissions...\n');
    
    const browser = await puppeteer.connect({ browserURL: 'http://localhost:9222' });
    const page = await browser.newPage();
    
    // Monitor console for Firebase errors
    page.on('console', msg => {
      if (msg.type() === 'error' && msg.text().includes('Firebase')) {
        console.log('Firebase Error:', msg.text());
      }
    });

    // First, check if user is logged in
    await page.goto('http://localhost:5174/', { waitUntil: 'networkidle0' });
    await page.waitForTimeout(2000);
    
    const isLoggedIn = await page.evaluate(() => {
      const bodyText = document.body.textContent || '';
      return !bodyText.includes('Sign In') && !bodyText.includes('Log In');
    });
    
    console.log('User logged in:', isLoggedIn);
    
    if (!isLoggedIn) {
      console.log('\nUser needs to log in first. Navigating to login page...');
      await page.goto('http://localhost:5174/login', { waitUntil: 'networkidle0' });
      
      // Check if login page loaded
      const hasLoginForm = await page.$('input[type="email"]');
      console.log('Login page loaded:', !!hasLoginForm);
      
      console.log('\nTo fix the Firebase permissions issue:');
      console.log('1. Update the Firebase security rules in the Firebase Console');
      console.log('2. Log in to the app with a valid account');
      console.log('3. The profile page should then load without permission errors');
    } else {
      // Try to access profile
      await page.goto('http://localhost:5174/profile', { waitUntil: 'networkidle0' });
      await page.waitForTimeout(2000);
      
      const profileLoaded = await page.evaluate(() => {
        const bodyText = document.body.textContent || '';
        return !bodyText.includes('Failed to load profile');
      });
      
      console.log('Profile loaded successfully:', profileLoaded);
    }
    
    await browser.disconnect();
  } catch (error) {
    console.error('Test error:', error.message);
  }
})();