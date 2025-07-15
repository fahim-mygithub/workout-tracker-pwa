import puppeteer from 'puppeteer';
import { PuppeteerTestFramework } from './test-framework';

describe('Firebase Profile Page Tests', () => {
  let framework: PuppeteerTestFramework;

  beforeAll(async () => {
    framework = new PuppeteerTestFramework();
    await framework.initialize();
  });

  afterAll(async () => {
    await framework.cleanup();
  });

  it('should check Firebase connection and profile page errors', async () => {
    const page = framework.page!;
    
    // Listen for console errors
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // Navigate to profile page
    console.log('Navigating to profile page...');
    await page.goto('http://localhost:5174/profile', { 
      waitUntil: 'networkidle0',
      timeout: 30000 
    });

    // Wait for the page to load
    await page.waitForTimeout(3000);

    // Take screenshot of current state
    await page.screenshot({ 
      path: 'screenshots/profile-firebase-error.png',
      fullPage: true 
    });
    console.log('Screenshot saved: profile-firebase-error.png');

    // Check for authentication state
    const isAuthenticated = await page.evaluate(() => {
      // Check if there's a user in Redux store or auth context
      const rootElement = document.getElementById('root');
      return rootElement?.textContent?.includes('Sign In') || 
             rootElement?.textContent?.includes('Log In');
    });
    console.log('User authenticated:', !isAuthenticated);

    // Get page content
    const pageContent = await page.evaluate(() => {
      return {
        title: document.title,
        hasLoginButton: !!document.querySelector('button[type="submit"]'),
        errorMessages: Array.from(document.querySelectorAll('[class*="error"]')).map(el => el.textContent),
        profileElements: {
          hasAvatar: !!document.querySelector('[class*="avatar"]'),
          hasStats: !!document.querySelector('[class*="stats"]'),
          hasWorkouts: !!document.querySelector('[class*="workout"]')
        }
      };
    });
    console.log('Page content:', pageContent);

    // Check Firebase errors
    const firebaseErrors = consoleErrors.filter(error => 
      error.includes('Firebase') || error.includes('permissions')
    );
    console.log('Firebase errors found:', firebaseErrors);

    // Try to log in if not authenticated
    if (isAuthenticated) {
      console.log('User not authenticated, attempting to navigate to login...');
      
      // Click on Sign In button if available
      const signInButton = await page.$('button:has-text("Sign In"), a[href="/login"]');
      if (signInButton) {
        await signInButton.click();
        await page.waitForNavigation({ waitUntil: 'networkidle0' });
        
        // Take screenshot of login page
        await page.screenshot({ 
          path: 'screenshots/login-page.png',
          fullPage: true 
        });
        console.log('Screenshot saved: login-page.png');
      }
    }

    // Return test results
    return {
      authenticated: !isAuthenticated,
      firebaseErrors: firebaseErrors.length,
      pageLoaded: !!pageContent.title,
      profileDataLoaded: pageContent.profileElements.hasAvatar || 
                        pageContent.profileElements.hasStats ||
                        pageContent.profileElements.hasWorkouts
    };
  });

  it('should test Firebase security rules by checking different collections', async () => {
    const page = framework.page!;
    
    // Inject Firebase test
    const firebaseTest = await page.evaluate(async () => {
      try {
        // Try to access Firebase directly from the browser console
        const { db } = await import('/src/firebase/config.ts');
        const { collection, getDocs, query, limit } = await import('firebase/firestore');
        
        const results: any = {};
        
        // Test different collections
        const collections = ['users', 'workouts', 'exercises'];
        
        for (const collName of collections) {
          try {
            const q = query(collection(db, collName), limit(1));
            const snapshot = await getDocs(q);
            results[collName] = {
              accessible: true,
              count: snapshot.size
            };
          } catch (error: any) {
            results[collName] = {
              accessible: false,
              error: error.message
            };
          }
        }
        
        return results;
      } catch (error: any) {
        return { error: error.message };
      }
    });
    
    console.log('Firebase collection access test:', firebaseTest);
  });
});

// Run the test
(async () => {
  const test = new (describe as any)('Firebase Profile Page Tests', () => {});
  await test.run();
})();