// App configuration
export const APP_CONFIG = {
  name: 'DESIST',
  version: '1.0.0',
  buildNumber: '1',
  bundleIdentifier: 'com.ahmedashraf_dev.desist',
  supportEmail: 'support@desist.app',
  privacyPolicyUrl: 'https://desist.app/privacy',
  termsOfServiceUrl: 'https://desist.app/terms',
} as const;

// API configuration
export const API_CONFIG = {
  baseUrl: process.env.EXPO_PUBLIC_API_URL || 'https://api.desist.app',
  timeout: 30000, // 30 seconds
  retryAttempts: 3,
  retryDelay: 1000, // 1 second
} as const;

// Cache configuration
export const CACHE_CONFIG = {
  defaultDuration: 5 * 60 * 1000, // 5 minutes
  maxSize: 50, // Maximum number of cached items
  cleanupInterval: 10 * 60 * 1000, // 10 minutes
} as const;

// Storage keys
export const STORAGE_KEYS = {
  // User data
  user: 'user_data',
  userPreferences: 'user_preferences',
  authToken: 'auth_token',
  refreshToken: 'refresh_token',
  
  // App state
  appState: 'app_state',
  theme: 'app_theme',
  language: 'user_language',
  
  // Cache
  cachePrefix: 'cache_',
  
  // Settings
  settings: 'app_settings',
  notifications: 'notification_settings',
  privacy: 'privacy_settings',
  
  // Emergency
  emergencyContacts: 'emergency_contacts',
  emergencySettings: 'emergency_settings',
  
  // Incidents
  incidents: 'incidents_data',
  incidentDrafts: 'incident_drafts',
  
  // Analytics
  analytics: 'analytics_data',
  crashReports: 'crash_reports',
} as const;

// Navigation constants
export const NAVIGATION = {
  // Tab routes
  tabs: {
    home: '/(tabs)',
    incidents: '/(tabs)/incidents',
    legalHelp: '/(tabs)/legal-help',
    documents: '/(tabs)/documents',
    recordings: '/(tabs)/recordings',
    blogs: '/(tabs)/blogs',
    badges: '/(tabs)/badges',
    profile: '/(tabs)/profile',
    settings: '/(tabs)/settings',
  },
  
  // Modal routes
  modals: {
    incidentDetails: '/incidents/[incident_id]',
    reportIncident: '/report-incident',
    emergencySetup: '/emergency-setup',
    stealthMode: '/stealth-mode',
    badgeUnlock: '/badge-unlock',
  },
  
  // Stack routes
  stacks: {
    onboarding: '/onboarding',
    emergency: '/emergency-sms',
    panic: '/panic-activation',
    recording: '/recording-backup',
  },
} as const;

// Feature flags
export const FEATURE_FLAGS = {
  // Core features
  emergencyMode: true,
  stealthMode: true,
  incidentReporting: true,
  legalResources: true,
  
  // Advanced features
  voiceRecording: true,
  locationTracking: true,
  pushNotifications: true,
  analytics: true,
  
  // Experimental features
  aiAssistance: false,
  socialFeatures: false,
  premiumFeatures: false,
} as const;

// Error codes
export const ERROR_CODES = {
  // Network errors
  NETWORK_ERROR: 'NETWORK_ERROR',
  TIMEOUT_ERROR: 'TIMEOUT_ERROR',
  SERVER_ERROR: 'SERVER_ERROR',
  
  // Authentication errors
  AUTH_REQUIRED: 'AUTH_REQUIRED',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  
  // Permission errors
  LOCATION_PERMISSION: 'LOCATION_PERMISSION',
  CAMERA_PERMISSION: 'CAMERA_PERMISSION',
  MICROPHONE_PERMISSION: 'MICROPHONE_PERMISSION',
  
  // Data errors
  DATA_NOT_FOUND: 'DATA_NOT_FOUND',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  STORAGE_ERROR: 'STORAGE_ERROR',
  
  // App errors
  INITIALIZATION_ERROR: 'INITIALIZATION_ERROR',
  CONFIGURATION_ERROR: 'CONFIGURATION_ERROR',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
} as const;

// Validation rules
export const VALIDATION_RULES = {
  email: {
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    message: 'Please enter a valid email address',
  },
  password: {
    minLength: 8,
    pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
    message: 'Password must be at least 8 characters with uppercase, lowercase, number, and special character',
  },
  phone: {
    pattern: /^\+?[\d\s\-\(\)]+$/,
    message: 'Please enter a valid phone number',
  },
  name: {
    minLength: 2,
    maxLength: 50,
    pattern: /^[a-zA-Z\s\-']+$/,
    message: 'Name must be 2-50 characters with only letters, spaces, hyphens, and apostrophes',
  },
} as const;

// Time constants
export const TIME = {
  // Durations in milliseconds
  SECOND: 1000,
  MINUTE: 60 * 1000,
  HOUR: 60 * 60 * 1000,
  DAY: 24 * 60 * 60 * 1000,
  WEEK: 7 * 24 * 60 * 60 * 1000,
  
  // Cache durations
  CACHE_SHORT: 5 * 60 * 1000, // 5 minutes
  CACHE_MEDIUM: 30 * 60 * 1000, // 30 minutes
  CACHE_LONG: 24 * 60 * 60 * 1000, // 24 hours
  
  // Animation durations
  ANIMATION_FAST: 200,
  ANIMATION_NORMAL: 300,
  ANIMATION_SLOW: 500,
  
  // Debounce delays
  DEBOUNCE_SHORT: 300,
  DEBOUNCE_NORMAL: 500,
  DEBOUNCE_LONG: 1000,
} as const;

// Dimensions
export const DIMENSIONS = {
  // Screen breakpoints
  BREAKPOINTS: {
    small: 375,
    medium: 768,
    large: 1024,
    xlarge: 1200,
  },
  
  // Touch targets
  TOUCH_TARGET_MIN: 44,
  TOUCH_TARGET_LARGE: 48,
  
  // Spacing
  SPACING: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  
  // Border radius
  BORDER_RADIUS: {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    round: 50,
  },
} as const;

// Accessibility
export const ACCESSIBILITY = {
  // Screen reader announcements
  ANNOUNCEMENTS: {
    loading: 'Loading, please wait',
    success: 'Operation completed successfully',
    error: 'An error occurred, please try again',
    networkError: 'Network connection error, please check your internet',
  },
  
  // Minimum contrast ratios
  CONTRAST_RATIOS: {
    normal: 4.5,
    large: 3.0,
  },
  
  // Focus indicators
  FOCUS_INDICATORS: {
    borderWidth: 2,
    borderColor: '#007AFF',
  },
} as const; 