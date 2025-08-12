// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Add minimal Node.js polyfills for packages that need them (like react-native-svg)
config.resolver.alias = {
  buffer: require.resolve('buffer'),
};

module.exports = config;
