import { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, Alert } from 'react-native';
import { GestureHandlerRootView, LongPressGestureHandler } from 'react-native-gesture-handler';
import { useStealthMode } from '@/components/StealthModeManager';
import { useStealthAutoTimeout } from '@/hooks/useStealthAutoTimeout';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { colors, shadows, radius } from '@/constants/theme';
import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as SMS from 'expo-sms';
import { useLanguage } from '@/contexts/LanguageContext';

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
  const { user } = useAuth();
  const { t } = useLanguage();
  const [display, setDisplay] = useState('0');
  const [previousValue, setPreviousValue] = useState<number | null>(null);
  const [operation, setOperation] = useState<Operation>(null);
  const [clearNext, setClearNext] = useState(false);
  const [smsCode, setSmsCode] = useState<string>('');
  const [smsPhone, setSmsPhone] = useState<string>('');
  const [emergencyMessage, setEmergencyMessage] = useState<string>('');
  const [incidentReportCode, setIncidentReportCode] = useState<string>('999');
  const [lastPowerPress, setLastPowerPress] = useState<number>(0);
  const powerPressTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Use the auto timeout hook - exit stealth mode after 10 minutes of inactivity
  const { resetTimeout } = useStealthAutoTimeout(10);

  useEffect(() => {
    if (user?.id) {
      loadEmergencySettings();
    }
  }, [user?.id]);

  const loadEmergencySettings = async () => {
    try {
      if (!user?.id) {
        console.log('No user ID available for loading emergency settings');
        return;
      }

      const { data, error } = await supabase
        .from('users')
        .select('emergency_call_code, emergency_contact_phone, emergency_message, incident_report_code')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error loading emergency settings:', error);
        return;
      }

      if (data) {
        if (data.emergency_call_code) setSmsCode(data.emergency_call_code);
        if (data.emergency_contact_phone) setSmsPhone(data.emergency_contact_phone);
        if (data.emergency_message) setEmergencyMessage(data.emergency_message);
        if (data.incident_report_code) setIncidentReportCode(data.incident_report_code);
      }
    } catch (error) {
      console.error('Error loading emergency settings:', error);
    }
  };

  // Check for secret sequence: exactly 5555 to exit stealth mode
  const checkSecretSequence = async (newDisplay: string) => {
    const currentNum = newDisplay.replace(/,/g, '').replace(/\./g, '');
    if (currentNum === '5555') {
      setTimeout(() => {
        deactivate('secret_sequence');
      }, 100);
      return true;
    }
    return false;
  };

  // Check for incident report code: uses custom code from settings (default: 999)
  const checkIncidentReportCode = async (newDisplay: string) => {
    const currentNum = newDisplay.replace(/,/g, '').replace(/\./g, '');
    const code = incidentReportCode || '999';
    if (currentNum === code) {
      setTimeout(() => {
        router.push('/report-incident' as any);
        // Clear the display after navigating
        setDisplay('0');
      }, 100);
      return true;
    }
    return false;
  };

  // Check for emergency SMS code and send SMS
  const checkSmsCode = async (newDisplay: string) => {
    if (!smsCode || !smsPhone || Platform.OS === 'web') return false;
    
    const currentNum = newDisplay.replace(/,/g, '').replace(/\./g, '');
    
    // Check if the entered number matches the SMS code
    if (currentNum === smsCode) {
      try {
        const isAvailable = await SMS.isAvailableAsync();
        if (!isAvailable) {
          console.error(t.calculator.smsNotAvailable);
          return false;
        }

        const message = emergencyMessage || t.calculator.emergencyMessage;
        await SMS.sendSMSAsync([smsPhone], message);
        
        // Clear the display after sending SMS
        setTimeout(() => {
          setDisplay('0');
        }, 500);
        return true;
      } catch (error) {
        console.error(t.calculator.errorSendingSMS, error);
        return false;
      }
    }
    return false;
  };

  const handleLongPress = async () => {
    deactivate('gesture');
  };

  const handlePowerOff = async () => {
    const now = Date.now();
    const DOUBLE_PRESS_DELAY = 500; // 500ms window for double press

    // Clear any existing timeout
    if (powerPressTimeoutRef.current) {
      clearTimeout(powerPressTimeoutRef.current);
      powerPressTimeoutRef.current = null;
    }

    if (lastPowerPress > 0 && now - lastPowerPress < DOUBLE_PRESS_DELAY) {
      // Double press detected
      deactivate('power_button');
      setLastPowerPress(0); // Reset
    } else {
      // First press - record the time
      setLastPowerPress(now);
      
      // Reset after delay if no second press
      powerPressTimeoutRef.current = setTimeout(() => {
        setLastPowerPress(0);
        powerPressTimeoutRef.current = null;
      }, DOUBLE_PRESS_DELAY);
    }
  };

  const handleNumber = async (num: string) => {
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
    
    // Check for secret sequence (exactly 5555 to exit stealth mode)
    const isExitSequence = await checkSecretSequence(newDisplay);
    // If not exit code, check for incident report code (999)
    if (!isExitSequence) {
      const isIncidentReport = await checkIncidentReportCode(newDisplay);
      // If not incident report code, check for emergency SMS code
      if (!isIncidentReport) {
        checkSmsCode(newDisplay);
      }
    }
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
    content: string | React.ReactNode,
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
          <View style={styles.header}>
            <View style={styles.headerSpacer} />
            <View style={styles.headerButtons}>
              <TouchableOpacity 
                style={styles.headerIconButton}
                onPress={() => {
                  router.push('/stealth-settings' as any);
                }}
                activeOpacity={0.7}>
                <MaterialIcons name="settings" size={24} color={colors.text.muted} />
              </TouchableOpacity>
              {/* <TouchableOpacity 
                style={styles.headerIconButton}
                onPress={handlePowerOff}
                activeOpacity={0.7}>
                <MaterialIcons name="power-settings-new" size={24} color={colors.text.muted} />
              </TouchableOpacity> */}
            </View>
          </View>

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
              {renderButton('÷', () => handleOperation('÷'), styles.operationButton)}
              {renderButton(<MaterialIcons name="backspace" size={24} color={colors.text.primary} />, handleDelete, styles.deleteButton)}
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
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-end',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    marginBottom: 16,
    position: 'absolute',
    right: 15,
    top: 50,
  },
  headerSpacer: {
    flex: 1,
  },
  headerButtons: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  headerIconButton: {
    padding: 8,
    borderRadius: radius.md,
    backgroundColor: `${colors.text.muted}15`,
  },
  display: {
    backgroundColor: colors.secondary,
    borderRadius: radius.lg,
    padding: 24,
    borderWidth: 1,
    borderColor: `${colors.text.muted}20`,
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
    gap: 12,
    paddingBottom: Platform.OS === 'ios' ? 20 : 10,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  button: {
    flex: 1,
    backgroundColor: colors.secondary,
    borderRadius: radius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    height: 65,
    ...shadows.sm,
  },
  buttonText: {
    color: colors.text.primary,
    fontSize: 28,
    fontWeight: '500',
    fontFamily: 'Inter-Medium',
  },
  numberButton: {
    backgroundColor: `${colors.text.muted}`,
    ...shadows.sm,
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
    backgroundColor: colors.accent,
  },
  clearButton: {
    backgroundColor: colors.accent,
  },
  equalsButton: {
    backgroundColor: colors.accent,
  },
  zeroButton: {
    flex: 2,
  },
});