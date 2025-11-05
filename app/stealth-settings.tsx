import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, ScrollView, Alert, BackHandler } from 'react-native';
import { router } from 'expo-router';
import { colors, shadows, radius } from '@/constants/theme';
import { MaterialIcons } from '@expo/vector-icons';
import { useStealthMode } from '@/components/StealthModeManager';
import { useAuth } from '@/contexts/AuthContext';

export default function StealthSettingsScreen() {
  const { deactivate } = useStealthMode();
  const { user, signOut } = useAuth();

  const handleExitStealth = async () => {
    try {
      await deactivate('settings');
      router.back();
    } catch (error) {
      console.error('Error exiting stealth mode:', error);
    }
  };

  const handleLogoutAndExitApp = async () => {
    try {
      await deactivate('logout');
      await new Promise(resolve => setTimeout(resolve, 300));
      await signOut();
      await new Promise(resolve => setTimeout(resolve, 300));

      if (Platform.OS === 'android') {
        BackHandler.exitApp();
      } else {
        router.replace('/login' as any);
      }
    } catch (error) {
      console.error('Error logging out and exiting app:', error);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}>
          <MaterialIcons name="chevron-left" color={colors.text.primary} size={24} />
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.titleContainer}>
          <MaterialIcons name="settings" size={32} color={colors.accent} />
          <Text style={styles.title}>Settings</Text>
        </View>

        <Text style={styles.description}>
          Configure Desist Calculator preferences and settings.
        </Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Emergency</Text>
          
          <TouchableOpacity 
            style={styles.settingItem}
            onPress={() => router.push('/emergency-setup')}>
            <View style={styles.settingInfo}>
              <MaterialIcons name="phone" size={24} color={colors.accent} />
              <View>
                <Text style={styles.settingTitle}>Emergency Contact</Text>
                <Text style={styles.settingDescription}>
                  Configure emergency contact and SMS settings
                </Text>
              </View>
            </View>
            <MaterialIcons name="chevron-right" size={24} color={colors.text.muted} />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Exit Options</Text>
          
          <Text style={styles.infoText}>
            You can exit stealth mode by:
          </Text>
          
          <View style={styles.exitOption}>
            <MaterialIcons name="power-settings-new" size={20} color={colors.text.muted} />
            <Text style={styles.exitOptionText}>Double press the power button</Text>
          </View>
          
          <View style={styles.exitOption}>
            <MaterialIcons name="dialpad" size={20} color={colors.text.muted} />
            <Text style={styles.exitOptionText}>Enter code "5555"</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.exitButton}
          onPress={() => handleLogoutAndExitApp()}>
          <MaterialIcons name="exit-to-app" size={24} color={colors.text.primary} />
          <Text style={styles.exitButtonText}>Clear Data & Close App</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.secondary,
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButtonText: {
    color: colors.text.primary,
    fontSize: 16,
    marginLeft: 8,
    fontFamily: 'Inter-Regular',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text.primary,
    fontFamily: 'Inter-Bold',
  },
  description: {
    fontSize: 16,
    color: colors.text.secondary,
    marginBottom: 30,
    lineHeight: 24,
    fontFamily: 'Inter-Regular',
  },
  section: {
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    padding: 20,
    marginBottom: 20,
    ...shadows.sm,
  },
  sectionTitle: {
    color: colors.text.muted,
    fontSize: 14,
    textTransform: 'uppercase',
    marginBottom: 15,
    fontFamily: 'Inter-Medium',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 15,
  },
  settingTitle: {
    color: colors.text.primary,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
    fontFamily: 'Inter-SemiBold',
  },
  settingDescription: {
    color: colors.text.muted,
    fontSize: 12,
    fontFamily: 'Inter-Regular',
  },
  infoText: {
    color: colors.text.secondary,
    fontSize: 14,
    marginBottom: 15,
    fontFamily: 'Inter-Regular',
  },
  exitOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
    paddingLeft: 8,
  },
  exitOptionText: {
    color: colors.text.primary,
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  exitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accent,
    padding: 20,
    borderRadius: radius.lg,
    gap: 10,
    marginBottom: 30,
    ...shadows.md,
  },
  exitButtonText: {
    color: colors.text.primary,
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: 'Inter-Bold',
  },
});

