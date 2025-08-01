import * as React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { AccessibleButton } from './AccessibleButton';
import { 
  AccessibleText, 
  AccessibleHeading, 
  AccessibleBody, 
  AccessibleCaption 
} from './AccessibleText';
import { useAccessibility } from '@/utils/accessibility';
import { 
  generateAccessibilityLabel, 
  generateAccessibilityHint,
  createAccessibilityState,
  useAccessibilityAnnouncements 
} from '@/utils/accessibility';
import { colors } from '@/constants/theme';

/**
 * Example component demonstrating accessibility features
 * This component shows how to use all accessibility components and utilities
 */
export default function AccessibilityExample() {
  const accessibilityConfig = useAccessibility();
  const { announce, announceSuccess, announceError } = useAccessibilityAnnouncements();
  
  const [isLoading, setIsLoading] = React.useState(false);
  const [buttonState, setButtonState] = React.useState('idle');

  const handleAccessibleButtonPress = () => {
    setIsLoading(true);
    announce('Processing button press', 'polite');
    
    // Simulate async operation
    setTimeout(() => {
      setIsLoading(false);
      setButtonState('pressed');
      announceSuccess('Button pressed successfully');
    }, 2000);
  };

  const handleTestAnnouncement = () => {
    announce('This is a test announcement for screen readers');
  };

  const handleErrorAnnouncement = () => {
    announceError('This is an error announcement');
  };

  return (
    <ScrollView style={styles.container}>
      <AccessibleHeading style={styles.title}>
        Accessibility Features Demo
      </AccessibleHeading>

      <AccessibleBody style={styles.description}>
        This screen demonstrates various accessibility features including screen reader support, 
        dynamic text sizing, and proper accessibility labels.
      </AccessibleBody>

      {/* Accessibility Status */}
      <View style={styles.section}>
        <AccessibleText variant="subheading" style={styles.sectionTitle}>
          Accessibility Status
        </AccessibleText>
        
        <AccessibleBody>
          Screen Reader: {accessibilityConfig.screenReaderEnabled ? 'Enabled' : 'Disabled'}
        </AccessibleBody>
        
        <AccessibleBody>
          Reduce Motion: {accessibilityConfig.reduceMotionEnabled ? 'Enabled' : 'Disabled'}
        </AccessibleBody>
      </View>

      {/* Accessible Button Examples */}
      <View style={styles.section}>
        <AccessibleText variant="subheading" style={styles.sectionTitle}>
          Accessible Buttons
        </AccessibleText>

        <AccessibleButton
          onPress={handleAccessibleButtonPress}
          isLoading={isLoading}
          accessibilityLabel={generateAccessibilityLabel('Demo Button', 'Press')}
          accessibilityHint={generateAccessibilityHint('test accessibility features')}
          style={styles.button}
        >
          Test Accessible Button
        </AccessibleButton>

        <AccessibleButton
          onPress={handleTestAnnouncement}
          accessibilityLabel="Test announcement button"
          accessibilityHint="Double tap to test screen reader announcement"
          style={[styles.button, styles.secondaryButton] as any}
        >
          Test Announcement
        </AccessibleButton>

        <AccessibleButton
          onPress={handleErrorAnnouncement}
          accessibilityLabel="Test error announcement"
          accessibilityHint="Double tap to test error announcement"
          style={[styles.button, styles.errorButton] as any}
        >
          Test Error Announcement
        </AccessibleButton>

        <AccessibleButton
          onPress={() => {}}
          disabled={true}
          accessibilityLabel="Disabled button example"
          accessibilityHint="This button is disabled"
          style={[styles.button, styles.disabledButton] as any}
        >
          Disabled Button
        </AccessibleButton>
      </View>

      {/* Text Examples */}
      <View style={styles.section}>
        <AccessibleText variant="subheading" style={styles.sectionTitle}>
          Accessible Text Components
        </AccessibleText>

        <AccessibleHeading style={styles.textExample}>
          This is a heading with proper accessibility role
        </AccessibleHeading>

        <AccessibleBody style={styles.textExample}>
          This is body text that supports dynamic text sizing and screen reader navigation.
        </AccessibleBody>

        <AccessibleCaption style={styles.textExample}>
          This is caption text for additional context and information.
        </AccessibleCaption>

        <AccessibleText
          variant="label"
          size="large"
          weight="bold"
          color={colors.accent}
          style={styles.textExample}
        >
          Custom styled text with accent color
        </AccessibleText>
      </View>

      {/* Accessibility State Examples */}
      <View style={styles.section}>
        <AccessibleText variant="subheading" style={styles.sectionTitle}>
          Accessibility States
        </AccessibleText>

        <AccessibleBody>
          Button State: {buttonState}
        </AccessibleBody>

        <AccessibleBody>
          Loading State: {isLoading ? 'Loading...' : 'Idle'}
        </AccessibleBody>
      </View>

      {/* Generated Accessibility Labels */}
      <View style={styles.section}>
        <AccessibleText variant="subheading" style={styles.sectionTitle}>
          Generated Accessibility Labels
        </AccessibleText>

        <AccessibleBody>
          Basic: {generateAccessibilityLabel('Submit Button')}
        </AccessibleBody>

        <AccessibleBody>
          With Action: {generateAccessibilityLabel('Submit Button', 'Press')}
        </AccessibleBody>

        <AccessibleBody>
          With Context: {generateAccessibilityLabel('Submit Button', 'Press', 'to save form')}
        </AccessibleBody>

        <AccessibleBody>
          Hint: {generateAccessibilityHint('save form', 'Form will be submitted')}
        </AccessibleBody>
      </View>

      {/* Accessibility State Object */}
      <View style={styles.section}>
        <AccessibleText variant="subheading" style={styles.sectionTitle}>
          Accessibility State Object
        </AccessibleText>

        <AccessibleBody>
          Disabled State: {JSON.stringify(createAccessibilityState(true))}
        </AccessibleBody>

        <AccessibleBody>
          Busy State: {JSON.stringify(createAccessibilityState(false, false, true))}
        </AccessibleBody>

        <AccessibleBody>
          Selected State: {JSON.stringify(createAccessibilityState(false, true))}
        </AccessibleBody>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    textAlign: 'center',
    marginBottom: 20,
    color: colors.text.primary,
  },
  description: {
    textAlign: 'center',
    marginBottom: 30,
    color: colors.text.secondary,
  },
  section: {
    marginBottom: 30,
    padding: 20,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    marginBottom: 15,
    color: colors.text.primary,
  },
  button: {
    marginBottom: 10,
  },
  secondaryButton: {
    backgroundColor: colors.secondary,
  },
  errorButton: {
    backgroundColor: colors.status.error,
  },
  disabledButton: {
    backgroundColor: colors.text.muted,
  },
  textExample: {
    marginBottom: 10,
  },
}); 