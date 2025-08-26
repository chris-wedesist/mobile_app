import React, { useEffect, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
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
import { colors, spacing, typography } from '../../constants/theme';

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
          }\n\n${ 
          results.recommendations.length > 0
            ? `Recommendations:\n${results.recommendations
                .map((r) => `• ${r}`)
                .join('\n')}`
            : 'No issues found.'}`
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
          <Ionicons name="scan-circle-outline" size={32} color={colors.background} />
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
              color={config.securityLevel === 'standard' ? colors.primary : colors.text.muted}
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
              color={config.securityLevel === 'enhanced' ? colors.primary : colors.text.muted}
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
              color={config.securityLevel === 'maximum' ? colors.primary : colors.text.muted}
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
            trackColor={{ false: colors.text.muted, true: colors.primary }}
            thumbColor={
              config.threatIntelligenceEnabled ? colors.background : colors.text.secondary
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
            trackColor={{ false: colors.text.muted, true: colors.primary }}
            thumbColor={config.networkSecurityEnabled ? colors.background : colors.text.secondary}
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
            trackColor={{ false: colors.text.muted, true: colors.primary }}
            thumbColor={config.privacyEngineEnabled ? colors.background : colors.text.secondary}
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
            trackColor={{ false: colors.text.muted, true: colors.primary }}
            thumbColor={config.advancedCoverAppsEnabled ? colors.background : colors.text.secondary}
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
            trackColor={{ false: colors.text.muted, true: colors.primary }}
            thumbColor={config.antiDetectionEnabled ? colors.background : colors.text.secondary}
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
            trackColor={{ false: colors.text.muted, true: colors.primary }}
            thumbColor={
              stealthConfig.blankScreenStealthEnabled ? colors.background : colors.text.secondary
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
          minimumTrackTintColor={colors.primary}
          maximumTrackTintColor={colors.text.muted}
          thumbTintColor={colors.primary}
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
          onPress={() => router.push('/phase3-demo' as any as any)}
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
    backgroundColor: colors.surface,
    padding: spacing.lg,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: typography.fontSize.title,
    fontWeight: '700',
    marginBottom: spacing.sm,
    color: colors.text.primary,
  },
  subtitle: {
    fontSize: typography.fontSize.body,
    color: colors.text.secondary,
    marginBottom: spacing.lg,
  },
  section: {
    backgroundColor: colors.background,
    borderRadius: 10,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: typography.fontSize.subheading,
    fontWeight: 'bold',
    marginBottom: spacing.lg,
    color: colors.text.primary,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  settingTextContainer: {
    flex: 1,
    paddingRight: spacing.lg,
  },
  settingTitle: {
    fontSize: typography.fontSize.body,
    fontWeight: '500',
    marginBottom: spacing.xs,
  },
  settingDescription: {
    fontSize: typography.fontSize.small,
    color: colors.text.secondary,
  },
  scanSection: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  scanButton: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: 50,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  scanButtonText: {
    color: colors.background,
    fontSize: typography.fontSize.subheading,
    fontWeight: 'bold',
    marginLeft: spacing.sm,
  },
  lastScanText: {
    marginTop: spacing.sm,
    color: colors.text.muted,
    fontSize: typography.fontSize.small,
  },
  securityLevelContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  securityLevelButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: 8,
    marginHorizontal: spacing.xs,
  },
  securityLevelButtonActive: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  securityLevelText: {
    fontSize: typography.fontSize.small,
    color: colors.text.muted,
    marginTop: spacing.sm,
  },
  securityLevelTextActive: {
    color: colors.primary,
    fontWeight: '500',
  },
  slider: {
    width: '100%',
    height: 40,
    marginTop: spacing.md,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.sm,
  },
  sliderLabel: {
    color: colors.text.muted,
    fontSize: typography.fontSize.caption,
  },
  navigationButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: spacing.lg,
  },
  navigationButton: {
    flex: 1,
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: spacing.md,
    alignItems: 'center',
    margin: spacing.xs,
  },
  navigationButtonText: {
    color: colors.text.primary,
    fontWeight: 'bold',
  },
});
