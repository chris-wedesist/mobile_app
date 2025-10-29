import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { GestureHandlerRootView, LongPressGestureHandler } from 'react-native-gesture-handler';
import { useStealthMode } from '@/components/StealthModeManager';
import { useStealthAutoTimeout } from '@/hooks/useStealthAutoTimeout';
import { colors, shadows, radius } from '@/constants/theme';
import { MaterialIcons } from '@expo/vector-icons';

type Operation = '+' | '-' | '×' | '÷' | '=' | null;

export default function StealthCalculatorScreen() {
  const { deactivate } = useStealthMode();
  const [display, setDisplay] = useState('0');
  const [previousValue, setPreviousValue] = useState<number | null>(null);
  const [operation, setOperation] = useState<Operation>(null);
  const [clearNext, setClearNext] = useState(false);
  
  // Use the auto timeout hook - exit stealth mode after 10 minutes of inactivity
  const { resetTimeout } = useStealthAutoTimeout(10);

  const handleLongPress = () => {
    deactivate('gesture');
  };

  const handleNumber = (num: string) => {
    resetTimeout(); // Reset timeout on user interaction
    if (clearNext) {
      setDisplay(num);
      setClearNext(false);
    } else {
      setDisplay(display === '0' ? num : display + num);
    }
  };

  const handleOperation = (op: Operation) => {
    resetTimeout(); // Reset timeout on user interaction
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
      }
    } else {
      setPreviousValue(currentValue);
      setOperation(op);
      setClearNext(true);
    }
  };

  const handleClear = () => {
    resetTimeout(); // Reset timeout on user interaction
    setDisplay('0');
    setPreviousValue(null);
    setOperation(null);
    setClearNext(false);
  };

  const handleDelete = () => {
    resetTimeout(); // Reset timeout on user interaction
    if (display.length > 1) {
      setDisplay(display.slice(0, -1));
    } else {
      setDisplay('0');
    }
  };

  const handleDecimal = () => {
    resetTimeout(); // Reset timeout on user interaction
    if (!display.includes('.')) {
      setDisplay(display + '.');
    }
  };

  const renderButton = (
    content: string | JSX.Element,
    onPress: () => void,
    style?: object
  ) => (
    <TouchableOpacity
      style={[styles.button, style]}
      onPress={onPress}>
      {typeof content === 'string' ? (
        <Text style={[
          styles.buttonText,
          style === styles.operationButton && styles.operationButtonText
        ]}>{content}</Text>
      ) : content}
    </TouchableOpacity>
  );

  return (
    <GestureHandlerRootView style={styles.container}>
      <LongPressGestureHandler
        minDurationMs={3000}
        onHandlerStateChange={({ nativeEvent }) => {
          if (nativeEvent.state === 4) { // 4 = ACTIVE (long press triggered)
            handleLongPress();
          }
        }}
      >
        <View style={styles.innerContainer}>
          <View style={styles.display}>
            <Text style={styles.displayText}>{display}</Text>
            {operation && (
              <View style={styles.operationIndicator}>
                <Text style={styles.operationText}>{operation}</Text>
              </View>
            )}
          </View>

          <View style={styles.buttonGrid}>
            <View style={styles.row}>
              {renderButton('C', handleClear, styles.clearButton)}
              {renderButton(<MaterialIcons name="backspace" size={24} color={colors.text.primary} />, handleDelete)}
              {renderButton(<MaterialIcons name="close" size={24} color={colors.accent} />, () => handleOperation('÷'), styles.operationButton)}
            </View>

            <View style={styles.row}>
              {renderButton('7', () => handleNumber('7'))}
              {renderButton('8', () => handleNumber('8'))}
              {renderButton('9', () => handleNumber('9'))}
              {renderButton(<MaterialIcons name="close" size={24} color={colors.accent} />, () => handleOperation('×'), styles.operationButton)}
            </View>

            <View style={styles.row}>
              {renderButton('4', () => handleNumber('4'))}
              {renderButton('5', () => handleNumber('5'))}
              {renderButton('6', () => handleNumber('6'))}
              {renderButton(<MaterialIcons name="remove" size={24} color={colors.accent} />, () => handleOperation('-'), styles.operationButton)}
            </View>

            <View style={styles.row}>
              {renderButton('1', () => handleNumber('1'))}
              {renderButton('2', () => handleNumber('2'))}
              {renderButton('3', () => handleNumber('3'))}
              {renderButton(<MaterialIcons name="add" size={24} color={colors.accent} />, () => handleOperation('+'), styles.operationButton)}
            </View>

            <View style={styles.row}>
              {renderButton('0', () => handleNumber('0'), styles.zeroButton)}
              {renderButton('.', handleDecimal)}
              {renderButton(<MaterialIcons name="equalizer" size={24} color={colors.text.primary} />, () => handleOperation('='), styles.equalsButton)}
            </View>
          </View>
        </View>
      </LongPressGestureHandler>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primary,
  },
  innerContainer: {
    flex: 1,
    padding: Platform.OS === 'web' ? 40 : 20,
  },
  display: {
    backgroundColor: colors.secondary,
    borderRadius: radius.lg,
    padding: 20,
    marginBottom: 20,
    minHeight: 100,
    justifyContent: 'center',
    alignItems: 'flex-end',
    ...shadows.sm,
  },
  displayText: {
    color: colors.text.primary,
    fontSize: 48,
    fontWeight: '300',
  },
  operationIndicator: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: `${colors.accent}20`,
    borderRadius: radius.round,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  operationText: {
    color: colors.accent,
    fontSize: 16,
    fontWeight: '600',
  },
  buttonGrid: {
    flex: 1,
    gap: 10,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
    flex: 1,
  },
  button: {
    flex: 1,
    backgroundColor: colors.secondary,
    borderRadius: radius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.sm,
  },
  buttonText: {
    color: colors.text.primary,
    fontSize: 24,
    fontWeight: '500',
  },
  operationButton: {
    backgroundColor: `${colors.accent}20`,
  },
  operationButtonText: {
    color: colors.accent,
    fontWeight: '600',
  },
  clearButton: {
    backgroundColor: colors.status.error,
  },
  equalsButton: {
    backgroundColor: colors.accent,
  },
  zeroButton: {
    flex: 2,
  },
});