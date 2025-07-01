const puppeteer = require('puppeteer');

describe('Profile Page E2E Tests', () => {
  let browser;
  let page;

  beforeAll(async () => {
    browser = await puppeteer.launch({
      headless: false,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    page = await browser.newPage();
  });

  afterAll(async () => {
    await browser.close();
  });

  // Helper function to login
  async function login() {
    await page.goto('http://localhost:5173/login');
    
    // Wait for the login form
    await page.waitForSelector('input[type="email"]');
    
    // Fill in credentials
    await page.type('input[type="email"]', 'test@example.com');
    await page.type('input[type="password"]', 'testpassword123');
    
    // Click sign in button
    await page.click('button[type="submit"]');
    
    // Wait for navigation
    await page.waitForNavigation();
  }

  test('should navigate to profile page', async () => {
    // First login
    await login();
    
    // Navigate to profile
    await page.goto('http://localhost:5173/profile');
    
    // Wait for profile page to load
    await page.waitForSelector('h1');
    
    // Check page title
    const title = await page.$eval('h1', el => el.textContent);
    expect(title).toContain('Profile & Settings');
  }, 30000);

  test('should display all profile sections', async () => {
    await page.goto('http://localhost:5173/profile');
    
    // Check for main sections
    const sections = [
      'Personal Information',
      'BMI Calculator',
      'My Workouts',
      'Appearance',
      'Units & Measurements',
      'Workout Settings',
      'Notifications',
      'Export Data'
    ];
    
    for (const section of sections) {
      const element = await page.$x(`//*[contains(text(), "${section}")]`);
      expect(element.length).toBeGreaterThan(0);
    }
  }, 30000);

  test('should edit personal information', async () => {
    await page.goto('http://localhost:5173/profile');
    
    // Click edit button
    const editButton = await page.$('button:has-text("Edit")');
    if (editButton) {
      await editButton.click();
      
      // Wait for form to be editable
      await page.waitForSelector('input[placeholder="Enter your name"]');
      
      // Clear and type new name
      const nameInput = await page.$('input[placeholder="Enter your name"]');
      await nameInput.click({ clickCount: 3 }); // Triple click to select all
      await nameInput.type('John Doe');
      
      // Save changes
      const saveButton = await page.$('button:has-text("Save")');
      await saveButton.click();
      
      // Wait for save to complete
      await page.waitForTimeout(1000);
      
      // Verify the name was updated
      const displayName = await page.$eval('p.text-base', el => el.textContent);
      expect(displayName).toBe('John Doe');
    }
  }, 30000);

  test('should calculate BMI', async () => {
    await page.goto('http://localhost:5173/profile');
    
    // Find and click BMI edit button
    const bmiSection = await page.$('text=BMI Calculator');
    const editButton = await page.evaluateHandle(
      el => el.closest('.rounded-xl').querySelector('button'),
      bmiSection
    );
    
    if (editButton) {
      await editButton.click();
      
      // Enter height and weight
      await page.type('input[placeholder*="Height"]', '180');
      await page.type('input[placeholder*="Weight"]', '75');
      
      // Save
      const saveButton = await page.$('button:has-text("Save")');
      await saveButton.click();
      
      // Wait for calculation
      await page.waitForTimeout(1000);
      
      // Check if BMI is displayed
      const bmiValue = await page.$('text=Your BMI');
      expect(bmiValue).toBeTruthy();
    }
  }, 30000);

  test('should toggle dark mode', async () => {
    await page.goto('http://localhost:5173/profile');
    
    // Find dark mode toggle
    const darkModeSection = await page.$('text=Dark Mode');
    const toggle = await page.evaluateHandle(
      el => el.closest('div').querySelector('button[aria-pressed]'),
      darkModeSection
    );
    
    if (toggle) {
      // Get initial state
      const initialState = await toggle.evaluate(el => el.getAttribute('aria-pressed'));
      
      // Click toggle
      await toggle.click();
      
      // Wait for state change
      await page.waitForTimeout(500);
      
      // Check new state
      const newState = await toggle.evaluate(el => el.getAttribute('aria-pressed'));
      expect(newState).not.toBe(initialState);
    }
  }, 30000);

  test('should save workout from build page', async () => {
    // Navigate to build page
    await page.goto('http://localhost:5173/build');
    
    // Wait for text area
    await page.waitForSelector('textarea');
    
    // Enter workout text
    await page.type('textarea', '3x10 Bench Press @135lbs\n3x12 Dumbbell Flyes @30lbs');
    
    // Wait for parsing
    await page.waitForTimeout(1000);
    
    // Click save workout button
    const saveButton = await page.$('button:has-text("Save Workout")');
    if (saveButton) {
      await saveButton.click();
      
      // Wait for modal
      await page.waitForSelector('input[placeholder*="Upper Body"]');
      
      // Fill in workout details
      await page.type('input[placeholder*="Upper Body"]', 'Test Workout');
      await page.type('textarea[placeholder*="Brief description"]', 'Test workout description');
      await page.type('input[placeholder*="strength"]', 'test, upper body');
      
      // Save workout
      const confirmSaveButton = await page.$('button:has-text("Save Workout"):not(:has-text("Saving"))');
      await confirmSaveButton.click();
      
      // Should navigate to profile
      await page.waitForNavigation();
      
      // Verify we're on profile page
      const url = page.url();
      expect(url).toContain('/profile');
    }
  }, 30000);
});