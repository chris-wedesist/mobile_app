import { Alert, Button, View, Text, StyleSheet } from 'react-native';
import * as Application from 'expo-application';
import Constants from 'expo-constants';

export function DevEnvironmentInfo() {
  // Only show in development builds
  if (!__DEV__) return null;
  
  const isDevClient = Constants.appOwnership !== 'expo';
  const version = Application.nativeApplicationVersion;
  const buildVersion = Application.nativeBuildVersion;
  
  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Development Environment</Text>
      <Text style={styles.info}>Client: {isDevClient ? 'Dev Client' : 'Expo Go'}</Text>
      <Text style={styles.info}>Version: {version} (Build {buildVersion})</Text>
      <Text style={styles.info}>JS Engine: {global.HermesInternal ? 'Hermes' : 'JSC'}</Text>
      <Button 
        title="Dev Settings" 
        onPress={() => Alert.alert(
          'Development Settings', 
          'What would you like to do?',
          [
            {text: 'Reload JS Bundle', onPress: () => {
              // Force reload the JS bundle
              if (global.__DEVTOOLS__) {
                global.__DEVTOOLS__.reload();
              }
            }},
            {text: 'Clear AsyncStorage', onPress: () => {
              // Clear local storage
              require('@react-native-async-storage/async-storage').default.clear();
              Alert.alert('Storage Cleared', 'AsyncStorage has been cleared.');
            }},
            {text: 'Cancel', style: 'cancel'}
          ]
        )} 
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 10,
    backgroundColor: '#1B2D45',
    borderRadius: 5,
    margin: 10,
  },
  heading: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 5,
  },
  info: {
    fontSize: 12,
    color: '#eeeeee',
    marginBottom: 3,
  }
});
