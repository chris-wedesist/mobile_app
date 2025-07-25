// User-related types
export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  preferences?: UserPreferences;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserPreferences {
  language: 'en' | 'es' | 'fr';
  theme: 'light' | 'dark';
  notifications: NotificationSettings;
  privacy: PrivacySettings;
}

export interface NotificationSettings {
  push: boolean;
  email: boolean;
  sms: boolean;
  emergency: boolean;
}

export interface PrivacySettings {
  locationSharing: boolean;
  dataCollection: boolean;
  analytics: boolean;
}

// App state types
export interface AppState {
  user: User | null;
  theme: 'light' | 'dark';
  language: 'en' | 'es' | 'fr';
  isOnline: boolean;
  isInitialized: boolean;
  currentScreen: string;
}

export interface AppExtendedState {
  isLoading: boolean;
  loadingStates: Record<string, boolean>;
  error: string | null;
  errors: Record<string, string | null>;
  cachedData: Record<string, any>;
  lastUpdated: Record<string, number>;
  isOnline: boolean;
  isInitialized: boolean;
  currentScreen: string;
}

// Navigation types
export interface NavigationItem {
  id: string;
  title: string;
  icon: string;
  route: string;
  badge?: number;
  disabled?: boolean;
}

// Incident-related types
export interface Incident {
  id: string;
  title: string;
  description: string;
  location: Location;
  dateTime: Date;
  witnesses: Witness[];
  evidence: Evidence[];
  status: IncidentStatus;
  priority: IncidentPriority;
  category: IncidentCategory;
  createdAt: Date;
  updatedAt: Date;
}

export interface Location {
  latitude: number;
  longitude: number;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
}

export interface Witness {
  id: string;
  name: string;
  contact: string;
  statement: string;
}

export interface Evidence {
  id: string;
  type: 'photo' | 'video' | 'audio' | 'document';
  url: string;
  description: string;
  uploadedAt: Date;
}

export type IncidentStatus = 'pending' | 'investigating' | 'resolved' | 'closed';
export type IncidentPriority = 'low' | 'medium' | 'high' | 'critical';
export type IncidentCategory = 'harassment' | 'discrimination' | 'violence' | 'theft' | 'other';

// API response types
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
  errors?: string[];
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Error handling types
export interface AppError {
  code: string;
  message: string;
  severity: 'low' | 'medium' | 'high';
  userMessage: string;
  timestamp: Date;
  context?: Record<string, any>;
}

// Performance optimization types
export interface CacheItem<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

export interface CacheConfig {
  duration?: number;
  key: string;
}

// Accessibility types
export interface AccessibilityConfig {
  screenReaderEnabled: boolean;
  reduceMotionEnabled: boolean;
  highContrastEnabled: boolean;
  largeTextEnabled: boolean;
}

// Component prop types
export interface BaseComponentProps {
  testID?: string;
  accessible?: boolean;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  accessibilityRole?: string;
}

export interface ButtonProps extends BaseComponentProps {
  onPress?: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'small' | 'medium' | 'large';
}

export interface TextProps extends BaseComponentProps {
  variant?: 'heading' | 'subheading' | 'body' | 'caption' | 'label';
  size?: 'small' | 'medium' | 'large' | 'xlarge';
  weight?: 'normal' | 'medium' | 'semibold' | 'bold';
  color?: string;
  align?: 'left' | 'center' | 'right' | 'justify';
}

// Form types
export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'password' | 'number' | 'select' | 'textarea' | 'date';
  required?: boolean;
  validation?: ValidationRule[];
  options?: SelectOption[];
}

export interface ValidationRule {
  type: 'required' | 'email' | 'minLength' | 'maxLength' | 'pattern' | 'custom';
  value?: any;
  message: string;
}

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

// Theme types
export interface Theme {
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
    text: {
      primary: string;
      secondary: string;
      muted: string;
    };
    status: {
      success: string;
      warning: string;
      error: string;
      info: string;
    };
  };
  spacing: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
  };
  borderRadius: {
    sm: number;
    md: number;
    lg: number;
  };
  typography: {
    fontFamily: {
      regular: string;
      medium: string;
      semibold: string;
      bold: string;
    };
    fontSize: {
      xs: number;
      sm: number;
      md: number;
      lg: number;
      xl: number;
      xxl: number;
    };
  };
} 