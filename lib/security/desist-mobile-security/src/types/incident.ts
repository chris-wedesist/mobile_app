/**
 * Incident Reporting Types and Interfaces
 * Comprehensive type definitions for the incident reporting system
 */

export interface Location {
  latitude: number;
  longitude: number;
  address?: string;
  accuracy?: number;
  timestamp?: Date;
}

export interface IncidentReport {
  id: string;
  type: IncidentType;
  title: string;
  description: string;
  location: Location;
  timestamp: Date;
  status: IncidentStatus;
  severity: IncidentSeverity;
  reporter: {
    id: string;
    anonymous: boolean;
    verified: boolean;
  };
  evidence?: Evidence[];
  tags?: string[];
  upvotes: number;
  downvotes: number;
  visibility: VisibilityLevel;
  expiresAt?: Date;
  lastUpdated: Date;
  encrypted: boolean;
}

export type IncidentType = 
  | 'harassment'
  | 'theft'
  | 'vandalism'
  | 'assault'
  | 'fraud'
  | 'suspicious_activity'
  | 'traffic_incident'
  | 'safety_concern'
  | 'emergency'
  | 'other';

export type IncidentStatus = 
  | 'submitted'
  | 'verified'
  | 'investigating'
  | 'resolved'
  | 'disputed'
  | 'expired';

export type IncidentSeverity = 
  | 'low'
  | 'medium'
  | 'high'
  | 'critical';

export type VisibilityLevel = 
  | 'public'
  | 'community'
  | 'private';

export interface Evidence {
  id: string;
  type: 'photo' | 'video' | 'audio' | 'document';
  uri: string;
  encrypted: boolean;
  timestamp: Date;
  metadata?: {
    size: number;
    format: string;
    duration?: number; // for audio/video
  };
}

export interface IncidentFilter {
  types?: IncidentType[];
  severity?: IncidentSeverity[];
  timeRange?: {
    start: Date;
    end: Date;
  };
  radius?: number; // in meters
  center?: Location;
  status?: IncidentStatus[];
  includeSelfReports?: boolean;
}

export interface IncidentSubmission {
  type: IncidentType;
  title: string;
  description: string;
  location: Location;
  severity: IncidentSeverity;
  anonymous: boolean;
  evidence?: File[];
  tags?: string[];
  visibility: VisibilityLevel;
  captchaToken?: string;
}

export interface IncidentVote {
  incidentId: string;
  userId: string;
  vote: 'up' | 'down' | 'neutral';
  timestamp: Date;
}

export interface IncidentComment {
  id: string;
  incidentId: string;
  userId: string;
  content: string;
  timestamp: Date;
  anonymous: boolean;
  encrypted: boolean;
}

export interface IncidentAnalytics {
  totalReports: number;
  recentReports: number;
  trendingTypes: IncidentType[];
  hotspots: Location[];
  averageResolutionTime: number;
}

export interface IncidentNotification {
  id: string;
  type: 'new_incident' | 'status_update' | 'nearby_alert' | 'trending';
  incidentId: string;
  title: string;
  message: string;
  location?: Location;
  severity: IncidentSeverity;
  timestamp: Date;
  read: boolean;
}

// Security and validation interfaces
export interface IncidentValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  securityScore: number;
}

export interface IncidentSecurityContext {
  deviceId: string;
  userAgent: string;
  ipAddress?: string;
  locationAccuracy: number;
  timestamp: Date;
  submissionTime?: Date;
  rateLimitStatus?: {
    remaining: number;
    resetTime: Date;
  };
}
