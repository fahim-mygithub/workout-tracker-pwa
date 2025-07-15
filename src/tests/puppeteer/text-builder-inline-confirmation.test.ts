import { PuppeteerTestFramework } from './helpers/framework';

describe('Text Builder Inline Confirmation', () => {
  const framework = new PuppeteerTestFramework();

  beforeAll(async () => {
    await framework.setUp();
  });

  afterAll(async () => {
    await framework.tearDown();
  });

  it('should display inline confirmation instead of modal when typing exercises', async () => {
    // Navigate to the build page
    await framework.navigateTo('/build');
    
    // Wait for the page to load
    await framework.waitForElement('h1', { text: 'Build Workout' });
    
    // Find and focus the workout text textarea
    const textareaSelector = 'textarea[placeholder*="Enter your workout"]';
    await framework.waitForElement(textareaSelector);
    
    // Type an exercise that will trigger validation
    await framework.page.type(textareaSelector, '5x5 ben');
    
    // Wait a moment for the parser to process
    await framework.page.waitForTimeout(1000);
    
    // Take screenshot to verify inline confirmation appears
    await framework.takeScreenshot('text-builder-inline-confirmation');
    
    // Check that inline confirmation is visible
    const inlineConfirmation = await framework.page.$eval(
      '.border-blue-200.bg-blue-50',
      el => ({
        exists: true,
        text: el.textContent,
        isVisible: window.getComputedStyle(el).display !== 'none'
      })
    ).catch(() => ({ exists: false, text: '', isVisible: false }));
    
    expect(inlineConfirmation.exists).toBe(true);
    expect(inlineConfirmation.isVisible).toBe(true);
    expect(inlineConfirmation.text).toContain('Confirm Exercises');
    
    // Verify no modal is present
    const modalCount = await framework.page.$$eval(
      '[role="dialog"]',
      modals => modals.length
    );
    expect(modalCount).toBe(0);
    
    // Verify user can continue typing
    await framework.page.type(textareaSelector, 'ch press');
    await framework.page.waitForTimeout(500);
    
    // Get the current value
    const textareaValue = await framework.page.$eval(
      textareaSelector,
      (el: any) => el.value
    );
    expect(textareaValue).toBe('5x5 bench press');
    
    // Check for console errors
    expect(framework.consoleErrors).toHaveLength(0);
  });

  it('should allow confirming exercises with inline buttons', async () => {
    // Clear the textarea first
    const textareaSelector = 'textarea[placeholder*="Enter your workout"]';
    await framework.page.click(textareaSelector, { clickCount: 3 });
    await framework.page.keyboard.press('Backspace');
    
    // Type a new exercise
    await framework.page.type(textareaSelector, '3x10 Kettlebell Single Arm Row On Bench');
    await framework.page.waitForTimeout(1000);
    
    // Take screenshot of confirmation state
    await framework.takeScreenshot('text-builder-confirmation-buttons');
    
    // Click "Confirm Exercises" button
    const confirmButton = await framework.page.$('button:has-text("Confirm Exercises")');
    expect(confirmButton).toBeTruthy();
    
    await confirmButton?.click();
    await framework.page.waitForTimeout(500);
    
    // Verify inline confirmation disappears
    const confirmationAfterClick = await framework.page.$('.border-blue-200.bg-blue-50');
    expect(confirmationAfterClick).toBeFalsy();
    
    // Verify parse status shows success
    const parseStatus = await framework.page.$eval(
      '.text-green-600',
      el => el.textContent
    ).catch(() => '');
    
    expect(parseStatus).toBeTruthy();
    
    // Take final screenshot
    await framework.takeScreenshot('text-builder-after-confirmation');
  });

  it('should work properly on mobile viewport', async () => {
    // Set mobile viewport
    await framework.page.setViewport({ width: 390, height: 844 });
    
    // Navigate to build page
    await framework.navigateTo('/build');
    await framework.waitForElement('h1', { text: 'Build Workout' });
    
    // Click on Text mode tab if needed
    const textTab = await framework.page.$('button:has-text("Workout Text")');
    if (textTab) {
      await textTab.click();
    }
    
    // Type exercise
    const textareaSelector = 'textarea[placeholder*="Enter your workout"]';
    await framework.waitForElement(textareaSelector);
    await framework.page.type(textareaSelector, '4x12 RDL');
    await framework.page.waitForTimeout(1000);
    
    // Take mobile screenshot
    await framework.takeScreenshot('text-builder-mobile-inline-confirmation');
    
    // Verify inline confirmation is visible on mobile
    const inlineConfirmation = await framework.page.$('.border-blue-200.bg-blue-50');
    expect(inlineConfirmation).toBeTruthy();
    
    // Verify no console errors
    expect(framework.consoleErrors).toHaveLength(0);
  });
});