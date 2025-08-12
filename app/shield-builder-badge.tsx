import { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, Animated, Easing } from 'react-native';
import { router } from 'expo-router';
import { colors, shadows, radius } from '../constants/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialIcons } from '@expo/vector-icons';

export default function ShieldBuilderBadgeScreen() {
  const [isCompleting, setIsCompleting] = useState(false);
  const [inviteCount, setInviteCount] = useState(0);
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    startAnimations();
    loadInviteCount();
  }, []);

  const startAnimations = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 1000,
        easing: Easing.elastic(1.2),
        useNativeDriver: true,
      }),
      Animated.parallel([
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  };

  const loadInviteCount = async () => {
    try {
      const count = await AsyncStorage.getItem('successful_invite_count');
      setInviteCount(parseInt(count || '0', 10));
    } catch (error) {
      console.error('Error loading invite count:', error);
    }
  };

  const handleContinue = async () => {
    try {
      setIsCompleting(true);
      
      // Save badge award
      await AsyncStorage.setItem('shield_builder_badge', 'awarded');

      // Navigate back
      router.back();
    } catch (error) {
      console.error('Error completing badge award:', error);
      setIsCompleting(false);
    }
  };

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Animated.View
          style={[
            styles.badgeContainer,
            {
              transform: [
                { scale: scaleAnim },
                { rotate: spin },
              ],
            },
          ]}>
          <View style={styles.badge}>
            <MaterialIcons name="shield" size={64} color={colors.accent} />
            <MaterialIcons name="verified" size={32} color={colors.status.success} style={styles.award} />
          </View>
        </Animated.View>

        <Animated.View
          style={[
            styles.textContent,
            {
              opacity: opacityAnim,
              transform: [{
                translateY: opacityAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [20, 0],
                }),
              }],
            },
          ]}>
          <Text style={styles.title}>🎖️ Shield Builder Badge Unlocked!</Text>
          <Text style={styles.subtitle}>
            You're growing the DESIST! community
          </Text>

          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <MaterialIcons name="group" size={24} color={colors.accent} />
              <Text style={styles.statTitle}>Successful Invites</Text>
              <Text style={styles.statValue}>{inviteCount}</Text>
            </View>
          </View>

          <View style={styles.achievementsContainer}>
            <View style={styles.achievementCard}>
              <MaterialIcons name="shield" size={24} color={colors.accent} />
              <Text style={styles.achievementTitle}>Community Builder</Text>
              <Text style={styles.achievementText}>
                You've helped {inviteCount} others access safety tools
              </Text>
            </View>

            <View style={styles.achievementCard}>
              <MaterialIcons name="verified" size={24} color={colors.accent} />
              <Text style={styles.achievementTitle}>Movement Leader</Text>
              <Text style={styles.achievementText}>
                Your invites strengthen our community
              </Text>
            </View>
          </View>

          <View style={styles.messageCard}>
            <Text style={styles.messageTitle}>Thank You</Text>
            <Text style={styles.messageText}>
              By helping others join DESIST!, you're making our community stronger 
              and safer. Keep building the movement!
            </Text>
          </View>
        </Animated.View>

        <TouchableOpacity
          style={[
            styles.continueButton,
            isCompleting && styles.continueButtonDisabled,
          ]}
          onPress={handleContinue}
          disabled={isCompleting}>
          <Text style={styles.continueButtonText}>
            Continue
          </Text>
          <MaterialIcons name="chevron-right" size={20} color={colors.text.primary} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primary,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    padding: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
  },
  badgeContainer: {
    marginBottom: 40,
  },
  badge: {
    width: 120,
    height: 120,
    borderRadius: radius.round,
    backgroundColor: `${colors.accent}20`,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.large,
  },
  award: {
    position: 'absolute',
    bottom: -8,
    right: -8,
    backgroundColor: colors.primary,
    borderRadius: radius.round,
    padding: 4,
  },
  textContent: {
    alignItems: 'center',
    width: '100%',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: colors.accent,
    marginBottom: 40,
    textAlign: 'center',
  },
  statsContainer: {
    width: '100%',
    marginBottom: 30,
  },
  statCard: {
    backgroundColor: colors.secondary,
    borderRadius: radius.lg,
    padding: 20,
    alignItems: 'center',
    ...shadows.sm,
  },
  statTitle: {
    color: colors.text.muted,
    fontSize: 14,
    marginTop: 10,
    marginBottom: 4,
  },
  statValue: {
    color: colors.text.primary,
    fontSize: 24,
    fontWeight: 'bold',
  },
  achievementsContainer: {
    width: '100%',
    marginBottom: 30,
    gap: 15,
  },
  achievementCard: {
    backgroundColor: colors.secondary,
    borderRadius: radius.lg,
    padding: 20,
    alignItems: 'center',
    ...shadows.sm,
  },
  achievementTitle: {
    color: colors.text.primary,
    fontSize: 16,
    fontWeight: '600',
    marginTop: 10,
    marginBottom: 4,
  },
  achievementText: {
    color: colors.text.muted,
    fontSize: 14,
    textAlign: 'center',
  },
  messageCard: {
    backgroundColor: colors.secondary,
    borderRadius: radius.lg,
    padding: 20,
    width: '100%',
    marginBottom: 40,
    ...shadows.sm,
  },
  messageTitle: {
    color: colors.accent,
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  messageText: {
    color: colors.text.secondary,
    fontSize: 16,
    lineHeight: 24,
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.accent,
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: radius.lg,
    gap: 8,
    ...shadows.md,
  },
  continueButtonDisabled: {
    opacity: 0.7,
  },
  continueButtonText: {
    color: colors.text.primary,
    fontSize: 16,
    fontWeight: '600',
  },
});