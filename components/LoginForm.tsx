import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { colors, radius, shadows } from '@/constants/theme';

interface LoginFormProps {
  onLogin: (email: string, password: string) => Promise<void>;
}

export default function LoginForm({ onLogin }: LoginFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rateLimited, setRateLimited] = useState(false);

  const handleSubmit = async () => {
    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setRateLimited(false);
      
      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          // Include IP for rate limiting on server
          ip: '127.0.0.1' // In a real app, this would be determined server-side
        }),
      });
      
      const data = await response.json();
      
      if (response.status === 429) {
        setRateLimited(true);
        setError('Too many login attempts. Please try again later.');
        return;
      }
      
      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }
      
      await onLogin(email, password);
    } catch (err) {
      setError(err.message || 'An error occurred during login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
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
          editable={!rateLimited}
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
          editable={!rateLimited}
        />
      </View>
      
      <TouchableOpacity
        style={[styles.button, (loading || rateLimited) && styles.buttonDisabled]}
        onPress={handleSubmit}
        disabled={loading || rateLimited}
      >
        {loading ? (
          <ActivityIndicator color={colors.text.primary} />
        ) : (
          <Text style={styles.buttonText}>Login</Text>
        )}
      </TouchableOpacity>
      
      {rateLimited && (
        <Text style={styles.rateLimitText}>
          Account temporarily locked due to too many login attempts.
          Please try again later.
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    maxWidth: 400,
    padding: 20,
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
    backgroundColor: colors.secondary,
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
  rateLimitText: {
    color: colors.status.warning,
    fontSize: 14,
    textAlign: 'center',
    marginTop: 20,
    fontFamily: 'Inter-Regular',
  },
});