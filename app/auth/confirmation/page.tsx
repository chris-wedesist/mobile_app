import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { colors, radius, shadows } from '@/constants/theme';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';

export default function ConfirmationPage() {
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<'pending' | 'verified' | 'error'>('pending');
  const searchParams = useLocalSearchParams();
  const { user, session } = useAuth();

  useEffect(() => {
    // Check if we have verification parameters from email link
    if (searchParams.token_hash || searchParams.type === 'signup') {
      handleEmailVerification();
    }
  }, [searchParams]);

  // Check if user is verified when auth state changes
  useEffect(() => {
    if (user && user.email_confirmed_at) {
      setVerificationStatus('verified');
      // Navigate to onboarding after a short delay
      setTimeout(() => {
        router.replace('/onboarding' as any);
      }, 2000);
    }
  }, [user]);

  const handleEmailVerification = async () => {
    setIsVerifying(true);
    try {
      // Check if user is already verified
      if (user && user.email_confirmed_at) {
        setVerificationStatus('verified');
        // Navigate to onboarding after a short delay
        setTimeout(() => {
          router.replace('/onboarding' as any);
        }, 2000);
      } else {
        setVerificationStatus('pending');
      }
    } catch (error) {
      console.error('Verification error:', error);
      setVerificationStatus('error');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleReturnToLogin = () => {
    router.push('/auth/login' as any);
  };

  const handleResendConfirmation = async () => {
    try {
      // This would typically resend the confirmation email
      // For now, we'll just show an alert
      alert('Confirmation email resent. Please check your inbox.');
    } catch (error) {
      console.error('Error resending confirmation:', error);
      alert('Failed to resend confirmation email. Please try again.');
    }
  };

  if (isVerifying) {
    return (
      <View style={styles.container}>
        <View style={styles.card}>
          <ActivityIndicator size="large" color={colors.accent} />
          <Text style={styles.title}>Verifying Account...</Text>
          <Text style={styles.description}>
            Please wait while we verify your account.
          </Text>
        </View>
      </View>
    );
  }

  if (verificationStatus === 'verified') {
    return (
      <View style={styles.container}>
        <View style={styles.card}>
          <View style={styles.iconContainer}>
            <MaterialIcons name="check-circle" size={64} color={colors.status.success} />
          </View>
          
          <Text style={styles.title}>Account Verified!</Text>
          <Text style={styles.description}>
            Your account has been successfully verified. Redirecting you to get started...
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.iconContainer}>
          <MaterialIcons name="email" size={64} color={colors.accent} />
        </View>
        
        <Text style={styles.title}>Check Your Email</Text>
        <Text style={styles.description}>
          We've sent you a confirmation email. Please check your inbox and click the link to verify your account.
        </Text>
        
        <View style={styles.infoBox}>
          <MaterialIcons name="info" size={20} color={colors.accent} />
          <Text style={styles.infoText}>
            If you don't see the email, check your spam folder or request a new confirmation link.
          </Text>
        </View>
        
        <TouchableOpacity
          style={styles.button}
          onPress={handleReturnToLogin}
        >
          <Text style={styles.buttonText}>Return to Login</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.resendButton}
          onPress={handleResendConfirmation}
        >
          <Text style={styles.resendButtonText}>Resend Confirmation Email</Text>
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
  card: {
    width: '100%',
    maxWidth: 500,
    backgroundColor: colors.secondary,
    borderRadius: radius.lg,
    padding: 40,
    alignItems: 'center',
    ...shadows.md,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: `${colors.accent}20`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 15,
    fontFamily: 'Inter-Bold',
  },
  description: {
    fontSize: 16,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 24,
    fontFamily: 'Inter-Regular',
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: `${colors.accent}10`,
    padding: 15,
    borderRadius: radius.lg,
    marginBottom: 30,
    width: '100%',
    gap: 10,
  },
  infoText: {
    flex: 1,
    color: colors.text.secondary,
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  button: {
    backgroundColor: colors.accent,
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: radius.lg,
    marginBottom: 15,
    ...shadows.sm,
  },
  buttonText: {
    color: colors.text.primary,
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  resendButton: {
    padding: 10,
  },
  resendButtonText: {
    color: colors.accent,
    fontSize: 14,
    fontFamily: 'Inter-Medium',
  },
});