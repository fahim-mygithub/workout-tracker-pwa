#!/bin/bash

# Kill any existing Chrome instances with debugging port
pkill -f "remote-debugging-port=9222" || true

echo "Starting Vite dev server..."

# Start Vite in the background
npm run dev &
VITE_PID=$!

# Wait for Vite to be ready
echo "Waiting for dev server to start..."
while ! curl -s http://localhost:5173 > /dev/null; do
  sleep 1
done

echo "Dev server is ready! Launching Chrome with debugging..."

# Launch Chrome with debugging
./scripts/launch-chrome-debug.sh http://localhost:5173

echo ""
echo "✅ Development environment ready!"
echo "   - Vite dev server: http://localhost:5173"
echo "   - Chrome debugging port: 9222"
echo "   - Puppeteer can connect to: http://localhost:9222"
echo ""
echo "Press Ctrl+C to stop both Chrome and the dev server"

# Wait for Vite process
wait $VITE_PID