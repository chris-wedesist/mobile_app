import React, { useState } from 'react';
import { View, Text, Switch, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';

interface PrivacySettings {
  dataCollection: boolean;
  analyticsData: boolean;
  locationData: boolean;
  crashReports: boolean;
  marketingEmails: boolean;
  securityAlerts: boolean;
}

export default function PrivacySettingsScreen() {
  const [settings, setSettings] = useState<PrivacySettings>({
    dataCollection: true,
    analyticsData: false,
    locationData: true,
    crashReports: true,
    marketingEmails: false,
    securityAlerts: true,
  });

  const updateSetting = (key: keyof PrivacySettings, value: boolean) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleDataDeletion = () => {
    Alert.alert(
      'Delete Personal Data',
      'This will permanently delete your account and all associated data. This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete Data',
          style: 'destructive',
          onPress: () => {
            // TODO: Implement data deletion request
            Alert.alert('Request Submitted', 'Your data deletion request has been submitted. You will receive confirmation within 24 hours.');
          },
        },
      ]
    );
  };

  const handleDataExport = () => {
    Alert.alert(
      'Export Personal Data',
      'We will prepare a file containing all your personal data and send it to your registered email address.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Export Data',
          onPress: () => {
            // TODO: Implement data export request
            Alert.alert('Request Submitted', 'Your data export request has been submitted. You will receive your data within 30 days.');
          },
        },
      ]
    );
  };

  const SettingItem = ({ 
    title, 
    description, 
    value, 
    onValueChange, 
    disabled = false 
  }: {
    title: string;
    description: string;
    value: boolean;
    onValueChange: (value: boolean) => void;
    disabled?: boolean;
  }) => (
    <View style={[styles.settingItem, disabled && styles.settingItemDisabled]}>
      <View style={styles.settingContent}>
        <Text style={styles.settingTitle}>{title}</Text>
        <Text style={styles.settingDescription}>{description}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
        trackColor={{ false: '#767577', true: '#007bff' }}
        thumbColor={value ? '#ffffff' : '#f4f3f4'}
      />
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Privacy Settings</Text>
        <Text style={styles.subtitle}>
          Control how your data is collected and used
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Data Collection</Text>
        
        <SettingItem
          title="Essential Data Collection"
          description="Required for app functionality, incident reporting, and security"
          value={settings.dataCollection}
          onValueChange={(value) => updateSetting('dataCollection', value)}
          disabled={true}
        />

        <SettingItem
          title="Analytics Data"
          description="Help us improve the app by sharing usage statistics"
          value={settings.analyticsData}
          onValueChange={(value) => updateSetting('analyticsData', value)}
        />

        <SettingItem
          title="Location Data"
          description="Include location information in incident reports"
          value={settings.locationData}
          onValueChange={(value) => updateSetting('locationData', value)}
        />

        <SettingItem
          title="Crash Reports"
          description="Automatically send crash reports to help fix bugs"
          value={settings.crashReports}
          onValueChange={(value) => updateSetting('crashReports', value)}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Communications</Text>
        
        <SettingItem
          title="Marketing Emails"
          description="Receive updates and news about DESIST!"
          value={settings.marketingEmails}
          onValueChange={(value) => updateSetting('marketingEmails', value)}
        />

        <SettingItem
          title="Security Alerts"
          description="Important security notifications and updates"
          value={settings.securityAlerts}
          onValueChange={(value) => updateSetting('securityAlerts', value)}
          disabled={true}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Data Rights</Text>
        
        <TouchableOpacity style={styles.actionButton} onPress={handleDataExport}>
          <Text style={styles.actionButtonText}>Export My Data</Text>
          <Text style={styles.actionButtonDescription}>
            Download a copy of all your personal data
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.actionButton, styles.dangerButton]} 
          onPress={handleDataDeletion}
        >
          <Text style={[styles.actionButtonText, styles.dangerButtonText]}>
            Delete My Data
          </Text>
          <Text style={styles.actionButtonDescription}>
            Permanently delete your account and all data
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.infoSection}>
        <Text style={styles.infoTitle}>Important Information</Text>
        <Text style={styles.infoText}>
          • Essential data collection cannot be disabled as it's required for app functionality{'\n'}
          • Security alerts are mandatory for your protection{'\n'}
          • Changes may take up to 24 hours to take effect{'\n'}
          • Data deletion is permanent and cannot be undone
        </Text>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          For privacy questions, contact: privacy@wedesist.com
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    backgroundColor: '#fff',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    lineHeight: 22,
  },
  section: {
    backgroundColor: '#fff',
    marginTop: 16,
    marginHorizontal: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    padding: 20,
    paddingBottom: 0,
    marginBottom: 8,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingItemDisabled: {
    opacity: 0.6,
  },
  settingContent: {
    flex: 1,
    marginRight: 16,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  actionButton: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#007bff',
    marginBottom: 4,
  },
  actionButtonDescription: {
    fontSize: 14,
    color: '#666',
  },
  dangerButton: {
    borderBottomWidth: 0,
  },
  dangerButtonText: {
    color: '#dc3545',
  },
  infoSection: {
    backgroundColor: '#fff',
    marginTop: 16,
    marginHorizontal: 16,
    padding: 20,
    borderRadius: 12,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 22,
  },
  footer: {
    padding: 24,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
});
