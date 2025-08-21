import React, { useEffect, useState } from 'react';
import {
  AppState,
  AppStateStatus,
  View,
  Image,
  Text,
  StyleSheet,
} from 'react-native';

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

  if (isBackground && isStealthMode) {
    return <PrivacyOverlay />;
  }

  return <>{children}</>;
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
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 20,
  },
  calculatorIcon: {
    width: 80,
    height: 100,
    backgroundColor: '#007bff',
    borderRadius: 8,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  calculatorScreen: {
    width: '100%',
    height: 20,
    backgroundColor: '#000',
    borderRadius: 2,
    marginBottom: 8,
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
    backgroundColor: '#ffffff',
    borderRadius: 2,
  },
  appName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
  },
});

export default PrivacyGuard;
