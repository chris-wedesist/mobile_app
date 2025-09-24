import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useAuth } from '@/contexts/AuthContextFallback';
import { colors, shadows, radius } from '@/constants/theme';

export default function AuthTestComponent() {
  const { user, userProfile, signOut } = useAuth();
  const [testResult, setTestResult] = useState<string>('');

  const testAuthFlow = async () => {
    try {
      if (!user) {
        setTestResult('No user logged in');
        return;
      }

      if (!userProfile) {
        setTestResult('User profile not loaded');
        return;
      }

      setTestResult(`✅ Auth Test Passed!\n\nUser ID: ${user.id}\nEmail: ${userProfile.email}\nFull Name: ${userProfile.full_name || 'Not set'}\nUsername: ${userProfile.username || 'Not set'}\nCreated: ${new Date(userProfile.created_at).toLocaleDateString()}`);
    } catch (error) {
      setTestResult(`❌ Auth Test Failed: ${error}`);
    }
  };

  const testSignOut = async () => {
    try {
      await signOut();
      setTestResult('✅ Sign out successful');
    } catch (error) {
      setTestResult(`❌ Sign out failed: ${error}`);
    }
  };

  if (!user) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Authentication Test</Text>
        <Text style={styles.subtitle}>No user logged in</Text>
        <Text style={styles.info}>Please sign in to test authentication</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Authentication Test</Text>
      
      <View style={styles.userInfo}>
        <Text style={styles.label}>User ID:</Text>
        <Text style={styles.value}>{user.id}</Text>
        
        <Text style={styles.label}>Email:</Text>
        <Text style={styles.value}>{userProfile?.email || 'Not loaded'}</Text>
        
        <Text style={styles.label}>Full Name:</Text>
        <Text style={styles.value}>{userProfile?.full_name || 'Not set'}</Text>
        
        <Text style={styles.label}>Username:</Text>
        <Text style={styles.value}>{userProfile?.username || 'Not set'}</Text>
        
        <Text style={styles.label}>Created:</Text>
        <Text style={styles.value}>
          {userProfile?.created_at ? new Date(userProfile.created_at).toLocaleDateString() : 'Not loaded'}
        </Text>
      </View>

      <TouchableOpacity style={styles.testButton} onPress={testAuthFlow}>
        <Text style={styles.buttonText}>Test Auth Flow</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.signOutButton} onPress={testSignOut}>
        <Text style={styles.buttonText}>Test Sign Out</Text>
      </TouchableOpacity>

      {testResult && (
        <View style={styles.resultContainer}>
          <Text style={styles.resultText}>{testResult}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: colors.primary,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 20,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 10,
    textAlign: 'center',
  },
  info: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  userInfo: {
    backgroundColor: colors.surface,
    borderRadius: radius.medium,
    padding: 16,
    marginBottom: 20,
    ...shadows.small,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    marginTop: 8,
    marginBottom: 4,
  },
  value: {
    fontSize: 16,
    color: colors.textPrimary,
    marginBottom: 8,
  },
  testButton: {
    backgroundColor: colors.accent,
    borderRadius: radius.medium,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
    ...shadows.medium,
  },
  signOutButton: {
    backgroundColor: '#ff4444',
    borderRadius: radius.medium,
    padding: 16,
    alignItems: 'center',
    marginBottom: 20,
    ...shadows.medium,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  resultContainer: {
    backgroundColor: colors.surface,
    borderRadius: radius.medium,
    padding: 16,
    ...shadows.small,
  },
  resultText: {
    fontSize: 14,
    color: colors.textPrimary,
    fontFamily: 'monospace',
  },
});