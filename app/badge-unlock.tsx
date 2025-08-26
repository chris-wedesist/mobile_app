import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { colors, radius, shadows } from '../constants/theme';

export default function BadgeUnlockScreen() {
  const [isCompleting, setIsCompleting] = useState(false);
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

  const handleContinue = async () => {
    try {
      console.log('Completing badge unlock...');
      setIsCompleting(true);

      // Save onboarding completion status
      await AsyncStorage.setItem('onboarding_completed', 'true');
      await AsyncStorage.setItem('founding_protector_badge', 'awarded');
      console.log('Badge unlock completed, navigating to home');

      // Navigate to home screen with a small delay to ensure state updates
      setTimeout(() => {
        router.replace('/(tabs)' as any);
      }, 100);
    } catch (error) {
      console.error('Error completing badge unlock:', error);
      setIsCompleting(false);

      // Fallback navigation in case of error
      setTimeout(() => {
        router.replace('/(tabs)' as any);
      }, 100);
    }
  };

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <ScrollView style={styles.container}>
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
          <Text style={styles.title}>🎖️ You Are A Founding Protector!</Text>
          <Text style={styles.subtitle}>Welcome to the DESIST! community</Text>

          <View style={styles.benefitsContainer}>
            <View style={styles.benefitCard}>
              <MaterialIcons name="shield" size={24} color={colors.accent} />
              <Text style={styles.benefitTitle}>Safety Tools</Text>
              <Text style={styles.benefitText}>
                Access to all emergency protection features
              </Text>
            </View>

            <View style={styles.benefitCard}>
              <MaterialIcons name="group" size={24} color={colors.accent} />
              <Text style={styles.benefitTitle}>Community</Text>
              <Text style={styles.benefitText}>
                Join a network of mutual support and safety
              </Text>
            </View>

            <View style={styles.benefitCard}>
              <MaterialIcons name="verified" size={24} color={colors.accent} />
              <Text style={styles.benefitTitle}>Recognition</Text>
              <Text style={styles.benefitText}>
                Exclusive Founding Protector status
              </Text>
            </View>
          </View>

          <View style={styles.messageCard}>
            <Text style={styles.messageTitle}>Thank You</Text>
            <Text style={styles.messageText}>
              Your commitment to personal and community safety helps make our
              spaces safer for everyone. You're now ready to use DESIST!
              whenever needed.
            </Text>
          </View>
        </Animated.View>

        <TouchableOpacity
          style={[
            styles.continueButton,
            isCompleting && styles.continueButtonDisabled,
          ]}
          onPress={handleContinue}
          disabled={isCompleting}
        >
          <Text style={styles.continueButtonText}>Continue to App</Text>
          <MaterialIcons
            name="chevron-right"
            size={20}
            color={colors.text.primary}
          />
        </TouchableOpacity>
      </View>
    </ScrollView>
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
  benefitsContainer: {
    width: '100%',
    marginBottom: 30,
    gap: 15,
  },
  benefitCard: {
    backgroundColor: colors.secondary,
    borderRadius: radius.lg,
    padding: 20,
    alignItems: 'center',
    ...shadows.sm,
  },
  benefitTitle: {
    color: colors.text.primary,
    fontSize: 16,
    fontWeight: '600',
    marginTop: 10,
    marginBottom: 4,
  },
  benefitText: {
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
