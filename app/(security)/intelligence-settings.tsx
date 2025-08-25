import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  intelligenceManager,
  performSecurityScan,
  setCoverApplication,
} from '../../lib/intelligence/intelligenceManager';
import { useRouter } from 'expo-router';
import { stealthManager } from '../../lib/stealth';
import Slider from '@react-native-community/slider';

export default function IntelligenceSettingsScreen() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [config, setConfig] = useState(intelligenceManager.getConfig());
  const [stealthConfig, setStealthConfig] = useState<any>({});
  const [scanningNow, setScanningNow] = useState(false);
  const [scanResults, setScanResults] = useState<any>(null);

  useEffect(() => {
    const loadConfig = async () => {
      await intelligenceManager.initialize();
      setConfig(intelligenceManager.getConfig());
      const stConfig = await stealthManager.getConfig();
      setStealthConfig(stConfig);
      setIsLoading(false);
    };

    loadConfig();
  }, []);

  const handleSecurityLevelChange = async (
    level: 'standard' | 'enhanced' | 'maximum'
  ) => {
    await intelligenceManager.setSecurityLevel(level);
    setConfig(intelligenceManager.getConfig());
  };

  const handleScanIntervalChange = async (value: number) => {
    // Convert slider value (0-100) to minutes (15-120)
    const minutes = Math.floor(15 + (value / 100) * 105);
    const milliseconds = minutes * 60 * 1000;
    await intelligenceManager.setScanInterval(milliseconds);
    setConfig(intelligenceManager.getConfig());
  };

  const toggleFeature = async (
    feature: keyof typeof config,
    value: boolean
  ) => {
    switch (feature) {
      case 'threatIntelligenceEnabled':
        await intelligenceManager.enableThreatIntelligence(value);
        break;
      case 'networkSecurityEnabled':
        await intelligenceManager.enableNetworkSecurity(value);
        break;
      case 'privacyEngineEnabled':
        await intelligenceManager.enablePrivacyEngine(value);
        break;
      case 'advancedCoverAppsEnabled':
        await intelligenceManager.enableAdvancedCoverApps(value);
        break;
      case 'antiDetectionEnabled':
        await intelligenceManager.enableAntiDetection(value);
        break;
    }
    setConfig(intelligenceManager.getConfig());
  };

  const runSecurityScan = async () => {
    try {
      setScanningNow(true);
      const results = await performSecurityScan();
      setScanResults(results);
      setScanningNow(false);

      // Show results alert
      Alert.alert(
        'Security Scan Results',
        `Threat Score: ${results.threatScore}/100\n` +
          `Network Security: ${
            results.networkSecure ? 'Secure' : 'Issues Detected'
          }\n` +
          `Privacy Protection: ${
            results.privacyProtected ? 'Active' : 'Issues Detected'
          }\n` +
          `Stealth Status: ${
            results.stealthActive ? 'Active' : 'Compromised'
          }\n\n` +
          (results.recommendations.length > 0
            ? `Recommendations:\n${results.recommendations
                .map((r) => `• ${r}`)
                .join('\n')}`
            : 'No issues found.')
      );
    } catch (error) {
      console.error('Security scan failed:', error);
      setScanningNow(false);
      Alert.alert('Scan Failed', 'The security scan failed. Please try again.');
    }
  };

  const getScanIntervalText = () => {
    const minutes = config.scanInterval / (60 * 1000);
    if (minutes >= 60) {
      const hours = minutes / 60;
      return `${hours} hour${hours !== 1 ? 's' : ''}`;
    }
    return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
  };

  const getSecurityLevelIcon = (level: string) => {
    switch (level) {
      case 'standard':
        return 'shield-outline';
      case 'enhanced':
        return 'shield-half-outline';
      case 'maximum':
        return 'shield';
      default:
        return 'shield-outline';
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading intelligence settings...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Intelligence &amp; Security</Text>
      <Text style={styles.subtitle}>
        Phase 3 advanced security and intelligence features
      </Text>

      {/* Security Scan Section */}
      <View style={styles.scanSection}>
        <TouchableOpacity
          style={styles.scanButton}
          onPress={runSecurityScan}
          disabled={scanningNow}
        >
          <Ionicons name="scan-circle-outline" size={32} color="#fff" />
          <Text style={styles.scanButtonText}>
            {scanningNow ? 'Scanning...' : 'Run Security Scan'}
          </Text>
        </TouchableOpacity>
        <Text style={styles.lastScanText}>
          Last scan: {config.lastScanTime.toLocaleString()}
        </Text>
      </View>

      {/* Security Level Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Security Level</Text>
        <View style={styles.securityLevelContainer}>
          <TouchableOpacity
            style={[
              styles.securityLevelButton,
              config.securityLevel === 'standard' &&
                styles.securityLevelButtonActive,
            ]}
            onPress={() => handleSecurityLevelChange('standard')}
          >
            <Ionicons
              name="shield-outline"
              size={24}
              color={config.securityLevel === 'standard' ? '#2196F3' : '#666'}
            />
            <Text
              style={[
                styles.securityLevelText,
                config.securityLevel === 'standard' &&
                  styles.securityLevelTextActive,
              ]}
            >
              Standard
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.securityLevelButton,
              config.securityLevel === 'enhanced' &&
                styles.securityLevelButtonActive,
            ]}
            onPress={() => handleSecurityLevelChange('enhanced')}
          >
            <Ionicons
              name="shield-half-outline"
              size={24}
              color={config.securityLevel === 'enhanced' ? '#2196F3' : '#666'}
            />
            <Text
              style={[
                styles.securityLevelText,
                config.securityLevel === 'enhanced' &&
                  styles.securityLevelTextActive,
              ]}
            >
              Enhanced
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.securityLevelButton,
              config.securityLevel === 'maximum' &&
                styles.securityLevelButtonActive,
            ]}
            onPress={() => handleSecurityLevelChange('maximum')}
          >
            <Ionicons
              name="shield"
              size={24}
              color={config.securityLevel === 'maximum' ? '#2196F3' : '#666'}
            />
            <Text
              style={[
                styles.securityLevelText,
                config.securityLevel === 'maximum' &&
                  styles.securityLevelTextActive,
              ]}
            >
              Maximum
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Intelligence Features */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Intelligence Features</Text>

        <View style={styles.settingRow}>
          <View style={styles.settingTextContainer}>
            <Text style={styles.settingTitle}>Threat Intelligence</Text>
            <Text style={styles.settingDescription}>
              Detects and mitigates potential threats to your security
            </Text>
          </View>
          <Switch
            value={config.threatIntelligenceEnabled}
            onValueChange={(value) =>
              toggleFeature('threatIntelligenceEnabled', value)
            }
            trackColor={{ false: '#767577', true: '#81b0ff' }}
            thumbColor={
              config.threatIntelligenceEnabled ? '#2196F3' : '#f4f3f4'
            }
          />
        </View>

        <View style={styles.settingRow}>
          <View style={styles.settingTextContainer}>
            <Text style={styles.settingTitle}>Network Security</Text>
            <Text style={styles.settingDescription}>
              Monitors and secures network connections
            </Text>
          </View>
          <Switch
            value={config.networkSecurityEnabled}
            onValueChange={(value) =>
              toggleFeature('networkSecurityEnabled', value)
            }
            trackColor={{ false: '#767577', true: '#81b0ff' }}
            thumbColor={config.networkSecurityEnabled ? '#2196F3' : '#f4f3f4'}
          />
        </View>

        <View style={styles.settingRow}>
          <View style={styles.settingTextContainer}>
            <Text style={styles.settingTitle}>Privacy Engine</Text>
            <Text style={styles.settingDescription}>
              Protects your data privacy and anonymity
            </Text>
          </View>
          <Switch
            value={config.privacyEngineEnabled}
            onValueChange={(value) =>
              toggleFeature('privacyEngineEnabled', value)
            }
            trackColor={{ false: '#767577', true: '#81b0ff' }}
            thumbColor={config.privacyEngineEnabled ? '#2196F3' : '#f4f3f4'}
          />
        </View>
      </View>

      {/* Advanced Stealth */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Advanced Stealth</Text>

        <View style={styles.settingRow}>
          <View style={styles.settingTextContainer}>
            <Text style={styles.settingTitle}>Advanced Cover Apps</Text>
            <Text style={styles.settingDescription}>
              Enhanced disguise capabilities for the application
            </Text>
          </View>
          <Switch
            value={config.advancedCoverAppsEnabled}
            onValueChange={(value) =>
              toggleFeature('advancedCoverAppsEnabled', value)
            }
            trackColor={{ false: '#767577', true: '#81b0ff' }}
            thumbColor={config.advancedCoverAppsEnabled ? '#2196F3' : '#f4f3f4'}
          />
        </View>

        <View style={styles.settingRow}>
          <View style={styles.settingTextContainer}>
            <Text style={styles.settingTitle}>Anti-Detection</Text>
            <Text style={styles.settingDescription}>
              Prevents app detection by security scanners
            </Text>
          </View>
          <Switch
            value={config.antiDetectionEnabled}
            onValueChange={(value) =>
              toggleFeature('antiDetectionEnabled', value)
            }
            trackColor={{ false: '#767577', true: '#81b0ff' }}
            thumbColor={config.antiDetectionEnabled ? '#2196F3' : '#f4f3f4'}
          />
        </View>

        <View style={styles.settingRow}>
          <View style={styles.settingTextContainer}>
            <Text style={styles.settingTitle}>Blank Screen Stealth</Text>
            <Text style={styles.settingDescription}>
              Makes screen appear off until activated by gesture
            </Text>
          </View>
          <Switch
            value={stealthConfig.blankScreenStealthEnabled}
            onValueChange={async (value) => {
              if (value) {
                await stealthManager.enableBlankScreenStealth();
              } else {
                await stealthManager.disableBlankScreenStealth();
              }
              const newConfig = await stealthManager.getConfig();
              setStealthConfig(newConfig);
            }}
            trackColor={{ false: '#767577', true: '#81b0ff' }}
            thumbColor={
              stealthConfig.blankScreenStealthEnabled ? '#2196F3' : '#f4f3f4'
            }
          />
        </View>
      </View>

      {/* Scan Interval */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Scan Interval</Text>
        <Text style={styles.settingDescription}>
          Security scans will run automatically every {getScanIntervalText()}
        </Text>
        <Slider
          style={styles.slider}
          minimumValue={0}
          maximumValue={100}
          value={((config.scanInterval / (60 * 1000) - 15) / 105) * 100} // Convert from minutes to slider value
          onValueChange={() => {}} // For smooth sliding
          onSlidingComplete={handleScanIntervalChange}
          minimumTrackTintColor="#2196F3"
          maximumTrackTintColor="#d3d3d3"
          thumbTintColor="#2196F3"
        />
        <View style={styles.sliderLabels}>
          <Text style={styles.sliderLabel}>15m</Text>
          <Text style={styles.sliderLabel}>1h</Text>
          <Text style={styles.sliderLabel}>2h</Text>
        </View>
      </View>

      {/* Navigation buttons */}
      <View style={styles.navigationButtons}>
        <TouchableOpacity
          style={styles.navigationButton}
          onPress={() => router.push('phase3-demo')}
        >
          <Text style={styles.navigationButtonText}>Demo Features</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navigationButton}
          onPress={() => router.back()}
        >
          <Text style={styles.navigationButtonText}>Back to Security</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  settingTextContainer: {
    flex: 1,
    paddingRight: 16,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    color: '#666',
  },
  scanSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  scanButton: {
    backgroundColor: '#2196F3',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 50,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  scanButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  lastScanText: {
    marginTop: 8,
    color: '#666',
    fontSize: 14,
  },
  securityLevelContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  securityLevelButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    marginHorizontal: 4,
  },
  securityLevelButtonActive: {
    backgroundColor: '#e6f2ff',
    borderWidth: 1,
    borderColor: '#2196F3',
  },
  securityLevelText: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
  },
  securityLevelTextActive: {
    color: '#2196F3',
    fontWeight: '500',
  },
  slider: {
    width: '100%',
    height: 40,
    marginTop: 8,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
  },
  sliderLabel: {
    color: '#666',
    fontSize: 12,
  },
  navigationButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 16,
  },
  navigationButton: {
    flex: 1,
    backgroundColor: '#333',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    margin: 4,
  },
  navigationButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});
