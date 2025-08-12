// ========================================================================
// EXPO GO COMPATIBLE POLYFILLS
// ========================================================================

// STEP 1: React Native Crypto Polyfill
// This is required for React Native to provide crypto.getRandomValues()
import 'react-native-get-random-values';

// STEP 2: Buffer Polyfill for packages like react-native-svg
if (typeof globalThis !== 'undefined' && typeof globalThis.Buffer === 'undefined') {
  try {
    const { Buffer } = require('buffer');
    globalThis.Buffer = Buffer;
  } catch (e) {
    // Fallback if buffer package is not available
    console.warn('Buffer polyfill not available');
  }
}
