import puppeteer, { Browser, Page } from 'puppeteer';

export interface TestResult {
  success: boolean;
  testName: string;
  duration: number;
  consoleLogs: string[];
  errors: string[];
  screenshots: string[];
  details: Record<string, any>;
}

export class PuppeteerTestFramework {
  private browser: Browser | null = null;
  private page: Page | null = null;
  private consoleLogs: string[] = [];
  private pageErrors: string[] = [];
  private startTime: number = 0;

  async connect(): Promise<void> {
    console.log('🔗 Connecting to Chrome...');
    this.browser = await puppeteer.connect({
      browserURL: 'http://localhost:9222',
      defaultViewport: null,
    });

    const pages = await this.browser.pages();
    this.page = pages[0] || await this.browser.newPage();

    // Set up console message capture
    this.page.on('console', (msg) => {
      this.consoleLogs.push(`[${msg.type()}] ${msg.text()}`);
    });

    // Set up error capture
    this.page.on('pageerror', (error) => {
      this.pageErrors.push(error.message);
    });
  }

  async runTest(
    testName: string,
    testFunction: (page: Page) => Promise<Record<string, any>>
  ): Promise<TestResult> {
    if (!this.page) {
      throw new Error('Not connected. Call connect() first.');
    }

    console.log(`\n🧪 Running test: ${testName}\n`);
    this.startTime = Date.now();
    this.consoleLogs = [];
    this.pageErrors = [];
    const screenshots: string[] = [];

    try {
      const details = await testFunction(this.page);
      
      const duration = Date.now() - this.startTime;
      
      return {
        success: true,
        testName,
        duration,
        consoleLogs: [...this.consoleLogs],
        errors: [...this.pageErrors],
        screenshots,
        details,
      };
    } catch (error) {
      // Take a screenshot on failure
      const screenshotPath = `test-failure-${testName.replace(/\s+/g, '-')}-${Date.now()}.png`;
      try {
        await this.page.screenshot({
          path: screenshotPath,
          fullPage: true,
        });
        screenshots.push(screenshotPath);
        console.log(`📸 Screenshot saved: ${screenshotPath}`);
      } catch (screenshotError) {
        console.error('Failed to take screenshot:', screenshotError);
      }

      const duration = Date.now() - this.startTime;

      return {
        success: false,
        testName,
        duration,
        consoleLogs: [...this.consoleLogs],
        errors: [...this.pageErrors, error.message],
        screenshots,
        details: { error: error.message },
      };
    }
  }

  async navigateTo(url: string, options?: any): Promise<void> {
    if (!this.page) throw new Error('Page not initialized');
    await this.page.goto(url, {
      waitUntil: 'networkidle2',
      timeout: 30000,
      ...options,
    });
  }

  async waitForElement(selector: string, timeout: number = 10000): Promise<void> {
    if (!this.page) throw new Error('Page not initialized');
    await this.page.waitForSelector(selector, { timeout });
  }

  async click(selector: string): Promise<void> {
    if (!this.page) throw new Error('Page not initialized');
    await this.page.click(selector);
  }

  async clickButtonWithText(text: string): Promise<boolean> {
    if (!this.page) throw new Error('Page not initialized');
    
    return await this.page.evaluate((buttonText) => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const button = buttons.find(b => b.textContent?.includes(buttonText));
      if (button) {
        (button as HTMLButtonElement).click();
        return true;
      }
      return false;
    }, text);
  }

  async findElement(selector: string): Promise<boolean> {
    if (!this.page) throw new Error('Page not initialized');
    const element = await this.page.$(selector);
    return !!element;
  }

  async getText(selector: string): Promise<string | null> {
    if (!this.page) throw new Error('Page not initialized');
    return await this.page.$eval(selector, el => el.textContent);
  }

  async evaluate<T>(fn: () => T): Promise<T> {
    if (!this.page) throw new Error('Page not initialized');
    return await this.page.evaluate(fn);
  }

  async wait(ms: number): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, ms));
  }

  async takeScreenshot(name: string): Promise<string> {
    if (!this.page) throw new Error('Page not initialized');
    const path = `screenshot-${name}-${Date.now()}.png`;
    await this.page.screenshot({ path, fullPage: true });
    return path;
  }

  getPage(): Page | null {
    return this.page;
  }

  async setup(): Promise<Page> {
    await this.connect();
    if (!this.page) throw new Error('Failed to connect');
    return this.page;
  }

  async cleanup(): Promise<void> {
    // Don't close the browser in cleanup as we're using an existing instance
    this.page = null;
    this.browser = null;
  }

  async takeScreenshot(page: Page, name: string): Promise<string> {
    const path = `screenshot-${name}-${Date.now()}.png`;
    await page.screenshot({ path, fullPage: true });
    console.log(`📸 Screenshot saved: ${path}`);
    return path;
  }

  async getConsoleErrors(): Promise<string[]> {
    return this.pageErrors.filter(log => log.includes('error') || log.includes('Error'));
  }

  printTestResults(results: TestResult[]): void {
    console.log('\n📊 Test Results Summary\n');
    console.log('═'.repeat(60));
    
    let passed = 0;
    let failed = 0;
    
    results.forEach(result => {
      const status = result.success ? '✅ PASS' : '❌ FAIL';
      const duration = `${result.duration}ms`;
      
      console.log(`${status} | ${result.testName.padEnd(30)} | ${duration.padStart(8)}`);
      
      if (result.success) {
        passed++;
      } else {
        failed++;
        console.log(`     Error: ${result.details.error}`);
        if (result.screenshots.length > 0) {
          console.log(`     Screenshots: ${result.screenshots.join(', ')}`);
        }
      }
    });
    
    console.log('═'.repeat(60));
    console.log(`Total: ${results.length} | Passed: ${passed} | Failed: ${failed}`);
    console.log('═'.repeat(60));
  }
}