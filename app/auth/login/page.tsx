import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { createClient } from '@supabase/supabase-js';
import { colors, radius, shadows } from '@/constants/theme';
import { checkRateLimit } from '@/utils/rateLimit';
import { sanitizeInput, getSecureErrorMessage, logAuthenticationFailure } from '@/utils/security';
import { generateCSRFToken, validateCSRFToken } from '@/utils/csrf';
import { getCaptchaToken } from '@/utils/captcha';
import { AuthError } from '@/types/auth';

// Initialize Supabase client
const supabase = createClient(
  'https://tscvzrxnxadnvgnsdrqx.supabase.co'!,
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRzY3Z6cnhueGFkbnZnbnNkcnF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ3NDcxMjgsImV4cCI6MjA2MDMyMzEyOH0.cvE6KoZXbSnigKUpbFzFwLtN-O6H4SxIyu5bn9rU1lY'!
);

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [csrfToken, setCsrfToken] = useState<string>('');
  
  useEffect(() => {
    setCsrfToken(generateCSRFToken());
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Check rate limiting
      const canProceed = await checkRateLimit(email);
      if (!canProceed) {
        throw new AuthError('TOO_MANY_ATTEMPTS', 'Too many login attempts. Please try again later.');
      }

      // Validate CSRF token
      if (!validateCSRFToken(csrfToken)) {
        throw new AuthError('INVALID_CSRF', 'Invalid request. Please refresh the page.');
      }

      // Sanitize inputs
      const sanitizedEmail = sanitizeInput(email);
      
      // Attempt login
      const { error: signInError, data } = await supabase.auth.signInWithPassword({
        email: sanitizedEmail,
        password,
      });

      if (signInError) throw signInError;

      // Check if 2FA is required (mock implementation)
      if (data.user?.email?.includes('2fa')) {
        router.push('/auth/2fa');
        return;
      }

      router.push('/(tabs)');
    } catch (error) {
      await logAuthenticationFailure({
        email,
        errorCode: error.code || 'UNKNOWN_ERROR',
        timestamp: new Date().toISOString()
      });
      
      // Use secure error messages
      setError(getSecureErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.formContainer}>
        <Text style={styles.title}>Sign In</Text>
        <Text style={styles.subtitle}>Welcome back to DESIST!</Text>
        
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
        
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            placeholder="Enter your password"
            placeholderTextColor={colors.text.muted}
            secureTextEntry
          />
        </View>
        
        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={colors.text.primary} />
          ) : (
            <Text style={styles.buttonText}>Sign In</Text>
          )}
        </TouchableOpacity>
        
        <View style={styles.footer}>
          <Text style={styles.footerText}>Don't have an account?</Text>
          <TouchableOpacity onPress={() => router.push('/auth/register')}>
            <Text style={styles.footerLink}>Sign Up</Text>
          </TouchableOpacity>
        </View>
        
        <TouchableOpacity 
          style={styles.forgotPassword}
          onPress={() => router.push('/auth/forgot-password')}
        >
          <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
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
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
    gap: 5,
  },
  footerText: {
    color: colors.text.secondary,
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  footerLink: {
    color: colors.accent,
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  forgotPassword: {
    alignItems: 'center',
    marginTop: 15,
  },
  forgotPasswordText: {
    color: colors.text.muted,
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
});