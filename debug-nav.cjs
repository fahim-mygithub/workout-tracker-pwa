const puppeteer = require('puppeteer');

(async () => {
  try {
    const browser = await puppeteer.connect({ browserURL: 'http://localhost:9222' });
    const page = await browser.newPage();
    
    // Capture all console messages and errors
    page.on('console', msg => {
      console.log(`CONSOLE [${msg.type()}]:`, msg.text());
    });
    page.on('pageerror', error => console.log('PAGE ERROR:', error.message));
    page.on('requestfailed', request => console.log('FAILED REQUEST:', request.url(), request.failure()?.errorText));
    
    console.log('Connecting to existing Chrome tab...');
    // Try to use the existing tab instead of creating a new one
    const pages = await browser.pages();
    const existingPage = pages.find(p => p.url().includes('localhost:517'));
    
    if (existingPage) {
      console.log('Using existing page:', existingPage.url());
      const currentUrl = existingPage.url();
      
      // Check if bottom navigation exists
      const bottomNav = await existingPage.$('nav');
      console.log('Bottom nav found:', !!bottomNav);
      
      // Check if AppLayout is rendered  
      const appLayout = await existingPage.$('div.min-h-screen');
      console.log('AppLayout found:', !!appLayout);
      
      // Get current page content
      const pageContent = await existingPage.evaluate(() => {
        return {
          title: document.title,
          hasRoot: !!document.getElementById('root'),
          rootChildren: document.getElementById('root')?.children.length || 0,
          bodyClasses: document.body.className,
          manifestErrors: window.console._logs?.filter(log => log.includes('manifest')) || []
        };
      });
      console.log('Page status:', pageContent);
      
    } else {
      console.log('No existing localhost page found, navigating to app...');
      // Determine correct port
      const url = 'http://localhost:5174'; // Based on the dev server output showing 5174
      await page.goto(url, { waitUntil: 'networkidle0', timeout: 15000 });
      
      const bottomNav = await page.$('nav');
      console.log('Bottom nav found after navigation:', !!bottomNav);
    }
    
    await browser.disconnect();
  } catch (error) {
    console.log('ERROR:', error.message);
  }
})();