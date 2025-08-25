#!/bin/bash

# DESIST Management Server Startup Script

SERVER_DIR="/Users/chrismitchell/mobile_app/server"

echo "🚀 Starting DESIST Management Server..."
echo "📁 Server directory: $SERVER_DIR"

# Change to server directory
cd "$SERVER_DIR"

# Check if package.json exists
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found in $SERVER_DIR"
    exit 1
fi

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Start the server
echo "🔥 Starting server in development mode..."
echo "🌐 Server will be available at: http://localhost:3000"
echo "📋 API documentation: http://localhost:3000/api"
echo "💓 Health check: http://localhost:3000/health"
echo ""

npm run dev
