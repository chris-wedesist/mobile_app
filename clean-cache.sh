#!/bin/bash

echo "Clearing all caches and build artifacts..."

# Stop any running processes
npx kill-port 8081 19000 19001 19002

# Clear watchman watches
watchman watch-del-all

# Clear metro bundler cache
rm -rf $TMPDIR/metro-*
rm -rf $TMPDIR/haste-map-*

# Clear npm cache
npm cache clean --force

# Remove node_modules
rm -rf node_modules/
rm -rf ios/Pods/
rm -rf android/.gradle/

# Remove Expo cache
rm -rf ~/.expo/
rm -rf .expo/

# Remove any build directories
rm -rf ios/build/
rm -rf android/app/build/
rm -rf web-build/
rm -rf .next/
rm -rf dist/

# Re-install dependencies
npm install

echo "Cache cleared successfully." 