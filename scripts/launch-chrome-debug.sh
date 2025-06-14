#!/bin/bash

# Kill any existing Chrome instances with debugging port
pkill -f "remote-debugging-port=9222" || true

# Launch Chrome with remote debugging enabled
google-chrome \
  --remote-debugging-port=9222 \
  --user-data-dir=/tmp/chrome-debug \
  --disable-background-timer-throttling \
  --disable-backgrounding-occluded-windows \
  --disable-renderer-backgrounding \
  --no-first-run \
  --no-default-browser-check \
  "$@" &

echo "Chrome launched with debugging on port 9222"
echo "Puppeteer can now connect using: puppeteer.connect({ browserURL: 'http://localhost:9222' })"