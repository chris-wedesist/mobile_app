import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Alert,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { stealthManager } from '../lib/stealth';
import { biometricAuthManager } from '../lib/security/biometricAuth';
import { screenProtectionManager } from '../lib/security/screenProtection';
import { emergencyProtocolManager } from '../lib/security/emergencyProtocols';
import { threatDetectionEngine } from '../lib/security/threatDetection';
import { ScreenProtector } from '../components/security/ScreenProtector';

const { width, height } = Dimensions.get('window');

interface AppStatus {
  mode: 'normal' | 'stealth' | 'emergency';
  securityLevel: 'high' | 'medium' | 'low';
  activeFeatures: number;
  isInitialized: boolean;
}

const HomeScreen: React.FC = () => {
  const [appStatus, setAppStatus] = useState<AppStatus>({
    mode: 'normal',
    securityLevel: 'low',
    activeFeatures: 0,
    isInitialized: false,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      setIsLoading(true);
      
      // Initialize all security systems
      await Promise.all([
        stealthManager.initialize(),
        biometricAuthManager.initialize(),
        screenProtectionManager.initialize(),
        emergencyProtocolManager.initialize(),
        threatDetectionEngine.initialize(),
      ]);

      // Enable screen protection by default
      await screenProtectionManager.enableScreenProtection();

      // Get current app status
      await updateAppStatus();
      
      setIsLoading(false);
    } catch (error) {
      console.error('Failed to initialize app:', error);
      setIsLoading(false);
      Alert.alert(
        'Initialization Error',
        'Failed to initialize security systems. Some features may not work correctly.',
        [{ text: 'OK' }]
      );
    }
  };

  const updateAppStatus = async () => {
    try {
      const [
        stealthStatus,
        biometricEnabled,
        screenStatus,
        emergencyConfig,
        threatStatus,
      ] = await Promise.all([
        stealthManager.getSecurityStatus(),
        biometricAuthManager.isEnabled(),
        screenProtectionManager.getProtectionStatus(),
        emergencyProtocolManager.getConfig(),
        threatDetectionEngine.getSecurityStatus(),
      ]);

      let activeFeatures = 0;
      if (biometricEnabled) activeFeatures++;
      if (screenStatus.isActive) activeFeatures++;
      if (emergencyConfig.isEnabled) activeFeatures++;
      if (threatStatus.monitoring) activeFeatures++;
      if (stealthStatus.securityLevel === 'high') activeFeatures++;

      // Determine app mode based on current state
      let mode: 'normal' | 'stealth' | 'emergency' = 'normal';
      if (stealthStatus.securityLevel === 'high') {
        mode = 'stealth';
      }

      setAppStatus({
        mode,
        securityLevel: stealthStatus.securityLevel,
        activeFeatures,
        isInitialized: true,
      });
    } catch (error) {
      console.error('Failed to update app status:', error);
    }
  };

  const handleModeSwitch = async () => {
    try {
      await stealthManager.toggleMode();
      await updateAppStatus();
      
      Alert.alert(
        'Mode Switched',
        `App switched to ${appStatus.mode === 'stealth' ? 'normal' : 'stealth'} mode`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Failed to switch mode:', error);
      Alert.alert('Error', 'Failed to switch app mode');
    }
  };

  const handleQuickAuth = async () => {
    try {
      const availability = await biometricAuthManager.checkBiometricAvailability();
      if (availability.isAvailable) {
        const result = await biometricAuthManager.authenticateWithBiometric();
        if (result.success) {
          Alert.alert('Success', 'Authentication successful!');
          router.push('/security-dashboard' as any);
        } else {
          Alert.alert('Failed', result.error || 'Authentication failed');
        }
      } else {
        Alert.alert(
          'Biometric Unavailable',
          'Biometric authentication is not available on this device.',
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Setup', 
              onPress: () => router.push('/biometric-setup' as any)
            }
          ]
        );
      }
    } catch (error) {
      console.error('Quick auth error:', error);
      Alert.alert('Error', 'Authentication error occurred');
    }
  };

  const handleEmergency = () => {
    Alert.alert(
      'Emergency Mode',
      'Are you in an emergency situation? This will trigger emergency protocols.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Emergency',
          style: 'destructive',
          onPress: async () => {
            try {
              await emergencyProtocolManager.triggerEmergency('manual');
              Alert.alert('Emergency Triggered', 'Emergency protocols activated');
            } catch (error) {
              console.error('Emergency trigger error:', error);
              Alert.alert('Error', 'Failed to trigger emergency protocols');
            }
          }
        }
      ]
    );
  };

  const getModeColor = () => {
    switch (appStatus.mode) {
      case 'stealth':
        return '#34C759';
      case 'emergency':
        return '#FF3B30';
      default:
        return '#007AFF';
    }
  };

  const getModeIcon = () => {
    switch (appStatus.mode) {
      case 'stealth':
        return 'eye-off';
      case 'emergency':
        return 'warning';
      default:
        return 'eye';
    }
  };

  const getSecurityColor = () => {
    switch (appStatus.securityLevel) {
      case 'high':
        return '#34C759';
      case 'medium':
        return '#FF9500';
      case 'low':
        return '#FF3B30';
      default:
        return '#8E8E93';
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Ionicons name="shield" size={80} color="#007AFF" />
        <Text style={styles.loadingTitle}>DESIST</Text>
        <Text style={styles.loadingSubtitle}>Initializing Security...</Text>
      </View>
    );
  }

  return (
    <ScreenProtector>
      <View style={styles.container}>
        <StatusBar 
          barStyle={appStatus.mode === 'stealth' ? 'light-content' : 'dark-content'}
          backgroundColor={appStatus.mode === 'stealth' ? '#1C1C1E' : '#FFFFFF'}
        />
        
        {/* Header */}
        <View style={[
          styles.header,
          { backgroundColor: appStatus.mode === 'stealth' ? '#1C1C1E' : '#FFFFFF' }
        ]}>
          <View style={styles.headerContent}>
            <View>
              <Text style={[
                styles.appTitle,
                { color: appStatus.mode === 'stealth' ? '#FFFFFF' : '#333' }
              ]}>
                DESIST
              </Text>
              <Text style={[
                styles.appSubtitle,
                { color: appStatus.mode === 'stealth' ? '#A1A1A6' : '#666' }
              ]}>
                Digital Security & Privacy
              </Text>
            </View>
            
            <TouchableOpacity 
              style={styles.refreshButton}
              onPress={updateAppStatus}
            >
              <Ionicons 
                name="refresh" 
                size={24} 
                color={appStatus.mode === 'stealth' ? '#FFFFFF' : '#007AFF'} 
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Status Card */}
        <View style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <View style={styles.modeIndicator}>
              <Ionicons
                name={getModeIcon() as any}
                size={24}
                color={getModeColor()}
              />
              <Text style={styles.modeText}>
                {appStatus.mode.toUpperCase()} MODE
              </Text>
            </View>
            
            <View style={styles.securityLevel}>
              <View style={[
                styles.securityDot,
                { backgroundColor: getSecurityColor() }
              ]} />
              <Text style={styles.securityText}>
                Security: {appStatus.securityLevel.toUpperCase()}
              </Text>
            </View>
          </View>
          
          <View style={styles.featuresStatus}>
            <Text style={styles.featuresText}>
              {appStatus.activeFeatures}/5 Security Features Active
            </Text>
            
            <View style={styles.progressBar}>
              <View style={[
                styles.progressFill,
                { 
                  width: `${(appStatus.activeFeatures / 5) * 100}%`,
                  backgroundColor: getSecurityColor()
                }
              ]} />
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          
          <TouchableOpacity
            style={[styles.actionButton, styles.primaryAction]}
            onPress={() => router.push('/security-dashboard' as any)}
          >
            <Ionicons name="shield-checkmark" size={24} color="#FFFFFF" />
            <Text style={styles.actionText}>Security Dashboard</Text>
            <Ionicons name="chevron-forward" size={20} color="#FFFFFF" />
          </TouchableOpacity>

          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[styles.actionButton, styles.secondaryAction]}
              onPress={handleModeSwitch}
            >
              <Ionicons name="swap-horizontal" size={20} color="#007AFF" />
              <Text style={[styles.actionText, { color: '#007AFF' }]}>
                Switch Mode
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.secondaryAction]}
              onPress={handleQuickAuth}
            >
              <Ionicons name="finger-print" size={20} color="#007AFF" />
              <Text style={[styles.actionText, { color: '#007AFF' }]}>
                Quick Auth
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.actionButton, styles.emergencyAction]}
            onPress={handleEmergency}
          >
            <Ionicons name="warning" size={20} color="#FFFFFF" />
            <Text style={[styles.actionText, { color: '#FFFFFF' }]}>
              Emergency
            </Text>
            <Ionicons name="alert-circle" size={16} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Setup Cards */}
        <View style={styles.setupSection}>
          <Text style={styles.sectionTitle}>Security Setup</Text>
          
          <View style={styles.setupGrid}>
            <TouchableOpacity
              style={styles.setupCard}
              onPress={() => router.push('/biometric-setup' as any)}
            >
              <Ionicons name="finger-print" size={32} color="#007AFF" />
              <Text style={styles.setupTitle}>Biometric</Text>
              <Text style={styles.setupSubtitle}>Face ID / Touch ID</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.setupCard}
              onPress={() => router.push('/emergency-setup' as any)}
            >
              <Ionicons name="people" size={32} color="#FF9500" />
              <Text style={styles.setupTitle}>Emergency</Text>
              <Text style={styles.setupSubtitle}>Contact Setup</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.setupCard}
              onPress={() => router.push('/security-test' as any)}
            >
              <Ionicons name="checkmark-circle" size={32} color="#34C759" />
              <Text style={styles.setupTitle}>Test</Text>
              <Text style={styles.setupSubtitle}>Security Check</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.setupCard}
              onPress={() => router.push('/security-dashboard' as any)}
            >
              <Ionicons name="analytics" size={32} color="#8E4EC6" />
              <Text style={styles.setupTitle}>Monitor</Text>
              <Text style={styles.setupSubtitle}>Live Status</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </ScreenProtector>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
  loadingTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#333',
    marginTop: 16,
    letterSpacing: 2,
  },
  loadingSubtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 8,
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  appTitle: {
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: 2,
  },
  appSubtitle: {
    fontSize: 14,
    marginTop: 4,
  },
  refreshButton: {
    padding: 8,
  },
  statusCard: {
    margin: 20,
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modeText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginLeft: 8,
  },
  securityLevel: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  securityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  securityText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  featuresStatus: {
    marginTop: 8,
  },
  featuresText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#E9ECEF',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  quickActions: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  setupSection: {
    paddingHorizontal: 20,
    flex: 1,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  primaryAction: {
    backgroundColor: '#007AFF',
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  secondaryAction: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E9ECEF',
    flex: 1,
    marginRight: 8,
  },
  emergencyAction: {
    backgroundColor: '#FF3B30',
  },
  actionRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  actionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    flex: 1,
    marginLeft: 12,
  },
  setupGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  setupCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  setupTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginTop: 12,
    marginBottom: 4,
  },
  setupSubtitle: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
});

export default HomeScreen;
