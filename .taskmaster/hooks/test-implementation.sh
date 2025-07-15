#!/bin/bash

# Test Implementation Hook
# This hook runs Puppeteer tests after implementing or fixing features

echo "🧪 Running automated tests for implementation verification..."

# Check if feature requires testing
if [ -z "$1" ]; then
  echo "Usage: ./test-implementation.sh <feature-name>"
  exit 1
fi

FEATURE_NAME=$1
TEST_FILE="src/tests/puppeteer/${FEATURE_NAME}.test.ts"

# Check if test file exists
if [ ! -f "$TEST_FILE" ]; then
  echo "⚠️  No test file found for feature: $FEATURE_NAME"
  echo "   Expected: $TEST_FILE"
  exit 0
fi

# Ensure dev server is running
if ! lsof -i :5173 > /dev/null; then
  echo "❌ Dev server not running on port 5173"
  echo "   Please run 'npm run dev' first"
  exit 1
fi

# Run the test
echo "📋 Running test: $TEST_FILE"
npx tsx "$TEST_FILE"

# Capture exit code
TEST_RESULT=$?

if [ $TEST_RESULT -eq 0 ]; then
  echo "✅ Tests passed successfully!"
else
  echo "❌ Tests failed with exit code: $TEST_RESULT"
  
  # Check for screenshots
  SCREENSHOTS=$(ls -1 test-failure-*.png screenshot-*.png 2>/dev/null)
  if [ -n "$SCREENSHOTS" ]; then
    echo "📸 Screenshots captured:"
    echo "$SCREENSHOTS"
  fi
fi

exit $TEST_RESULT