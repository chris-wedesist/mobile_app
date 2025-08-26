import React, { useEffect, useState } from 'react';
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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
  registerPanicTap,
  triggerEmergency,
} from '../../lib/security/emergencyProtocols';

interface EmergencyPanelProps {
  visible: boolean;
  onClose: () => void;
  onEmergencyTriggered?: () => void;
}

export const EmergencyPanel: React.FC<EmergencyPanelProps> = ({
  visible,
  onClose,
  onEmergencyTriggered,
}) => {
  const [activeTab, setActiveTab] = useState<
    'emergency' | 'contacts' | 'settings'
  >('emergency');
  const [emergencyContacts, setEmergencyContacts] = useState<
    EmergencyContact[]
  >([]);
  const [config, setConfig] = useState({
    isEnabled: false,
    panicGestureEnabled: true,
    autoCallEnabled: false,
    autoTextEnabled: true,
    emergencyMessage: '',
  });
  const [isTriggering, setIsTriggering] = useState(false);
  const [showAddContact, setShowAddContact] = useState(false);

  useEffect(() => {
    if (visible) {
      loadData();
    }
  }, [visible]);

  const loadData = async () => {
    try {
      await emergencyProtocolManager.initialize();
      const contacts = emergencyProtocolManager.getEmergencyContacts();
      const currentConfig = emergencyProtocolManager.getConfig();

      setEmergencyContacts(contacts);
      setConfig({
        isEnabled: currentConfig.isEnabled,
        panicGestureEnabled: currentConfig.panicGestureEnabled,
        autoCallEnabled: currentConfig.autoCallEnabled,
        autoTextEnabled: currentConfig.autoTextEnabled,
        emergencyMessage: currentConfig.emergencyMessage,
      });
    } catch (error) {
      console.error('Failed to load emergency data:', error);
    }
  };

  const handleEmergencyTrigger = async () => {
    Alert.alert(
      'Trigger Emergency',
      'Are you sure you want to trigger emergency protocols? This will alert your emergency contacts.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Trigger',
          style: 'destructive',
          onPress: async () => {
            setIsTriggering(true);
            try {
              const success = await triggerEmergency('manual');
              if (success) {
                Alert.alert(
                  'Emergency Triggered',
                  'Emergency protocols have been activated.'
                );
                onEmergencyTriggered?.();
                onClose();
              } else {
                Alert.alert('Error', 'Failed to trigger emergency protocols.');
              }
            } catch (error) {
              console.error('Emergency trigger error:', error);
              Alert.alert(
                'Error',
                'An error occurred while triggering emergency protocols.'
              );
            } finally {
              setIsTriggering(false);
            }
          },
        },
      ]
    );
  };

  const handleConfigUpdate = async (updates: Partial<typeof config>) => {
    const newConfig = { ...config, ...updates };
    setConfig(newConfig);

    try {
      await emergencyProtocolManager.updateConfig(newConfig);
    } catch (error) {
      console.error('Failed to update emergency config:', error);
    }
  };

  const renderEmergencyTab = () => (
    <View style={styles.tabContent}>
      <View style={styles.emergencyHeader}>
        <Ionicons name="warning" size={48} color={colors.error} />
        <Text style={styles.emergencyTitle}>Emergency Protocols</Text>
        <Text style={styles.emergencySubtitle}>
          Trigger emergency alerts to your contacts
        </Text>
      </View>

      <TouchableOpacity
        style={[
          styles.emergencyButton,
          isTriggering && styles.emergencyButtonDisabled,
        ]}
        onPress={handleEmergencyTrigger}
        disabled={isTriggering || !config.isEnabled}
      >
        <Ionicons name="alert-circle" size={24} color={colors.background} />
        <Text style={styles.emergencyButtonText}>
          {isTriggering ? 'Triggering...' : 'TRIGGER EMERGENCY'}
        </Text>
      </TouchableOpacity>

      {!config.isEnabled && (
        <Text style={styles.disabledText}>
          Emergency protocols are disabled. Enable them in settings.
        </Text>
      )}

      <View style={styles.statusSection}>
        <Text style={styles.sectionTitle}>Status</Text>
        <View style={styles.statusRow}>
          <Ionicons
            name={config.isEnabled ? 'checkmark-circle' : 'close-circle'}
            size={20}
            color={config.isEnabled ? colors.success : colors.error}
          />
          <Text style={styles.statusText}>
            Emergency protocols {config.isEnabled ? 'enabled' : 'disabled'}
          </Text>
        </View>
        <View style={styles.statusRow}>
          <Ionicons name="people" size={20} color={colors.primary} />
          <Text style={styles.statusText}>
            {emergencyContacts.length} emergency contact
            {emergencyContacts.length !== 1 ? 's' : ''}
          </Text>
        </View>
      </View>

      <View style={styles.instructionsSection}>
        <Text style={styles.sectionTitle}>Quick Access</Text>
        <Text style={styles.instructionText}>
          • Panic Gesture: Tap 5 times rapidly anywhere on screen
        </Text>
        <Text style={styles.instructionText}>
          • Manual: Use this emergency button
        </Text>
        <Text style={styles.instructionText}>
          • Auto-reset: App will switch to stealth mode after trigger
        </Text>
      </View>
    </View>
  );

  const renderContactsTab = () => (
    <View style={styles.tabContent}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Emergency Contacts</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowAddContact(true)}
        >
          <Ionicons name="add" size={20} color={colors.primary} />
          <Text style={styles.addButtonText}>Add</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.contactsList}>
        {emergencyContacts.map((contact) => (
          <View key={contact.id} style={styles.contactItem}>
            <View style={styles.contactInfo}>
              <Text style={styles.contactName}>
                {contact.name}
                {contact.isPrimary && (
                  <Text style={styles.primaryBadge}> (Primary)</Text>
                )}
              </Text>
              <Text style={styles.contactPhone}>{contact.phoneNumber}</Text>
              <Text style={styles.contactRelation}>{contact.relationship}</Text>
            </View>
            <TouchableOpacity
              style={styles.contactAction}
              onPress={() => handleRemoveContact(contact.id)}
            >
              <Ionicons name="trash" size={20} color={colors.error} />
            </TouchableOpacity>
          </View>
        ))}

        {emergencyContacts.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="person-add" size={48} color={colors.text.muted} />
            <Text style={styles.emptyStateText}>No emergency contacts</Text>
            <Text style={styles.emptyStateSubtext}>
              Add contacts to enable emergency protocols
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );

  const renderSettingsTab = () => (
    <View style={styles.tabContent}>
      <ScrollView style={styles.settingsContainer}>
        <View style={styles.settingSection}>
          <Text style={styles.sectionTitle}>General</Text>

          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Enable Emergency Protocols</Text>
            <Switch
              value={config.isEnabled}
              onValueChange={(value) =>
                handleConfigUpdate({ isEnabled: value })
              }
            />
          </View>

          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Panic Gesture</Text>
            <Switch
              value={config.panicGestureEnabled}
              onValueChange={(value) =>
                handleConfigUpdate({ panicGestureEnabled: value })
              }
            />
          </View>
        </View>

        <View style={styles.settingSection}>
          <Text style={styles.sectionTitle}>Auto Actions</Text>

          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Auto Call Primary Contact</Text>
            <Switch
              value={config.autoCallEnabled}
              onValueChange={(value) =>
                handleConfigUpdate({ autoCallEnabled: value })
              }
            />
          </View>

          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Auto Send Text Messages</Text>
            <Switch
              value={config.autoTextEnabled}
              onValueChange={(value) =>
                handleConfigUpdate({ autoTextEnabled: value })
              }
            />
          </View>
        </View>

        <View style={styles.settingSection}>
          <Text style={styles.sectionTitle}>Emergency Message</Text>
          <TextInput
            style={styles.messageInput}
            value={config.emergencyMessage}
            onChangeText={(text) =>
              handleConfigUpdate({ emergencyMessage: text })
            }
            placeholder="Enter emergency message..."
            multiline
            numberOfLines={3}
          />
        </View>
      </ScrollView>
    </View>
  );

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
              loadData();
            } catch (error) {
              console.error('Failed to remove contact:', error);
            }
          },
        },
      ]
    );
  };

  const renderTabs = () => (
    <View style={styles.tabBar}>
      <TouchableOpacity
        style={[styles.tab, activeTab === 'emergency' && styles.tabActive]}
        onPress={() => setActiveTab('emergency')}
      >
        <Ionicons
          name="warning"
          size={20}
          color={activeTab === 'emergency' ? colors.primary : colors.text.muted}
        />
        <Text
          style={[
            styles.tabText,
            activeTab === 'emergency' && styles.tabTextActive,
          ]}
        >
          Emergency
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.tab, activeTab === 'contacts' && styles.tabActive]}
        onPress={() => setActiveTab('contacts')}
      >
        <Ionicons
          name="people"
          size={20}
          color={activeTab === 'contacts' ? colors.primary : colors.text.muted}
        />
        <Text
          style={[
            styles.tabText,
            activeTab === 'contacts' && styles.tabTextActive,
          ]}
        >
          Contacts
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.tab, activeTab === 'settings' && styles.tabActive]}
        onPress={() => setActiveTab('settings')}
      >
        <Ionicons
          name="settings"
          size={20}
          color={activeTab === 'settings' ? colors.primary : colors.text.muted}
        />
        <Text
          style={[
            styles.tabText,
            activeTab === 'settings' && styles.tabTextActive,
          ]}
        >
          Settings
        </Text>
      </TouchableOpacity>
    </View>
  );

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Emergency Center</Text>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={24} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {renderTabs()}

        {activeTab === 'emergency' && renderEmergencyTab()}
        {activeTab === 'contacts' && renderContactsTab()}
        {activeTab === 'settings' && renderSettingsTab()}
      </View>

      <AddContactModal
        visible={showAddContact}
        onClose={() => setShowAddContact(false)}
        onAdd={async (contact) => {
          try {
            await addEmergencyContact(contact);
            loadData();
            setShowAddContact(false);
          } catch (error) {
            console.error('Failed to add contact:', error);
          }
        }}
      />
    </Modal>
  );
};

