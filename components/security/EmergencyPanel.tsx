import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Alert,
  ScrollView,
  TextInput,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  emergencyProtocolManager,
  EmergencyContact,
  triggerEmergency,
  addEmergencyContact,
  registerPanicTap,
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
  const [activeTab, setActiveTab] = useState<'emergency' | 'contacts' | 'settings'>('emergency');
  const [emergencyContacts, setEmergencyContacts] = useState<EmergencyContact[]>([]);
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
                Alert.alert('Emergency Triggered', 'Emergency protocols have been activated.');
                onEmergencyTriggered?.();
                onClose();
              } else {
                Alert.alert('Error', 'Failed to trigger emergency protocols.');
              }
            } catch (error) {
              console.error('Emergency trigger error:', error);
              Alert.alert('Error', 'An error occurred while triggering emergency protocols.');
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
        <Ionicons name="warning" size={48} color="#FF3B30" />
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
        <Ionicons name="alert-circle" size={24} color="#FFFFFF" />
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
            color={config.isEnabled ? '#34C759' : '#FF3B30'}
          />
          <Text style={styles.statusText}>
            Emergency protocols {config.isEnabled ? 'enabled' : 'disabled'}
          </Text>
        </View>
        <View style={styles.statusRow}>
          <Ionicons
            name="people"
            size={20}
            color="#007AFF"
          />
          <Text style={styles.statusText}>
            {emergencyContacts.length} emergency contact{emergencyContacts.length !== 1 ? 's' : ''}
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
          <Ionicons name="add" size={20} color="#007AFF" />
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
              <Ionicons name="trash" size={20} color="#FF3B30" />
            </TouchableOpacity>
          </View>
        ))}
        
        {emergencyContacts.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="person-add" size={48} color="#8E8E93" />
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
              onValueChange={(value) => handleConfigUpdate({ isEnabled: value })}
            />
          </View>

          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Panic Gesture</Text>
            <Switch
              value={config.panicGestureEnabled}
              onValueChange={(value) => handleConfigUpdate({ panicGestureEnabled: value })}
            />
          </View>
        </View>

        <View style={styles.settingSection}>
          <Text style={styles.sectionTitle}>Auto Actions</Text>
          
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Auto Call Primary Contact</Text>
            <Switch
              value={config.autoCallEnabled}
              onValueChange={(value) => handleConfigUpdate({ autoCallEnabled: value })}
            />
          </View>

          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Auto Send Text Messages</Text>
            <Switch
              value={config.autoTextEnabled}
              onValueChange={(value) => handleConfigUpdate({ autoTextEnabled: value })}
            />
          </View>
        </View>

        <View style={styles.settingSection}>
          <Text style={styles.sectionTitle}>Emergency Message</Text>
          <TextInput
            style={styles.messageInput}
            value={config.emergencyMessage}
            onChangeText={(text) => handleConfigUpdate({ emergencyMessage: text })}
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
          color={activeTab === 'emergency' ? '#007AFF' : '#8E8E93'}
        />
        <Text style={[
          styles.tabText,
          activeTab === 'emergency' && styles.tabTextActive,
        ]}>
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
          color={activeTab === 'contacts' ? '#007AFF' : '#8E8E93'}
        />
        <Text style={[
          styles.tabText,
          activeTab === 'contacts' && styles.tabTextActive,
        ]}>
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
          color={activeTab === 'settings' ? '#007AFF' : '#8E8E93'}
        />
        <Text style={[
          styles.tabText,
          activeTab === 'settings' && styles.tabTextActive,
        ]}>
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
            <Ionicons name="close" size={24} color="#007AFF" />
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
    <Modal visible={visible} animationType="slide" presentationStyle="formSheet">
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
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  closeButton: {
    padding: 4,
  },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: '#007AFF',
  },
  tabText: {
    fontSize: 14,
    color: '#8E8E93',
    marginLeft: 4,
  },
  tabTextActive: {
    color: '#007AFF',
    fontWeight: '600',
  },
  tabContent: {
    flex: 1,
    padding: 16,
  },
  emergencyHeader: {
    alignItems: 'center',
    marginBottom: 32,
  },
  emergencyTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  emergencySubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  emergencyButton: {
    backgroundColor: '#FF3B30',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginBottom: 24,
  },
  emergencyButtonDisabled: {
    backgroundColor: '#8E8E93',
  },
  emergencyButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  disabledText: {
    fontSize: 14,
    color: '#FF3B30',
    textAlign: 'center',
    marginBottom: 24,
  },
  statusSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusText: {
    fontSize: 16,
    color: '#666',
    marginLeft: 8,
  },
  instructionsSection: {
    backgroundColor: '#F8F9FA',
    padding: 16,
    borderRadius: 8,
  },
  instructionText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#F0F8FF',
    borderRadius: 6,
  },
  addButtonText: {
    fontSize: 14,
    color: '#007AFF',
    marginLeft: 4,
  },
  contactsList: {
    flex: 1,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    marginBottom: 8,
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  primaryBadge: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '500',
  },
  contactPhone: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  contactRelation: {
    fontSize: 12,
    color: '#8E8E93',
  },
  contactAction: {
    padding: 8,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#8E8E93',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
  },
  settingsContainer: {
    flex: 1,
  },
  settingSection: {
    marginBottom: 24,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  settingLabel: {
    fontSize: 16,
    color: '#333',
  },
  messageInput: {
    borderWidth: 1,
    borderColor: '#E9ECEF',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#333',
    textAlignVertical: 'top',
    minHeight: 80,
  },
  addContactContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  addContactHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  addContactTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  cancelButton: {
    fontSize: 16,
    color: '#FF3B30',
  },
  saveButton: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  addContactForm: {
    flex: 1,
    padding: 16,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#E9ECEF',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#333',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    marginBottom: 12,
  },
  switchLabel: {
    fontSize: 16,
    color: '#333',
  },
  helpText: {
    fontSize: 12,
    color: '#8E8E93',
    fontStyle: 'italic',
  },
});

export default EmergencyPanel;
