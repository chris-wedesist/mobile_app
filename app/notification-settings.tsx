import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Slider from '@react-native-community/slider';
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { colors, radius, shadows } from '../constants/theme';

type NotificationType =
  | 'local_incidents'
  | 'us_incidents'
  | 'legal_updates'
  | 'civil_rights'
  | 'immigration'
  | 'policing';
type NotificationFrequency = 'hourly' | 'daily' | 'weekly' | 'custom';

interface NotificationSettings {
  notification_frequency: NotificationFrequency;
  notification_types: Record<NotificationType, boolean>;
  notification_radius: number;
}

export default function NotificationSettingsScreen() {
  const [settings, setSettings] = useState<NotificationSettings>({
    notification_frequency: 'daily',
    notification_types: {
      local_incidents: true,
      us_incidents: true,
      legal_updates: true,
      civil_rights: true,
      immigration: true,
      policing: true,
    },
    notification_radius: 50,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const SETTINGS_KEY = 'notification_settings';

  const loadSettings = async () => {
    try {
      const cachedSettings = await AsyncStorage.getItem(SETTINGS_KEY);
      if (cachedSettings) {
        setSettings(JSON.parse(cachedSettings));
      }
    } catch (err) {
      console.error('Error loading settings:', err);
      setError('Failed to load notification settings');
    } finally {
      setIsLoading(false);
    }
  };

  const saveSettings = async () => {
    try {
      await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
      // Update notification schedule based on new frequency
      await updateNotificationSchedule();
    } catch (err) {
      console.error('Error saving settings:', err);
      setError('Failed to save notification settings');
    }
  };

  const updateNotificationSchedule = async () => {
    if (Platform.OS === 'web') return;

    try {
      await Notifications.cancelAllScheduledNotificationsAsync();

      if (settings.notification_frequency === 'hourly') {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: 'DESIST! Updates',
            body: 'Check for new incidents and updates in your area',
          },
          trigger: {
            type: 'timeInterval',
            seconds: 3600, // 1 hour
            repeats: true,
          } as Notifications.TimeIntervalTriggerInput,
        });
      } else if (settings.notification_frequency === 'daily') {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: 'DESIST! Daily Digest',
            body: 'Your daily summary of incidents and updates',
          },
          trigger: {
            type: 'timeInterval',
            seconds: 86400, // 24 hours
            repeats: true,
          } as Notifications.TimeIntervalTriggerInput,
        });
      } else if (settings.notification_frequency === 'weekly') {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: 'DESIST! Weekly Summary',
            body: 'Your weekly summary of incidents and updates',
          },
          trigger: {
            type: 'timeInterval',
            seconds: 604800, // 7 days
            repeats: true,
          } as Notifications.TimeIntervalTriggerInput,
        });
      }
    } catch (err) {
      console.error('Error scheduling notifications:', err);
    }
  };

  const toggleNotificationType = (type: NotificationType) => {
    setSettings((prev) => ({
      ...prev,
      notification_types: {
        ...prev.notification_types,
        [type]: !prev.notification_types[type],
      },
    }));
  };

  const setNotificationFrequency = (frequency: NotificationFrequency) => {
    setSettings((prev) => ({
      ...prev,
      notification_frequency: frequency,
    }));
  };

  const updateNotificationRadius = (radius: number) => {
    setSettings((prev) => ({
      ...prev,
      notification_radius: radius,
    }));
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <MaterialIcons
            name="chevron-left"
            size={24}
            color={colors.text.primary}
          />
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Notification Settings</Text>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Frequency</Text>
          <View style={styles.frequencyOptions}>
            {(['hourly', 'daily', 'weekly'] as NotificationFrequency[]).map(
              (frequency) => (
                <TouchableOpacity
                  key={frequency}
                  style={[
                    styles.frequencyOption,
                    settings.notification_frequency === frequency &&
                      styles.selectedFrequency,
                  ]}
                  onPress={() => setNotificationFrequency(frequency)}
                >
                  <Text
                    style={[
                      styles.frequencyText,
                      settings.notification_frequency === frequency &&
                        styles.selectedFrequencyText,
                    ]}
                  >
                    {frequency.charAt(0).toUpperCase() + frequency.slice(1)}
                  </Text>
                </TouchableOpacity>
              )
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Content Types</Text>
          {Object.entries(settings.notification_types).map(
            ([type, enabled]) => (
              <View key={type} style={styles.settingItem}>
                <View style={styles.settingInfo}>
                  <MaterialIcons
                    name="notifications"
                    size={24}
                    color={colors.accent}
                  />
                  <Text style={styles.settingText}>
                    {type
                      .split('_')
                      .map(
                        (word) => word.charAt(0).toUpperCase() + word.slice(1)
                      )
                      .join(' ')}
                  </Text>
                </View>
                <Switch
                  value={enabled}
                  onValueChange={() =>
                    toggleNotificationType(type as NotificationType)
                  }
                  trackColor={{ false: colors.text.muted, true: colors.accent }}
                  thumbColor={
                    enabled ? colors.text.primary : colors.text.secondary
                  }
                />
              </View>
            )
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Location Radius</Text>
          <View style={styles.radiusControl}>
            <MaterialIcons name="location-on" size={24} color={colors.accent} />
            <Slider
              style={styles.slider}
              minimumValue={1}
              maximumValue={100}
              step={1}
              value={settings.notification_radius}
              onValueChange={updateNotificationRadius}
              minimumTrackTintColor={colors.accent}
              maximumTrackTintColor={colors.text.muted}
              thumbTintColor={colors.accent}
            />
            <Text style={styles.radiusText}>
              {settings.notification_radius} km
            </Text>
          </View>
          <TouchableOpacity style={styles.saveButton} onPress={saveSettings}>
            <Text style={styles.saveButtonText}>Save Settings</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 10,
  },
  backButtonText: {
    color: colors.text.primary,
    fontSize: 16,
    marginLeft: 8,
    fontFamily: 'Inter-Regular',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text.primary,
    fontFamily: 'Inter-Bold',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 0,
    paddingBottom: 40,
  },
  section: {
    backgroundColor: colors.secondary,
    borderRadius: radius.lg,
    padding: 20,
    marginBottom: 20,
    ...shadows.sm,
  },
  sectionTitle: {
    color: colors.text.muted,
    fontSize: 14,
    textTransform: 'uppercase',
    marginBottom: 15,
    fontFamily: 'Inter-Medium',
  },
  frequencyOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  frequencyOption: {
    flex: 1,
    padding: 15,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  selectedFrequency: {
    backgroundColor: colors.accent,
  },
  frequencyText: {
    color: colors.text.primary,
    fontSize: 16,
    fontFamily: 'Inter-Medium',
  },
  selectedFrequencyText: {
    color: colors.text.primary,
    fontWeight: '600',
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: `${colors.text.muted}30`,
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
    flex: 1,
  },
  settingText: {
    color: colors.text.primary,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
  },
  radiusControl: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 15,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    marginBottom: 20,
  },
  radiusText: {
    color: colors.text.primary,
    fontSize: 18,
    fontFamily: 'Inter-Medium',
  },
  saveButton: {
    backgroundColor: colors.accent,
    padding: 15,
    borderRadius: radius.lg,
    alignItems: 'center',
    ...shadows.sm,
  },
  saveButtonText: {
    color: colors.text.primary,
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  slider: {
    flex: 1,
    height: 40,
    marginHorizontal: 10,
  },
});
