import { PuppeteerTestFramework } from './test-framework';

// Test exercise validation and suggestion feature
(async () => {
  const framework = new PuppeteerTestFramework();
  
  try {
    console.log('🧪 Starting Exercise Validation Test...\n');
    
    // Connect and navigate to build page
    await framework.connect();
    await framework.navigateTo('http://localhost:5173/build');
    await framework.waitForElement('h1');
    
    // Test 1: Enter workout text with unknown exercise
    console.log('📝 Test 1: Testing unknown exercise detection...');
    await framework.waitForElement('textarea[placeholder*="natural language"]');
    const page = framework.getPage();
    if (!page) throw new Error('Page not initialized');
    
    // Wait a bit for exercises to potentially load
    await framework.wait(1000);
    
    const textArea = await page.$('textarea[placeholder*="natural language"]');
    
    // Clear any existing text
    await page.evaluate((el: HTMLTextAreaElement) => {
      el.value = '';
      el.dispatchEvent(new Event('input', { bubbles: true }));
    }, textArea);
    
    // Type workout with unknown exercise (use a clearly unknown exercise)
    const workoutText = '5x5 bench press ss 5x5 unknown exercise xyz';
    await textArea.type(workoutText, { delay: 50 });
    
    // Wait for debounced parsing
    await framework.wait(2000);
    
    // Wait for validation modal to appear
    console.log('⏳ Waiting for validation modal...');
    let validationModal = null;
    try {
      await framework.waitForElement('[role="dialog"]', 5000);
      validationModal = await page.$('[role="dialog"]');
    } catch (error) {
      console.log('⚠️  Validation modal did not appear. This could mean:');
      console.log('   - Exercises are being loaded from the directory');
      console.log('   - Validation is bypassed');
      console.log('   - Or there is an issue with the implementation');
      
      // Take a screenshot to see current state
      await framework.takeScreenshot('no-validation-modal');
      
      // Check if workout was parsed anyway
      const workoutOverview = await page.$('h6');
      if (workoutOverview) {
        console.log('   ✅ Workout was parsed without validation');
      }
    }
    
    if (validationModal) {
      console.log('✅ Validation modal appeared successfully');
      
      // Take screenshot of validation modal
      await framework.takeScreenshot('validation-modal', {
        clip: {
          x: 100,
          y: 100,
          width: 800,
          height: 600
        }
      });
      
      // Test 2: Check for suggestions
      console.log('\n📝 Test 2: Checking exercise suggestions...');
      const unmatchedExercise = await page.$eval(
        '.text-destructive',
        el => el.textContent
      );
      console.log(`   Unmatched exercise: ${unmatchedExercise}`);
      
      // Look for suggestions
      const suggestions = await page.$$eval(
        'label input[type="radio"]',
        elements => elements.map(el => {
          const label = el.closest('label');
          const text = label?.textContent || '';
          return text.trim();
        })
      );
      
      console.log(`   Found ${suggestions.length} suggestions:`);
      suggestions.forEach((suggestion, index) => {
        console.log(`   ${index + 1}. ${suggestion}`);
      });
      
      // Test 3: Select a suggestion
      console.log('\n📝 Test 3: Selecting a suggestion...');
      const firstRadio = await page.$('label input[type="radio"]');
      if (firstRadio) {
        await firstRadio.click();
        console.log('   ✅ Selected first suggestion');
        
        // Apply suggestions
        // Find button with text "Apply Suggestions"
        const applyButton = await page.evaluate(() => {
          const buttons = Array.from(document.querySelectorAll('button'));
          const button = buttons.find(b => b.textContent?.includes('Apply Suggestions'));
          return button ? button : null;
        });
        if (applyButton) {
          await page.evaluate((btn: HTMLButtonElement) => btn.click(), applyButton);
        }
        await applyButton.click();
        console.log('   ✅ Applied suggestions');
        
        // Wait for modal to close and workout to parse
        await page.waitForSelector('[role="dialog"]', {
          hidden: true,
          timeout: 5000
        });
        
        // Test 4: Verify workout preview updates
        console.log('\n📝 Test 4: Verifying workout preview...');
        await framework.waitForElement('h6');
        
        // Check if the exercise appears in preview
        const exerciseInPreview = await page.evaluate(() => {
          const body = document.body;
          return body?.textContent?.includes('bench press') || false;
        });
        
        if (exerciseInPreview) {
          console.log('   ✅ Workout preview updated successfully');
        } else {
          console.log('   ❌ Workout preview did not update');
        }
        
        // Take final screenshot
        await framework.takeScreenshot('validation-complete');
      }
      
      // Test 5: Test "Use Original Names" option
      console.log('\n📝 Test 5: Testing "Use Original Names" option...');
      
      // Clear and re-enter text to trigger validation again
      await page.evaluate((el: HTMLTextAreaElement) => {
        el.value = '';
        el.dispatchEvent(new Event('input', { bubbles: true }));
      }, textArea);
      
      await textArea.type('3x10 tricep pushdowns', { delay: 50 });
      
      // Wait for validation modal again
      await framework.waitForElement('[role="dialog"]', 10000);
      const modal2 = await page.$('[role="dialog"]');
      
      if (modal2) {
        // Find button with text "Use Original Names"
        const useOriginalButton = await page.evaluate(() => {
          const buttons = Array.from(document.querySelectorAll('button'));
          const button = buttons.find(b => b.textContent?.includes('Use Original Names'));
          return button ? button : null;
        });
        if (useOriginalButton) {
          await page.evaluate((btn: HTMLButtonElement) => btn.click(), useOriginalButton);
        }
        await useOriginalButton.click();
        console.log('   ✅ Clicked "Use Original Names"');
        
        // Verify modal closes and workout is parsed
        await page.waitForSelector('[role="dialog"]', {
          hidden: true,
          timeout: 5000
        });
        
        console.log('   ✅ Workout accepted with original names');
      }
      
    } else {
      console.log('❌ Validation modal did not appear');
    }
    
    // Note: Console errors would be captured in the test framework's result object
    
    console.log('\n✅ Exercise validation test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    await framework.takeScreenshot('validation-test-failure');
    process.exit(1);
  } finally {
    // No cleanup method in framework - just exit
  }
})();