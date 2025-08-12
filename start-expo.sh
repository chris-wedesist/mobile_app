#!/bin/bash

# Kill any processes on the Expo and Metro ports
echo "Ensuring ports are free..."
npx kill-port 8081 19000 19001 19002

# Start with clean cache
echo "Starting with clean Metro cache..."
export METRO_CLEAR_CACHE=true

# Set higher memory limit for Node
export NODE_OPTIONS=--max_old_space_size=4096

# Start Expo with specific configuration
echo "Starting Expo server..."
npx expo start --clear --no-dev --minify 