import React, { useEffect, useState } from 'react';
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { NotificationPreferences, notificationService } from '../notifications';

export default function NotificationSettingsScreen() {
  const router = useRouter();
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    initializeNotificationService();
  }, []);

  const initializeNotificationService = async () => {
    try {
      if (!notificationService.isServiceInitialized()) {
        await notificationService.initialize();
        setIsInitialized(true);
      }
      
      const currentPrefs = await notificationService.getNotificationPreferences();
      setPreferences(currentPrefs);
    } catch (error) {
      console.error('Failed to initialize notification service:', error);
      Alert.alert('Error', 'Failed to load notification settings');
    } finally {
      setLoading(false);
    }
  };

  const updatePreference = async <K extends keyof NotificationPreferences>(
    key: K,
    value: NotificationPreferences[K]
  ) => {
    if (!preferences) return;

    try {
      const updatedPrefs = { ...preferences, [key]: value };
      setPreferences(updatedPrefs);
      
      await notificationService.updateNotificationPreferences({ [key]: value });
    } catch (error) {
      console.error('Failed to update notification preference:', error);
      // Revert the change
      setPreferences(preferences);
      Alert.alert('Error', 'Failed to update notification settings');
    }
  };

  const updateQuietHours = async (key: keyof NotificationPreferences['quietHours'], value: any) => {
    if (!preferences) return;

    try {
      const updatedQuietHours = { ...preferences.quietHours, [key]: value };
      const updatedPrefs = { ...preferences, quietHours: updatedQuietHours };
      setPreferences(updatedPrefs);
      
      await notificationService.updateNotificationPreferences({ quietHours: updatedQuietHours });
    } catch (error) {
      console.error('Failed to update quiet hours:', error);
      setPreferences(preferences);
      Alert.alert('Error', 'Failed to update quiet hours settings');
    }
  };

  const testNotification = async () => {
    try {
      if (!isInitialized) {
        Alert.alert('Error', 'Notification service not initialized');
        return;
      }

      await notificationService.sendLocalNotification({
        type: 'system_update',
        title: 'Test Notification',
        body: 'This is a test notification from DESIST!',
        priority: 'normal',
        data: { test: true }
      });

      Alert.alert('Success', 'Test notification sent!');
    } catch (error) {
      console.error('Failed to send test notification:', error);
      Alert.alert('Error', 'Failed to send test notification');
    }
  };

  const requestPermissions = async () => {
    try {
      const permissionStatus = await notificationService.requestPermissions();
      
      if (permissionStatus.granted) {
        Alert.alert('Success', 'Notification permissions granted!');
        await initializeNotificationService();
      } else {
        Alert.alert(
          'Permissions Required',
          'Please enable notifications in your device settings to receive important safety alerts.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => {
              if (Platform.OS === 'ios') {
                // In a real app, you'd use Linking.openURL('app-settings:')
                Alert.alert('Info', 'Open Settings > Notifications > DESIST! to enable notifications');
              }
            }}
          ]
        );
      }
    } catch (error) {
      console.error('Failed to request permissions:', error);
      Alert.alert('Error', 'Failed to request notification permissions');
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading notification settings...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!preferences) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Failed to load notification settings</Text>
          <TouchableOpacity style={styles.retryButton} onPress={initializeNotificationService}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Notification Settings</Text>
        </View>

        {/* Permission Status */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Permission Status</Text>
          <View style={styles.permissionStatus}>
            <Text style={styles.permissionText}>
              Status: {isInitialized ? 'Enabled' : 'Disabled'}
            </Text>
            {!isInitialized && (
              <TouchableOpacity style={styles.enableButton} onPress={requestPermissions}>
                <Text style={styles.enableButtonText}>Enable Notifications</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Safety & Emergency Notifications */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Safety & Emergency</Text>
          <Text style={styles.sectionDescription}>
            Critical notifications for your safety (recommended to keep enabled)
          </Text>
          
          <View style={styles.setting}>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>Emergency Notifications</Text>
              <Text style={styles.settingDescription}>Critical safety alerts and emergency updates</Text>
            </View>
            <Switch
              value={preferences.emergencyNotifications}
              onValueChange={(value) => updatePreference('emergencyNotifications', value)}
              trackColor={{ false: '#767577', true: '#FF4444' }}
              thumbColor={preferences.emergencyNotifications ? '#fff' : '#f4f3f4'}
            />
          </View>

          <View style={styles.setting}>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>Incident Alerts</Text>
              <Text style={styles.settingDescription}>Notifications about incidents in your area</Text>
            </View>
            <Switch
              value={preferences.incidentAlerts}
              onValueChange={(value) => updatePreference('incidentAlerts', value)}
              trackColor={{ false: '#767577', true: '#4285F4' }}
              thumbColor={preferences.incidentAlerts ? '#fff' : '#f4f3f4'}
            />
          </View>

          <View style={styles.setting}>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>Safety Alerts</Text>
              <Text style={styles.settingDescription}>General safety notifications and tips</Text>
            </View>
            <Switch
              value={preferences.safetyAlerts}
              onValueChange={(value) => updatePreference('safetyAlerts', value)}
              trackColor={{ false: '#767577', true: '#4285F4' }}
              thumbColor={preferences.safetyAlerts ? '#fff' : '#f4f3f4'}
            />
          </View>
        </View>

        {/* App Updates */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>App Updates</Text>
          
          <View style={styles.setting}>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>Report Updates</Text>
              <Text style={styles.settingDescription}>Updates on reports you've submitted</Text>
            </View>
            <Switch
              value={preferences.reportUpdates}
              onValueChange={(value) => updatePreference('reportUpdates', value)}
              trackColor={{ false: '#767577', true: '#4285F4' }}
              thumbColor={preferences.reportUpdates ? '#fff' : '#f4f3f4'}
            />
          </View>

          <View style={styles.setting}>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>System Updates</Text>
              <Text style={styles.settingDescription}>App updates and maintenance notices</Text>
            </View>
            <Switch
              value={preferences.systemUpdates}
              onValueChange={(value) => updatePreference('systemUpdates', value)}
              trackColor={{ false: '#767577', true: '#4285F4' }}
              thumbColor={preferences.systemUpdates ? '#fff' : '#f4f3f4'}
            />
          </View>
        </View>

        {/* Marketing */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Marketing</Text>
          
          <View style={styles.setting}>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>Marketing Communications</Text>
              <Text style={styles.settingDescription}>News, features, and promotional content</Text>
            </View>
            <Switch
              value={preferences.marketing}
              onValueChange={(value) => updatePreference('marketing', value)}
              trackColor={{ false: '#767577', true: '#4285F4' }}
              thumbColor={preferences.marketing ? '#fff' : '#f4f3f4'}
            />
          </View>
        </View>

        {/* Quiet Hours */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quiet Hours</Text>
          <Text style={styles.sectionDescription}>
            Reduce notifications during specified hours (emergency notifications will still come through)
          </Text>
          
          <View style={styles.setting}>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>Enable Quiet Hours</Text>
              <Text style={styles.settingDescription}>
                {preferences.quietHours.enabled 
                  ? `${preferences.quietHours.startTime} - ${preferences.quietHours.endTime}`
                  : 'Disabled'
                }
              </Text>
            </View>
            <Switch
              value={preferences.quietHours.enabled}
              onValueChange={(value) => updateQuietHours('enabled', value)}
              trackColor={{ false: '#767577', true: '#4285F4' }}
              thumbColor={preferences.quietHours.enabled ? '#fff' : '#f4f3f4'}
            />
          </View>

          {preferences.quietHours.enabled && (
            <View style={styles.quietHoursDetails}>
              <Text style={styles.quietHoursNote}>
                Quiet hours are currently set from {preferences.quietHours.startTime} to {preferences.quietHours.endTime}.
                You can adjust these times in your device's notification settings.
              </Text>
            </View>
          )}
        </View>

        {/* Test Notification */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Test Notifications</Text>
          <TouchableOpacity 
            style={[styles.testButton, !isInitialized && styles.testButtonDisabled]} 
            onPress={testNotification}
            disabled={!isInitialized}
          >
            <Text style={[styles.testButtonText, !isInitialized && styles.testButtonTextDisabled]}>
              Send Test Notification
            </Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            DESIST! respects your privacy. Notification preferences are stored securely on your device.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#FF4444',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#4285F4',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
  },
  backButton: {
    marginRight: 15,
  },
  backButtonText: {
    fontSize: 16,
    color: '#4285F4',
    fontWeight: '600',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    lineHeight: 20,
  },
  setting: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingContent: {
    flex: 1,
    marginRight: 16,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 18,
  },
  permissionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  permissionText: {
    fontSize: 16,
    color: '#1a1a1a',
  },
  enableButton: {
    backgroundColor: '#4285F4',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  enableButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  quietHoursDetails: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  quietHoursNote: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },
  testButton: {
    backgroundColor: '#4285F4',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  testButtonDisabled: {
    backgroundColor: '#ccc',
  },
  testButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  testButtonTextDisabled: {
    color: '#999',
  },
  footer: {
    marginTop: 20,
    padding: 16,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
  },
  footerText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    lineHeight: 16,
  },
});
