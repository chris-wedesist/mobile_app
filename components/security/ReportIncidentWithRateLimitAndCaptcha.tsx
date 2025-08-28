import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert, TextInput, ActivityIndicator } from 'react-native';
import { supabase } from '../../lib/supabase';
import ReCaptcha from 'react-native-recaptcha-that-works';
import { incidentReportLimiter } from '../../lib/security/rateLimiter';
import { getDeviceId } from '../../lib/security/deviceUtils';

interface FormField {
  label: string;
  value: string;
}

export default function ReportIncidentWithRateLimitAndCaptcha() {
  const [formFields, setFormFields] = useState<FormField[]>([{ label: 'Details', value: '' }]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [captchaVerified, setCaptchaVerified] = useState(false);
  const [showCaptcha, setShowCaptcha] = useState(false);
  const [remainingAttempts, setRemainingAttempts] = useState<number | null>(null);
  const [deviceId, setDeviceId] = useState<string>('');

  // Add your site key here (register at https://www.google.com/recaptcha/admin)
  const RECAPTCHA_SITE_KEY = process.env.EXPO_PUBLIC_RECAPTCHA_SITE_KEY || '6Ld-ALYrAAAAAKW7vP_I_d2wKZ7_lz-g49AWhOl7';
  const RECAPTCHA_BASE_URL = process.env.EXPO_PUBLIC_APP_URL || 'https://your-app-url.com';

  useEffect(() => {
    const initializeComponent = async () => {
      try {
        const id = await getDeviceId();
        setDeviceId(id);
        const remaining = await incidentReportLimiter.getRemainingAttempts(id);
        setRemainingAttempts(remaining);
      } catch (error) {
        console.error('Failed to initialize rate limiter:', error);
      }
    };

    initializeComponent();
  }, []);

  const handleFieldChange = (value: string) => {
    setFormFields([{ label: 'Details', value }]);
  };

  const handleCaptcha = () => {
    setShowCaptcha(true);
  };

  const onVerifyCaptcha = (token: string) => {
    if (token) {
      setCaptchaVerified(true);
      setShowCaptcha(false);
      Alert.alert('Verified', 'You are verified as human.');
    }
  };

  const onCaptchaExpire = () => {
    setCaptchaVerified(false);
    Alert.alert('Verification Expired', 'Please verify again.');
  };

  const onCaptchaError = () => {
    setShowCaptcha(false);
    setCaptchaVerified(false);
    Alert.alert('Verification Error', 'Please try again.');
  };

  const handleSubmit = async () => {
    if (!deviceId) {
      Alert.alert('Error', 'Device identification failed. Please try again.');
      return;
    }

    // Check rate limit first
    const canSubmit = await incidentReportLimiter.canPerformAction(deviceId);
    if (!canSubmit) {
      const resetTime = await incidentReportLimiter.getResetTime(deviceId);
      Alert.alert(
        'Rate Limit Exceeded', 
        `You have reached the maximum number of incident reports per hour. Please try again after ${resetTime.toLocaleTimeString()}.`
      );
      return;
    }

    // Require captcha verification
    if (!captchaVerified) {
      handleCaptcha();
      return;
    }

    // Validate form
    const incidentDetails = formFields[0].value.trim();
    if (!incidentDetails) {
      Alert.alert('Validation Error', 'Please provide incident details.');
      return;
    }

    setIsSubmitting(true);

    try {
      // Submit incident to database
      const { data, error } = await supabase
        .from('incidents')
        .insert([
          {
            description: incidentDetails,
            device_id: deviceId,
            created_at: new Date().toISOString(),
            verified_human: captchaVerified,
          },
        ])
        .select()
        .single();

      if (error) {
        console.error('Database error:', error);
        throw new Error('Failed to save incident report');
      }

      // Record the rate limit action
      await incidentReportLimiter.recordAction(deviceId);
      
      // Update remaining attempts
      const remaining = await incidentReportLimiter.getRemainingAttempts(deviceId);
      setRemainingAttempts(remaining);

      Alert.alert('Success', 'Incident reported successfully. Thank you for helping improve security.');
      
      // Reset form
      setFormFields([{ label: 'Details', value: '' }]);
      setCaptchaVerified(false); // Require re-verification for next submission

    } catch (error) {
      console.error('Submission error:', error);
      Alert.alert('Error', 'Failed to report incident. Please try again later.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid = formFields[0].value.trim().length > 0;
  const canSubmitForm = remainingAttempts !== null && remainingAttempts > 0;

  return (
    <View style={{ padding: 20, backgroundColor: '#fff', flex: 1 }}>
      <Text style={{ 
        fontWeight: 'bold', 
        fontSize: 18, 
        marginBottom: 10,
        color: '#333'
      }}>
        Report Security Incident
      </Text>
      
      {remainingAttempts !== null && (
        <Text style={{ 
          fontSize: 14, 
          color: canSubmitForm ? '#666' : '#d32f2f',
          marginBottom: 10 
        }}>
          {canSubmitForm 
            ? `${remainingAttempts} reports remaining this hour`
            : 'Rate limit exceeded. Please wait before submitting another report.'
          }
        </Text>
      )}

      <TextInput
        style={{
          backgroundColor: '#f5f5f5',
          padding: 12,
          borderRadius: 8,
          marginBottom: 15,
          borderWidth: 1,
          borderColor: '#e0e0e0',
          fontSize: 16,
          textAlignVertical: 'top',
        }}
        placeholder="Describe the security incident in detail..."
        value={formFields[0].value}
        onChangeText={handleFieldChange}
        multiline
        numberOfLines={6}
        maxLength={1000}
        editable={canSubmitForm}
      />

      <TouchableOpacity
        style={{
          backgroundColor: canSubmitForm && isFormValid ? '#007bff' : '#ccc',
          padding: 15,
          borderRadius: 8,
          alignItems: 'center',
          opacity: isSubmitting ? 0.7 : 1,
        }}
        onPress={handleSubmit}
        disabled={isSubmitting || !canSubmitForm || !isFormValid}
      >
        {isSubmitting ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={{ 
            color: '#fff', 
            fontWeight: 'bold',
            fontSize: 16 
          }}>
            {captchaVerified ? 'Submit Incident Report' : 'Verify & Submit Report'}
          </Text>
        )}
      </TouchableOpacity>

      {captchaVerified && (
        <Text style={{
          textAlign: 'center',
          marginTop: 10,
          color: '#4caf50',
          fontSize: 14
        }}>
          ✓ Human verification completed
        </Text>
      )}

      <ReCaptcha
        siteKey={RECAPTCHA_SITE_KEY}
        baseUrl={RECAPTCHA_BASE_URL}
        onVerify={onVerifyCaptcha}
        show={showCaptcha}
        onExpire={onCaptchaExpire}
        onError={onCaptchaError}
        size="normal"
        theme="light"
      />
    </View>
  );
}
