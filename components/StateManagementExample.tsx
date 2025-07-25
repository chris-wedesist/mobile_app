import * as React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useUser, useTheme, useLanguage, useUserActions, useThemeActions, useLanguageActions } from '@/utils/store';
import { useAppState, useLoadingState, useErrorState } from '@/utils/stateManager';
import { colors } from '@/constants/theme';

/**
 * Example component demonstrating state management usage
 * This component shows how to use the Zustand store and state manager
 */
export default function StateManagementExample() {
  // Basic state hooks
  const user = useUser();
  const theme = useTheme();
  const language = useLanguage();
  
  // Action hooks
  const { setUser, clearUser } = useUserActions();
  const { setTheme, toggleTheme } = useThemeActions();
  const { setLanguage } = useLanguageActions();
  
  // Extended state hooks
  const { isLoading, error, isOnline, isInitialized } = useAppState();
  const loadingState = useLoadingState('example');
  const errorState = useErrorState('example');

  const handleSetUser = () => {
    setUser({ id: '1', name: 'John Doe', email: 'john@example.com' });
  };

  const handleClearUser = () => {
    clearUser();
  };

  const handleToggleTheme = () => {
    toggleTheme();
  };

  const handleSetLanguage = (lang: 'en' | 'es' | 'fr') => {
    setLanguage(lang);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme === 'dark' ? '#1a1a1a' : '#ffffff' }]}>
      <Text style={[styles.title, { color: theme === 'dark' ? '#ffffff' : '#000000' }]}>
        State Management Example
      </Text>
      
      {/* User State */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme === 'dark' ? '#ffffff' : '#000000' }]}>
          User State
        </Text>
        <Text style={[styles.text, { color: theme === 'dark' ? '#cccccc' : '#333333' }]}>
          {user ? `Logged in as: ${user.name}` : 'No user logged in'}
        </Text>
        <View style={styles.buttonRow}>
          <Pressable style={styles.button} onPress={handleSetUser}>
            <Text style={styles.buttonText}>Set User</Text>
          </Pressable>
          <Pressable style={styles.button} onPress={handleClearUser}>
            <Text style={styles.buttonText}>Clear User</Text>
          </Pressable>
        </View>
      </View>

      {/* Theme State */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme === 'dark' ? '#ffffff' : '#000000' }]}>
          Theme State
        </Text>
        <Text style={[styles.text, { color: theme === 'dark' ? '#cccccc' : '#333333' }]}>
          Current theme: {theme}
        </Text>
        <Pressable style={styles.button} onPress={handleToggleTheme}>
          <Text style={styles.buttonText}>Toggle Theme</Text>
        </Pressable>
      </View>

      {/* Language State */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme === 'dark' ? '#ffffff' : '#000000' }]}>
          Language State
        </Text>
        <Text style={[styles.text, { color: theme === 'dark' ? '#cccccc' : '#333333' }]}>
          Current language: {language}
        </Text>
        <View style={styles.buttonRow}>
          <Pressable style={styles.button} onPress={() => handleSetLanguage('en')}>
            <Text style={styles.buttonText}>English</Text>
          </Pressable>
          <Pressable style={styles.button} onPress={() => handleSetLanguage('es')}>
            <Text style={styles.buttonText}>Español</Text>
          </Pressable>
          <Pressable style={styles.button} onPress={() => handleSetLanguage('fr')}>
            <Text style={styles.buttonText}>Français</Text>
          </Pressable>
        </View>
      </View>

      {/* App State */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme === 'dark' ? '#ffffff' : '#000000' }]}>
          App State
        </Text>
        <Text style={[styles.text, { color: theme === 'dark' ? '#cccccc' : '#333333' }]}>
          Online: {isOnline ? 'Yes' : 'No'}
        </Text>
        <Text style={[styles.text, { color: theme === 'dark' ? '#cccccc' : '#333333' }]}>
          Initialized: {isInitialized ? 'Yes' : 'No'}
        </Text>
        <Text style={[styles.text, { color: theme === 'dark' ? '#cccccc' : '#333333' }]}>
          Loading: {isLoading ? 'Yes' : 'No'}
        </Text>
        {error && (
          <Text style={[styles.errorText, { color: '#ff0000' }]}>
            Error: {error}
          </Text>
        )}
      </View>

      {/* Loading and Error States */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme === 'dark' ? '#ffffff' : '#000000' }]}>
          Component States
        </Text>
        <Text style={[styles.text, { color: theme === 'dark' ? '#cccccc' : '#333333' }]}>
          Component Loading: {loadingState ? 'Yes' : 'No'}
        </Text>
        {errorState && (
          <Text style={[styles.errorText, { color: '#ff0000' }]}>
            Component Error: {errorState}
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  section: {
    marginBottom: 20,
    padding: 15,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  text: {
    fontSize: 16,
    marginBottom: 10,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 10,
  },
  button: {
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
    marginHorizontal: 5,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  errorText: {
    fontSize: 14,
    fontStyle: 'italic',
    marginTop: 5,
  },
}); 