import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { colors, shadows, radius } from '@/constants/theme';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import { sendPushNotificationToUser } from '@/utils/push-notifications';

export default function PushNotificationTest() {
  const { user } = useAuth();
  const [isTesting, setIsTesting] = useState(false);

  const testPushNotification = async () => {
    if (!user) {
      Alert.alert('Error', 'You must be logged in to test push notifications');
      return;
    }

    try {
      setIsTesting(true);

      const success = await sendPushNotificationToUser(
        user.id,
        'DESIST! Push Test',
        'This is a test push notification sent directly to your device.',
        { type: 'test', timestamp: new Date().toISOString() }
      );

      if (success) {
        Alert.alert(
          'Test Sent',
          'Push notification sent successfully! Check your device notifications.',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert(
          'Test Failed',
          'Failed to send push notification. Check console for details.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error testing push notification:', error);
      Alert.alert(
        'Test Error',
        'An error occurred while testing push notifications.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <MaterialIcons name="notifications-active" size={24} color={colors.accent} />
        <Text style={styles.title}>Push Notification Test</Text>
      </View>

      <Text style={styles.description}>
        Test push notifications sent directly to your device via Expo's push service.
        This simulates what happens when incidents are reported nearby.
      </Text>

      <TouchableOpacity
        style={[styles.testButton, isTesting && styles.testButtonDisabled]}
        onPress={testPushNotification}
        disabled={isTesting || !user}
      >
        <MaterialIcons name="send" size={20} color={colors.text.primary} />
        <Text style={styles.testButtonText}>
          {isTesting ? 'Sending...' : 'Send Push Notification'}
        </Text>
      </TouchableOpacity>

      {!user && (
        <View style={styles.warningContainer}>
          <MaterialIcons name="warning" size={20} color={colors.status.warning} />
          <Text style={styles.warningText}>
            You must be logged in to test push notifications
          </Text>
        </View>
      )}

      <View style={styles.infoSection}>
        <Text style={styles.infoTitle}>How it works:</Text>
        <Text style={styles.infoText}>• Gets your push token from your user profile</Text>
        <Text style={styles.infoText}>• Sends notification via Expo's push service</Text>
        <Text style={styles.infoText}>• Works across different devices/users</Text>
        <Text style={styles.infoText}>• Same system used for incident notifications</Text>
      </View>

      <View style={styles.statusSection}>
        <Text style={styles.statusTitle}>Status:</Text>
        <Text style={styles.statusText}>
          Push Token: {user ? 'Registered' : 'Not Available'}
        </Text>
        <Text style={styles.statusText}>
          User ID: {user?.id || 'Not Logged In'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primary,
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
    marginBottom: 16,
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
  warningContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff3cd',
    padding: 12,
    borderRadius: radius.md,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#ffc107',
  },
  warningText: {
    color: '#856404',
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
    fontFamily: 'Inter-Regular',
  },
  infoSection: {
    backgroundColor: colors.secondary,
    padding: 16,
    borderRadius: radius.lg,
    marginBottom: 16,
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
  statusSection: {
    backgroundColor: colors.secondary,
    padding: 16,
    borderRadius: radius.lg,
    ...shadows.sm,
  },
  statusTitle: {
    color: colors.text.primary,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    fontFamily: 'Inter-SemiBold',
  },
  statusText: {
    color: colors.text.muted,
    fontSize: 14,
    marginBottom: 4,
    fontFamily: 'Inter-Regular',
  },
});
