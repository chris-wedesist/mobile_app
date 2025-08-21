import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import {
  emergencyProtocolManager,
  EmergencyContact,
  addEmergencyContact,
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
        emergencyMessage: emergencyMessage.trim() 
      });
      Alert.alert('Updated', 'Emergency message has been updated.');
    } catch (error) {
      console.error('Failed to update emergency message:', error);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Ionicons name="refresh" size={48} color="#FF3B30" />
        <Text style={styles.loadingText}>Loading emergency setup...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Ionicons name="warning" size={64} color="#FF3B30" />
          </View>
          <Text style={styles.title}>Emergency Protocols</Text>
          <Text style={styles.description}>
            Set up emergency contacts and configure automatic alerts for critical situations.
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
              trackColor={{ false: '#E9ECEF', true: '#34C759' }}
              thumbColor={'#FFFFFF'}
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
              <Ionicons name="add" size={20} color="#007AFF" />
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
                  onChangeText={(text) => setNewContact(prev => ({ ...prev, name: text }))}
                  placeholder="Enter contact name"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Phone Number *</Text>
                <TextInput
                  style={styles.textInput}
                  value={newContact.phoneNumber}
                  onChangeText={(text) => setNewContact(prev => ({ ...prev, phoneNumber: text }))}
                  placeholder="Enter phone number"
                  keyboardType="phone-pad"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Relationship</Text>
                <TextInput
                  style={styles.textInput}
                  value={newContact.relationship}
                  onChangeText={(text) => setNewContact(prev => ({ ...prev, relationship: text }))}
                  placeholder="e.g., Family, Friend, Lawyer"
                />
              </View>

              <View style={styles.switchRow}>
                <Text style={styles.switchLabel}>Primary Contact</Text>
                <Switch
                  value={newContact.isPrimary}
                  onValueChange={(value) => setNewContact(prev => ({ ...prev, isPrimary: value }))}
                />
              </View>

              <View style={styles.formActions}>
                <TouchableOpacity
                  style={[styles.button, styles.cancelButton]}
                  onPress={() => {
                    setShowAddContact(false);
                    setNewContact({ name: '', phoneNumber: '', relationship: '', isPrimary: false });
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
                    <Text style={styles.contactPhone}>{contact.phoneNumber}</Text>
                    <Text style={styles.contactRelation}>{contact.relationship}</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => handleRemoveContact(contact.id)}
                  >
                    <Ionicons name="trash" size={20} color="#FF3B30" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="person-add" size={48} color="#8E8E93" />
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
            This message will be sent to your emergency contacts when protocols are triggered.
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
            <Ionicons name="hand-left" size={20} color="#FF3B30" />
            <Text style={styles.featureText}>
              Panic gesture: 5 rapid taps anywhere on screen
            </Text>
          </View>
          
          <View style={styles.featureRow}>
            <Ionicons name="call" size={20} color="#FF3B30" />
            <Text style={styles.featureText}>
              Auto-call primary contact (optional)
            </Text>
          </View>
          
          <View style={styles.featureRow}>
            <Ionicons name="chatbubble" size={20} color="#FF3B30" />
            <Text style={styles.featureText}>
              Auto-send emergency texts
            </Text>
          </View>
          
          <View style={styles.featureRow}>
            <Ionicons name="eye-off" size={20} color="#FF3B30" />
            <Text style={styles.featureText}>
              Automatic switch to stealth mode
            </Text>
          </View>
        </View>

        <View style={styles.navigationSection}>
          <TouchableOpacity
            style={styles.nextButton}
            onPress={() => router.push('/security-test' as any)}
          >
            <Text style={styles.nextButtonText}>Test Security Features</Text>
            <Ionicons name="chevron-forward" size={20} color="#007AFF" />
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
    backgroundColor: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
  },
  content: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    padding: 24,
    paddingTop: 40,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#FFF5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
    marginBottom: 12,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 16,
  },
  enableSection: {
    margin: 24,
    padding: 20,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  toggleInfo: {
    flex: 1,
    marginRight: 16,
  },
  toggleLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  toggleDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  contactsSection: {
    margin: 24,
    marginTop: 0,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
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
  addContactForm: {
    backgroundColor: '#F8F9FA',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
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
    backgroundColor: '#FFFFFF',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  switchLabel: {
    fontSize: 14,
    color: '#333',
  },
  formActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#E9ECEF',
    marginRight: 8,
  },
  saveButton: {
    backgroundColor: '#007AFF',
    marginLeft: 8,
  },
  cancelButtonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  saveButtonText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  contactsList: {
    marginTop: 8,
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
  removeButton: {
    padding: 8,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyStateText: {
    fontSize: 16,
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
  messageSection: {
    margin: 24,
    marginTop: 0,
  },
  messageDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    lineHeight: 20,
  },
  messageInput: {
    borderWidth: 1,
    borderColor: '#E9ECEF',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#333',
    minHeight: 80,
    marginBottom: 12,
  },
  updateButton: {
    backgroundColor: '#34C759',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  updateButtonText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  featuresSection: {
    margin: 24,
    marginTop: 0,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureText: {
    fontSize: 14,
    color: '#333',
    marginLeft: 12,
    flex: 1,
  },
  navigationSection: {
    margin: 24,
    marginTop: 0,
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    backgroundColor: '#F0F8FF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#007AFF',
    marginBottom: 12,
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
    marginRight: 8,
  },
  skipButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  skipButtonText: {
    fontSize: 16,
    color: '#8E8E93',
  },
});
