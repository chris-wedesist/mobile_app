import * as React from 'react';
import { forwardRef } from 'react';
import { 
  TouchableOpacity, 
  Text, 
  ActivityIndicator, 
  StyleSheet, 
  ViewStyle, 
  TextStyle,
  AccessibilityInfo,
  Platform
} from 'react-native';
import { colors } from '../constants/theme';

// Button props interface with accessibility support
interface AccessibleButtonProps {
  children: React.ReactNode;
  isLoading?: boolean;
  disabled?: boolean;
  onPress?: () => void;
  style?: ViewStyle;
  textStyle?: TextStyle;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  accessibilityRole?: 'button' | 'link' | 'tab' | 'menuitem';
  accessibilityState?: {
    disabled?: boolean;
    busy?: boolean;
    selected?: boolean;
  };
  // Additional accessibility props
  accessible?: boolean;
  accessibilityLiveRegion?: 'none' | 'polite' | 'assertive';
  accessibilityViewIsModal?: boolean;
  importantForAccessibility?: 'auto' | 'yes' | 'no' | 'no-hide-descendants';
}

// Forward ref for proper accessibility focus management
export const AccessibleButton = forwardRef<React.ElementRef<typeof TouchableOpacity>, AccessibleButtonProps>(
  ({ 
    children, 
    isLoading = false, 
    disabled = false,
    onPress,
    style,
    textStyle,
    accessibilityLabel,
    accessibilityHint,
    accessibilityRole = 'button',
    accessibilityState,
    accessible = true,
    accessibilityLiveRegion = 'polite',
    importantForAccessibility = 'yes',
    ...props 
  }, ref) => {
    
    // Determine if button should be disabled
    const isDisabled = isLoading || disabled;
    
    // Generate accessibility label if not provided
    const getAccessibilityLabel = () => {
      if (accessibilityLabel) return accessibilityLabel;
      
      // Extract text from children for default accessibility label
      if (typeof children === 'string') {
        return children;
      }
      
      // For complex children, provide a default
      return 'Button';
    };
    
    // Generate accessibility hint for loading state
    const getAccessibilityHint = () => {
      if (isLoading) {
        return 'Button is currently loading. Please wait.';
      }
      return accessibilityHint;
    };
    
    // Handle press with accessibility feedback
    const handlePress = () => {
      if (isDisabled) return;
      
      // Provide haptic feedback on iOS
      if (Platform.OS === 'ios') {
        // Note: Would need react-native-haptic-feedback for full implementation
        console.log('Haptic feedback would trigger here');
      }
      
      // Announce button press to screen readers
      if (accessible) {
        AccessibilityInfo.announceForAccessibility('Button pressed');
      }
      
      onPress?.();
    };
    
    return (
      <TouchableOpacity
        ref={ref}
        onPress={handlePress}
        disabled={isDisabled}
        style={[
          styles.button,
          isDisabled && styles.disabled,
          style
        ]}
        accessible={accessible}
        accessibilityLabel={getAccessibilityLabel()}
        accessibilityHint={getAccessibilityHint()}
        accessibilityRole={accessibilityRole}
        accessibilityState={{
          disabled: isDisabled,
          busy: isLoading,
          ...accessibilityState
        }}
        accessibilityLiveRegion={accessibilityLiveRegion}
        importantForAccessibility={importantForAccessibility}
        {...props}
      >
        {isLoading ? (
          <>
            <ActivityIndicator 
              size="small" 
              color="#ffffff" 
              style={styles.loader}
            />
            <Text style={[styles.loadingText, textStyle]}>
              Loading...
            </Text>
          </>
        ) : (
          <Text style={[styles.text, textStyle]}>
            {children}
          </Text>
        )}
      </TouchableOpacity>
    );
  }
);

// Styles with accessibility considerations
const styles = StyleSheet.create({
  button: {
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44, // Minimum touch target size for accessibility
    minWidth: 44,
  },
  disabled: {
    backgroundColor: colors.text.muted,
    opacity: 0.6,
  },
  text: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  loadingText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginLeft: 8,
  },
  loader: {
    marginRight: 8,
  }
});

// Set display name for debugging
AccessibleButton.displayName = 'AccessibleButton';

export default AccessibleButton; 