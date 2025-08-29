/**
 * Constants for the Incident Reporting System
 */

// Rate limiting configuration
export const RATE_LIMITING = {
  MAX_SUBMISSIONS_PER_HOUR: 3,
  MINUTES_PER_HOUR: 60,
  SECONDS_PER_MINUTE: 60,
  MS_PER_SECOND: 1000,
} as const;

// Time calculations
export const TIME_CONSTANTS = {
  MS_PER_HOUR: RATE_LIMITING.MINUTES_PER_HOUR * RATE_LIMITING.SECONDS_PER_MINUTE * RATE_LIMITING.MS_PER_SECOND,
  HOURS_PER_DAY: 24,
} as const;

export const MS_PER_DAY = TIME_CONSTANTS.HOURS_PER_DAY * TIME_CONSTANTS.MS_PER_HOUR;

// Content validation limits
export const VALIDATION = {
  MAX_TITLE_LENGTH: 100,
  MAX_DESCRIPTION_LENGTH: 1000,
  LOCATION_ACCURACY_THRESHOLD: 100,
} as const;

// Security scoring
export const SECURITY = {
  PENALTY_LOW_ACCURACY: 10,
  PENALTY_SUSPICIOUS_CONTENT: 20,
  INITIAL_SCORE: 100,
} as const;

// Search and location
export const LOCATION = {
  DEFAULT_SEARCH_RADIUS: 1000, // meters
  CLUSTER_RADIUS_METERS: 200,
} as const;

// Analytics
export const ANALYTICS = {
  MAX_TRENDING_TYPES: 3,
  MIN_HOTSPOT_INCIDENTS: 3,
  MAX_HOTSPOTS: 5,
} as const;

// Earth's radius for distance calculations
export const EARTH_RADIUS_METERS = 6371e3;