interface AddContactModalProps {
  visible: boolean;
  onClose: () => void;
  onAdd: (contact: Omit<EmergencyContact, 'id'>) => void;
}

const AddContactModal: React.FC<AddContactModalProps> = ({
  visible,
  onClose,
  onAdd,
}) => {
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [relationship, setRelationship] = useState('');
  const [isPrimary, setIsPrimary] = useState(false);

  const handleSave = () => {
    if (!name.trim() || !phoneNumber.trim()) {
      Alert.alert('Error', 'Please fill in all required fields.');
      return;
    }

    onAdd({
      name: name.trim(),
      phoneNumber: phoneNumber.trim(),
      relationship: relationship.trim() || 'Contact',
      isPrimary,
    });

    // Reset form
    setName('');
    setPhoneNumber('');
    setRelationship('');
    setIsPrimary(false);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="formSheet"
    >
      <View style={styles.addContactContainer}>
        <View style={styles.addContactHeader}>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.cancelButton}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.addContactTitle}>Add Contact</Text>
          <TouchableOpacity onPress={handleSave}>
            <Text style={styles.saveButton}>Save</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.addContactForm}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Name *</Text>
            <TextInput
              style={styles.textInput}
              value={name}
              onChangeText={setName}
              placeholder="Enter contact name"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Phone Number *</Text>
            <TextInput
              style={styles.textInput}
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              placeholder="Enter phone number"
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Relationship</Text>
            <TextInput
              style={styles.textInput}
              value={relationship}
              onChangeText={setRelationship}
              placeholder="e.g., Family, Friend, Lawyer"
            />
          </View>

          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Primary Contact</Text>
            <Switch value={isPrimary} onValueChange={setIsPrimary} />
          </View>

          <Text style={styles.helpText}>
            Primary contact will be called first during emergencies.
          </Text>
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: typography.fontSize.subheading,
    fontWeight: '600',
    color: colors.text.primary,
  },
  closeButton: {
    padding: spacing.xs,
  },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
  },
  tabText: {
    fontSize: typography.fontSize.small,
    color: colors.text.muted,
    marginLeft: spacing.xs,
  },
  tabTextActive: {
    color: colors.primary,
    fontWeight: '600',
  },
  tabContent: {
    flex: 1,
    padding: spacing.md,
  },
  emergencyHeader: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  emergencyTitle: {
    fontSize: typography.fontSize.title,
    fontWeight: '700',
    color: colors.text.primary,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  emergencySubtitle: {
    fontSize: typography.fontSize.body,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  emergencyButton: {
    backgroundColor: colors.error,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.medium,
    marginBottom: spacing.lg,
  },
  emergencyButtonDisabled: {
    backgroundColor: colors.text.muted,
  },
  emergencyButtonText: {
    fontSize: typography.fontSize.subheading,
    fontWeight: '700',
    color: colors.background,
    marginLeft: spacing.xs,
  },
  disabledText: {
    fontSize: typography.fontSize.small,
    color: colors.error,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  statusSection: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: typography.fontSize.subheading,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  statusText: {
    fontSize: typography.fontSize.body,
    color: colors.text.secondary,
    marginLeft: spacing.xs,
  },
  instructionsSection: {
    backgroundColor: colors.background,
    padding: spacing.md,
    borderRadius: radius.small,
  },
  instructionText: {
    fontSize: typography.fontSize.small,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.background,
    borderRadius: radius.small,
  },
  addButtonText: {
    fontSize: typography.fontSize.small,
    color: colors.primary,
    marginLeft: spacing.xs,
  },
  contactsList: {
    flex: 1,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.background,
    borderRadius: radius.small,
    marginBottom: spacing.xs,
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: typography.fontSize.body,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.xs,
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
  contactAction: {
    padding: spacing.xs,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xl * 3,
  },
  emptyStateText: {
    fontSize: typography.fontSize.subheading,
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
  settingsContainer: {
    flex: 1,
  },
  settingSection: {
    marginBottom: spacing.lg,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  settingLabel: {
    fontSize: typography.fontSize.body,
    color: colors.text.primary,
  },
  messageInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.medium,
    padding: spacing.sm,
    fontSize: typography.fontSize.body,
    color: colors.text.primary,
    textAlignVertical: 'top',
    minHeight: 80,
  },
  addContactContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  addContactHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  addContactTitle: {
    fontSize: typography.fontSize.subheading,
    fontWeight: '600',
    color: colors.text.primary,
  },
  cancelButton: {
    fontSize: typography.fontSize.body,
    color: colors.error,
  },
  saveButton: {
    fontSize: typography.fontSize.body,
    color: colors.primary,
    fontWeight: '600',
  },
  addContactForm: {
    flex: 1,
    padding: spacing.md,
  },
  inputGroup: {
    marginBottom: spacing.md,
  },
  inputLabel: {
    fontSize: typography.fontSize.body,
    fontWeight: '500',
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  textInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.medium,
    padding: spacing.sm,
    fontSize: typography.fontSize.body,
    color: colors.text.primary,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    marginBottom: spacing.sm,
  },
  switchLabel: {
    fontSize: typography.fontSize.body,
    color: colors.text.primary,
  },
  helpText: {
    fontSize: typography.fontSize.caption,
    color: colors.text.muted,
    fontStyle: 'italic',
  },
});

export default EmergencyPanel;
