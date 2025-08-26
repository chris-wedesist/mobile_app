import React, { useEffect, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import {
  colors,
  radius,
  shadows,
  spacing,
  typography,
} from '../../constants/theme';
import {
  addEmergencyContact,
  EmergencyContact,
  emergencyProtocolManager,
} from '../../lib/security/emergencyProtocols';

export default function EmergencySetupScreen() {
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [isEnabled, setIsEnabled] = useState(false);
  const [emergencyMessage, setEmergencyMessage] = useState(
    'This is an emergency alert from DESIST app. I may need assistance.'
  );
  const [showAddContact, setShowAddContact] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Add contact form state
  const [newContact, setNewContact] = useState({
    name: '',
    phoneNumber: '',
    relationship: '',
    isPrimary: false,
  });

  useEffect(() => {
    initializeEmergency();
  }, []);

  const initializeEmergency = async () => {
    try {
      await emergencyProtocolManager.initialize();

      const emergencyContacts = emergencyProtocolManager.getEmergencyContacts();
      const config = emergencyProtocolManager.getConfig();

      setContacts(emergencyContacts);
      setIsEnabled(config.isEnabled);
      setEmergencyMessage(config.emergencyMessage);
    } catch (error) {
      console.error('Failed to initialize emergency setup:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleEnabled = async (enabled: boolean) => {
    try {
      await emergencyProtocolManager.updateConfig({ isEnabled: enabled });
      setIsEnabled(enabled);

      if (enabled && contacts.length === 0) {
        Alert.alert(
          'Add Contacts',
          'You should add at least one emergency contact to use this feature.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Failed to update emergency config:', error);
    }
  };

  const handleAddContact = async () => {
    if (!newContact.name.trim() || !newContact.phoneNumber.trim()) {
      Alert.alert('Error', 'Please fill in name and phone number.');
      return;
    }

    try {
      await addEmergencyContact({
        name: newContact.name.trim(),
        phoneNumber: newContact.phoneNumber.trim(),
        relationship: newContact.relationship.trim() || 'Contact',
        isPrimary: newContact.isPrimary || contacts.length === 0, // First contact is primary by default
      });

      // Reload contacts
      await initializeEmergency();

      // Reset form
      setNewContact({
        name: '',
        phoneNumber: '',
        relationship: '',
        isPrimary: false,
      });
      setShowAddContact(false);

      Alert.alert(
        'Contact Added',
        'Emergency contact has been added successfully.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Failed to add emergency contact:', error);
      Alert.alert('Error', 'Failed to add emergency contact.');
    }
  };

  const handleRemoveContact = async (contactId: string) => {
    Alert.alert(
      'Remove Contact',
      'Are you sure you want to remove this emergency contact?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await emergencyProtocolManager.removeEmergencyContact(contactId);
              await initializeEmergency();
            } catch (error) {
              console.error('Failed to remove contact:', error);
            }
          },
        },
      ]
    );
  };

  const handleUpdateMessage = async () => {
    try {
      await emergencyProtocolManager.updateConfig({
        emergencyMessage: emergencyMessage.trim(),
      });
      Alert.alert('Updated', 'Emergency message has been updated.');
    } catch (error) {
      console.error('Failed to update emergency message:', error);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Ionicons name="refresh" size={48} color={colors.error} />
        <Text style={styles.loadingText}>Loading emergency setup...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Ionicons name="warning" size={64} color={colors.error} />
          </View>
          <Text style={styles.title}>Emergency Protocols</Text>
          <Text style={styles.description}>
            Set up emergency contacts and configure automatic alerts for
            critical situations.
          </Text>
        </View>

        <View style={styles.enableSection}>
          <View style={styles.toggleRow}>
            <View style={styles.toggleInfo}>
              <Text style={styles.toggleLabel}>Enable Emergency Protocols</Text>
              <Text style={styles.toggleDescription}>
                Allow the app to contact emergency contacts when triggered
              </Text>
            </View>
            <Switch
              value={isEnabled}
              onValueChange={handleToggleEnabled}
              trackColor={{ false: colors.border, true: colors.success }}
              thumbColor={colors.background}
            />
          </View>
        </View>

        <View style={styles.contactsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Emergency Contacts</Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => setShowAddContact(!showAddContact)}
            >
              <Ionicons name="add" size={20} color={colors.primary} />
              <Text style={styles.addButtonText}>Add</Text>
            </TouchableOpacity>
          </View>

          {showAddContact && (
            <View style={styles.addContactForm}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Name *</Text>
                <TextInput
                  style={styles.textInput}
                  value={newContact.name}
                  onChangeText={(text) =>
                    setNewContact((prev) => ({ ...prev, name: text }))
                  }
                  placeholder="Enter contact name"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Phone Number *</Text>
                <TextInput
                  style={styles.textInput}
                  value={newContact.phoneNumber}
                  onChangeText={(text) =>
                    setNewContact((prev) => ({ ...prev, phoneNumber: text }))
                  }
                  placeholder="Enter phone number"
                  keyboardType="phone-pad"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Relationship</Text>
                <TextInput
                  style={styles.textInput}
                  value={newContact.relationship}
                  onChangeText={(text) =>
                    setNewContact((prev) => ({ ...prev, relationship: text }))
                  }
                  placeholder="e.g., Family, Friend, Lawyer"
                />
              </View>

              <View style={styles.switchRow}>
                <Text style={styles.switchLabel}>Primary Contact</Text>
                <Switch
                  value={newContact.isPrimary}
                  onValueChange={(value) =>
                    setNewContact((prev) => ({ ...prev, isPrimary: value }))
                  }
                />
              </View>

              <View style={styles.formActions}>
                <TouchableOpacity
                  style={[styles.button, styles.cancelButton]}
                  onPress={() => {
                    setShowAddContact(false);
                    setNewContact({
                      name: '',
                      phoneNumber: '',
                      relationship: '',
                      isPrimary: false,
                    });
                  }}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.button, styles.saveButton]}
                  onPress={handleAddContact}
                >
                  <Text style={styles.saveButtonText}>Save Contact</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {contacts.length > 0 ? (
            <View style={styles.contactsList}>
              {contacts.map((contact) => (
                <View key={contact.id} style={styles.contactItem}>
                  <View style={styles.contactInfo}>
                    <Text style={styles.contactName}>
                      {contact.name}
                      {contact.isPrimary && (
                        <Text style={styles.primaryBadge}> (Primary)</Text>
                      )}
                    </Text>
                    <Text style={styles.contactPhone}>
                      {contact.phoneNumber}
                    </Text>
                    <Text style={styles.contactRelation}>
                      {contact.relationship}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => handleRemoveContact(contact.id)}
                  >
                    <Ionicons name="trash" size={20} color={colors.error} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="person-add" size={48} color={colors.text.muted} />
              <Text style={styles.emptyStateText}>No emergency contacts</Text>
              <Text style={styles.emptyStateSubtext}>
                Add contacts to enable emergency protocols
              </Text>
            </View>
          )}
        </View>

        <View style={styles.messageSection}>
          <Text style={styles.sectionTitle}>Emergency Message</Text>
          <Text style={styles.messageDescription}>
            This message will be sent to your emergency contacts when protocols
            are triggered.
          </Text>
          <TextInput
            style={styles.messageInput}
            value={emergencyMessage}
            onChangeText={setEmergencyMessage}
            placeholder="Enter emergency message..."
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
          <TouchableOpacity
            style={[styles.button, styles.updateButton]}
            onPress={handleUpdateMessage}
          >
            <Text style={styles.updateButtonText}>Update Message</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.featuresSection}>
          <Text style={styles.sectionTitle}>Features</Text>

          <View style={styles.featureRow}>
            <Ionicons name="hand-left" size={20} color={colors.error} />
            <Text style={styles.featureText}>
              Panic gesture: 5 rapid taps anywhere on screen
            </Text>
          </View>

          <View style={styles.featureRow}>
            <Ionicons name="call" size={20} color={colors.error} />
            <Text style={styles.featureText}>
              Auto-call primary contact (optional)
            </Text>
          </View>

          <View style={styles.featureRow}>
            <Ionicons name="chatbubble" size={20} color={colors.error} />
            <Text style={styles.featureText}>Auto-send emergency texts</Text>
          </View>

          <View style={styles.featureRow}>
            <Ionicons name="eye-off" size={20} color={colors.error} />
            <Text style={styles.featureText}>
              Automatic switch to stealth mode
            </Text>
          </View>
        </View>

        <View style={styles.navigationSection}>
          <TouchableOpacity
            style={styles.nextButton}
            onPress={() => router.push('/security-test' as any as any)}
          >
            <Text style={styles.nextButtonText}>Test Security Features</Text>
            <Ionicons name="chevron-forward" size={20} color={colors.primary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.skipButton}
            onPress={() => router.back()}
          >
            <Text style={styles.skipButtonText}>Finish Setup</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    fontSize: typography.fontSize.body,
    color: colors.text.secondary,
    marginTop: spacing.md,
  },
  content: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    padding: spacing.xl,
    paddingTop: spacing.xl * 1.67, // 40px equivalent
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: typography.fontSize.title,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: spacing.sm + 2,
    textAlign: 'center',
  },
  description: {
    fontSize: typography.fontSize.body,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: spacing.md,
  },
  enableSection: {
    margin: spacing.xl,
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.large,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  toggleInfo: {
    flex: 1,
    marginRight: spacing.md,
  },
  toggleLabel: {
    fontSize: typography.fontSize.body,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.xs / 2,
  },
  toggleDescription: {
    fontSize: typography.fontSize.small,
    color: colors.text.secondary,
    lineHeight: 20,
  },
  contactsSection: {
    margin: spacing.xl,
    marginTop: 0,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.fontSize.subheading,
    fontWeight: '600',
    color: colors.text.primary,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm + 2,
    backgroundColor: colors.surface,
    borderRadius: radius.small + 2,
  },
  addButtonText: {
    fontSize: typography.fontSize.small,
    color: colors.primary,
    marginLeft: spacing.xs / 2,
  },
  addContactForm: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radius.medium,
    marginBottom: spacing.md,
  },
  inputGroup: {
    marginBottom: spacing.md,
  },
  inputLabel: {
    fontSize: typography.fontSize.small,
    fontWeight: '500',
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  textInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.medium,
    padding: spacing.sm + 2,
    fontSize: typography.fontSize.body,
    color: colors.text.primary,
    backgroundColor: colors.background,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  switchLabel: {
    fontSize: typography.fontSize.small,
    color: colors.text.primary,
  },
  formActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  button: {
    flex: 1,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.md,
    borderRadius: radius.medium,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: colors.border,
    marginRight: spacing.xs,
  },
  saveButton: {
    backgroundColor: colors.primary,
    marginLeft: spacing.xs,
  },
  cancelButtonText: {
    fontSize: typography.fontSize.small,
    color: colors.text.secondary,
    fontWeight: '500',
  },
  saveButtonText: {
    fontSize: typography.fontSize.small,
    color: colors.background,
    fontWeight: '600',
  },
  contactsList: {
    marginTop: spacing.xs,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.medium,
    marginBottom: spacing.xs,
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: typography.fontSize.body,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.xs / 2,
  },
  primaryBadge: {
    fontSize: typography.fontSize.caption,
    color: colors.primary,
    fontWeight: '500',
  },
  contactPhone: {
    fontSize: typography.fontSize.small,
    color: colors.text.secondary,
    marginBottom: 2,
  },
  contactRelation: {
    fontSize: typography.fontSize.caption,
    color: colors.text.muted,
  },
  removeButton: {
    padding: spacing.xs,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xl * 2,
  },
  emptyStateText: {
    fontSize: typography.fontSize.body,
    fontWeight: '600',
    color: colors.text.muted,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  emptyStateSubtext: {
    fontSize: typography.fontSize.small,
    color: colors.text.muted,
    textAlign: 'center',
  },
  messageSection: {
    margin: spacing.xl,
    marginTop: 0,
  },
  messageDescription: {
    fontSize: typography.fontSize.small,
    color: colors.text.secondary,
    marginBottom: spacing.sm + 2,
    lineHeight: 20,
  },
  messageInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.medium,
    padding: spacing.sm + 2,
    fontSize: typography.fontSize.body,
    color: colors.text.primary,
    minHeight: 80,
    marginBottom: spacing.sm + 2,
  },
  updateButton: {
    backgroundColor: colors.success,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.md,
    borderRadius: radius.medium,
    alignItems: 'center',
  },
  updateButtonText: {
    fontSize: typography.fontSize.small,
    color: colors.background,
    fontWeight: '600',
  },
  featuresSection: {
    margin: spacing.xl,
    marginTop: 0,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm + 2,
  },
  featureText: {
    fontSize: typography.fontSize.small,
    color: colors.text.primary,
    marginLeft: spacing.sm + 2,
    flex: 1,
  },
  navigationSection: {
    margin: spacing.xl,
    marginTop: 0,
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    backgroundColor: colors.surface,
    borderRadius: radius.large,
    borderWidth: 1,
    borderColor: colors.primary,
    marginBottom: spacing.sm + 2,
  },
  nextButtonText: {
    fontSize: typography.fontSize.body,
    fontWeight: '600',
    color: colors.primary,
    marginRight: spacing.xs,
  },
  skipButton: {
    alignItems: 'center',
    paddingVertical: spacing.sm + 2,
  },
  skipButtonText: {
    fontSize: typography.fontSize.body,
    color: colors.text.muted,
  },
});
