const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  
  // Capture console messages
  page.on('console', msg => {
    console.log(`[${msg.type().toUpperCase()}] ${msg.text()}`);
  });
  
  try {
    // First check the main page
    console.log('Checking main page (/)...');
    await page.goto('http://localhost:5173/', {
      waitUntil: 'networkidle0',
      timeout: 30000
    });
    
    // Get current URL after any redirects
    const currentUrl = page.url();
    console.log('Current URL:', currentUrl);
    
    // Check what's rendered
    const pageContent = await page.evaluate(() => {
      const root = document.getElementById('root');
      return {
        hasRoot: !!root,
        rootHTML: root ? root.innerHTML.substring(0, 200) : 'No root element',
        bodyText: document.body.innerText.substring(0, 500),
        links: Array.from(document.querySelectorAll('a')).map(a => ({
          text: a.textContent,
          href: a.href
        })),
        buttons: Array.from(document.querySelectorAll('button')).map(b => b.textContent?.trim())
      };
    });
    
    console.log('\nPage content:', pageContent);
    
    // Look for navigation elements
    const navElements = await page.evaluate(() => {
      const nav = document.querySelector('nav');
      const bottomNav = document.querySelector('[class*="bottom"], [class*="navigation"]');
      return {
        hasNav: !!nav,
        hasBottomNav: !!bottomNav,
        navLinks: nav ? Array.from(nav.querySelectorAll('a')).map(a => a.textContent) : [],
        allLinks: Array.from(document.querySelectorAll('a[href*="login"], a[href*="sign"]')).map(a => ({
          text: a.textContent,
          href: a.href
        }))
      };
    });
    
    console.log('\nNavigation elements:', navElements);
    
    // Check if we're already on a login page
    const isAuthPage = await page.evaluate(() => {
      const text = document.body.innerText.toLowerCase();
      return text.includes('sign in') || text.includes('login') || text.includes('email') && text.includes('password');
    });
    
    console.log('\nIs auth page:', isAuthPage);
    
    // Try different routes
    const routes = ['/', '/login', '/signin', '/auth', '/profile'];
    console.log('\nChecking routes:');
    
    for (const route of routes) {
      try {
        await page.goto(`http://localhost:5173${route}`, {
          waitUntil: 'domcontentloaded',
          timeout: 5000
        });
        
        const routeInfo = await page.evaluate(() => ({
          title: document.title,
          hasContent: document.body.innerText.length > 0,
          hasError: document.body.innerText.includes('Error') || document.body.innerText.includes('404'),
          preview: document.body.innerText.substring(0, 100)
        }));
        
        console.log(`${route}:`, routeInfo);
      } catch (e) {
        console.log(`${route}: Failed to load`);
      }
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await browser.close();
  }
})();