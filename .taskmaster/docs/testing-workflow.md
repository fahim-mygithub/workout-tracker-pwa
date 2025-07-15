# Testing Workflow for Feature Implementation

## Overview
This document outlines the testing workflow that should be followed when implementing or fixing features in the Workout Tracker PWA.

## Workflow Steps

### 1. Implementation Phase
- Write the feature code
- Ensure TypeScript compilation passes (`npm run typecheck`)
- Fix any linting issues (`npm run lint`)

### 2. Create Puppeteer Test Plan
For each feature implementation, create a test file in `src/tests/puppeteer/`:

```typescript
// Example: src/tests/puppeteer/feature-name.test.ts
import { PuppeteerTestFramework } from './test-framework';

async function runFeatureTests() {
  const framework = new PuppeteerTestFramework();
  await framework.connect();
  
  const results = [];
  
  // Add your test cases here
  results.push(await framework.runTest('Test Case Name', async (page) => {
    // Test implementation
    return { testData: 'results' };
  }));
  
  framework.printTestResults(results);
  return results.every(r => r.success);
}

runFeatureTests()
  .then(success => process.exit(success ? 0 : 1))
  .catch(error => {
    console.error('Test failed:', error);
    process.exit(1);
  });
```

### 3. Test Execution
Run tests using the test implementation hook:
```bash
./.taskmaster/hooks/test-implementation.sh feature-name
```

### 4. Test Coverage Guidelines

#### For UI Features:
- Navigate to the feature page
- Check that all elements render correctly
- Verify interactive elements work (buttons, inputs, etc.)
- Test state changes and updates
- Capture console logs and errors

#### For Data Features:
- Verify data loads correctly
- Test CRUD operations
- Check error handling
- Validate state management

#### For Video/Media Features:
- Check media elements load
- Verify playback controls
- Test autoplay behavior
- Validate fallback mechanisms

### 5. Console Output Analysis
The test framework automatically captures:
- Console logs (debug, info, warn, error)
- Page errors
- Network failures

Review these outputs to identify issues not caught by assertions.

### 6. Screenshot Analysis
On test failure, screenshots are automatically captured:
- `test-failure-{test-name}-{timestamp}.png`
- `screenshot-{name}-{timestamp}.png`

Review screenshots to understand visual issues.

## Example: Video Playback Test

```typescript
// src/tests/puppeteer/video-playback.test.ts
results.push(await framework.runTest('Video Elements Present', async (page) => {
  const videoCheck = await framework.evaluate(() => {
    const iframe = document.querySelector('iframe[src*="youtube.com/embed"]');
    const thumbnail = document.querySelector('img[src*="youtube.com/vi"]');
    
    return {
      hasIframe: !!iframe,
      iframeSrc: iframe?.getAttribute('src') || null,
      hasThumbnail: !!thumbnail,
    };
  });
  
  if (!videoCheck.hasIframe && !videoCheck.hasThumbnail) {
    throw new Error('No video elements found');
  }
  
  return videoCheck;
}));
```

## Best Practices

1. **Test Isolation**: Each test should be independent and not rely on previous test state
2. **Clear Assertions**: Use descriptive error messages that explain what failed
3. **Wait Strategies**: Use appropriate wait methods:
   - `framework.wait(ms)` for simple delays
   - `page.waitForNavigation()` for page changes
   - `framework.waitForElement()` for dynamic content
4. **Error Handling**: Always include try-catch blocks for better error reporting
5. **Cleanup**: Tests should not leave the application in an inconsistent state

## Integration with Development Workflow

1. **Pre-commit**: Run relevant tests before committing
2. **Post-implementation**: Always create and run tests for new features
3. **Bug Fixes**: Create regression tests for fixed bugs
4. **Documentation**: Update test documentation when adding new test patterns

## Troubleshooting

### Common Issues:
- **Timeout Errors**: Increase wait times or check if elements exist
- **Navigation Errors**: Ensure proper wait for navigation completion
- **Selector Issues**: Use more specific or flexible selectors
- **Port Conflicts**: Verify dev server is running on expected port

### Debug Mode:
Enable verbose logging by adding to your test:
```typescript
page.on('console', msg => console.log('PAGE LOG:', msg.text()));
page.on('pageerror', error => console.log('PAGE ERROR:', error));
```