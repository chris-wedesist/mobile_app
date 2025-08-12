import * as React from 'react';
import { Text, StyleSheet, TextStyle, TextProps } from 'react-native';
import { colors } from '../constants/theme';

// Accessible text props interface
interface AccessibleTextProps extends TextProps {
  children: React.ReactNode;
  variant?: 'heading' | 'subheading' | 'body' | 'caption' | 'label';
  size?: 'small' | 'medium' | 'large' | 'xlarge';
  weight?: 'normal' | 'medium' | 'semibold' | 'bold';
  color?: string;
  align?: 'left' | 'center' | 'right' | 'justify';
  accessibilityRole?: 'header' | 'text' | 'link' | 'button';
  accessibilityLabel?: string;
  accessibilityHint?: string;
  allowFontScaling?: boolean;
  maxFontSizeMultiplier?: number;
  style?: TextStyle;
}

// Accessible text component with dynamic sizing support
export const AccessibleText: React.FC<AccessibleTextProps> = ({
  children,
  variant = 'body',
  size = 'medium',
  weight = 'normal',
  color,
  align = 'left',
  accessibilityRole = 'text',
  accessibilityLabel,
  accessibilityHint,
  allowFontScaling = true,
  maxFontSizeMultiplier = 2.0,
  style,
  ...props
}) => {
  
  // Generate accessibility label if not provided
  const getAccessibilityLabel = () => {
    if (accessibilityLabel) return accessibilityLabel;
    
    // Extract text from children for default accessibility label
    if (typeof children === 'string') {
      return children;
    }
    
    // For complex children, provide a default based on variant
    return `${variant} text`;
  };
  
  // Get text styles based on variant and size
  const getTextStyles = (): TextStyle => {
    const baseStyles: TextStyle = {
      color: color || colors.text.primary,
      textAlign: align,
    };
    
    // Variant-based styles
    const variantStyles: Record<string, TextStyle> = {
      heading: {
        fontSize: 24,
        fontWeight: 'bold',
        lineHeight: 32,
        marginBottom: 8,
      },
      subheading: {
        fontSize: 20,
        fontWeight: 'semibold',
        lineHeight: 28,
        marginBottom: 6,
      },
      body: {
        fontSize: 16,
        fontWeight: 'normal',
        lineHeight: 24,
        marginBottom: 4,
      },
      caption: {
        fontSize: 14,
        fontWeight: 'normal',
        lineHeight: 20,
        marginBottom: 2,
      },
      label: {
        fontSize: 14,
        fontWeight: 'medium',
        lineHeight: 20,
        marginBottom: 4,
      },
    };
    
    // Size-based adjustments
    const sizeStyles: Record<string, TextStyle> = {
      small: {
        fontSize: 12,
        lineHeight: 16,
      },
      medium: {
        fontSize: 16,
        lineHeight: 24,
      },
      large: {
        fontSize: 18,
        lineHeight: 26,
      },
      xlarge: {
        fontSize: 20,
        lineHeight: 28,
      },
    };
    
    // Weight-based adjustments
    const weightStyles: Record<string, TextStyle> = {
      normal: {
        fontWeight: 'normal',
      },
      medium: {
        fontWeight: '500',
      },
      semibold: {
        fontWeight: '600',
      },
      bold: {
        fontWeight: 'bold',
      },
    };
    
    return {
      ...baseStyles,
      ...variantStyles[variant],
      ...sizeStyles[size],
      ...weightStyles[weight],
    };
  };
  
  return (
    <Text
      style={[getTextStyles(), style]}
      accessibilityRole={accessibilityRole}
      accessibilityLabel={getAccessibilityLabel()}
      accessibilityHint={accessibilityHint}
      accessible={true}
      importantForAccessibility="yes"
      allowFontScaling={allowFontScaling}
      maxFontSizeMultiplier={maxFontSizeMultiplier}
      {...props}
    >
      {children}
    </Text>
  );
};

// Predefined accessible text components for common use cases
export const AccessibleHeading: React.FC<Omit<AccessibleTextProps, 'variant'>> = (props) => (
  <AccessibleText variant="heading" accessibilityRole="header" {...props} />
);

export const AccessibleSubheading: React.FC<Omit<AccessibleTextProps, 'variant'>> = (props) => (
  <AccessibleText variant="subheading" accessibilityRole="header" {...props} />
);

export const AccessibleBody: React.FC<Omit<AccessibleTextProps, 'variant'>> = (props) => (
  <AccessibleText variant="body" {...props} />
);

export const AccessibleCaption: React.FC<Omit<AccessibleTextProps, 'variant'>> = (props) => (
  <AccessibleText variant="caption" {...props} />
);

export const AccessibleLabel: React.FC<Omit<AccessibleTextProps, 'variant'>> = (props) => (
  <AccessibleText variant="label" {...props} />
);

// Export the main component as default
export default AccessibleText; 