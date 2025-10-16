import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { confirmEmail } from '@/utils/email-confirmation';
import { colors } from '@/constants/theme';
import { MaterialIcons } from '@expo/vector-icons';

export default function EmailCallbackScreen() {
  const [isConfirming, setIsConfirming] = useState(true);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const { email, confirmed } = useLocalSearchParams();

  useEffect(() => {
    if (email && confirmed) {
      handleEmailConfirmation();
    } else {
      setIsConfirming(false);
      Alert.alert('Error', 'Invalid confirmation link');
    }
  }, [email, confirmed]);

  const handleEmailConfirmation = async () => {
    try {
      const result = await confirmEmail({
        email: email as string,
        confirmed: confirmed === 'true',
      });

      if (result.success) {
        setIsConfirmed(true);
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
        Alert.alert('Confirmation Failed', result.error || 'Failed to confirm email');
      }
    } catch (error) {
      console.error('Email confirmation error:', error);
      Alert.alert('Error', 'Failed to confirm email. Please try again.');
    } finally {
      setIsConfirming(false);
    }
  };

  if (isConfirming) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.accent} />
        <Text style={styles.loadingText}>Confirming your email...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <MaterialIcons 
          name={isConfirmed ? "check-circle" : "error"} 
          size={80} 
          color={isConfirmed ? colors.accent : colors.error || '#ef4444'} 
        />
        <Text style={styles.title}>
          {isConfirmed ? 'Email Confirmed!' : 'Confirmation Failed'}
        </Text>
        <Text style={styles.subtitle}>
          {isConfirmed 
            ? 'Your email has been successfully confirmed. You can now sign in to your account.'
            : 'There was an issue confirming your email. Please try again or contact support.'
          }
        </Text>
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
    paddingHorizontal: 24,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.primary,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.text.secondary,
  },
  content: {
    alignItems: 'center',
    textAlign: 'center',
  },
  title: {
    fontSize: 24,
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
    lineHeight: 24,
  },
});
