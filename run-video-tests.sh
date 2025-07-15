#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Running Video Display Puppeteer Tests...${NC}"
echo "========================================"

# Create screenshots directory
mkdir -p screenshots

# Check if dev server is running
if ! curl -s http://localhost:5173 > /dev/null; then
  echo -e "${RED}Error: Dev server is not running on http://localhost:5173${NC}"
  echo "Please run 'npm run dev' in another terminal"
  exit 1
fi

# Install jest if not already installed
if ! command -v jest &> /dev/null; then
  echo -e "${YELLOW}Installing Jest...${NC}"
  npm install --save-dev jest @types/jest ts-jest
fi

# Run the video display tests
echo -e "${GREEN}Running video display tests...${NC}"
npx ts-node --transpile-only src/tests/puppeteer/video-display.test.ts

# Check if tests passed
if [ $? -eq 0 ]; then
  echo -e "${GREEN}✅ All video display tests passed!${NC}"
  echo ""
  echo "Screenshots saved in ./screenshots/"
  ls -la screenshots/
else
  echo -e "${RED}❌ Some tests failed${NC}"
  exit 1
fi