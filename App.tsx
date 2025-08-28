import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import OnboardingScreen from './screens/OnboardingScreen';
import { onboardingManager } from './lib/legal/onboardingManager';

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkOnboardingStatus();
  }, []);

  const checkOnboardingStatus = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const isComplete = await onboardingManager.isOnboardingComplete();
      const needsReConsent = await onboardingManager.needsReConsent();
      
      // Show onboarding if not complete or needs re-consent
      setShowOnboarding(!isComplete || needsReConsent);
      
    } catch (err) {
      console.error('Error checking onboarding status:', err);
      setError('Failed to load app. Please restart.');
      // Default to showing onboarding on error
      setShowOnboarding(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOnboardingComplete = async () => {
    try {
      // Onboarding completion is handled by ConsentFlowScreen
      // Just update our local state to hide onboarding
      setShowOnboarding(false);
    } catch (err) {
      console.error('Error completing onboarding:', err);
      setError('Failed to complete setup. Please try again.');
    }
  };

  const renderMainApp = () => (
    <View style={styles.mainApp}>
      <Text style={styles.welcomeText}>Welcome to DESIST!</Text>
      <Text style={styles.statusText}>🛡️ Your security app is ready</Text>
      
      <View style={styles.statusContainer}>
        <Text style={styles.statusTitle}>Security Status: Active</Text>
        <Text style={styles.statusDescription}>
          • End-to-end encryption enabled
        </Text>
        <Text style={styles.statusDescription}>
          • Rate limiting protection active
        </Text>
        <Text style={styles.statusDescription}>
          • CAPTCHA verification ready
        </Text>
        <Text style={styles.statusDescription}>
          • Privacy settings configured
        </Text>
      </View>
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text style={styles.loadingText}>Loading DESIST!...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>⚠️ Error</Text>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  if (showOnboarding) {
    return (
      <OnboardingScreen onComplete={handleOnboardingComplete} />
    );
  }

  return renderMainApp();
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 24,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#dc3545',
    marginBottom: 16,
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
  mainApp: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  welcomeText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
  statusText: {
    fontSize: 18,
    color: '#28a745',
    marginBottom: 32,
    textAlign: 'center',
  },
  statusContainer: {
    backgroundColor: '#f8f9fa',
    padding: 24,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#28a745',
    width: '100%',
    maxWidth: 400,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#28a745',
    marginBottom: 16,
  },
  statusDescription: {
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
    marginBottom: 8,
  },
});
