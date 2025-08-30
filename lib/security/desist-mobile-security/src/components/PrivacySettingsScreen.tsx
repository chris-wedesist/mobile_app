import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { PrivacyService } from '../services/PrivacyService';
import { EncryptionService } from '../encryption';
import { ConsentPreferences, DataInventory, PrivacySettings } from '../types/privacy';
import { COLORS } from '../constants/theme';

interface PrivacySettingsScreenProps {
  encryptionService: EncryptionService;
  userId: string;
  onDataDeleted?: () => void;
}

const minimizedDataFields = [
  'Email (for account access)',
  'Incident reports (encrypted, no personal identifiers)',
  'App usage metrics (anonymous)',
  'Device info (OS type, version)',
  'Location data (for incident reporting only)',
  'Authentication data (hashed passwords, biometric templates)'
];

export const PrivacySettingsScreen: React.FC<PrivacySettingsScreenProps> = ({
  encryptionService,
  userId,
  onDataDeleted
}) => {
  const [loading, setLoading] = useState(false);
  const [consentPreferences, setConsentPreferences] = useState<ConsentPreferences>({
    essential: true,
    functional: true,
    analytics: false,
    marketing: false,
    personalization: false,
    thirdParty: false,
    locationServices: true,
    biometrics: false,
    cloudSync: false,
    crashReporting: true
  });
  const [privacySettings, setPrivacySettings] = useState<PrivacySettings | null>(null);
  const [dataInventory, setDataInventory] = useState<DataInventory | null>(null);

  const privacyService = new PrivacyService(encryptionService);

  useEffect(() => {
    loadPrivacyData();
  }, []);

  const loadPrivacyData = async (): Promise<void> => {
    try {
      setLoading(true);
      
      const [settingsResult, inventoryResult] = await Promise.all([
        privacyService.getPrivacySettings(userId),
        privacyService.getDataInventory(userId)
      ]);

      if (settingsResult.success && settingsResult.data) {
        setPrivacySettings(settingsResult.data);
      }

      if (inventoryResult.success && inventoryResult.data) {
        setDataInventory(inventoryResult.data);
      }

    } catch (error) {
      console.error('Failed to load privacy data:', error);
      Alert.alert('Error', 'Failed to load privacy settings');
    } finally {
      setLoading(false);
    }
  };

  const handleConsentChange = async (key: keyof ConsentPreferences, value: boolean): Promise<void> => {
    if (key === 'essential') {
      Alert.alert('Required', 'Essential cookies cannot be disabled as they are required for basic app functionality.');
      return;
    }

    try {
      setLoading(true);
      
      const updatedPreferences = {
        ...consentPreferences,
        [key]: value
      };
      
      setConsentPreferences(updatedPreferences);
      
      const result = await privacyService.recordConsent(userId, updatedPreferences);
      
      if (result.success) {
        Alert.alert(
          'Consent Updated',
          value 
            ? `You have enabled ${key} data processing.`
            : `You have disabled ${key} data processing.`
        );
      } else {
        Alert.alert('Error', 'Failed to update consent preferences');
        // Revert the change
        setConsentPreferences(consentPreferences);
      }
    } catch (error) {
      console.error('Consent update error:', error);
      Alert.alert('Error', 'Failed to update consent preferences');
      setConsentPreferences(consentPreferences);
    } finally {
      setLoading(false);
    }
  };

  const handleExportData = async (): Promise<void> => {
    try {
      setLoading(true);
      
      const result = await privacyService.requestDataExport(userId, 'json');
      
      if (result.success && result.data) {
        Alert.alert(
          'Data Export Requested',
          `Your data export has been prepared. Request ID: ${result.data.requestId}\n\nThe export will be available for download for 48 hours.`,
          [
            { text: 'OK' }
          ]
        );
      } else {
        Alert.alert('Error', 'Failed to export data. Please try again later.');
      }
    } catch (error) {
      console.error('Data export error:', error);
      Alert.alert('Error', 'Failed to export data. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async (): Promise<void> => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account and all related data? This action cannot be undone.\n\nThis will permanently remove:\n• Your profile and account\n• All incident reports\n• Location data\n• App preferences\n• Authentication data',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Account',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              
              const result = await privacyService.requestDataDeletion(userId, 'full');
              
              if (result.success) {
                Alert.alert(
                  'Account Deleted',
                  'Your account and all associated data have been permanently deleted.',
                  [
                    {
                      text: 'OK',
                      onPress: () => {
                        onDataDeleted?.();
                      }
                    }
                  ]
                );
              } else {
                Alert.alert('Error', 'Failed to delete account. Please try again later.');
              }
            } catch (error) {
              console.error('Account deletion error:', error);
              Alert.alert('Error', 'Failed to delete account. Please try again later.');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleWithdrawConsent = async (): Promise<void> => {
    Alert.alert(
      'Withdraw All Consent',
      'This will withdraw your consent for all non-essential data processing. Some app features may become unavailable.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Withdraw Consent',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              
              const result = await privacyService.withdrawConsent(userId);
              
              if (result.success) {
                // Update local state
                setConsentPreferences({
                  ...consentPreferences,
                  functional: false,
                  analytics: false,
                  marketing: false,
                  personalization: false,
                  thirdParty: false,
                  locationServices: false,
                  biometrics: false,
                  cloudSync: false,
                  crashReporting: false
                });
                
                Alert.alert(
                  'Consent Withdrawn',
                  'Your consent has been withdrawn. You can re-enable specific features at any time.'
                );
              } else {
                Alert.alert('Error', 'Failed to withdraw consent. Please try again later.');
              }
            } catch (error) {
              console.error('Consent withdrawal error:', error);
              Alert.alert('Error', 'Failed to withdraw consent. Please try again later.');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const renderConsentSwitch = (
    key: keyof ConsentPreferences,
    label: string,
    description: string,
    required = false
  ): React.ReactElement => (
    <View key={key} style={styles.consentItem}>
      <View style={styles.consentHeader}>
        <Text style={styles.consentLabel}>
          {label} {required && <Text style={styles.required}>*</Text>}
        </Text>
        <Switch
          value={consentPreferences[key]}
          onValueChange={(value) => handleConsentChange(key, value)}
          disabled={loading || required}
          trackColor={{ false: COLORS.border, true: COLORS.success }}
          thumbColor={consentPreferences[key] ? COLORS.white : COLORS.lightGray}
        />
      </View>
      <Text style={styles.consentDescription}>{description}</Text>
    </View>
  );

  const renderDataInventory = (): React.ReactElement | null => {
    if (!dataInventory) return null;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Your Data Overview</Text>
        <View style={styles.inventoryContainer}>
          <View style={styles.inventoryItem}>
            <Text style={styles.inventoryLabel}>Account Created</Text>
            <Text style={styles.inventoryValue}>
              {dataInventory.metadata.accountCreated.toLocaleDateString()}
            </Text>
          </View>
          <View style={styles.inventoryItem}>
            <Text style={styles.inventoryLabel}>Data Size</Text>
            <Text style={styles.inventoryValue}>{dataInventory.metadata.dataSize}</Text>
          </View>
          <View style={styles.inventoryItem}>
            <Text style={styles.inventoryLabel}>Incident Reports</Text>
            <Text style={styles.inventoryValue}>
              {dataInventory.personalData.incidents.totalReports} total
              ({dataInventory.personalData.incidents.anonymousReports} anonymous)
            </Text>
          </View>
          <View style={styles.inventoryItem}>
            <Text style={styles.inventoryLabel}>Storage Locations</Text>
            <Text style={styles.inventoryValue}>
              {dataInventory.metadata.storageLocations.join(', ')}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  if (loading && !privacySettings) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading privacy settings...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.header}>Privacy & Data Management</Text>
      <Text style={styles.subtitle}>
        Control how your data is used and exercise your privacy rights
      </Text>

      {/* Data Minimization */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Data We Collect</Text>
        <Text style={styles.sectionDescription}>
          We follow data minimization principles and only collect what's necessary:
        </Text>
        {minimizedDataFields.map((field, index) => (
          <Text key={index} style={styles.dataItem}>• {field}</Text>
        ))}
      </View>

      {/* Consent Management */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Consent Preferences</Text>
        <Text style={styles.sectionDescription}>
          Choose what data processing you consent to. You can change these settings at any time.
        </Text>

        {renderConsentSwitch(
          'essential',
          'Essential',
          'Required for basic app functionality and security. Cannot be disabled.',
          true
        )}
        
        {renderConsentSwitch(
          'functional',
          'Functional',
          'Enables enhanced app features and remembers your preferences.'
        )}
        
        {renderConsentSwitch(
          'analytics',
          'Analytics',
          'Helps us understand how the app is used to improve performance and features.'
        )}
        
        {renderConsentSwitch(
          'locationServices',
          'Location Services',
          'Enables location-based incident reporting and nearby incident viewing.'
        )}
        
        {renderConsentSwitch(
          'crashReporting',
          'Crash Reporting',
          'Helps us identify and fix bugs to improve app stability.'
        )}
        
        {renderConsentSwitch(
          'marketing',
          'Marketing',
          'Receive updates about new features and safety tips.'
        )}

        <TouchableOpacity
          style={styles.withdrawButton}
          onPress={handleWithdrawConsent}
          disabled={loading}
        >
          <Text style={styles.withdrawButtonText}>Withdraw All Consent</Text>
        </TouchableOpacity>
      </View>

      {/* Data Overview */}
      {renderDataInventory()}

      {/* Privacy Rights */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Your Privacy Rights</Text>
        <Text style={styles.sectionDescription}>
          Exercise your data protection rights under GDPR and CCPA:
        </Text>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleExportData}
          disabled={loading}
        >
          <Text style={styles.actionButtonText}>📄 Export My Data</Text>
          <Text style={styles.actionButtonSubtext}>
            Download all your data in a portable format
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.deleteButton]}
          onPress={handleDeleteAccount}
          disabled={loading}
        >
          <Text style={[styles.actionButtonText, styles.deleteButtonText]}>
            🗑️ Delete My Account & Data
          </Text>
          <Text style={[styles.actionButtonSubtext, styles.deleteButtonSubtext]}>
            Permanently remove all your data from our systems
          </Text>
        </TouchableOpacity>
      </View>

      {/* Legal Information */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Legal Information</Text>
        <Text style={styles.legalText}>
          This app complies with GDPR, CCPA, and other privacy regulations. 
          For questions about your privacy rights or our data practices, 
          please contact our Data Protection Officer.
        </Text>
        <Text style={styles.legalText}>
          Privacy Policy Version: 1.0.0 • Last Updated: August 30, 2025
        </Text>
      </View>

      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
    padding: 20
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.white
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.medium
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.dark,
    marginBottom: 8
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.medium,
    marginBottom: 24,
    lineHeight: 22
  },
  section: {
    marginBottom: 32
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.dark,
    marginBottom: 8
  },
  sectionDescription: {
    fontSize: 14,
    color: COLORS.medium,
    marginBottom: 16,
    lineHeight: 20
  },
  dataItem: {
    fontSize: 14,
    color: COLORS.dark,
    marginLeft: 8,
    marginBottom: 4,
    lineHeight: 20
  },
  consentItem: {
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight
  },
  consentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4
  },
  consentLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.dark,
    flex: 1
  },
  required: {
    color: COLORS.severityHigh,
    fontWeight: 'bold'
  },
  consentDescription: {
    fontSize: 13,
    color: COLORS.medium,
    lineHeight: 18,
    marginTop: 4
  },
  withdrawButton: {
    marginTop: 16,
    padding: 12,
    backgroundColor: COLORS.severityHigh,
    borderRadius: 8,
    alignItems: 'center'
  },
  withdrawButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '600'
  },
  inventoryContainer: {
    backgroundColor: COLORS.background,
    borderRadius: 8,
    padding: 16
  },
  inventoryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  inventoryLabel: {
    fontSize: 14,
    color: COLORS.medium,
    flex: 1
  },
  inventoryValue: {
    fontSize: 14,
    color: COLORS.dark,
    fontWeight: '500',
    textAlign: 'right',
    flex: 1
  },
  actionButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center'
  },
  actionButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4
  },
  actionButtonSubtext: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
    textAlign: 'center'
  },
  deleteButton: {
    backgroundColor: COLORS.severityHigh
  },
  deleteButtonText: {
    color: COLORS.white
  },
  deleteButtonSubtext: {
    color: 'rgba(255, 255, 255, 0.8)'
  },
  legalText: {
    fontSize: 12,
    color: COLORS.lighter,
    lineHeight: 16,
    marginBottom: 8
  }
});
