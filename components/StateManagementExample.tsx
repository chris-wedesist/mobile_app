import * as React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import {
  colors,
  radius,
  shadows,
  spacing,
  typography,
} from '../constants/theme';
import {
  useAppState,
  useErrorState,
  useLoadingState,
} from '../utils/stateManager';
import {
  useLanguage,
  useLanguageActions,
  useTheme,
  useThemeActions,
  useUser,
  useUserActions,
} from '../utils/store';

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
    <View
      style={[
        styles.container,
        {
          backgroundColor:
            theme === 'dark' ? colors.surface : colors.background,
        },
      ]}
    >
      <Text
        style={[
          styles.title,
          { color: theme === 'dark' ? colors.background : colors.text.primary },
        ]}
      >
        State Management Example
      </Text>

      {/* User State */}
      <View style={styles.section}>
        <Text
          style={[
            styles.sectionTitle,
            {
              color: theme === 'dark' ? colors.background : colors.text.primary,
            },
          ]}
        >
          User State
        </Text>
        <Text
          style={[
            styles.text,
            {
              color:
                theme === 'dark' ? colors.text.muted : colors.text.secondary,
            },
          ]}
        >
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
        <Text
          style={[
            styles.sectionTitle,
            {
              color: theme === 'dark' ? colors.background : colors.text.primary,
            },
          ]}
        >
          Theme State
        </Text>
        <Text
          style={[
            styles.text,
            {
              color:
                theme === 'dark' ? colors.text.muted : colors.text.secondary,
            },
          ]}
        >
          Current theme: {theme}
        </Text>
        <Pressable style={styles.button} onPress={handleToggleTheme}>
          <Text style={styles.buttonText}>Toggle Theme</Text>
        </Pressable>
      </View>

      {/* Language State */}
      <View style={styles.section}>
        <Text
          style={[
            styles.sectionTitle,
            {
              color: theme === 'dark' ? colors.background : colors.text.primary,
            },
          ]}
        >
          Language State
        </Text>
        <Text
          style={[
            styles.text,
            {
              color:
                theme === 'dark' ? colors.text.muted : colors.text.secondary,
            },
          ]}
        >
          Current language: {language}
        </Text>
        <View style={styles.buttonRow}>
          <Pressable
            style={styles.button}
            onPress={() => handleSetLanguage('en')}
          >
            <Text style={styles.buttonText}>English</Text>
          </Pressable>
          <Pressable
            style={styles.button}
            onPress={() => handleSetLanguage('es')}
          >
            <Text style={styles.buttonText}>Español</Text>
          </Pressable>
          <Pressable
            style={styles.button}
            onPress={() => handleSetLanguage('fr')}
          >
            <Text style={styles.buttonText}>Français</Text>
          </Pressable>
        </View>
      </View>

      {/* App State */}
      <View style={styles.section}>
        <Text
          style={[
            styles.sectionTitle,
            {
              color: theme === 'dark' ? colors.background : colors.text.primary,
            },
          ]}
        >
          App State
        </Text>
        <Text
          style={[
            styles.text,
            {
              color:
                theme === 'dark' ? colors.text.muted : colors.text.secondary,
            },
          ]}
        >
          Online: {isOnline ? 'Yes' : 'No'}
        </Text>
        <Text
          style={[
            styles.text,
            {
              color:
                theme === 'dark' ? colors.text.muted : colors.text.secondary,
            },
          ]}
        >
          Initialized: {isInitialized ? 'Yes' : 'No'}
        </Text>
        <Text
          style={[
            styles.text,
            {
              color:
                theme === 'dark' ? colors.text.muted : colors.text.secondary,
            },
          ]}
        >
          Loading: {isLoading ? 'Yes' : 'No'}
        </Text>
        {error && (
          <Text style={[styles.errorText, { color: colors.error }]}>
            Error: {error}
          </Text>
        )}
      </View>

      {/* Loading and Error States */}
      <View style={styles.section}>
        <Text
          style={[
            styles.sectionTitle,
            {
              color: theme === 'dark' ? colors.background : colors.text.primary,
            },
          ]}
        >
          Component States
        </Text>
        <Text
          style={[
            styles.text,
            {
              color:
                theme === 'dark' ? colors.text.muted : colors.text.secondary,
            },
          ]}
        >
          Component Loading: {loadingState ? 'Yes' : 'No'}
        </Text>
        {errorState && (
          <Text style={[styles.errorText, { color: colors.error }]}>
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
    padding: spacing.md,
  },
  title: {
    fontSize: typography.fontSize.heading,
    fontWeight: 'bold',
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  section: {
    marginBottom: spacing.md,
    padding: spacing.sm,
    borderRadius: radius.medium,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  sectionTitle: {
    fontSize: typography.fontSize.subheading,
    fontWeight: 'bold',
    marginBottom: spacing.xs,
  },
  text: {
    fontSize: typography.fontSize.body,
    marginBottom: spacing.xs,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: spacing.xs,
  },
  button: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.small,
    marginHorizontal: spacing.xs,
  },
  buttonText: {
    color: colors.background,
    fontSize: typography.fontSize.caption,
    fontWeight: 'bold',
  },
  errorText: {
    fontSize: typography.fontSize.caption,
    fontStyle: 'italic',
    marginTop: spacing.xs,
  },
});
