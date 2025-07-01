import { expect, test } from '@playwright/test';

test.describe('Profile Page', () => {
  // Helper to login before tests
  async function login(page: any) {
    await page.goto('http://localhost:5173/login');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'testpassword123');
    await page.click('button:has-text("Sign In")');
    await page.waitForURL('**/');
  }

  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto('http://localhost:5173/profile');
    await page.waitForLoadState('networkidle');
  });

  test('should display profile page with all sections', async ({ page }) => {
    // Check page title
    await expect(page.locator('h1')).toContainText('Profile & Settings');

    // Check all main sections are present
    await expect(page.locator('text=Personal Information')).toBeVisible();
    await expect(page.locator('text=BMI Calculator')).toBeVisible();
    await expect(page.locator('text=My Workouts')).toBeVisible();
    await expect(page.locator('text=Appearance')).toBeVisible();
    await expect(page.locator('text=Units & Measurements')).toBeVisible();
    await expect(page.locator('text=Workout Settings')).toBeVisible();
    await expect(page.locator('text=Notifications')).toBeVisible();
    await expect(page.locator('text=Export Data')).toBeVisible();
  });

  test('should edit personal information', async ({ page }) => {
    // Click edit button
    await page.click('button:has-text("Edit"):near(:text("Personal Information"))');
    
    // Fill in form
    await page.fill('input[placeholder="Enter your name"]', 'John Doe');
    await page.fill('input[type="date"]', '1990-01-15');
    await page.selectOption('select:near(:text("Gender"))', 'male');
    await page.selectOption('select:near(:text("Experience Level"))', 'intermediate');
    
    // Save changes
    await page.click('button:has-text("Save"):near(:text("Personal Information"))');
    
    // Verify changes were saved
    await expect(page.locator('text=John Doe')).toBeVisible();
    await expect(page.locator('text=Male')).toBeVisible();
    await expect(page.locator('text=Intermediate')).toBeVisible();
  });

  test('should calculate BMI', async ({ page }) => {
    // Click edit button for BMI
    await page.click('button:has-text("Edit"):near(:text("BMI Calculator"))');
    
    // Enter height and weight
    await page.fill('input[placeholder="Height in cm"]', '180');
    await page.fill('input[placeholder="Weight in kg"]', '75');
    
    // Save
    await page.click('button:has-text("Save"):near(:text("BMI Calculator"))');
    
    // Check BMI is calculated
    await expect(page.locator('text=Your BMI')).toBeVisible();
    await expect(page.locator('text=Normal')).toBeVisible();
    await expect(page.locator('text=Healthy Weight Range')).toBeVisible();
  });

  test('should toggle dark mode', async ({ page }) => {
    // Find dark mode toggle
    const darkModeToggle = page.locator('button[aria-pressed]').first();
    
    // Click to enable dark mode
    await darkModeToggle.click();
    
    // Verify toggle state changed
    await expect(darkModeToggle).toHaveAttribute('aria-pressed', 'true');
  });

  test('should change unit system', async ({ page }) => {
    // Click Imperial button
    await page.click('button:has-text("Imperial (lbs, ft)")');
    
    // Verify button is selected
    await expect(page.locator('button:has-text("Imperial (lbs, ft)")')).toHaveClass(/bg-primary-600/);
  });

  test('should update rest timer settings', async ({ page }) => {
    // Find rest time input
    const restTimeInput = page.locator('input[type="number"][min="30"]');
    
    // Clear and enter new value
    await restTimeInput.fill('120');
    
    // Verify value was updated
    await expect(restTimeInput).toHaveValue('120');
  });

  test('should show export options', async ({ page }) => {
    // Check export buttons are visible
    await expect(page.locator('button:has-text("Export as CSV")')).toBeVisible();
    await expect(page.locator('button:has-text("Export as PDF")')).toBeVisible();
    
    // Click CSV export
    await page.click('button:has-text("Export as CSV")');
    
    // Should show coming soon alert
    await page.waitForFunction(() => {
      const alerts = Array.from(document.querySelectorAll('*')).filter(
        el => el.textContent?.includes('Export as CSV coming soon!')
      );
      return alerts.length > 0;
    });
  });

  test('should navigate to build page when no workouts', async ({ page }) => {
    // If there are no workouts, should show create button
    const createButton = page.locator('button:has-text("Create Your First Workout")');
    
    if (await createButton.isVisible()) {
      await createButton.click();
      await expect(page).toHaveURL(/.*\/build/);
    }
  });

  test('should handle profile picture upload', async ({ page }) => {
    // Create a test image file
    const buffer = Buffer.from('fake-image-data');
    
    // Upload file
    const fileInput = page.locator('input[type="file"][accept="image/*"]');
    await fileInput.setInputFiles({
      name: 'test-photo.jpg',
      mimeType: 'image/jpeg',
      buffer: buffer
    });
    
    // Wait for upload (would normally upload to Firebase)
    await page.waitForTimeout(1000);
  });

  test('should update notification preferences', async ({ page }) => {
    // Find notification toggles
    const notificationToggles = page.locator('button[aria-pressed]');
    
    // Toggle each notification setting
    const count = await notificationToggles.count();
    for (let i = 0; i < count; i++) {
      const toggle = notificationToggles.nth(i);
      const initialState = await toggle.getAttribute('aria-pressed');
      await toggle.click();
      
      // Verify state changed
      const newState = await toggle.getAttribute('aria-pressed');
      expect(newState).not.toBe(initialState);
    }
  });
});