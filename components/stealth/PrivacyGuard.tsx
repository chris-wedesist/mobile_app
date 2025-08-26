import React, { useEffect, useState } from 'react';
import {
  AppState,
  AppStateStatus,
  Image,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  colors,
  radius,
  shadows,
  spacing,
  typography,
} from '../../constants/theme';
import { ScreenProtector } from '../security/ScreenProtector';

interface PrivacyGuardProps {
  children: React.ReactNode;
  isStealthMode?: boolean;
}

export function PrivacyGuard({
  children,
  isStealthMode = true,
}: PrivacyGuardProps) {
  const [isBackground, setIsBackground] = useState(false);

  useEffect(() => {
    const subscription = AppState.addEventListener(
      'change',
      (nextAppState: AppStateStatus) => {
        if (nextAppState === 'background' || nextAppState === 'inactive') {
          setIsBackground(true);
        } else if (nextAppState === 'active') {
          setIsBackground(false);
        }
      }
    );

    return () => subscription?.remove();
  }, []);

  // Wrap with ScreenProtector for enhanced security
  return (
    <ScreenProtector
      showPrivacyScreen={isStealthMode}
      privacyMessage="Calculator"
      privacyIcon="calculator"
    >
      {isBackground && isStealthMode ? <PrivacyOverlay /> : children}
    </ScreenProtector>
  );
}

function PrivacyOverlay() {
  return (
    <View style={styles.overlay}>
      <View style={styles.iconContainer}>
        {/* Calculator icon representation */}
        <View style={styles.calculatorIcon}>
          <View style={styles.calculatorScreen} />
          <View style={styles.calculatorButtons}>
            {Array.from({ length: 12 }, (_, i) => (
              <View key={i} style={styles.calculatorButton} />
            ))}
          </View>
        </View>
      </View>
      <Text style={styles.appName}>Calculator</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: spacing.md,
  },
  calculatorIcon: {
    width: 80,
    height: 100,
    backgroundColor: colors.primary,
    borderRadius: radius.medium,
    padding: spacing.xs,
    ...shadows.medium,
  },
  calculatorScreen: {
    width: '100%',
    height: 20,
    backgroundColor: colors.text.primary,
    borderRadius: radius.small,
    marginBottom: spacing.xs,
  },
  calculatorButtons: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignContent: 'space-between',
  },
  calculatorButton: {
    width: '22%',
    height: '22%',
    backgroundColor: colors.background,
    borderRadius: radius.small,
  },
  appName: {
    fontSize: typography.fontSize.body,
    fontWeight: '500',
    color: colors.text.primary,
  },
});

export default PrivacyGuard;
