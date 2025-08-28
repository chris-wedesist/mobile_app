/**
 * Enhanced Incident Reporting Component with Server Integration
 * 
 * This component integrates with the backend CAPTCHA verification endpoint
 * for secure server-side validation and rate limiting.
 */

import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert, TextInput, ActivityIndicator, StyleSheet } from 'react-native';
import ReCaptcha from 'react-native-recaptcha-that-works';
import { getDeviceId } from '../../lib/security/deviceUtils';
import { securityConfig } from '../../lib/security/securityConfig';

interface IncidentData {
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category?: string;
}

interface ServerResponse {
  success: boolean;
  score?: number;
  error?: string;
  rateLimitInfo?: {
    remainingAttempts: number;
    resetTime: string;
  };
}

export default function EnhancedIncidentReporting() {
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState<'low' | 'medium' | 'high' | 'critical'>('medium');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [captchaVerified, setCaptchaVerified] = useState(false);
  const [showCaptcha, setShowCaptcha] = useState(false);
  const [deviceId, setDeviceId] = useState<string>('');
  const [rateLimitInfo, setRateLimitInfo] = useState<ServerResponse['rateLimitInfo'] | null>(null);

  const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

  useEffect(() => {
    const initializeComponent = async () => {
      try {
        const id = await getDeviceId();
        setDeviceId(id);
        // Optionally fetch current rate limit status
        await fetchRateLimitStatus(id);
      } catch (error) {
        console.error('Failed to initialize component:', error);
      }
    };

    initializeComponent();
  }, []);

  const fetchRateLimitStatus = async (deviceId: string) => {
    try {
      // This would be a separate endpoint to check rate limit status
      // For now, we'll get this info from the submission response
    } catch (error) {
      console.error('Failed to fetch rate limit status:', error);
    }
  };

  const handleCaptchaVerify = (token: string) => {
    if (token) {
      setCaptchaVerified(true);
      setShowCaptcha(false);
      // Proceed with submission after CAPTCHA verification
      submitToServer(token);
    }
  };

  const handleSubmit = async () => {
    if (!description.trim()) {
      Alert.alert('Validation Error', 'Please provide a description of the incident.');
      return;
    }

    if (!deviceId) {
      Alert.alert('Error', 'Device identification failed. Please restart the app.');
      return;
    }

    // Show CAPTCHA for verification
    setShowCaptcha(true);
  };

  const submitToServer = async (captchaToken: string) => {
    setIsSubmitting(true);

    try {
      const incidentData: IncidentData = {
        description: description.trim(),
        severity,
        category: 'security'
      };

      const response = await fetch(`${API_BASE_URL}/api/incidents`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: captchaToken,
          action: 'submit_incident',
          deviceId,
          incidentData
        }),
      });

      const result: ServerResponse = await response.json();

      if (result.success) {
        setRateLimitInfo(result.rateLimitInfo || null);
        
        Alert.alert(
          'Success', 
          `Incident reported successfully. ${result.rateLimitInfo ? 
            `You have ${result.rateLimitInfo.remainingAttempts} reports remaining.` : 
            ''}`
        );
        
        // Reset form
        setDescription('');
        setSeverity('medium');
        setCaptchaVerified(false);
      } else {
        if (response.status === 429) {
          const resetTime = result.rateLimitInfo?.resetTime 
            ? new Date(result.rateLimitInfo.resetTime).toLocaleTimeString()
            : 'later';
          
          Alert.alert(
            'Rate Limit Exceeded',
            `You have reached the maximum number of incident reports. Please try again after ${resetTime}.`
          );
        } else {
          Alert.alert('Error', result.error || 'Failed to submit incident report.');
        }
      }
    } catch (error) {
      console.error('Submission error:', error);
      Alert.alert('Network Error', 'Failed to connect to the server. Please check your internet connection.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCaptchaError = () => {
    setShowCaptcha(false);
    setCaptchaVerified(false);
    Alert.alert('Verification Error', 'CAPTCHA verification failed. Please try again.');
  };

  const handleCaptchaExpire = () => {
    setCaptchaVerified(false);
    Alert.alert('Verification Expired', 'Please verify again.');
  };

  const canSubmit = description.trim().length > 0 && !isSubmitting;
  const showRateLimitWarning = rateLimitInfo && rateLimitInfo.remainingAttempts <= 1;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Report Security Incident</Text>
      
      {showRateLimitWarning && (
        <View style={styles.warningContainer}>
          <Text style={styles.warningText}>
            ⚠️ Warning: Only {rateLimitInfo!.remainingAttempts} report(s) remaining this hour
          </Text>
        </View>
      )}

      {rateLimitInfo && rateLimitInfo.remainingAttempts === 0 && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>
            🚫 Rate limit exceeded. Next report available at{' '}
            {new Date(rateLimitInfo.resetTime).toLocaleTimeString()}
          </Text>
        </View>
      )}

      <Text style={styles.label}>Description *</Text>
      <TextInput
        style={styles.textInput}
        placeholder="Describe the security incident in detail..."
        value={description}
        onChangeText={setDescription}
        multiline
        numberOfLines={6}
        maxLength={1000}
        editable={!isSubmitting && rateLimitInfo?.remainingAttempts !== 0}
      />

      <Text style={styles.label}>Severity Level</Text>
      <View style={styles.severityContainer}>
        {(['low', 'medium', 'high', 'critical'] as const).map((level) => (
          <TouchableOpacity
            key={level}
            style={[
              styles.severityButton,
              severity === level && styles.severityButtonActive,
              isSubmitting && styles.severityButtonDisabled
            ]}
            onPress={() => !isSubmitting && setSeverity(level)}
            disabled={isSubmitting}
          >
            <Text
              style={[
                styles.severityButtonText,
                severity === level && styles.severityButtonTextActive
              ]}
            >
              {level.charAt(0).toUpperCase() + level.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        style={[
          styles.submitButton,
          !canSubmit && styles.submitButtonDisabled
        ]}
        onPress={handleSubmit}
        disabled={!canSubmit || rateLimitInfo?.remainingAttempts === 0}
      >
        {isSubmitting ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.submitButtonText}>
            Verify & Submit Report
          </Text>
        )}
      </TouchableOpacity>

      {captchaVerified && (
        <Text style={styles.verifiedText}>
          ✓ Human verification completed
        </Text>
      )}

      <ReCaptcha
        siteKey={securityConfig.captcha.siteKey}
        baseUrl={securityConfig.captcha.baseUrl}
        onVerify={handleCaptchaVerify}
        show={showCaptcha}
        onExpire={handleCaptchaExpire}
        onError={handleCaptchaError}
        size="normal"
        theme="light"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#fff',
    flex: 1,
  },
  title: {
    fontWeight: 'bold',
    fontSize: 18,
    marginBottom: 20,
    color: '#333',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  textInput: {
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    fontSize: 16,
    textAlignVertical: 'top',
    minHeight: 120,
  },
  severityContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    flexWrap: 'wrap',
  },
  severityButton: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
    marginBottom: 10,
  },
  severityButtonActive: {
    backgroundColor: '#007bff',
  },
  severityButtonDisabled: {
    opacity: 0.5,
  },
  severityButtonText: {
    color: '#333',
    fontWeight: '500',
  },
  severityButtonTextActive: {
    color: '#fff',
  },
  submitButton: {
    backgroundColor: '#007bff',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  submitButtonDisabled: {
    backgroundColor: '#ccc',
    opacity: 0.7,
  },
  submitButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  verifiedText: {
    textAlign: 'center',
    color: '#4caf50',
    fontSize: 14,
    marginTop: 10,
  },
  warningContainer: {
    backgroundColor: '#fff3cd',
    padding: 12,
    borderRadius: 8,
    marginBottom: 15,
    borderLeftWidth: 4,
    borderLeftColor: '#ff9800',
  },
  warningText: {
    color: '#856404',
    fontSize: 14,
  },
  errorContainer: {
    backgroundColor: '#f8d7da',
    padding: 12,
    borderRadius: 8,
    marginBottom: 15,
    borderLeftWidth: 4,
    borderLeftColor: '#dc3545',
  },
  errorText: {
    color: '#721c24',
    fontSize: 14,
  },
});
