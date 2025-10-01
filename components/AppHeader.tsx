import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, shadows, radius } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { router } from 'expo-router';
import * as Linking from 'expo-linking';

interface AppHeaderProps {
  title?: string;
  showBackButton?: boolean;
  onBackPress?: () => void;
}

export default function AppHeader({ 
  title, 
  showBackButton = false, 
  onBackPress 
}: AppHeaderProps) {
  const { userProfile, user } = useAuth();

  const handleCallPress = () => {
    // Open phone dialer with emergency number
    Linking.openURL('tel:911');
  };

  const handleSettingsPress = () => {
    router.push('/(tabs)/settings');
  };

  const handleHomePress = () => {
    router.push('/(tabs)/');
  };

  const handleBackPress = () => {
    if (onBackPress) {
      onBackPress();
    } else {
      router.back();
    }
  };

  const displayName = userProfile?.full_name || user?.user_metadata?.full_name || 'User';
  const welcomeText = title || `Welcome, ${displayName}`;

  return (
    <View style={styles.header}>
      <View style={styles.leftSection}>
        {showBackButton && (
          <TouchableOpacity 
            style={styles.backButton}
            onPress={handleBackPress}
          >
            <MaterialIcons name="arrow-back" size={24} color={colors.text.primary} />
          </TouchableOpacity>
        )}
        {!showBackButton && (
          <TouchableOpacity 
            style={styles.homeButton}
            onPress={handleHomePress}
          >
            <MaterialIcons name="home" size={24} color={colors.accent} />
          </TouchableOpacity>
        )}
        <Text style={styles.welcomeText} numberOfLines={1}>
          {welcomeText}
        </Text>
      </View>

      <View style={styles.rightSection}>
        <TouchableOpacity 
          style={styles.iconButton}
          onPress={handleCallPress}
        >
          <MaterialIcons name="phone" size={24} color={colors.accent} />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.iconButton}
          onPress={handleSettingsPress}
        >
          <MaterialIcons name="settings" size={24} color={colors.accent} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
    paddingBottom: 15,
    backgroundColor: colors.primary,
    borderBottomWidth: 1,
    borderBottomColor: `${colors.text.muted}20`,
    ...shadows.sm,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 15,
  },
  backButton: {
    marginRight: 12,
    padding: 4,
  },
  homeButton: {
    marginRight: 12,
    padding: 4,
  },
  welcomeText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
    fontFamily: 'Inter-SemiBold',
    flex: 1,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconButton: {
    backgroundColor: colors.secondary,
    borderRadius: 12,
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm,
  },
});
