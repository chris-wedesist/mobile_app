import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import * as Notifications from 'expo-notifications';
import { colors, shadows, radius } from '@/constants/theme';
import { MaterialIcons } from '@expo/vector-icons';

export default function NotificationTest() {
  const [isTesting, setIsTesting] = useState(false);

  const testNotification = async () => {
    try {
      setIsTesting(true);

      // Check notification permissions
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      // If permission not granted, request it
      if (existingStatus !== 'granted') {
        console.log('Requesting notification permissions...');
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      // If still not granted, show error
      if (finalStatus !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Please enable notifications in your device settings to test notifications.',
          [{ text: 'OK' }]
        );
        return;
      }

      // Schedule test notification
      console.log('Scheduling test notification...');
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'DESIST! Test Notification',
          body: 'This is a test notification to verify the system is working correctly.',
          data: { type: 'test' },
        },
        trigger: {
          seconds: 2, // Show after 2 seconds
        },
      });

      Alert.alert(
        'Test Scheduled',
        'A test notification will appear in 2 seconds.',
        [{ text: 'OK' }]
      );

    } catch (error) {
      console.error('Error testing notification:', error);
      Alert.alert(
        'Test Failed',
        'Failed to schedule test notification. Check console for details.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsTesting(false);
    }
  };

  const testIncidentNotification = async () => {
    try {
      setIsTesting(true);

      // Check notification permissions
      const { status } = await Notifications.getPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Please enable notifications in your device settings.',
          [{ text: 'OK' }]
        );
        return;
      }

      // Schedule incident notification
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'New Incident Nearby',
          body: 'Test Incident - 2.5 miles away',
          data: { 
            type: 'incident',
            incidentId: 'test-incident-123'
          },
        },
        trigger: {
          seconds: 1,
        },
      });

      Alert.alert(
        'Incident Test Scheduled',
        'A test incident notification will appear in 1 second.',
        [{ text: 'OK' }]
      );

    } catch (error) {
      console.error('Error testing incident notification:', error);
      Alert.alert(
        'Test Failed',
        'Failed to schedule incident notification.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <MaterialIcons name="notifications" size={24} color={colors.accent} />
        <Text style={styles.title}>Notification Test</Text>
      </View>

      <Text style={styles.description}>
        Test the notification system to ensure it's working correctly.
      </Text>

      <TouchableOpacity
        style={[styles.testButton, isTesting && styles.testButtonDisabled]}
        onPress={testNotification}
        disabled={isTesting}
      >
        <MaterialIcons name="notifications-active" size={20} color={colors.text.primary} />
        <Text style={styles.testButtonText}>
          {isTesting ? 'Testing...' : 'Test Basic Notification'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.testButton, isTesting && styles.testButtonDisabled]}
        onPress={testIncidentNotification}
        disabled={isTesting}
      >
        <MaterialIcons name="report" size={20} color={colors.text.primary} />
        <Text style={styles.testButtonText}>
          {isTesting ? 'Testing...' : 'Test Incident Notification'}
        </Text>
      </TouchableOpacity>

      <View style={styles.infoSection}>
        <Text style={styles.infoTitle}>What to expect:</Text>
        <Text style={styles.infoText}>• Basic notification should appear after 2 seconds</Text>
        <Text style={styles.infoText}>• Incident notification should appear after 1 second</Text>
        <Text style={styles.infoText}>• Check your device's notification panel</Text>
        <Text style={styles.infoText}>• Ensure notifications are enabled in device settings</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  title: {
    color: colors.text.primary,
    fontSize: 24,
    fontWeight: 'bold',
    fontFamily: 'Inter-Bold',
  },
  description: {
    color: colors.text.muted,
    fontSize: 16,
    marginBottom: 24,
    fontFamily: 'Inter-Regular',
    lineHeight: 22,
  },
  testButton: {
    backgroundColor: colors.accent,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: radius.lg,
    marginBottom: 12,
    gap: 8,
    ...shadows.sm,
  },
  testButtonDisabled: {
    opacity: 0.6,
  },
  testButtonText: {
    color: colors.text.primary,
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  infoSection: {
    marginTop: 24,
    backgroundColor: colors.secondary,
    padding: 16,
    borderRadius: radius.lg,
    ...shadows.sm,
  },
  infoTitle: {
    color: colors.text.primary,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    fontFamily: 'Inter-SemiBold',
  },
  infoText: {
    color: colors.text.muted,
    fontSize: 14,
    marginBottom: 4,
    fontFamily: 'Inter-Regular',
  },
});
