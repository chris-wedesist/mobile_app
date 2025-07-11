import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { createClient } from '@supabase/supabase-js';
import { colors, radius, shadows } from '@/constants/theme';
import { sanitizeInput, isValidEmail, validatePassword } from '@/utils/security';
import { generateCSRFToken, validateCSRFToken } from '@/utils/csrf';
import { getCaptchaToken } from '@/utils/captcha';
import { AuthError } from '@/types/auth';

// Initialize Supabase client
const supabase = createClient(
  'https://tscvzrxnxadnvgnsdrqx.supabase.co'!,
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRzY3Z6cnhueGFkbnZnbnNkcnF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ3NDcxMjgsImV4cCI6MjA2MDMyMzEyOH0.cvE6KoZXbSnigKUpbFzFwLtN-O6H4SxIyu5bn9rU1lY'!
);

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [csrfToken, setCsrfToken] = useState<string>('');
  const [passwordStrength, setPasswordStrength] = useState<{
    score: number;
    feedback: string;
  }>({ score: 0, feedback: '' });
  
  useEffect(() => {
    setCsrfToken(generateCSRFToken());
  }, []);
  
  // Check password strength whenever password changes
  useEffect(() => {
    if (!password) {
      setPasswordStrength({ score: 0, feedback: '' });
      return;
    }
    
    // Simple password strength calculation
    let score = 0;
    let feedback = '';
    
    if (password.length >= 8) score += 1;
    if (password.length >= 12) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[a-z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;
    
    // Provide feedback based on score
    if (score < 3) {
      feedback = 'Weak password';
    } else if (score < 5) {
      feedback = 'Moderate password';
    } else {
      feedback = 'Strong password';
    }
    
    setPasswordStrength({ score, feedback });
  }, [password]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Validate CSRF token
      if (!validateCSRFToken(csrfToken)) {
        throw new AuthError('INVALID_CSRF', 'Invalid request. Please refresh the page.');
      }

      // Validate email
      if (!isValidEmail(email)) {
        throw new AuthError('INVALID_EMAIL', 'Please enter a valid email address.');
      }
      
      // Validate password
      const passwordValidation = validatePassword(password);
      if (!passwordValidation.valid) {
        throw new AuthError('INVALID_PASSWORD', passwordValidation.reason || 'Invalid password');
      }
      
      // Check password confirmation
      if (password !== confirmPassword) {
        throw new AuthError('PASSWORD_MISMATCH', 'Passwords do not match');
      }

      // Sanitize inputs
      const sanitizedEmail = sanitizeInput(email);
      
      // Get CAPTCHA token
      const captchaToken = await getCaptchaToken();
      
      // Attempt registration
      const { error: signUpError, data } = await supabase.auth.signUp({
        email: sanitizedEmail,
        password,
        options: {
          emailRedirectTo: 'https://desist.app/auth/confirm',
          captchaToken
        }
      });

      if (signUpError) throw signUpError;

      // Navigate to confirmation page
      router.push('/auth/confirmation');
    } catch (error) {
      // Use secure error messages
      if (error.code === 'INVALID_EMAIL') {
        setError('Please enter a valid email address.');
      } else if (error.code === 'INVALID_PASSWORD') {
        setError(error.message);
      } else if (error.code === 'PASSWORD_MISMATCH') {
        setError('Passwords do not match.');
      } else if (error.code === 'INVALID_CSRF') {
        setError('Security validation failed. Please refresh the page.');
      } else if (error.code === 'USER_ALREADY_EXISTS') {
        setError('An account with this email already exists.');
      } else {
        setError('An error occurred during registration. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const getPasswordStrengthColor = () => {
    const { score } = passwordStrength;
    if (score < 3) return colors.status.error;
    if (score < 5) return colors.status.warning;
    return colors.status.success;
  };

  return (
    <ScrollView 
      style={styles.scrollView}
      contentContainerStyle={styles.scrollContent}
    >
      <View style={styles.container}>
        <View style={styles.formContainer}>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Join DESIST! to protect your rights</Text>
          
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
              placeholder="Create a password"
              placeholderTextColor={colors.text.muted}
              secureTextEntry
            />
            {password && (
              <View style={styles.passwordStrength}>
                <View style={styles.strengthMeter}>
                  {[1, 2, 3, 4, 5, 6].map((segment) => (
                    <View 
                      key={segment}
                      style={[
                        styles.strengthSegment,
                        { 
                          backgroundColor: passwordStrength.score >= segment 
                            ? getPasswordStrengthColor() 
                            : colors.text.muted 
                        }
                      ]}
                    />
                  ))}
                </View>
                <Text 
                  style={[
                    styles.strengthText,
                    { color: getPasswordStrengthColor() }
                  ]}
                >
                  {passwordStrength.feedback}
                </Text>
              </View>
            )}
          </View>
          
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Confirm Password</Text>
            <TextInput
              style={styles.input}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Confirm your password"
              placeholderTextColor={colors.text.muted}
              secureTextEntry
            />
          </View>
          
          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleRegister}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={colors.text.primary} />
            ) : (
              <Text style={styles.buttonText}>Create Account</Text>
            )}
          </TouchableOpacity>
          
          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account?</Text>
            <TouchableOpacity onPress={() => router.push('/auth/login')}>
              <Text style={styles.footerLink}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    backgroundColor: colors.primary,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  container: {
    flex: 1,
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
  passwordStrength: {
    marginTop: 10,
  },
  strengthMeter: {
    flexDirection: 'row',
    height: 4,
    borderRadius: 2,
    marginBottom: 5,
    gap: 4,
  },
  strengthSegment: {
    flex: 1,
    height: '100%',
    borderRadius: 2,
    backgroundColor: colors.text.muted,
  },
  strengthText: {
    fontSize: 12,
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
});