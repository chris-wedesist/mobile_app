#!/bin/bash

echo "=== APPLYING EXPO DEV CLIENT MIGRATION ==="

# Install required packages
npm install expo-dev-client expo-application @react-native-async-storage/async-storage --legacy-peer-deps

# Install additional dependencies for the utilities
npm install expo-application expo-constants --legacy-peer-deps

# Update index.js to import dev client extensions (if needed)
if ! grep -q "import './dev-client-extensions';" index.js; then
  # Get the line number of the first import
  first_import_line=$(grep -n "import " index.js | head -1 | cut -d':' -f1)
  
  # Add our import after the first import
  sed -i "${first_import_line}a import './dev-client-extensions';" index.js
  echo "Added dev-client-extensions import to index.js"
fi

# Create a minimal example of how to integrate the DevEnvironmentInfo
echo '
// HOW TO INTEGRATE DevEnvironmentInfo:
// In your App.js or similar component:

import { DevEnvironmentInfo } from "./dev-environment";

export default function App() {
  return (
    <View style={{flex: 1}}>
      {/* Your existing app */}
      {__DEV__ && <DevEnvironmentInfo />}
    </View>
  );
}
' > dev-environment-example.js

echo "=== MIGRATION ASSETS CREATED ==="
echo "Next steps:"
echo "1. Run 'eas build --profile development --platform ios' (or android)"
echo "2. Install the build on your device when complete"
echo "3. Start development server with 'npm run start-dev-client'"
echo "=== MIGRATION COMPLETE ==="
