import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { verifyConfirmationCode, resendConfirmationEmail } from '@/utils/email-confirmation';
import { colors, shadows, radius } from '@/constants/theme';
import { MaterialIcons } from '@expo/vector-icons';

export default function ConfirmCodeScreen() {
  const [code, setCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const { email } = useLocalSearchParams();

  console.log('ConfirmCodeScreen loaded with email:', email);

  const handleVerifyCode = async () => {
    if (!code.trim() || code.length !== 6) {
      Alert.alert('Error', 'Please enter a valid 6-digit code');
      return;
    }

    setIsVerifying(true);
    try {
      const result = await verifyConfirmationCode({
        email: email as string,
        code: code.trim(),
      });

      if (result.success) {
        Alert.alert(
          'Email Confirmed!',
          'Your email has been successfully confirmed. You can now sign in to your account.',
          [
            {
              text: 'Sign In',
              onPress: () => router.push('/login' as any),
            },
          ]
        );
      } else {
        Alert.alert('Verification Failed', result.error || 'Invalid confirmation code');
      }
    } catch (error) {
      console.error('Code verification error:', error);
      Alert.alert('Error', 'Failed to verify code. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendCode = async () => {
    if (!email) {
      Alert.alert('Error', 'Email not found');
      return;
    }

    setIsResending(true);
    try {
      const username = (email as string).split('@')[0];
      const result = await resendConfirmationEmail(email as string, username);
      
      if (result.success) {
        Alert.alert(
          'Code Sent',
          'A new confirmation code has been sent to your email address.'
        );
        setCode(''); // Clear the current code
      } else {
        Alert.alert('Error', result.error || 'Failed to resend code');
      }
    } catch (error) {
      console.error('Resend code error:', error);
      Alert.alert('Error', 'Failed to resend confirmation code');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <MaterialIcons name="email" size={80} color={colors.accent} />
        <Text style={styles.title}>Enter Confirmation Code</Text>
        <Text style={styles.subtitle}>
          We've sent a 6-digit confirmation code to:
        </Text>
        <Text style={styles.email}>{email}</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.codeInputContainer}>
          <TextInput
            style={styles.codeInput}
            placeholder="000000"
            placeholderTextColor={colors.text.muted}
            value={code}
            onChangeText={setCode}
            keyboardType="numeric"
            maxLength={6}
            autoFocus
            textAlign="center"
          />
        </View>

        <TouchableOpacity
          style={[styles.verifyButton, isVerifying && styles.verifyButtonDisabled]}
          onPress={handleVerifyCode}
          disabled={isVerifying || code.length !== 6}
        >
          {isVerifying ? (
            <ActivityIndicator size="small" color={colors.text.primary} />
          ) : (
            <Text style={styles.verifyButtonText}>Verify Code</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.resendButton}
          onPress={handleResendCode}
          disabled={isResending}
        >
          {isResending ? (
            <ActivityIndicator size="small" color={colors.accent} />
          ) : (
            <Text style={styles.resendButtonText}>Resend Code</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.push('/login' as any)}
        >
          <Text style={styles.backButtonText}>Back to Sign In</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingTop: 60,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginTop: 20,
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: 8,
  },
  email: {
    fontSize: 16,
    color: colors.accent,
    fontWeight: '600',
    textAlign: 'center',
  },
  content: {
    flex: 1,
  },
  codeInputContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  codeInput: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.text.primary,
    backgroundColor: colors.secondary,
    borderRadius: radius.lg,
    paddingVertical: 20,
    paddingHorizontal: 30,
    borderWidth: 2,
    borderColor: colors.accent,
    width: 200,
    textAlign: 'center',
    letterSpacing: 8,
    ...shadows.md,
  },
  verifyButton: {
    backgroundColor: colors.accent,
    borderRadius: radius.lg,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 20,
    ...shadows.md,
  },
  verifyButtonDisabled: {
    opacity: 0.6,
  },
  verifyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    fontFamily: 'Inter-SemiBold',
  },
  resendButton: {
    alignItems: 'center',
    paddingVertical: 12,
    marginBottom: 20,
  },
  resendButtonText: {
    fontSize: 16,
    color: colors.accent,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  backButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  backButtonText: {
    fontSize: 16,
    color: colors.text.secondary,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
});
