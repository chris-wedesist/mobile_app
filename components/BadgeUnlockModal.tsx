import { MaterialIcons } from '@expo/vector-icons';
import { useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { colors, typography, spacing, radius, shadows } from '../constants/theme';

type BadgeUnlockModalProps = {
  visible: boolean;
  onClose: () => void;
  badge: {
    icon: React.ReactNode;
    name: string;
    description: string;
    unlocked: boolean;
    progress?: {
      current: number;
      total: number;
    };
  } | null;
};

export default function BadgeUnlockModal({
  visible,
  onClose,
  badge,
}: BadgeUnlockModalProps) {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const confettiAnims = useRef(
    Array(20)
      .fill(0)
      .map(() => ({
        position: new Animated.ValueXY({ x: 0, y: 0 }),
        opacity: new Animated.Value(1),
        rotation: new Animated.Value(0),
      }))
  ).current;

  useEffect(() => {
    if (visible && badge) {
      // Reset animations
      scaleAnim.setValue(0);
      opacityAnim.setValue(0);
      confettiAnims.forEach((anim) => {
        anim.position.setValue({ x: 0, y: 0 });
        anim.opacity.setValue(1);
        anim.rotation.setValue(0);
      });

      // Start animations
      Animated.sequence([
        // Badge entrance
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
        // Content fade in
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        // Only show confetti for unlocked badges
        badge.unlocked
          ? Animated.parallel(
              confettiAnims.map((anim, i) => {
                const angle = (i / confettiAnims.length) * Math.PI * 2;
                const radius = Math.random() * 200 + 100;
                return Animated.parallel([
                  Animated.timing(anim.position, {
                    toValue: {
                      x: Math.cos(angle) * radius,
                      y: Math.sin(angle) * radius,
                    },
                    duration: 1000,
                    easing: Easing.out(Easing.cubic),
                    useNativeDriver: true,
                  }),
                  Animated.timing(anim.opacity, {
                    toValue: 0,
                    duration: 1000,
                    useNativeDriver: true,
                  }),
                  Animated.timing(anim.rotation, {
                    toValue: Math.random() * 4 - 2,
                    duration: 1000,
                    useNativeDriver: true,
                  }),
                ]);
              })
            )
          : Animated.delay(0),
      ]).start();
    }
  }, [visible, badge]);

  if (!badge) return null;

  const renderConfetti = () => {
    if (!badge.unlocked) return null;

    return confettiAnims.map((anim, i) => (
      <Animated.View
        key={i}
        style={[
          styles.confetti,
          {
            backgroundColor: [
              colors.accent,
              colors.status.success,
              colors.text.primary,
            ][i % 3],
            transform: [
              { translateX: anim.position.x },
              { translateY: anim.position.y },
              {
                rotate: anim.rotation.interpolate({
                  inputRange: [-2, 2],
                  outputRange: ['-360deg', '360deg'],
                }),
              },
            ],
            opacity: anim.opacity,
          },
        ]}
      />
    ));
  };

  const renderProgress = () => {
    if (!badge.progress) return null;

    return (
      <View style={styles.progressSection}>
        <Text style={styles.progressTitle}>Progress</Text>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${Math.min(
                  100,
                  (badge.progress.current / badge.progress.total) * 100
                )}%`,
              },
            ]}
          />
        </View>
        <Text style={styles.progressText}>
          {badge.progress.current} of {badge.progress.total} completed
        </Text>
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.content}>
          {/* Confetti */}
          <View style={styles.confettiContainer}>{renderConfetti()}</View>

          {/* Badge Icon */}
          <Animated.View
            style={[
              styles.badgeContainer,
              {
                transform: [{ scale: scaleAnim }],
              },
            ]}
          >
            <View style={styles.badge}>
              {badge.icon}
              {badge.unlocked && (
                <MaterialIcons
                  name="verified"
                  color={colors.status.success}
                  style={styles.award}
                />
              )}
            </View>
          </Animated.View>

          {/* Badge Info */}
          <Animated.View style={[styles.textContent, { opacity: opacityAnim }]}>
            <Text style={styles.title}>
              {badge.unlocked ? '🎖️ Unlocked: ' : ''}
              {badge.name}
            </Text>
            <Text style={styles.description}>{badge.description}</Text>

            {renderProgress()}
          </Animated.View>

          {/* Action Button */}
          <Animated.View style={{ opacity: opacityAnim }}>
            <TouchableOpacity style={styles.button} onPress={onClose}>
              <Text style={styles.buttonText}>
                {badge.unlocked ? 'Awesome!' : 'Got it'}
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    padding: spacing.xl,
    alignItems: 'center',
    width: '90%',
    maxWidth: 400,
    ...shadows.large,
  },
  confettiContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  confetti: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  badgeContainer: {
    marginBottom: spacing.xl,
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
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: typography.fontSize.title,
    fontWeight: 'bold',
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: spacing.sm,
    fontFamily: 'Inter-Bold',
  },
  description: {
    fontSize: typography.fontSize.body,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
    fontFamily: 'Inter-Regular',
  },
  progressSection: {
    width: '100%',
    marginTop: spacing.md,
    alignItems: 'center',
  },
  progressTitle: {
    fontSize: typography.fontSize.body,
    color: colors.text.primary,
    marginBottom: spacing.xs,
    fontFamily: 'Inter-Medium',
  },
  progressBar: {
    width: '100%',
    height: 8,
    backgroundColor: colors.secondary,
    borderRadius: radius.round,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.accent,
    borderRadius: radius.round,
  },
  progressText: {
    fontSize: typography.fontSize.caption,
    color: colors.text.muted,
    fontFamily: 'Inter-Regular',
  },
  button: {
    backgroundColor: colors.accent,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
    borderRadius: radius.lg,
    ...shadows.sm,
  },
  buttonText: {
    color: colors.text.primary,
    fontSize: typography.fontSize.body,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
});
