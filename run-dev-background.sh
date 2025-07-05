#!/bin/bash

# Script to run npm dev server in background for Claude
# This ensures the dev server doesn't block Claude's execution

echo "🚀 Starting dev server in background mode..."

# Kill any existing servers
pkill -f "remote-debugging-port=9222" 2>/dev/null || true
pkill -f "vite" 2>/dev/null || true
# Also kill any Puppeteer Chrome instances
pkill -f "puppeteer_dev_chrome_profile" 2>/dev/null || true

# Give processes time to clean up
sleep 2

# Start dev server with nohup
nohup npm run dev > /tmp/workout-dev.log 2>&1 &
DEV_PID=$!

echo "⏳ Waiting for server to start (PID: $DEV_PID)..."

# Wait for server with visual feedback
for i in {1..30}; do
    if curl -s http://localhost:5173 > /dev/null 2>&1; then
        echo ""
        echo "✅ Development server is running!"
        echo "🌐 Vite: http://localhost:5173"
        echo "🔍 Chrome Debug: http://localhost:9222"
        echo "📝 Logs: tail -f /tmp/workout-dev.log"
        echo "🛑 Stop: kill $DEV_PID"
        echo ""
        echo "Server PID saved to: /tmp/workout-dev.pid"
        echo $DEV_PID > /tmp/workout-dev.pid
        exit 0
    fi
    
    # Show progress
    if [ $((i % 5)) -eq 0 ]; then
        echo "Still waiting... ($i/30 seconds)"
    fi
    
    sleep 1
done

echo "❌ Server failed to start. Check logs:"
tail -20 /tmp/workout-dev.log
exit 1