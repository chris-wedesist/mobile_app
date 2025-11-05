import { BackHandler, Platform } from 'react-native';

/**
 * Executes panic mode - signs out user and closes the app
 * Note: signOut should be called from the component before calling this
 */
export async function executePanicMode(): Promise<boolean> {
  try {
    console.log('🚨 PANIC MODE ACTIVATED - Closing app...');
    
    // Try to close/minimize the app
    if (Platform.OS === 'android') {
      // On Android, BackHandler.exitApp() will close the app
      BackHandler.exitApp();
      return true;
    } else if (Platform.OS === 'ios') {
      // On iOS, we can't programmatically close the app per Apple guidelines
      // Signing out will effectively lock the app, which is the best we can do
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('❌ PANIC MODE: Error executing panic mode:', error);
    return false;
  }
}

