import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { colors, radius, shadows } from '../constants/theme';

export default function MissionSuccessScreen() {
  const [isAwarding, setIsAwarding] = useState(false);
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    startAnimations();
  }, []);

  const startAnimations = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 800,
        easing: Easing.elastic(1.2),
        useNativeDriver: true,
      }),
      Animated.parallel([
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  };

  const handleComplete = async () => {
    try {
      setIsAwarding(true);

      // Save badge award to storage
      await AsyncStorage.setItem('founding_protector_badge', 'awarded');
      await AsyncStorage.setItem('demo_completed', 'true');

      // Navigate back to home
      router.replace('/' as any);
    } catch (error) {
      console.error('Error completing mission:', error);
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
              transform: [{ scale: scaleAnim }, { rotate: spin }],
            },
          ]}
        >
          <View style={styles.badge}>
            <MaterialIcons name="shield" size={64} color={colors.accent} />
            <MaterialIcons
              name="verified"
              size={32}
              color={colors.status.success}
              style={styles.award}
            />
          </View>
        </Animated.View>

        <Animated.View
          style={[
            styles.textContent,
            {
              opacity: opacityAnim,
              transform: [
                {
                  translateY: opacityAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [20, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <Text style={styles.title}>Mission Complete!</Text>
          <Text style={styles.subtitle}>You're ready to protect yourself</Text>

          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <MaterialIcons name="shield" size={24} color={colors.accent} />
              <Text style={styles.statTitle}>Safety Features</Text>
              <Text style={styles.statValue}>Tested</Text>
            </View>

            <View style={styles.statCard}>
              <MaterialIcons name="group" size={24} color={colors.accent} />
              <Text style={styles.statTitle}>Community</Text>
              <Text style={styles.statValue}>Joined</Text>
            </View>

            <View style={styles.statCard}>
              <MaterialIcons name="verified" size={24} color={colors.accent} />
              <Text style={styles.statTitle}>Badge</Text>
              <Text style={styles.statValue}>Earned</Text>
            </View>
          </View>

          <View style={styles.messageCard}>
            <Text style={styles.messageTitle}>Founding Protector</Text>
            <Text style={styles.messageText}>
              You've earned the Founding Protector badge for completing the
              safety mission. Your commitment to personal and community safety
              makes a difference.
            </Text>
          </View>
        </Animated.View>

        <TouchableOpacity
          style={[
            styles.completeButton,
            isAwarding && styles.completeButtonDisabled,
          ]}
          onPress={handleComplete}
          disabled={isAwarding}
        >
          <Text style={styles.completeButtonText}>
            {isAwarding ? 'Completing...' : 'Start Protecting'}
          </Text>
          <MaterialIcons
            name="chevron-right"
            size={20}
            color={colors.text.primary}
          />
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
    ...shadows.lg,
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
    fontSize: 32,
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 30,
    gap: 15,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.secondary,
    borderRadius: radius.lg,
    padding: 15,
    alignItems: 'center',
    ...shadows.sm,
  },
  statTitle: {
    color: colors.text.muted,
    fontSize: 12,
    marginTop: 8,
    marginBottom: 4,
  },
  statValue: {
    color: colors.text.primary,
    fontSize: 16,
    fontWeight: '600',
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
  completeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.accent,
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: radius.lg,
    gap: 8,
    ...shadows.md,
  },
  completeButtonDisabled: {
    opacity: 0.7,
  },
  completeButtonText: {
    color: colors.text.primary,
    fontSize: 18,
    fontWeight: 'bold',
  },
});
