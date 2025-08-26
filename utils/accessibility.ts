import { useEffect, useRef, useState } from 'react';
import { 
  AccessibilityInfo, 
  AccessibilityRole, 
  AccessibilityState,
  findNodeHandle,
  Platform
} from 'react-native';

// Accessibility configuration interface
interface AccessibilityConfig {
  screenReaderEnabled: boolean;
  reduceMotionEnabled: boolean;
  highContrastEnabled: boolean;
  largeTextEnabled: boolean;
}

// Accessibility hook for managing accessibility state
export const useAccessibility = () => {
  const [config, setConfig] = useState<AccessibilityConfig>({
    screenReaderEnabled: false,
    reduceMotionEnabled: false,
    highContrastEnabled: false,
    largeTextEnabled: false,
  });

  useEffect(() => {
    // Check initial accessibility settings
    const checkAccessibilitySettings = async () => {
      try {
        const screenReaderEnabled = await AccessibilityInfo.isScreenReaderEnabled();
        const reduceMotionEnabled = await AccessibilityInfo.isReduceMotionEnabled();
        
        setConfig({
          screenReaderEnabled,
          reduceMotionEnabled,
          highContrastEnabled: false, // Not available on all platforms
          largeTextEnabled: false, // Would need to check system font size
        });

        // Listen for accessibility changes
        const screenReaderSubscription = AccessibilityInfo.addEventListener(
          'screenReaderChanged',
          (enabled) => {
            setConfig(prev => ({ ...prev, screenReaderEnabled: enabled }));
          }
        );

        const reduceMotionSubscription = AccessibilityInfo.addEventListener(
          'reduceMotionChanged',
          (enabled) => {
            setConfig(prev => ({ ...prev, reduceMotionEnabled: enabled }));
          }
        );

        return () => {
          screenReaderSubscription?.remove();
          reduceMotionSubscription?.remove();
        };
      } catch (error) {
        console.error('Error checking accessibility settings:', error);
      }
    };

    checkAccessibilitySettings();
  }, []);

  return config;
};

// Hook for managing focus
export const useAccessibilityFocus = () => {
  const focusRef = useRef<any>(null);

  const focus = () => {
    if (focusRef.current) {
      const nodeHandle = findNodeHandle(focusRef.current);
      if (nodeHandle) {
        AccessibilityInfo.setAccessibilityFocus(nodeHandle);
      }
    }
  };

  const blur = () => {
    if (focusRef.current) {
      const nodeHandle = findNodeHandle(focusRef.current);
      if (nodeHandle) {
        // Note: React Native doesn't have a direct blur method
        // This would need to be handled at the component level
      }
    }
  };

  return { focusRef, focus, blur };
};

// Utility for announcing messages to screen readers
export const announceForAccessibility = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
  if (Platform.OS === 'ios') {
    AccessibilityInfo.announceForAccessibility(message);
  } else {
    // Android uses a different approach
    AccessibilityInfo.announceForAccessibility(message);
  }
};

// Utility for generating accessibility labels
export const generateAccessibilityLabel = (
  element: string,
  action?: string,
  context?: string
): string => {
  let label = element;
  
  if (action) {
    label = `${action} ${label}`;
  }
  
  if (context) {
    label = `${label} ${context}`;
  }
  
  return label;
};

// Utility for generating accessibility hints
export const generateAccessibilityHint = (
  action: string,
  result?: string
): string => {
  let hint = `Double tap to ${action}`;
  
  if (result) {
    hint += `. ${result}`;
  }
  
  return hint;
};

// Accessibility role constants
export const ACCESSIBILITY_ROLES = {
  BUTTON: 'button' as AccessibilityRole,
  LINK: 'link' as AccessibilityRole,
  TAB: 'tab' as AccessibilityRole,
  MENUITEM: 'menuitem' as AccessibilityRole,
  HEADER: 'header' as AccessibilityRole,
  IMAGE: 'image' as AccessibilityRole,
  TEXT: 'text' as AccessibilityRole,
  SEARCH: 'search' as AccessibilityRole,
  SWITCH: 'switch' as AccessibilityRole,
  SLIDER: 'slider' as AccessibilityRole,
  CHECKBOX: 'checkbox' as AccessibilityRole,
  RADIO: 'radio' as AccessibilityRole,
} as const;

// Accessibility state utilities
export const createAccessibilityState = (
  disabled?: boolean,
  selected?: boolean,
  busy?: boolean,
  expanded?: boolean,
  checked?: boolean
): AccessibilityState => ({
  disabled,
  selected,
  busy,
  expanded,
  checked,
});

// Hook for managing accessibility announcements
export const useAccessibilityAnnouncements = () => {
  const announce = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
    announceForAccessibility(message, priority);
  };

  const announceSuccess = (message: string) => {
    announce(`Success: ${message}`, 'polite');
  };

  const announceError = (message: string) => {
    announce(`Error: ${message}`, 'assertive');
  };

  const announceLoading = (message: string) => {
    announce(`Loading: ${message}`, 'polite');
  };

  const announceComplete = (message: string) => {
    announce(`Complete: ${message}`, 'polite');
  };

  return {
    announce,
    announceSuccess,
    announceError,
    announceLoading,
    announceComplete,
  };
};

// Utility for checking if accessibility features should be enabled
export const shouldEnableAccessibility = (feature: keyof AccessibilityConfig): boolean => {
  // This would typically check user preferences or system settings
  // For now, we'll return true to ensure accessibility is always available
  return true;
};

// Accessibility testing utilities
export const accessibilityTestUtils = {
  // Check if element has proper accessibility props
  hasAccessibilityProps: (props: any): boolean => {
    return !!(
      props.accessibilityLabel ||
      props.accessibilityHint ||
      props.accessibilityRole ||
      props.accessibilityState
    );
  },

  // Validate accessibility label
  isValidAccessibilityLabel: (label: string): boolean => {
    return typeof label === 'string' && label.length > 0 && label.length <= 255;
  },

  // Check minimum touch target size
  hasMinimumTouchTarget: (style: any): boolean => {
    const minSize = 44; // iOS/Android minimum touch target
    return (
      (style?.minHeight >= minSize || style?.height >= minSize) &&
      (style?.minWidth >= minSize || style?.width >= minSize)
    );
  },
};

// Export types
export type { AccessibilityConfig }; 