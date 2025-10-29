import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { GestureHandlerRootView, LongPressGestureHandler } from 'react-native-gesture-handler';
import { useStealthMode } from '@/components/StealthModeManager';
import { useStealthAutoTimeout } from '@/hooks/useStealthAutoTimeout';
import { colors, shadows, radius } from '@/constants/theme';
import { MaterialIcons } from '@expo/vector-icons';

type Operation = '+' | '-' | '×' | '÷' | '=' | null;

// Format number for display
const formatDisplay = (value: string | number): string => {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(num)) return '0';
  
  // Handle very large or very small numbers with scientific notation
  if (Math.abs(num) > 1e15 || (Math.abs(num) < 1e-6 && num !== 0)) {
    return num.toExponential(6);
  }
  
  // Check if it's a whole number or has decimals
  const str = num.toString();
  const hasDecimal = str.includes('.');
  
  if (hasDecimal) {
    // Limit decimal places and remove trailing zeros
    return parseFloat(num.toFixed(10)).toLocaleString('en-US', {
      maximumFractionDigits: 10,
      useGrouping: true
    });
  }
  
  // Format integers with thousand separators
  return num.toLocaleString('en-US', {
    maximumFractionDigits: 0,
    useGrouping: true
  });
};

export default function StealthCalculatorScreen() {
  const { deactivate } = useStealthMode();
  const [display, setDisplay] = useState('0');
  const [previousValue, setPreviousValue] = useState<number | null>(null);
  const [operation, setOperation] = useState<Operation>(null);
  const [clearNext, setClearNext] = useState(false);
  
  // Use the auto timeout hook - exit stealth mode after 10 minutes of inactivity
  const { resetTimeout } = useStealthAutoTimeout(10);

  // Check for secret sequence: exactly 5555
  const checkSecretSequence = (newDisplay: string) => {
    const currentNum = newDisplay.replace(/,/g, '').replace(/\./g, '');
    if (currentNum === '5555') {
      setTimeout(() => {
        deactivate('secret_sequence');
      }, 100);
      return true;
    }
    return false;
  };

  const handleLongPress = () => {
    deactivate('gesture');
  };

  const handleNumber = (num: string) => {
    resetTimeout(); // Reset timeout on user interaction
    let newDisplay: string;
    
    if (clearNext) {
      newDisplay = num;
      setClearNext(false);
    } else {
      // Remove formatting before adding new number
      const currentNum = display.replace(/,/g, '');
      newDisplay = currentNum === '0' ? num : currentNum + num;
    }
    
    setDisplay(newDisplay);
    
    // Check for secret sequence (exactly 5555)
    checkSecretSequence(newDisplay);
  };

  const handleOperation = (op: Operation) => {
    resetTimeout(); // Reset timeout on user interaction
    // Remove formatting before parsing
    const currentValue = parseFloat(display.replace(/,/g, ''));

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
        
        // Format result
        const formattedResult = formatDisplay(result);
        setDisplay(formattedResult);
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
    // Remove formatting before deleting
    const currentNum = display.replace(/,/g, '');
    if (currentNum.length > 1) {
      setDisplay(currentNum.slice(0, -1));
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
    style?: object | object[]
  ) => {
    const isOperationButton = Array.isArray(style) 
      ? style.includes(styles.operationButton)
      : style === styles.operationButton;
    
    return (
      <TouchableOpacity
        style={[styles.button, style]}
        onPress={onPress}
        activeOpacity={0.7}>
        {typeof content === 'string' ? (
          <Text style={[
            styles.buttonText,
            isOperationButton && styles.operationButtonText
          ]}>{content}</Text>
        ) : content}
      </TouchableOpacity>
    );
  };

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
            {previousValue !== null && (
              <View style={styles.historyContainer}>
                <Text style={styles.historyText}>
                  {formatDisplay(previousValue)} {operation}
                </Text>
              </View>
            )}
            <Text 
              style={[
                styles.displayText,
                display.replace(/,/g, '').length > 12 && styles.displayTextSmall
              ]} 
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              {formatDisplay(display.replace(/,/g, ''))}
            </Text>
          </View>

          <View style={styles.buttonGrid}>
            <View style={styles.row}>
              {renderButton('C', handleClear, styles.clearButton)}
              {renderButton(<MaterialIcons name="backspace" size={24} color={colors.text.primary} />, handleDelete, styles.deleteButton)}
              {renderButton('÷', () => handleOperation('÷'), styles.operationButton)}
            </View>

            <View style={styles.row}>
              {renderButton('7', () => handleNumber('7'), styles.numberButton)}
              {renderButton('8', () => handleNumber('8'), styles.numberButton)}
              {renderButton('9', () => handleNumber('9'), styles.numberButton)}
              {renderButton('×', () => handleOperation('×'), styles.operationButton)}
            </View>

            <View style={styles.row}>
              {renderButton('4', () => handleNumber('4'), styles.numberButton)}
              {renderButton('5', () => handleNumber('5'), styles.numberButton)}
              {renderButton('6', () => handleNumber('6'), styles.numberButton)}
              {renderButton('−', () => handleOperation('-'), styles.operationButton)}
            </View>

            <View style={styles.row}>
              {renderButton('1', () => handleNumber('1'), styles.numberButton)}
              {renderButton('2', () => handleNumber('2'), styles.numberButton)}
              {renderButton('3', () => handleNumber('3'), styles.numberButton)}
              {renderButton('+', () => handleOperation('+'), styles.operationButton)}
            </View>

            <View style={styles.row}>
              {renderButton('0', () => handleNumber('0'), [styles.zeroButton, styles.numberButton])}
              {renderButton('.', handleDecimal, styles.numberButton)}
              {renderButton('=', () => handleOperation('='), styles.equalsButton)}
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
    padding: 24,
    marginBottom: 24,
    minHeight: 120,
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
    ...shadows.sm,
  },
  historyContainer: {
    width: '100%',
    alignItems: 'flex-end',
    marginBottom: 8,
    opacity: 0.6,
  },
  historyText: {
    color: colors.text.muted,
    fontSize: 18,
    fontWeight: '400',
    fontFamily: 'Inter-Regular',
  },
  displayText: {
    color: colors.text.primary,
    fontSize: 56,
    fontWeight: '300',
    fontFamily: 'Inter-Light',
    textAlign: 'right',
  },
  displayTextSmall: {
    fontSize: 40,
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
    minHeight: 70,
    ...shadows.sm,
  },
  buttonText: {
    color: colors.text.primary,
    fontSize: 28,
    fontWeight: '500',
    fontFamily: 'Inter-Medium',
  },
  numberButton: {
    backgroundColor: colors.secondary,
  },
  operationButton: {
    backgroundColor: colors.accent,
  },
  operationButtonText: {
    color: colors.text.primary,
    fontWeight: '600',
    fontSize: 32,
    fontFamily: 'Inter-SemiBold',
  },
  deleteButton: {
    backgroundColor: `${colors.text.muted}30`,
  },
  clearButton: {
    backgroundColor: '#ff6b6b',
  },
  equalsButton: {
    backgroundColor: colors.accent,
  },
  zeroButton: {
    flex: 2,
  },
});