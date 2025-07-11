import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { colors, radius, shadows } from '@/constants/theme';
import { MaterialIcons } from '@expo/vector-icons';

export default function ConfirmationPage() {
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
          onPress={() => router.push('/auth/login')}
        >
          <Text style={styles.buttonText}>Return to Login</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.resendButton}
          onPress={() => {
            // In a real app, this would resend the confirmation email
            alert('Confirmation email resent. Please check your inbox.');
          }}
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