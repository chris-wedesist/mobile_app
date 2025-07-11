import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { createClient } from '@supabase/supabase-js';
import { colors, radius, shadows } from '@/constants/theme';
import { sanitizeInput, isValidEmail } from '@/utils/security';

// Initialize Supabase client
const supabase = createClient(
  'https://tscvzrxnxadnvgnsdrqx.supabase.co'!,
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRzY3Z6cnhueGFkbnZnbnNkcnF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ3NDcxMjgsImV4cCI6MjA2MDMyMzEyOH0.cvE6KoZXbSnigKUpbFzFwLtN-O6H4SxIyu5bn9rU1lY'!
);

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  const handleSubmit = async () => {
    // Validate email
    if (!email || !isValidEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // Sanitize input
      const sanitizedEmail = sanitizeInput(email);
      
      // Send password reset email
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        sanitizedEmail,
        {
          redirectTo: 'https://desist.app/auth/reset-password',
        }
      );
      
      if (resetError) throw resetError;
      
      // Show success message
      setSuccess(true);
    } catch (error) {
      // For security reasons, always show the same message
      // regardless of whether the email exists or not
      setSuccess(true);
    } finally {
      setLoading(false);
    }
  };
  
  if (success) {
    return (
      <View style={styles.container}>
        <View style={styles.formContainer}>
          <Text style={styles.title}>Check Your Email</Text>
          <Text style={styles.subtitle}>
            If an account exists with the email {email}, you will receive a password reset link shortly.
          </Text>
          
          <TouchableOpacity
            style={styles.button}
            onPress={() => router.push('/auth/login')}
          >
            <Text style={styles.buttonText}>Return to Login</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }
  
  return (
    <View style={styles.container}>
      <View style={styles.formContainer}>
        <Text style={styles.title}>Reset Password</Text>
        <Text style={styles.subtitle}>
          Enter your email address and we'll send you a link to reset your password
        </Text>
        
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}
        
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="Enter your email"
            placeholderTextColor={colors.text.muted}
            autoCapitalize="none"
            keyboardType="email-address"
          />
        </View>
        
        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={colors.text.primary} />
          ) : (
            <Text style={styles.buttonText}>Send Reset Link</Text>
          )}
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.push('/auth/login')}
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
    fontSize: 16,
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
  backButton: {
    alignItems: 'center',
    marginTop: 20,
  },
  backButtonText: {
    color: colors.text.muted,
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
});