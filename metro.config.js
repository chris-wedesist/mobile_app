const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add support for expo-router
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

// Handle environment variables
config.resolver.alias = {
  ...config.resolver.alias,
  // Ensure process.env is available
  'process.env': 'process.env',
};

module.exports = config; 