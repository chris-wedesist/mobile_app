import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Switch, Alert } from 'react-native';
import { complianceManager } from '../../lib/legal/complianceManager';

interface ConsentFlowProps {
  onComplete: () => void;
  onPrivacyPolicyPress: () => void;
  onTermsPress: () => void;
}

export default function ConsentFlowScreen({ 
  onComplete, 
  onPrivacyPolicyPress, 
  onTermsPress 
}: ConsentFlowProps) {
  const [consents, setConsents] = useState({
    privacyPolicy: false,
    termsOfService: false,
    dataCollection: false,
    locationTracking: false,
    analytics: false,
    marketing: false,
  });

  const [currentStep, setCurrentStep] = useState(0);

  const updateConsent = (key: keyof typeof consents, value: boolean) => {
    setConsents(prev => ({ ...prev, [key]: value }));
  };

  const canProceed = () => {
    switch (currentStep) {
      case 0: // Welcome
        return true;
      case 1: // Required consents
        return consents.privacyPolicy && consents.termsOfService && consents.dataCollection;
      case 2: // Optional consents
        return true;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (currentStep < 2) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleComplete();
    }
  };

  const handleComplete = async () => {
    try {
      await complianceManager.recordConsent(consents);
      
      // Log compliance event
      await complianceManager.logComplianceEvent({
        type: 'consent_flow_completed',
        description: 'User completed initial consent flow',
        metadata: { consents }
      });

      Alert.alert('Setup Complete', 'Your privacy preferences have been saved.', [
        { text: 'Continue', onPress: onComplete }
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to save your preferences. Please try again.');
    }
  };

  const renderWelcomeStep = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.welcomeTitle}>Welcome to DESIST!</Text>
      <Text style={styles.welcomeSubtitle}>
        Before we begin, let's set up your privacy preferences and review our policies.
      </Text>
      
      <View style={styles.featureList}>
        <Text style={styles.featureTitle}>What DESIST! does:</Text>
        <Text style={styles.featureItem}>• Report and track security incidents</Text>
        <Text style={styles.featureItem}>• Enhance community safety</Text>
        <Text style={styles.featureItem}>• Protect your privacy with encryption</Text>
        <Text style={styles.featureItem}>• Prevent abuse with rate limiting</Text>
      </View>

      <View style={styles.securityBadge}>
        <Text style={styles.securityBadgeText}>🛡️ Enterprise-Grade Security</Text>
        <Text style={styles.securityDescription}>
          Your data is protected with AES-256 encryption, CAPTCHA verification, 
          and comprehensive rate limiting.
        </Text>
      </View>
    </View>
  );

  const renderRequiredConsentsStep = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Required Agreements</Text>
      <Text style={styles.stepDescription}>
        These agreements are required to use DESIST! and ensure your safety.
      </Text>

      <View style={styles.consentSection}>
        <View style={styles.consentItem}>
          <View style={styles.consentContent}>
            <Text style={styles.consentTitle}>Privacy Policy</Text>
            <Text style={styles.consentDescription}>
              How we collect, use, and protect your information
            </Text>
            <TouchableOpacity onPress={onPrivacyPolicyPress}>
              <Text style={styles.linkText}>Read Privacy Policy →</Text>
            </TouchableOpacity>
          </View>
          <Switch
            value={consents.privacyPolicy}
            onValueChange={(value) => updateConsent('privacyPolicy', value)}
            trackColor={{ false: '#767577', true: '#007bff' }}
          />
        </View>

        <View style={styles.consentItem}>
          <View style={styles.consentContent}>
            <Text style={styles.consentTitle}>Terms of Service</Text>
            <Text style={styles.consentDescription}>
              Your rights and responsibilities when using the app
            </Text>
            <TouchableOpacity onPress={onTermsPress}>
              <Text style={styles.linkText}>Read Terms of Service →</Text>
            </TouchableOpacity>
          </View>
          <Switch
            value={consents.termsOfService}
            onValueChange={(value) => updateConsent('termsOfService', value)}
            trackColor={{ false: '#767577', true: '#007bff' }}
          />
        </View>

        <View style={styles.consentItem}>
          <View style={styles.consentContent}>
            <Text style={styles.consentTitle}>Essential Data Collection</Text>
            <Text style={styles.consentDescription}>
              Required for app functionality, incident reporting, and security
            </Text>
          </View>
          <Switch
            value={consents.dataCollection}
            onValueChange={(value) => updateConsent('dataCollection', value)}
            trackColor={{ false: '#767577', true: '#007bff' }}
          />
        </View>
      </View>
    </View>
  );

  const renderOptionalConsentsStep = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Optional Features</Text>
      <Text style={styles.stepDescription}>
        These features enhance your experience but are not required.
      </Text>

      <View style={styles.consentSection}>
        <View style={styles.consentItem}>
          <View style={styles.consentContent}>
            <Text style={styles.consentTitle}>Location Services</Text>
            <Text style={styles.consentDescription}>
              Include location data in incident reports for better context
            </Text>
          </View>
          <Switch
            value={consents.locationTracking}
            onValueChange={(value) => updateConsent('locationTracking', value)}
            trackColor={{ false: '#767577', true: '#007bff' }}
          />
        </View>

        <View style={styles.consentItem}>
          <View style={styles.consentContent}>
            <Text style={styles.consentTitle}>Usage Analytics</Text>
            <Text style={styles.consentDescription}>
              Help us improve the app by sharing anonymous usage data
            </Text>
          </View>
          <Switch
            value={consents.analytics}
            onValueChange={(value) => updateConsent('analytics', value)}
            trackColor={{ false: '#767577', true: '#007bff' }}
          />
        </View>

        <View style={styles.consentItem}>
          <View style={styles.consentContent}>
            <Text style={styles.consentTitle}>Marketing Communications</Text>
            <Text style={styles.consentDescription}>
              Receive updates and news about DESIST! features
            </Text>
          </View>
          <Switch
            value={consents.marketing}
            onValueChange={(value) => updateConsent('marketing', value)}
            trackColor={{ false: '#767577', true: '#007bff' }}
          />
        </View>
      </View>

      <View style={styles.privacyNote}>
        <Text style={styles.privacyNoteText}>
          💡 You can change these preferences anytime in Settings → Privacy
        </Text>
      </View>
    </View>
  );

  const steps = [
    renderWelcomeStep,
    renderRequiredConsentsStep,
    renderOptionalConsentsStep,
  ];

  const stepTitles = ['Welcome', 'Required', 'Optional'];

  return (
    <View style={styles.container}>
      <View style={styles.progressContainer}>
        {stepTitles.map((title, index) => (
          <View key={index} style={styles.progressStep}>
            <View style={[
              styles.progressCircle,
              index <= currentStep && styles.progressCircleActive
            ]}>
              <Text style={[
                styles.progressNumber,
                index <= currentStep && styles.progressNumberActive
              ]}>
                {index + 1}
              </Text>
            </View>
            <Text style={[
              styles.progressLabel,
              index <= currentStep && styles.progressLabelActive
            ]}>
              {title}
            </Text>
          </View>
        ))}
      </View>

      <ScrollView style={styles.content}>
        {steps[currentStep]()}
      </ScrollView>

      <View style={styles.buttonContainer}>
        {currentStep > 0 && (
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => setCurrentStep(prev => prev - 1)}
          >
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>
        )}
        
        <TouchableOpacity
          style={[
            styles.nextButton,
            !canProceed() && styles.nextButtonDisabled
          ]}
          onPress={handleNext}
          disabled={!canProceed()}
        >
          <Text style={styles.nextButtonText}>
            {currentStep === 2 ? 'Complete Setup' : 'Next'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    padding: 20,
    paddingTop: 40,
  },
  progressStep: {
    alignItems: 'center',
    marginHorizontal: 20,
  },
  progressCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#e9ecef',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  progressCircleActive: {
    backgroundColor: '#007bff',
  },
  progressNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  progressNumberActive: {
    color: '#fff',
  },
  progressLabel: {
    fontSize: 12,
    color: '#666',
  },
  progressLabelActive: {
    color: '#007bff',
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  stepContainer: {
    padding: 24,
  },
  welcomeTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 12,
  },
  welcomeSubtitle: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
    lineHeight: 26,
    marginBottom: 32,
  },
  featureList: {
    marginBottom: 32,
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  featureItem: {
    fontSize: 16,
    color: '#555',
    lineHeight: 24,
    marginBottom: 8,
  },
  securityBadge: {
    backgroundColor: '#e7f3ff',
    padding: 20,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#007bff',
  },
  securityBadgeText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#007bff',
    marginBottom: 8,
  },
  securityDescription: {
    fontSize: 14,
    color: '#0056b3',
    lineHeight: 20,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  stepDescription: {
    fontSize: 16,
    color: '#666',
    lineHeight: 22,
    marginBottom: 24,
  },
  consentSection: {
    marginBottom: 24,
  },
  consentItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  consentContent: {
    flex: 1,
    marginRight: 16,
  },
  consentTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  consentDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 8,
  },
  linkText: {
    fontSize: 14,
    color: '#007bff',
    fontWeight: '500',
  },
  privacyNote: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 8,
    marginTop: 16,
  },
  privacyNoteText: {
    fontSize: 14,
    color: '#555',
    textAlign: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    padding: 24,
    paddingTop: 12,
  },
  backButton: {
    flex: 1,
    paddingVertical: 12,
    marginRight: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#007bff',
    borderRadius: 8,
  },
  backButtonText: {
    fontSize: 16,
    color: '#007bff',
    fontWeight: '600',
  },
  nextButton: {
    flex: 2,
    backgroundColor: '#007bff',
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  nextButtonDisabled: {
    backgroundColor: '#ccc',
    opacity: 0.7,
  },
  nextButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
});
