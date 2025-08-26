import React, { useEffect } from 'react';
import { StatusBar, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Import analytics configuration
import { initializeAmplitude, trackScreenView } from './lib/analytics/amplitudeConfig';

// Import security manager
import { CryptoManager } from './lib/security/cryptoManager';

// Import theme constants
import { colors, spacing, typography } from './constants/theme';

const App: React.FC = () => {
  useEffect(() => {
    // Initialize analytics tracking
    initializeAmplitude();
    
    // Track main app screen view
    trackScreenView('main_app', {
      app_version: '1.0.0',
      security_features: ['crypto', 'network_monitoring', 'analytics'],
      timestamp: new Date().toISOString(),
    });

    // Initialize security manager
    const initializeSecurity = async () => {
      try {
        const cryptoManager = CryptoManager.getInstance();
        await cryptoManager.initialize();
      } catch (error) {
        console.error('Failed to initialize security manager:', error);
      }
    };

    initializeSecurity();
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar 
        barStyle="dark-content" 
        backgroundColor={colors.background} 
      />
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>DESIST Security App</Text>
          <Text style={styles.subtitle}>Enhanced Cryptography & Analytics</Text>
        </View>
        
        <View style={styles.content}>
          <View style={styles.featureCard}>
            <Text style={styles.featureTitle}>🔐 Secure Cryptography</Text>
            <Text style={styles.featureDescription}>
              Real SHA-256 hashing with expo-crypto
            </Text>
          </View>
          
          <View style={styles.featureCard}>
            <Text style={styles.featureTitle}>🌐 Network Monitoring</Text>
            <Text style={styles.featureDescription}>
              Real-time security analysis with NetInfo
            </Text>
          </View>
          
          <View style={styles.featureCard}>
            <Text style={styles.featureTitle}>📊 Analytics Tracking</Text>
            <Text style={styles.featureDescription}>
              Comprehensive security event monitoring
            </Text>
          </View>
        </View>
        
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Powered by enhanced security architecture
          </Text>
        </View>
      </View>
    </SafeAreaProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingTop: spacing.xl,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    backgroundColor: colors.surface,
  },
  title: {
    fontSize: typography.fontSize.title,
    fontWeight: '700',
    color: colors.text.primary,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: typography.fontSize.body,
    color: colors.text.secondary,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
  },
  featureCard: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderRadius: 12,
    shadowColor: colors.text.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  featureTitle: {
    fontSize: typography.fontSize.heading,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  featureDescription: {
    fontSize: typography.fontSize.small,
    color: colors.text.secondary,
    lineHeight: 20,
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    backgroundColor: colors.surface,
  },
  footerText: {
    fontSize: typography.fontSize.small,
    color: colors.text.secondary,
    textAlign: 'center',
  },
});

export default App;
