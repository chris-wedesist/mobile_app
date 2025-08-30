/**
 * Privacy Management Types and Interfaces
 * GDPR/CCPA compliant privacy controls for mobile applications
 */

export interface PrivacyConsent {
  id: string;
  userId: string;
  dataCollection: boolean;
  analytics: boolean;
  marketing: boolean;
  locationTracking: boolean;
  incidentReporting: boolean;
  timestamp: Date;
  ipAddress?: string;
  consentVersion: string;
  withdrawalDate?: Date;
}

export interface DataExportRequest {
  userId: string;
  requestId: string;
  requestDate: Date;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  downloadUrl?: string;
  expiresAt?: Date;
  fileSize?: number;
  format: 'json' | 'csv' | 'xml';
}

export interface DataDeletionRequest {
  userId: string;
  requestId: string;
  requestDate: Date;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  completedDate?: Date;
  retentionPeriod?: number; // days
  deletionScope: 'full' | 'partial';
  preservedData?: string[]; // legal/safety requirements
}

export interface PrivacySettings {
  userId: string;
  dataMinimization: {
    enabled: boolean;
    retentionPeriod: number; // days
    autoDelete: boolean;
  };
  anonymization: {
    incidentReports: boolean;
    locationData: boolean;
    deviceInfo: boolean;
  };
  sharing: {
    lawEnforcement: boolean;
    emergencyServices: boolean;
    analytics: boolean;
    thirdPartyIntegrations: boolean;
  };
  notifications: {
    privacyUpdates: boolean;
    dataRequests: boolean;
    securityAlerts: boolean;
  };
  lastUpdated: Date;
}

export interface DataInventory {
  personalData: {
    profile: {
      email?: string;
      phone?: string;
      name?: string;
      profilePicture?: string;
    };
    authentication: {
      hashedPassword: boolean;
      biometricTemplates: boolean;
      securityQuestions: boolean;
    };
    incidents: {
      totalReports: number;
      anonymousReports: number;
      locations: number;
      evidence: number;
    };
    usage: {
      sessionData: boolean;
      deviceInfo: boolean;
      appUsage: boolean;
      crashReports: boolean;
    };
  };
  metadata: {
    accountCreated: Date;
    lastLogin: Date;
    dataSize: string;
    storageLocations: string[];
  };
}

export interface PrivacyNotification {
  id: string;
  userId: string;
  type: 'policy_update' | 'data_request' | 'breach_notification' | 'consent_reminder';
  title: string;
  message: string;
  actionRequired: boolean;
  actionUrl?: string;
  createdAt: Date;
  readAt?: Date;
  acknowledged: boolean;
}

export interface LegalBasis {
  type: 'consent' | 'contract' | 'legal_obligation' | 'vital_interests' | 'public_task' | 'legitimate_interests';
  description: string;
  dataCategories: string[];
  processingPurposes: string[];
  retentionPeriod: number;
  automaticProcessing: boolean;
}

export interface PrivacyAuditLog {
  id: string;
  userId: string;
  action: 'consent_given' | 'consent_withdrawn' | 'data_accessed' | 'data_exported' | 'data_deleted' | 'settings_changed';
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
  details: Record<string, unknown>;
  legalBasis: LegalBasis;
}

export interface PrivacyCompliance {
  gdprCompliant: boolean;
  ccpaCompliant: boolean;
  coppaCompliant: boolean;
  lastAudit: Date;
  certifications: string[];
  dataProcessingAgreements: string[];
  privacyPolicyVersion: string;
  cookiePolicyVersion?: string;
}

export type PrivacyRight = 
  | 'access'           // Right to access personal data
  | 'rectification'    // Right to correct inaccurate data
  | 'erasure'          // Right to be forgotten
  | 'portability'      // Right to data portability
  | 'restriction'      // Right to restrict processing
  | 'objection'        // Right to object to processing
  | 'withdraw_consent' // Right to withdraw consent
  | 'automated_decision'; // Right not to be subject to automated decision-making

export interface PrivacyRightRequest {
  id: string;
  userId: string;
  rightType: PrivacyRight;
  description: string;
  status: 'submitted' | 'under_review' | 'approved' | 'denied' | 'completed';
  submittedAt: Date;
  reviewedAt?: Date;
  completedAt?: Date;
  reviewerNotes?: string;
  evidence?: string[];
  appealDeadline?: Date;
}

export interface ConsentPreferences {
  essential: boolean;           // Always true, cannot be disabled
  functional: boolean;          // App functionality
  analytics: boolean;           // Usage analytics
  marketing: boolean;           // Marketing communications
  personalization: boolean;     // Personalized content
  thirdParty: boolean;         // Third-party integrations
  locationServices: boolean;   // Location-based services
  biometrics: boolean;         // Biometric authentication
  cloudSync: boolean;          // Cloud synchronization
  crashReporting: boolean;     // Crash and error reporting
}

export interface PrivacyDashboard {
  dataOverview: DataInventory;
  activeConsents: PrivacyConsent[];
  pendingRequests: PrivacyRightRequest[];
  recentActivity: PrivacyAuditLog[];
  complianceStatus: PrivacyCompliance;
  recommendations: string[];
  nextReview: Date;
}
