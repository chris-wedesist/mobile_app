import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import * as SMS from 'expo-sms';
import { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  colors,
  radius,
  shadows,
  spacing,
  typography,
} from '../constants/theme';
// Emergency contact type definition
interface EmergencyContact {
  id: string;
  name: string;
  phone: string;
  relationship: string;
}

export default function EmergencySetupScreen() {
  const [contact, setContact] = useState({
    name: '',
    phone: '',
    customMessage:
      'EMERGENCY: I need immediate assistance. My location will be shared when activated.',
  });
  const [smsEnabled, setSmsEnabled] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [testMode, setTestMode] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const name = await AsyncStorage.getItem('emergencyContactName');
      const phone = await AsyncStorage.getItem('emergencyContact');
      const message = await AsyncStorage.getItem('emergencyMessage');

      setContact({
        name: name || '',
        phone: phone || '',
        customMessage: message || contact.customMessage,
      });

      const smsEnabledValue = await AsyncStorage.getItem('emergencySmsEnabled');
      setSmsEnabled(smsEnabledValue !== 'false');
    } catch (error) {
      console.error('Error loading settings:', error);
      setError('Failed to load saved settings');
    }
  };

  const handleSave = async () => {
    try {
      setError(null);
      setIsSaving(true);

      // if (!contact.name.trim()) {
      //   setError('Please enter a contact name');
      //   setIsSaving(false);
      //   return;
      // }

      await AsyncStorage.setItem('emergencyContactName', contact.name);
      await AsyncStorage.setItem('emergencyContact', contact.phone);
      await AsyncStorage.setItem(
        'emergencyMessage',
        contact.customMessage || ''
      );
      await AsyncStorage.setItem(
        'emergencySmsEnabled',
        smsEnabled ? 'true' : 'false'
      );

      // Navigate back
      router.back();
    } catch (error) {
      console.error('Error saving settings:', error);
      setError('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestMessage = async () => {
    if (Platform.OS === 'web') {
      alert('SMS testing is only available on mobile devices');
      return;
    }

    try {
      setTestMode(true);
      const isAvailable = await SMS.isAvailableAsync();
      if (!isAvailable) {
        throw new Error('SMS is not available on this device');
      }

      const testMessage =
        'This is a test message from DESIST! Emergency System. No action required.';
      await SMS.sendSMSAsync([contact.phone], testMessage);
    } catch (error) {
      console.error('Error sending test SMS:', error);
      setError('Failed to send test message');
    } finally {
      setTestMode(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
    >
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <MaterialIcons
              name="chevron-left"
              color={colors.text.primary}
              size={24}
            />
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <View style={styles.titleContainer}>
            <MaterialIcons name="shield" size={32} color={colors.accent} />
            <Text style={styles.title}>Emergency Setup</Text>
          </View>

          <Text style={styles.description}>
            Configure your emergency contact who will be notified when you
            activate emergency mode.
          </Text>

          {error && (
            <View style={styles.errorContainer}>
              <MaterialIcons
                name="error"
                color={colors.status.error}
                size={20}
              />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <View style={styles.formSection}>
            <Text style={styles.label}>Contact Name</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                value={contact.name}
                onChangeText={(text) =>
                  setContact((prev) => ({ ...prev, name: text }))
                }
                placeholder="Enter contact name"
                placeholderTextColor={colors.text.muted}
              />
            </View>

            <Text style={styles.label}>Contact Phone</Text>
            <View style={styles.inputContainer}>
              <MaterialIcons name="phone" size={20} color={colors.text.muted} />
              <TextInput
                style={styles.input}
                value={contact.phone}
                onChangeText={(text) =>
                  setContact((prev) => ({ ...prev, phone: text }))
                }
                placeholder="Enter phone number"
                placeholderTextColor={colors.text.muted}
                keyboardType="phone-pad"
              />
            </View>

            <Text style={styles.label}>Emergency Message</Text>
            <View style={styles.messageContainer}>
              <MaterialIcons
                name="message"
                size={20}
                color={colors.text.muted}
              />
              <TextInput
                style={[styles.input, styles.messageInput]}
                value={contact.customMessage}
                onChangeText={(text) =>
                  setContact((prev) => ({ ...prev, customMessage: text }))
                }
                placeholder="Enter custom emergency message"
                placeholderTextColor={colors.text.muted}
                multiline
                numberOfLines={3}
              />
            </View>

            <View style={styles.toggleContainer}>
              <Text style={styles.toggleLabel}>Enable Emergency SMS</Text>
              <Switch
                value={smsEnabled}
                onValueChange={setSmsEnabled}
                trackColor={{ false: colors.text.muted, true: colors.accent }}
                thumbColor={
                  smsEnabled ? colors.text.primary : colors.text.secondary
                }
              />
            </View>

            {Platform.OS !== 'web' && contact.phone && (
              <TouchableOpacity
                style={[styles.testButton, testMode && styles.testButtonActive]}
                onPress={handleTestMessage}
                disabled={testMode}
              >
                <MaterialIcons
                  name="send"
                  size={20}
                  color={colors.text.primary}
                />
                <Text style={styles.testButtonText}>
                  {testMode ? 'Sending Test...' : 'Send Test Message'}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity
            style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={isSaving}
          >
            <Text style={styles.saveButtonText}>
              {isSaving ? 'Saving...' : 'Save Emergency Settings'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primary,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : spacing.xxl,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButtonText: {
    color: colors.text.primary,
    fontSize: typography.fontSize.body,
    marginLeft: spacing.xs,
    fontFamily: 'Inter-Regular',
  },
  content: {
    flex: 1,
    padding: spacing.lg,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  title: {
    fontSize: typography.fontSize.title,
    fontWeight: 'bold',
    color: colors.text.primary,
    fontFamily: 'Inter-Bold',
  },
  description: {
    fontSize: typography.fontSize.body,
    color: colors.text.secondary,
    marginBottom: spacing.xl,
    lineHeight: 24,
    fontFamily: 'Inter-Regular',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${colors.status.error}20`,
    padding: spacing.md,
    borderRadius: radius.lg,
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  errorText: {
    color: colors.status.error,
    flex: 1,
    fontFamily: 'Inter-Regular',
  },
  formSection: {
    backgroundColor: colors.secondary,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    ...shadows.sm,
  },
  label: {
    color: colors.text.muted,
    fontSize: typography.fontSize.small,
    marginBottom: spacing.xs,
    fontFamily: 'Inter-Medium',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  input: {
    flex: 1,
    color: colors.text.primary,
    fontSize: typography.fontSize.body,
    fontFamily: 'Inter-Regular',
  },
  messageContainer: {
    flexDirection: 'row',
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.lg,
    gap: spacing.sm,
    alignItems: 'flex-start',
  },
  messageInput: {
    height: 100,
    textAlignVertical: 'top',
  },
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  toggleLabel: {
    color: colors.text.primary,
    fontSize: typography.fontSize.body,
    fontFamily: 'Inter-Regular',
  },
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accent,
    padding: spacing.md,
    borderRadius: radius.lg,
    gap: spacing.sm,
    ...shadows.sm,
  },
  testButtonActive: {
    opacity: 0.7,
  },
  testButtonText: {
    color: colors.text.primary,
    fontSize: typography.fontSize.body,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  saveButton: {
    backgroundColor: colors.accent,
    padding: spacing.lg,
    borderRadius: radius.lg,
    alignItems: 'center',
    ...shadows.md,
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
    color: colors.text.primary,
    fontSize: typography.fontSize.subheading,
    fontWeight: 'bold',
    fontFamily: 'Inter-Bold',
  },
});
