import { useState, useRef } from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Vibration,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  colors,
  typography,
  spacing,
  radius,
  shadows,
} from '../../constants/theme';
import { stealthManager } from '../../lib/stealth';
import { router } from 'expo-router';

type Operation = '+' | '-' | '×' | '÷' | '=' | null;

export default function CalculatorScreen() {
  const [display, setDisplay] = useState('0');
  const [previousValue, setPreviousValue] = useState<number | null>(null);
  const [operation, setOperation] = useState<Operation>(null);
  const [clearNext, setClearNext] = useState(false);

  // Hidden toggle mechanism
  const [tapSequence, setTapSequence] = useState<number[]>([]);
  const [holdStartTime, setHoldStartTime] = useState<number | null>(null);
  const holdTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleNumber = (num: string) => {
    if (clearNext) {
      setDisplay(num);
      setClearNext(false);
    } else {
      setDisplay(display === '0' ? num : display + num);
    }
  };

  const handleOperation = (op: Operation) => {
    const currentValue = parseFloat(display);

    if (op === '=') {
      if (previousValue !== null && operation) {
        let result: number;
        switch (operation) {
          case '+':
            result = previousValue + currentValue;
            break;
          case '-':
            result = previousValue - currentValue;
            break;
          case '×':
            result = previousValue * currentValue;
            break;
          case '÷':
            result = previousValue / currentValue;
            break;
          default:
            return;
        }
        setDisplay(result.toString());
        setPreviousValue(null);
        setOperation(null);
        setClearNext(true);
      }
    } else {
      setPreviousValue(currentValue);
      setOperation(op);
      setClearNext(true);
    }
  };

  const handleClear = () => {
    setDisplay('0');
    setPreviousValue(null);
    setOperation(null);
    setClearNext(false);

    // Reset tap sequence when clearing
    setTapSequence([]);
  };

  const handleDelete = () => {
    if (display.length > 1) {
      setDisplay(display.slice(0, -1));
    } else {
      setDisplay('0');
    }
  };

  const handleDecimal = () => {
    if (!display.includes('.')) {
      setDisplay(display + '.');
    }
  };

  // Hidden toggle mechanism - 7 taps + hold on display
  const handleDisplayPress = () => {
    const now = Date.now();

    // Reset sequence if too much time has passed (5 seconds)
    const newSequence = tapSequence.filter((time) => now - time < 5000);
    newSequence.push(now);

    setTapSequence(newSequence);

    // Check if we have 7 taps
    if (newSequence.length >= 7) {
      // Verify the sequence timing
      if (stealthManager.validateToggleSequence(newSequence)) {
        // Provide subtle feedback
        Vibration.vibrate(100);
        showHiddenToggle();
      }
      // Reset sequence after check
      setTapSequence([]);
    }
  };

  const handleDisplayLongPress = () => {
    setHoldStartTime(Date.now());

    // Start hold timer
    holdTimeoutRef.current = setTimeout(() => {
      // If we have recent taps and a long press, show toggle
      if (tapSequence.length >= 6) {
        Vibration.vibrate([100, 50, 100]);
        showHiddenToggle();
      }
    }, 1000); // 1 second hold
  };

  const handleDisplayPressOut = () => {
    if (holdTimeoutRef.current) {
      clearTimeout(holdTimeoutRef.current);
      holdTimeoutRef.current = null;
    }
    setHoldStartTime(null);
  };

  const showHiddenToggle = () => {
    Alert.alert(
      'Calculator Settings',
      'Access advanced features?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Continue',
          onPress: () => handleModeToggle(),
        },
      ],
      { cancelable: true }
    );
  };

  const handleModeToggle = async () => {
    try {
      const success = await stealthManager.toggleMode();
      if (success) {
        // Navigate to normal mode
        router.replace('/(tabs)');
      } else {
        Alert.alert('Error', 'Unable to switch modes at this time.');
      }
    } catch (error) {
      console.error('Failed to toggle mode:', error);
      Alert.alert('Error', 'An error occurred while switching modes.');
    }
  };

  const renderButton = (
    content: string,
    onPress: () => void,
    style?: object,
    textStyle?: object
  ) => (
    <TouchableOpacity
      style={[styles.button, style]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={[styles.buttonText, textStyle]}>{content}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.displayContainer}>
        <TouchableOpacity
          style={styles.displayTouchable}
          onPress={handleDisplayPress}
          onLongPress={handleDisplayLongPress}
          onPressOut={handleDisplayPressOut}
          delayLongPress={1000}
          activeOpacity={1}
        >
          <Text style={styles.display} numberOfLines={1} adjustsFontSizeToFit>
            {display}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.buttonContainer}>
        {/* Row 1 */}
        <View style={styles.row}>
          {renderButton(
            'C',
            handleClear,
            styles.operatorButton,
            styles.operatorText
          )}
          {renderButton(
            '⌫',
            handleDelete,
            styles.operatorButton,
            styles.operatorText
          )}
          {renderButton(
            '%',
            () => {},
            styles.operatorButton,
            styles.operatorText
          )}
          {renderButton(
            '÷',
            () => handleOperation('÷'),
            styles.operatorButton,
            styles.operatorText
          )}
        </View>

        {/* Row 2 */}
        <View style={styles.row}>
          {renderButton('7', () => handleNumber('7'))}
          {renderButton('8', () => handleNumber('8'))}
          {renderButton('9', () => handleNumber('9'))}
          {renderButton(
            '×',
            () => handleOperation('×'),
            styles.operatorButton,
            styles.operatorText
          )}
        </View>

        {/* Row 3 */}
        <View style={styles.row}>
          {renderButton('4', () => handleNumber('4'))}
          {renderButton('5', () => handleNumber('5'))}
          {renderButton('6', () => handleNumber('6'))}
          {renderButton(
            '-',
            () => handleOperation('-'),
            styles.operatorButton,
            styles.operatorText
          )}
        </View>

        {/* Row 4 */}
        <View style={styles.row}>
          {renderButton('1', () => handleNumber('1'))}
          {renderButton('2', () => handleNumber('2'))}
          {renderButton('3', () => handleNumber('3'))}
          {renderButton(
            '+',
            () => handleOperation('+'),
            styles.operatorButton,
            styles.operatorText
          )}
        </View>

        {/* Row 5 */}
        <View style={styles.row}>
          {renderButton('0', () => handleNumber('0'), styles.zeroButton)}
          {renderButton('.', handleDecimal)}
          {renderButton(
            '=',
            () => handleOperation('='),
            styles.equalsButton,
            styles.equalsText
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  displayContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: spacing.lg,
    backgroundColor: colors.surface,
    marginHorizontal: spacing.sm,
    marginTop: spacing.sm,
    borderRadius: radius.medium,
    shadowColor: shadows.medium.shadowColor,
    shadowOffset: shadows.medium.shadowOffset,
    shadowOpacity: shadows.medium.shadowOpacity,
    shadowRadius: shadows.medium.shadowRadius,
    elevation: shadows.medium.elevation,
  },
  displayTouchable: {
    padding: spacing.sm,
  },
  display: {
    fontSize: 48,
    fontWeight: '300',
    textAlign: 'right',
    color: colors.text.primary,
    minHeight: 60,
  },
  buttonContainer: {
    paddingHorizontal: spacing.sm,
    paddingBottom: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    marginVertical: spacing.xs,
  },
  button: {
    flex: 1,
    height: 70,
    marginHorizontal: spacing.xs,
    backgroundColor: colors.surface,
    borderRadius: radius.medium,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: shadows.medium.shadowColor,
    shadowOffset: shadows.medium.shadowOffset,
    shadowOpacity: shadows.medium.shadowOpacity,
    shadowRadius: shadows.medium.shadowRadius,
    elevation: shadows.medium.elevation,
  },
  buttonText: {
    fontSize: 24,
    fontWeight: '400',
    color: colors.text.primary,
  },
  operatorButton: {
    backgroundColor: colors.primary,
  },
  operatorText: {
    color: colors.surface,
    fontWeight: '500',
  },
  equalsButton: {
    backgroundColor: colors.success,
  },
  equalsText: {
    color: colors.surface,
    fontWeight: '500',
  },
  zeroButton: {
    flex: 2,
  },
});
