import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Application from 'expo-application';
import { Platform } from 'react-native';

const DEVICE_ID_KEY = 'device_id';

/**
 * Generate a unique device identifier for rate limiting purposes
 * This combines multiple device characteristics to create a stable identifier
 */
export async function getDeviceId(): Promise<string> {
  try {
    // Check if we already have a stored device ID
    const storedId = await AsyncStorage.getItem(DEVICE_ID_KEY);
    if (storedId) {
      return storedId;
    }

    // Generate a new device ID based on available device info
    const deviceInfo = {
      installationId: Application.applicationId,
      platform: Platform.OS,
      version: Platform.Version,
      timestamp: Date.now()
    };

    // Create a hash-like identifier from device characteristics
    const deviceString = JSON.stringify(deviceInfo);
    const deviceId = btoa(deviceString).replace(/[^a-zA-Z0-9]/g, '').substring(0, 32);
    
    // Store for future use
    await AsyncStorage.setItem(DEVICE_ID_KEY, deviceId);
    
    return deviceId;
  } catch (error) {
    console.error('Failed to generate device ID:', error);
    // Fallback to timestamp-based ID
    const fallbackId = `fallback_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    return fallbackId;
  }
}

/**
 * Clear the stored device ID (useful for testing or privacy compliance)
 */
export async function clearDeviceId(): Promise<void> {
  try {
    await AsyncStorage.removeItem(DEVICE_ID_KEY);
  } catch (error) {
    console.error('Failed to clear device ID:', error);
  }
}

/**
 * Get device information for security logging
 */
export function getDeviceInfo() {
  return {
    platform: Platform.OS,
    version: Platform.Version,
    appVersion: Application.nativeApplicationVersion,
    buildVersion: Application.nativeBuildVersion,
  };
}
