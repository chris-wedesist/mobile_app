#!/bin/bash
echo "Cleaning up project environment..."

# Kill any running processes
npx kill-port 8081 19000 19001 19002

# Clear watchman
watchman watch-del-all

# Clear Metro cache
rm -rf $TMPDIR/metro-*
rm -rf $TMPDIR/haste-map-*

# Clear React Native cache
rm -rf $TMPDIR/react-*

# Clear project caches
rm -rf node_modules
rm -rf .expo
rm -rf ios/build
rm -rf android/build
rm -rf android/app/build

# Reinstall dependencies
npm install --legacy-peer-deps

echo "Cleanup complete!"
