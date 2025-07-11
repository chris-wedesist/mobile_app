import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { createClient } from '@supabase/supabase-js';
import { colors, radius, shadows } from '@/constants/theme';

// Initialize Supabase client
const supabase = createClient(
  'https://tscvzrxnxadnvgnsdrqx.supabase.co'!,
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRzY3Z6cnhueGFkbnZnbnNkcnF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ3NDcxMjgsImV4cCI6MjA2MDMyMzEyOH0.cvE6KoZXbSnigKUpbFzFwLtN-O6H4SxIyu5bn9rU1lY'!
);

export default function TwoFactorAuthPage() {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [remainingTime, setRemainingTime] = useState(300); // 5 minutes in seconds
  const [resendDisabled, setResendDisabled] = useState(true);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
  useEffect(() => {
    // Start countdown timer
    timerRef.current = setInterval(() => {
      setRemainingTime(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          setResendDisabled(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    // Enable resend after 60 seconds
    const resendTimer = setTimeout(() => {
      setResendDisabled(false);
    }, 60000);
    
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      clearTimeout(resendTimer);
    };
  }, []);
  
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  const handleVerify = async () => {
    if (!code || code.length < 6) {
      setError('Please enter a valid verification code');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // In a real implementation, this would verify the 2FA code
      // For demo purposes, we'll simulate verification
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Simulate successful verification
      if (code === '123456') {
        router.push('/(tabs)');
      } else {
        setError('Invalid verification code. Please try again.');
      }
    } catch (error) {
      setError('Failed to verify code. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleResendCode = async () => {
    setResendDisabled(true);
    
    try {
      // In a real implementation, this would request a new 2FA code
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Reset timer
      setRemainingTime(300);
      
      // Restart timer
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        setRemainingTime(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            setResendDisabled(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
      // Disable resend for 60 seconds
      setTimeout(() => {
        setResendDisabled(false);
      }, 60000);
    } catch (error) {
      setError('Failed to resend code. Please try again.');
      setResendDisabled(false);
    }
  };
  
  return (
    <View style={styles.container}>
      <View style={styles.formContainer}>
        <Text style={styles.title}>Two-Factor Authentication</Text>
        <Text style={styles.subtitle}>Enter the verification code sent to your device</Text>
        
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}
        
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Verification Code</Text>
          <TextInput
            style={styles.input}
            value={code}
            onChangeText={setCode}
            placeholder="Enter 6-digit code"
            placeholderTextColor={colors.text.muted}
            keyboardType="number-pad"
            maxLength={6}
          />
        </View>
        
        <Text style={styles.timerText}>
          Code expires in: {formatTime(remainingTime)}
        </Text>
        
        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleVerify}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={colors.text.primary} />
          ) : (
            <Text style={styles.buttonText}>Verify</Text>
          )}
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.resendButton, resendDisabled && styles.resendButtonDisabled]}
          onPress={handleResendCode}
          disabled={resendDisabled}
        >
          <Text style={[styles.resendButtonText, resendDisabled && styles.resendButtonTextDisabled]}>
            Resend Code
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>Back to Login</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  formContainer: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: colors.secondary,
    borderRadius: radius.lg,
    padding: 30,
    ...shadows.md,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 8,
    fontFamily: 'Inter-Bold',
  },
  subtitle: {
    fontSize: 16,
    color: colors.text.secondary,
    marginBottom: 30,
    fontFamily: 'Inter-Regular',
  },
  errorContainer: {
    backgroundColor: `${colors.status.error}20`,
    padding: 15,
    borderRadius: radius.lg,
    marginBottom: 20,
  },
  errorText: {
    color: colors.status.error,
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    color: colors.text.primary,
    marginBottom: 8,
    fontFamily: 'Inter-Medium',
  },
  input: {
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    padding: 15,
    color: colors.text.primary,
    fontSize: 24,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
    letterSpacing: 8,
  },
  timerText: {
    color: colors.text.muted,
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
    fontFamily: 'Inter-Regular',
  },
  button: {
    backgroundColor: colors.accent,
    padding: 15,
    borderRadius: radius.lg,
    alignItems: 'center',
    ...shadows.sm,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: colors.text.primary,
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  resendButton: {
    alignItems: 'center',
    marginTop: 20,
  },
  resendButtonDisabled: {
    opacity: 0.5,
  },
  resendButtonText: {
    color: colors.accent,
    fontSize: 14,
    fontFamily: 'Inter-Medium',
  },
  resendButtonTextDisabled: {
    color: colors.text.muted,
  },
  backButton: {
    alignItems: 'center',
    marginTop: 15,
  },
  backButtonText: {
    color: colors.text.muted,
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
});