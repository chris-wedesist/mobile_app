export const colors = {
  primary: '#007AFF',
  secondary: '#5856D6',
  accent: '#FF6B6B', // Added missing accent color
  success: '#34C759',
  warning: '#FF9500',
  error: '#FF3B30',
  background: '#FFFFFF',
  surface: '#F2F2F7',
  text: {
    primary: '#000000',
    secondary: '#8E8E93',
    muted: '#C7C7CC'
  },
  textSecondary: '#8E8E93',
  border: '#C6C6C8',
  shadow: '#000000',
  status: {
    error: '#FF3B30',
    warning: '#FF9500',
    success: '#34C759'
  }
};

export const shadows = {
  small: {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  medium: {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  large: {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  sm: {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  }
};

export const radius = {
  small: 4,
  medium: 8,
  large: 12,
  xlarge: 16,
  md: 8,
  lg: 12,
  round: 999
};