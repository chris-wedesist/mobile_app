import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Switch, Platform, ScrollView, KeyboardAvoidingView, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import * as SMS from 'expo-sms';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, shadows, radius } from '@/constants/theme';

export default function EmergencySetupScreen() {
  const { user } = useAuth();
  const [contact, setContact] = useState({
    name: '',
    phone: '',
    callCode: '',
    customMessage: 'EMERGENCY: I need immediate assistance. My location will be shared when activated.',
  });
  const [smsEnabled, setSmsEnabled] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [testMode, setTestMode] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      loadSettings();
    } else {
      setLoading(false);
    }
  }, [user?.id]);

  const loadSettings = async () => {
    try {
      if (!user?.id) {
        setError('You must be logged in to load emergency settings');
        setLoading(false);
        return;
      }

      const { data, error: fetchError } = await supabase
        .from('users')
        .select('emergency_contact_name, emergency_contact_phone, emergency_call_code, emergency_message, emergency_sms_enabled')
        .eq('id', user.id)
        .single();

      if (fetchError) {
        console.error('Error fetching emergency settings:', fetchError);
        // If user doesn't exist yet, that's okay - they'll start with defaults
        if (fetchError.code !== 'PGRST116') {
          setError('Failed to load saved settings');
        }
        setLoading(false);
        return;
      }

      setContact({
        name: data?.emergency_contact_name || '',
        phone: data?.emergency_contact_phone || '',
        callCode: data?.emergency_call_code || '',
        customMessage: data?.emergency_message || contact.customMessage,
      });
      
      setSmsEnabled(data?.emergency_sms_enabled !== false);
      setLoading(false);
    } catch (error) {
      console.error('Error loading settings:', error);
      setError('Failed to load saved settings');
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setError(null);
      setIsSaving(true);

      if (!user?.id) {
        setError('You must be logged in to save emergency settings');
        setIsSaving(false);
        return;
      }

      // if (!contact.name.trim()) {
      //   setError('Please enter a contact name');
      //   setIsSaving(false);
      //   return;
      // }

      const { error: updateError } = await supabase
        .from('users')
        .update({
          emergency_contact_name: contact.name,
          emergency_contact_phone: contact.phone,
          emergency_call_code: contact.callCode,
          emergency_message: contact.customMessage || '',
          emergency_sms_enabled: smsEnabled,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (updateError) {
        console.error('Error saving emergency settings:', updateError);
        setError('Failed to save settings');
        setIsSaving(false);
        return;
      }

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

      const testMessage = 'This is a test message from DESIST! Emergency System. No action required.';
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
            onPress={() => router.back()}>
            <MaterialIcons name="chevron-left" color={colors.text.primary} size={24} />
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <View style={styles.titleContainer}>
            <MaterialIcons name="shield" size={32} color={colors.accent} />
            <Text style={styles.title}>Emergency Setup</Text>
          </View>

          <Text style={styles.description}>
            Configure your emergency contact who will be notified when you activate emergency mode.
          </Text>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.accent} />
              <Text style={styles.loadingText}>Loading settings...</Text>
            </View>
          ) : (
            <>
              {error && (
                <View style={styles.errorContainer}>
                  <MaterialIcons name="error" color={colors.status.error} size={20} />
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              )}

              <View style={styles.formSection}>
            <Text style={styles.label}>Contact Name</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                value={contact.name}
                onChangeText={(text) => setContact(prev => ({ ...prev, name: text }))}
                placeholder="Enter contact name"
                placeholderTextColor={colors.text.muted}
              />
            </View>

            <Text style={styles.label}>Contact Phone (SMS)</Text>
            <View style={styles.inputContainer}>
              <MaterialIcons name="phone" size={20} color={colors.text.muted} />
              <TextInput
                style={styles.input}
                value={contact.phone}
                onChangeText={(text) => setContact(prev => ({ ...prev, phone: text }))}
                placeholder="Enter phone number for SMS"
                placeholderTextColor={colors.text.muted}
                keyboardType="phone-pad"
              />
            </View>

            <Text style={styles.label}>SMS Code</Text>
            <Text style={styles.labelDescription}>
              Enter this code in calculator to send emergency SMS to the contact above
            </Text>
            <View style={styles.inputContainer}>
              <MaterialIcons name="dialpad" size={20} color={colors.text.muted} />
              <TextInput
                style={styles.input}
                value={contact.callCode}
                onChangeText={(text) => setContact(prev => ({ ...prev, callCode: text }))}
                placeholder="e.g., 9999 or 1234"
                placeholderTextColor={colors.text.muted}
                keyboardType="number-pad"
                maxLength={10}
              />
            </View>

            <Text style={styles.label}>Emergency Message</Text>
            <View style={styles.messageContainer}>
              <MaterialIcons name="message" size={20} color={colors.text.muted} />
              <TextInput
                style={[styles.input, styles.messageInput]}
                value={contact.customMessage}
                onChangeText={(text) => setContact(prev => ({ ...prev, customMessage: text }))}
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
                thumbColor={smsEnabled ? colors.text.primary : colors.text.secondary}
              />
            </View>

            {Platform.OS !== 'web' && contact.phone && (
              <TouchableOpacity
                style={[styles.testButton, testMode && styles.testButtonActive]}
                onPress={handleTestMessage}
                disabled={testMode}>
                <MaterialIcons name="send" size={20} color={colors.text.primary} />
                <Text style={styles.testButtonText}>
                  {testMode ? 'Sending Test...' : 'Send Test Message'}
                </Text>
              </TouchableOpacity>
            )}
              </View>

              <TouchableOpacity
                style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
                onPress={handleSave}
                disabled={isSaving}>
                <Text style={styles.saveButtonText}>
                  {isSaving ? 'Saving...' : 'Save Emergency Settings'}
                </Text>
              </TouchableOpacity>
            </>
          )}
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
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButtonText: {
    color: colors.text.primary,
    fontSize: 16,
    marginLeft: 8,
    fontFamily: 'Inter-Regular',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text.primary,
    fontFamily: 'Inter-Bold',
  },
  description: {
    fontSize: 16,
    color: colors.text.secondary,
    marginBottom: 30,
    lineHeight: 24,
    fontFamily: 'Inter-Regular',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${colors.status.error}20`,
    padding: 15,
    borderRadius: radius.lg,
    marginBottom: 20,
    gap: 10,
  },
  errorText: {
    color: colors.status.error,
    flex: 1,
    fontFamily: 'Inter-Regular',
  },
  formSection: {
    backgroundColor: colors.secondary,
    borderRadius: radius.lg,
    padding: 20,
    marginBottom: 20,
    ...shadows.sm,
  },
  label: {
    color: colors.text.muted,
    fontSize: 14,
    marginBottom: 8,
    fontFamily: 'Inter-Medium',
  },
  labelDescription: {
    color: colors.text.muted,
    fontSize: 12,
    marginBottom: 8,
    fontFamily: 'Inter-Regular',
    opacity: 0.7,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    padding: 15,
    marginBottom: 20,
    gap: 10,
  },
  input: {
    flex: 1,
    color: colors.text.primary,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
  },
  messageContainer: {
    flexDirection: 'row',
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    padding: 15,
    marginBottom: 20,
    gap: 10,
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
    marginBottom: 20,
  },
  toggleLabel: {
    color: colors.text.primary,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
  },
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accent,
    padding: 15,
    borderRadius: radius.lg,
    gap: 10,
    ...shadows.sm,
  },
  testButtonActive: {
    opacity: 0.7,
  },
  testButtonText: {
    color: colors.text.primary,
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  saveButton: {
    backgroundColor: colors.accent,
    padding: 20,
    borderRadius: radius.lg,
    alignItems: 'center',
    ...shadows.md,
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
    color: colors.text.primary,
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: 'Inter-Bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    minHeight: 200,
  },
  loadingText: {
    color: colors.text.secondary,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    marginTop: 16,
  },
});