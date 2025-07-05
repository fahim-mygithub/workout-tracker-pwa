# Claude Dev Server Hook Documentation

## Overview

This document describes the Claude hook implementation for handling `npm run dev` commands that start long-running development servers.

## Problem Statement

When Claude runs `npm run dev`, it waits for the command to complete. Since dev servers run indefinitely, this blocks Claude's execution and causes timeouts.

## Solution

We've implemented a multi-layered solution:

### 1. Background Script (`run-dev-background.sh`)

A simple script that:
- Kills any existing dev servers
- Starts the dev server in background with nohup
- Waits for the server to be ready
- Returns immediately after server is confirmed running

**Usage:**
```bash
cd /home/fahim/ClaudeProjects/WorkoutAppPWA
./run-dev-background.sh
```

### 2. Claude Hooks Configuration

Located in `/home/fahim/.claude/`:

#### Files Created:
- `hooks/npm-dev-hook.sh` - Hook script that intercepts npm run dev
- `hooks/puppeteer-health-check.js` - Optional Puppeteer verification
- `hooks/dev-server-wrapper.js` - Node.js wrapper for advanced handling
- `hooks.json` - Hook configuration file

#### Hook Configuration:
```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "/home/fahim/.claude/hooks/npm-dev-hook.sh"
          }
        ]
      }
    ]
  }
}
```

### 3. Settings Integration

Added hooks to `/home/fahim/.claude/settings.local.json`:
```json
{
  "permissions": { ... },
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "/home/fahim/.claude/hooks/npm-dev-hook.sh"
          }
        ]
      }
    ]
  }
}
```

## How It Works

1. When Claude executes a Bash command containing "npm run dev"
2. The PreToolUse hook intercepts the command
3. The hook script:
   - Detects the npm run dev pattern
   - Starts the server in background
   - Waits for server readiness
   - Returns control to Claude
4. Server continues running independently

## Benefits

- Claude doesn't block on long-running servers
- Automatic server readiness verification
- Chrome debugging port available for Puppeteer
- Server logs captured for debugging
- Clean process management with PID tracking

## Server Management

After starting:
- **URL**: http://localhost:5173
- **Chrome Debug**: http://localhost:9222
- **Logs**: `tail -f /tmp/workout-dev.log`
- **Stop**: `kill $(cat /tmp/workout-dev.pid)`

## Testing

To test the hook:
```bash
cd /home/fahim/ClaudeProjects/WorkoutAppPWA
npm run dev  # This will be intercepted by the hook
```

Or use the background script directly:
```bash
./run-dev-background.sh
```

## Future Enhancements

1. Auto-detect different server ports
2. Support for other dev commands (yarn, pnpm)
3. Automatic server cleanup on Claude exit
4. Health check integration with server status reporting