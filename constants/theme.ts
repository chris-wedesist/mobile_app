/**
 * DESIST Mobile App - Official Design System
 * 
 * ⚠️  IMPORTANT: This is the single source of truth for all design tokens.
 * ⚠️  Never use hardcoded values. Always import and use these tokens.
 * ⚠️  See /docs/STYLE_GUIDE.md for complete usage guidelines.
 */

export const colors = {
  // Brand Colors
  primary: '#007AFF',    // Main brand color - iOS blue
  secondary: '#5856D6',  // Supporting brand color - iOS purple
  accent: '#FF6B6B',     // Highlight and CTA color

  // Semantic Colors
  success: '#34C759',    // Green - success states, secure status
  warning: '#FF9500',    // Orange - warning states, caution
  error: '#FF3B30',      // Red - error states, danger, emergency

  // Background Colors
  background: '#FFFFFF', // Main app background
  surface: '#F2F2F7',    // Cards, elevated surfaces

  // Text Colors
  text: {
    primary: '#000000',   // Main text, headings
    secondary: '#8E8E93', // Supporting text, descriptions
    muted: '#C7C7CC',     // Placeholder text, disabled states
  },

  // Legacy support (deprecated - use text.secondary)
  textSecondary: '#8E8E93',

  // UI Elements
  border: '#C6C6C8',     // Borders, dividers
  shadow: '#000000',     // Shadow color for all elevations

  // Status Colors (for security features)
  status: {
    error: '#FF3B30',    // Danger, critical alerts
    warning: '#FF9500',  // Caution, attention needed
    success: '#34C759',  // Safe, active, enabled
  },

  // Mode Colors (for app modes)
  mode: {
    normal: '#007AFF',   // Normal operating mode
    stealth: '#34C759',  // Stealth mode active
    emergency: '#FF3B30', // Emergency mode active
  },
};

/**
 * Typography System
 * Inter font family with comprehensive size and weight scales
 */
export const typography = {
  // Font Family
  fontFamily: {
    regular: 'Inter-Regular',
    medium: 'Inter-Medium',
    semiBold: 'Inter-SemiBold',
    bold: 'Inter-Bold',
  },

  // Font Sizes (in pixels)
  fontSize: {
    display: 32,    // Large titles, app name
    title: 24,      // Screen titles, section headers
    heading: 20,    // Card titles, important text
    subheading: 18, // Secondary headers
    body: 16,       // Default body text, buttons
    small: 14,      // Supporting text, captions
    caption: 12,    // Fine print, metadata
  },

  // Font Weights
  fontWeight: {
    light: '300',
    regular: '400',
    medium: '500',
    semiBold: '600',
    bold: '700',
    black: '800',
  },

  // Line Heights (relative to font size)
  lineHeight: {
    tight: 1.2,     // Compact headings
    normal: 1.4,    // Default body text
    relaxed: 1.6,   // Comfortable reading
  },
};

/**
 * Spacing System
 * Consistent spacing scale for margins, padding, and gaps
 */
export const spacing = {
  xs: 4,    // Tiny gaps, fine adjustments
  sm: 8,    // Small spacing, compact layouts
  md: 16,   // Standard spacing, most common
  lg: 24,   // Large spacing, section separation
  xl: 32,   // Extra large spacing, major sections
  xxl: 48,  // Maximum spacing, dramatic separation
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

/**
 * Shadow System
 * Consistent elevation levels for depth and hierarchy
 */
export const shadows = {
  // Primary shadow variants
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

  // Aliases for backward compatibility
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

/**
 * Border Radius System
 * Consistent corner radius for buttons, cards, and other UI elements
 */
export const radius = {
  small: 4,     // Subtle rounding, small buttons
  medium: 8,    // Standard rounding, most components
  large: 12,    // Prominent rounding, cards
  xlarge: 16,   // Maximum rounding, special elements
  
  // Aliases for convenience
  md: 8,        // Same as medium
  lg: 12,       // Same as large
  round: 999,   // Perfect circles, pills
};
