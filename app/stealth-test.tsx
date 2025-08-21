import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { stealthManager } from '../lib/stealth';
import { router } from 'expo-router';

interface TestResult {
  name: string;
  status: 'pass' | 'fail' | 'pending';
  details?: string;
}

export default function StealthTestScreen() {
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const updateTestResult = (name: string, status: 'pass' | 'fail', details?: string) => {
    setTestResults(prev => {
      const existing = prev.find(r => r.name === name);
      if (existing) {
        existing.status = status;
        existing.details = details;
        return [...prev];
      }
      return [...prev, { name, status, details }];
    });
  };

  const runAllTests = async () => {
    setIsRunning(true);
    setTestResults([]);

    // Test 1: Stealth Manager Initialization
    try {
      await stealthManager.initialize();
      updateTestResult('Stealth Manager Initialization', 'pass');
    } catch (error) {
      updateTestResult('Stealth Manager Initialization', 'fail', error.message);
    }

    // Test 2: Mode Detection
    try {
      const currentMode = await stealthManager.getCurrentMode();
      if (currentMode === 'stealth' || currentMode === 'normal') {
        updateTestResult('Mode Detection', 'pass', `Current mode: ${currentMode}`);
      } else {
        updateTestResult('Mode Detection', 'fail', `Invalid mode: ${currentMode}`);
      }
    } catch (error) {
      updateTestResult('Mode Detection', 'fail', error.message);
    }

    // Test 3: Configuration Persistence
    try {
      const config = await stealthManager.getConfig();
      if (config.currentMode && typeof config.toggleCount === 'number') {
        updateTestResult('Configuration Persistence', 'pass', 'Config loaded successfully');
      } else {
        updateTestResult('Configuration Persistence', 'fail', 'Invalid config structure');
      }
    } catch (error) {
      updateTestResult('Configuration Persistence', 'fail', error.message);
    }

    // Test 4: Toggle Sequence Validation
    try {
      const validSequence = Array.from({ length: 7 }, (_, i) => Date.now() + i * 100);
      const isValid = stealthManager.validateToggleSequence(validSequence);
      
      const invalidSequence = Array.from({ length: 5 }, (_, i) => Date.now() + i * 100);
      const isInvalid = !stealthManager.validateToggleSequence(invalidSequence);
      
      if (isValid && isInvalid) {
        updateTestResult('Toggle Sequence Validation', 'pass');
      } else {
        updateTestResult('Toggle Sequence Validation', 'fail', 'Validation logic error');
      }
    } catch (error) {
      updateTestResult('Toggle Sequence Validation', 'fail', error.message);
    }

    // Test 5: Mode Toggle (without actually switching)
    try {
      const initialMode = await stealthManager.getCurrentMode();
      
      // Test the toggle logic by checking if it would prevent rapid toggles
      const recentToggle = await stealthManager.toggleMode();
      const immediateToggle = await stealthManager.toggleMode(); // Should fail due to timing
      
      if (!immediateToggle) {
        updateTestResult('Mode Toggle Protection', 'pass', 'Rapid toggle prevention works');
        // Reset to initial mode
        await stealthManager.setMode(initialMode);
      } else {
        updateTestResult('Mode Toggle Protection', 'fail', 'Rapid toggle not prevented');
      }
    } catch (error) {
      updateTestResult('Mode Toggle Protection', 'fail', error.message);
    }

    // Test 6: Emergency Reset
    try {
      await stealthManager.resetToStealth();
      const mode = await stealthManager.getCurrentMode();
      if (mode === 'stealth') {
        updateTestResult('Emergency Reset', 'pass');
      } else {
        updateTestResult('Emergency Reset', 'fail', `Mode not reset: ${mode}`);
      }
    } catch (error) {
      updateTestResult('Emergency Reset', 'fail', error.message);
    }

    // Test 7: Usage Statistics
    try {
      const stats = stealthManager.getUsageStats();
      if (typeof stats.toggleCount === 'number' && stats.lastToggleTime instanceof Date) {
        updateTestResult('Usage Statistics', 'pass');
      } else {
        updateTestResult('Usage Statistics', 'fail', 'Invalid stats structure');
      }
    } catch (error) {
      updateTestResult('Usage Statistics', 'fail', error.message);
    }

    setIsRunning(false);
  };

  const testModeSwitch = async () => {
    Alert.alert(
      'Test Mode Switch',
      'This will test the actual mode switching. The app will switch to normal mode if currently in stealth, or vice versa. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Test Switch',
          onPress: async () => {
            try {
              const currentMode = await stealthManager.getCurrentMode();
              const success = await stealthManager.toggleMode();
              
              if (success) {
                const newMode = await stealthManager.getCurrentMode();
                Alert.alert(
                  'Mode Switch Successful',
                  `Switched from ${currentMode} to ${newMode} mode`,
                  [
                    {
                      text: 'Navigate',
                      onPress: () => {
                        if (newMode === 'stealth') {
                        router.replace('/stealth-calculator' as any);
                        } else {
                          router.replace('/(tabs)' as any);
                        }
                      },
                    },
                  ]
                );
              } else {
                Alert.alert('Mode Switch Failed', 'Unable to switch modes');
              }
            } catch (error) {
              Alert.alert('Error', `Mode switch error: ${error.message}`);
            }
          },
        },
      ]
    );
  };

  const getStatusIcon = (status: 'pass' | 'fail' | 'pending') => {
    switch (status) {
      case 'pass':
        return <Ionicons name="checkmark-circle" size={20} color="#28a745" />;
      case 'fail':
        return <Ionicons name="close-circle" size={20} color="#dc3545" />;
      case 'pending':
        return <Ionicons name="time" size={20} color="#ffc107" />;
    }
  };

  const getStatusColor = (status: 'pass' | 'fail' | 'pending') => {
    switch (status) {
      case 'pass':
        return '#28a745';
      case 'fail':
        return '#dc3545';
      case 'pending':
        return '#ffc107';
    }
  };

  const passedTests = testResults.filter(r => r.status === 'pass').length;
  const totalTests = testResults.length;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Phase 1 Stealth Mode Tests</Text>
        <Text style={styles.subtitle}>Validation of core functionality</Text>
      </View>

      <View style={styles.summary}>
        <Text style={styles.summaryText}>
          {totalTests > 0 ? `${passedTests}/${totalTests} tests passed` : 'No tests run yet'}
        </Text>
        <TouchableOpacity
          style={[styles.button, isRunning && styles.buttonDisabled]}
          onPress={runAllTests}
          disabled={isRunning}
        >
          <Text style={styles.buttonText}>
            {isRunning ? 'Running Tests...' : 'Run All Tests'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.testResults}>
        {testResults.map((result, index) => (
          <View key={index} style={styles.testItem}>
            <View style={styles.testHeader}>
              {getStatusIcon(result.status)}
              <Text style={styles.testName}>{result.name}</Text>
            </View>
            {result.details && (
              <Text style={[styles.testDetails, { color: getStatusColor(result.status) }]}>
                {result.details}
              </Text>
            )}
          </View>
        ))}

        {testResults.length === 0 && !isRunning && (
          <View style={styles.emptyState}>
            <Ionicons name="flask-outline" size={48} color="#ccc" />
            <Text style={styles.emptyText}>No test results yet</Text>
            <Text style={styles.emptySubtext}>Run tests to validate functionality</Text>
          </View>
        )}
      </ScrollView>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.actionButton} onPress={testModeSwitch}>
          <Ionicons name="swap-horizontal" size={20} color="#007bff" />
          <Text style={styles.actionButtonText}>Test Mode Switch</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.actionButton} 
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={20} color="#6c757d" />
          <Text style={[styles.actionButtonText, { color: '#6c757d' }]}>Back</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    padding: 20,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#6c757d',
  },
  summary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#ffffff',
    marginTop: 8,
    marginHorizontal: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  summaryText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
  },
  button: {
    backgroundColor: '#007bff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  buttonDisabled: {
    backgroundColor: '#6c757d',
  },
  buttonText: {
    color: '#ffffff',
    fontWeight: '500',
  },
  testResults: {
    flex: 1,
    padding: 16,
  },
  testItem: {
    backgroundColor: '#ffffff',
    padding: 16,
    marginBottom: 8,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  testHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  testName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
    marginLeft: 12,
    flex: 1,
  },
  testDetails: {
    fontSize: 14,
    marginTop: 8,
    marginLeft: 32,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '500',
    color: '#6c757d',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#adb5bd',
    marginTop: 8,
  },
  actions: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    padding: 12,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#007bff',
    marginLeft: 8,
  },
});
