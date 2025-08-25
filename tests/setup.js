// Jest setup file
import { NativeModules } from 'react-native';

// Mock expo-local-authentication
NativeModules.ExpoLocalAuthentication = {
  authenticateAsync: jest.fn(() => Promise.resolve({ success: true })),
  hasHardwareAsync: jest.fn(() => Promise.resolve(true)),
  isEnrolledAsync: jest.fn(() => Promise.resolve(true)),
  supportedAuthenticationTypesAsync: jest.fn(() => Promise.resolve([1, 2])), // Fingerprint, FaceID
  cancelAuthenticate: jest.fn(),
};

// Mock expo-screen-capture
NativeModules.ExpoScreenCapture = {
  preventScreenCaptureAsync: jest.fn(() => Promise.resolve()),
  allowScreenCaptureAsync: jest.fn(() => Promise.resolve()),
};

// Mock expo-secure-store
NativeModules.ExpoSecureStore = {
  setItemAsync: jest.fn(() => Promise.resolve()),
  getItemAsync: jest.fn(() => Promise.resolve(null)),
  deleteItemAsync: jest.fn(() => Promise.resolve()),
};

// Mock expo-device
jest.mock('expo-device', () => ({
  isDevice: true,
  brand: 'Apple',
  manufacturer: 'Apple',
  modelName: 'iPhone 12',
  deviceYearClass: 2020,
  totalMemory: 4000000000,
  isRootedExperimental: jest.fn(() => Promise.resolve(false)),
}));

// Mock expo-application
jest.mock('expo-application', () => ({
  applicationId: 'com.example.app',
  applicationName: 'Example App',
  nativeApplicationVersion: '1.0.0',
  nativeBuildVersion: '1',
}));

// Mock AppState
jest.mock('react-native/Libraries/AppState/AppState', () => ({
  currentState: 'active',
  addEventListener: jest.fn(() => ({ remove: jest.fn() })),
}));

// Set up global timing mocks
global.setTimeout = jest.fn((cb) => cb());
global.clearTimeout = jest.fn();
global.setInterval = jest.fn(() => 1);
global.clearInterval = jest.fn();
global.Date.now = jest.fn(() => 1600000000000);

// Suppress console errors during tests
console.error = jest.fn();
console.warn = jest.fn();
