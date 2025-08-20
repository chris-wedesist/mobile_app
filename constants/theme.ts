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
    muted: '#C7C7CC',
  },
  textSecondary: '#8E8E93',
  border: '#C6C6C8',
  shadow: '#000000',
  status: {
    error: '#FF3B30',
    warning: '#FF9500',
    success: '#34C759',
  },
};

// Muted color palette for attorney filter tags (separate from main app colors)
export const tagColors = {
  highly_rated: {
    background: '#E8F4E8',
    text: '#2D5016',
    border: '#C1E3C1',
  },
  well_reviewed: {
    background: '#E8F0FF',
    text: '#1B4332',
    border: '#B8D4FF',
  },
  established: {
    background: '#F0F0F2',
    text: '#4A4A52',
    border: '#D0D0D6',
  },
  verified: {
    background: '#FFF8E1',
    text: '#6B5B00',
    border: '#FFE082',
  },
  nearby: {
    background: '#F3E5F5',
    text: '#4A2C2A',
    border: '#E1BEE7',
  },
  accessible: {
    background: '#E0F2F1',
    text: '#00463F',
    border: '#B2DFDB',
  },
  responsive: {
    background: '#FFF3E0',
    text: '#E65100',
    border: '#FFCC02',
  },
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
  },
};

export const radius = {
  small: 4,
  medium: 8,
  large: 12,
  xlarge: 16,
  md: 8,
  lg: 12,
  round: 999,
};
