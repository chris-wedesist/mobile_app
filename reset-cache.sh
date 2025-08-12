#!/bin/bash

echo "Clearing all caches..."

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

# Re-install dependencies
npm install

echo "Cache cleared successfully. Now restart your development server." 