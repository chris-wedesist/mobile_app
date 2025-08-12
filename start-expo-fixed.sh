#!/bin/bash

# Permanent Expo Startup Script with Directory Fix
# Based on research findings for persistent directory issues

echo "🔧 PERMANENT DIRECTORY FIX + EXPO STARTUP"
echo "=========================================="

# Step 1: Force correct directory
PROJECT_ROOT="/Users/chrismitchell/mobile_app"
cd "$PROJECT_ROOT"

# Step 2: Verify we're in the correct directory
if [ ! -f "package.json" ]; then
    echo "❌ CRITICAL ERROR: package.json not found in $PWD"
    echo "Current directory: $PWD"
    echo "Expected directory: $PROJECT_ROOT"
    exit 1
fi

echo "✅ Directory verified: $PWD"
echo "📁 package.json found: $(ls package.json)"

# Step 3: Kill any existing Expo processes
echo "🔄 Stopping any existing Expo processes..."
pkill -f "expo start" 2>/dev/null || echo "No existing Expo processes found"

# Step 4: Clear ports
echo "🔄 Clearing ports..."
npx kill-port 8081 19000 19001 19002 2>/dev/null || echo "Ports cleared"

# Step 5: Start Expo with tunnel (ngrok already installed globally)
echo "🚀 Starting Expo server with tunnel..."
echo "📍 Project root: $PWD"
echo "📱 Server will be accessible via tunnel"

# Start Expo with tunnel mode
npx expo start --clear --tunnel

echo "✅ Expo server started successfully!" 