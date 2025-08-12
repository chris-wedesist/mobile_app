import * as React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../constants/theme';

/**
 * Simple test component to verify Hermes compatibility
 * This component tests basic functionality without complex imports
 */
export const HermesTest: React.FC = () => {
  const [testValue, setTestValue] = React.useState('Hermes Test Passed');

  React.useEffect(() => {
    // Test basic JavaScript functionality
    try {
      // Test array methods
      const testArray = [1, 2, 3];
      const doubled = testArray.map(x => x * 2);
      console.log('Array test passed:', doubled);

      // Test object methods
      const testObject = { a: 1, b: 2 };
      const keys = Object.keys(testObject);
      console.log('Object test passed:', keys);

      // Test async/await
      const testAsync = async () => {
        return 'async test passed';
      };
      testAsync().then(result => {
        console.log('Async test passed:', result);
      });

      setTestValue('All Tests Passed');
    } catch (error) {
      console.error('Hermes test failed:', error);
      setTestValue('Test Failed: ' + (error as Error).message);
    }
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Hermes Compatibility Test</Text>
      <Text style={styles.status}>{testValue}</Text>
      <Text style={styles.info}>
        If you can see this, Hermes is working correctly!
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#ffffff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 20,
    textAlign: 'center',
  },
  status: {
    fontSize: 18,
    color: colors.primary,
    marginBottom: 20,
    textAlign: 'center',
  },
  info: {
    fontSize: 16,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
  },
});

export default HermesTest; 