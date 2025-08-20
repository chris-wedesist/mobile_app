import { registerDevMenuItems } from 'expo-dev-client';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Register custom dev menu items
registerDevMenuItems([
  {
    name: 'Clear App Storage',
    callback: async () => {
      await AsyncStorage.clear();
      Alert.alert('Storage Cleared', 'App storage has been reset.');
    },
  },
  {
    name: 'Toggle Design Mode',
    callback: async () => {
      const current = await AsyncStorage.getItem('@DesignMode');
      const newValue = current === 'true' ? 'false' : 'true';
      await AsyncStorage.setItem('@DesignMode', newValue);
      Alert.alert(
        'Design Mode',
        `Design mode is now ${newValue === 'true' ? 'ON' : 'OFF'}`
      );
    },
  },
  {
    name: 'Simulate Error',
    callback: () => {
      throw new Error('Simulated error for testing');
    },
  },
]);
