/**
 * Theme Constants for the Mobile Security Application
 */

export const COLORS = {
  // Primary colors
  primary: '#007AFF',
  primaryDark: '#0056CC',
  primaryLight: '#4DA8FF',
  
  // Secondary colors
  secondary: '#5856D6',
  secondaryDark: '#4845B5',
  secondaryLight: '#8B8AE6',
  
  // Status colors
  success: '#4CAF50',
  warning: '#FF9800',
  error: '#F44336',
  info: '#2196F3',
  
  // Severity colors
  severityLow: '#4CAF50',
  severityMedium: '#FF9800',
  severityHigh: '#FF5722',
  severityCritical: '#F44336',
  
  // Neutral colors
  white: '#FFFFFF',
  black: '#000000',
  dark: '#333333',
  medium: '#666666',
  light: '#CCCCCC',
  background: '#F9F9F9',
  border: '#E0E0E0',
  
  // Transparent colors
  overlay: 'rgba(0, 0, 0, 0.5)',
  disabled: 'rgba(0, 0, 0, 0.3)',
  
  // Location status
  locationBackground: '#F0F8FF',
  locationBorder: '#B0D4FF'
} as const;

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32
} as const;

export const FONT_SIZES = {
  xs: 10,
  sm: 12,
  md: 14,
  lg: 16,
  xl: 18,
  xxl: 20,
  xxxl: 24
} as const;

export const FONT_WEIGHTS = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700'
} as const;

export const BORDER_RADIUS = {
  sm: 4,
  md: 6,
  lg: 8,
  xl: 12,
  xxl: 16,
  circle: 50
} as const;

export const SHADOWS = {
  light: {
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1
  },
  medium: {
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3
  },
  heavy: {
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5
  }
} as const;
