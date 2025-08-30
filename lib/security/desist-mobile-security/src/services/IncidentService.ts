import AsyncStorage from '@react-native-async-storage/async-storage';
import { EncryptionService } from '../encryption';
import { SecurityResult } from '../types';
import {
  IncidentAnalytics,
  IncidentFilter,
  IncidentReport,
  IncidentSecurityContext,
  IncidentSubmission,
  IncidentValidation,
  IncidentVote,
  Location
} from '../types/incident';
import {
  ANALYTICS,
  EARTH_RADIUS_METERS,
  LOCATION,
  MS_PER_DAY,
  RATE_LIMITING,
  SECURITY,
  TIME_CONSTANTS,
  VALIDATION
} from '../constants/incident';

/**
 * IncidentService Constants
 */
const RANDOM_STRING_BASE = 36;
const RANDOM_STRING_LENGTH = 9;
const DEGREES_TO_RADIANS = 180;

/**
 * Incident Service
 * Handles incident reporting, storage, retrieval, and security validation
 */
export class IncidentService {
  private encryptionService: EncryptionService;
  private storageKey = 'desist_incidents';
  private votesKey = 'desist_incident_votes';
  private submissionLimitKey = 'incident_submission_limit';

  constructor(encryptionService: EncryptionService) {
    this.encryptionService = encryptionService;
  }

  /**
   * Submit a new incident report
   */
  async submitIncident(
    submission: IncidentSubmission,
    securityContext: IncidentSecurityContext
  ): Promise<SecurityResult<IncidentReport>> {
    try {
      // Validate submission
      const validation = await this.validateSubmission(submission, securityContext);
      if (!validation.isValid) {
        return {
          success: false,
          error: {
            code: 'VALIDATION_FAILED',
            message: 'Incident submission validation failed',
            severity: 'medium',
            details: { errors: validation.errors }
          },
          timestamp: new Date()
        };
      }

      // Check rate limiting
      const rateLimitCheck = await this.checkRateLimit(securityContext.deviceId);
      if (!rateLimitCheck.allowed) {
        return {
          success: false,
          error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: `Maximum ${RATE_LIMITING.MAX_SUBMISSIONS_PER_HOUR} submissions per hour exceeded`,
            severity: 'medium',
            details: { resetTime: rateLimitCheck.resetTime }
          },
          timestamp: new Date()
        };
      }

      // Create incident report
      const incident: IncidentReport = {
        id: this.generateIncidentId(),
        type: submission.type,
        title: submission.title,
        description: submission.description,
        location: submission.location,
        timestamp: new Date(),
        status: 'submitted',
        severity: submission.severity,
        reporter: {
          id: securityContext.deviceId,
          anonymous: submission.anonymous,
          verified: false
        },
        evidence: [],
        tags: submission.tags || [],
        upvotes: 0,
        downvotes: 0,
        visibility: submission.visibility,
        lastUpdated: new Date(),
        encrypted: true
      };

      // Encrypt sensitive data
      const encryptedDescription = await this.encryptionService.encrypt(incident.description);
      if (!encryptedDescription.success || !encryptedDescription.data) {
        return {
          success: false,
          error: {
            code: 'ENCRYPTION_FAILED',
            message: 'Failed to encrypt incident description',
            severity: 'high'
          },
          timestamp: new Date()
        };
      }

      // Store encrypted incident
      const encryptedIncident = {
        ...incident,
        description: encryptedDescription.data.encryptedData,
        _encryption: {
          iv: encryptedDescription.data.iv,
          tag: encryptedDescription.data.tag,
          algorithm: encryptedDescription.data.algorithm
        }
      };

      await this.storeIncident(encryptedIncident);
      await this.recordSubmission(securityContext.deviceId);

      return {
        success: true,
        data: incident,
        timestamp: new Date()
      };

    } catch (error) {
      return {
        success: false,
        error: {
          code: 'SUBMISSION_ERROR',
          message: 'Failed to submit incident report',
          severity: 'high',
          details: { error: error instanceof Error ? error.message : 'Unknown error' }
        },
        timestamp: new Date()
      };
    }
  }

  /**
   * Get incidents near a location
   */
  async getIncidentsNearLocation(
    location: Location,
    radius: number = LOCATION.DEFAULT_SEARCH_RADIUS, // meters
    filter?: IncidentFilter
  ): Promise<SecurityResult<IncidentReport[]>> {
    try {
      const incidents = await this.getAllIncidents();
      if (!incidents.success || !incidents.data) {
        return incidents;
      }

      // Filter by location
      const nearbyIncidents = incidents.data.filter(incident => {
        const distance = this.calculateDistance(location, incident.location);
        return distance <= radius;
      });

      // Apply additional filters
      let filteredIncidents = nearbyIncidents;
      if (filter) {
        filteredIncidents = this.applyFilters(nearbyIncidents, filter);
      }

      // Sort by recency and severity
      filteredIncidents.sort((a, b) => {
        if (a.severity !== b.severity) {
          const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
          return severityOrder[b.severity] - severityOrder[a.severity];
        }
        return b.timestamp.getTime() - a.timestamp.getTime();
      });

      return {
        success: true,
        data: filteredIncidents,
        timestamp: new Date()
      };

    } catch (error) {
      return {
        success: false,
        error: {
          code: 'RETRIEVAL_ERROR',
          message: 'Failed to retrieve incidents',
          severity: 'medium',
          details: { error: error instanceof Error ? error.message : 'Unknown error' }
        },
        timestamp: new Date()
      };
    }
  }

  /**
   * Vote on an incident
   */
  async voteOnIncident(
    incidentId: string,
    vote: 'up' | 'down' | 'neutral',
    userId: string
  ): Promise<SecurityResult<boolean>> {
    try {
      const incidents = await this.getAllIncidents();
      if (!incidents.success || !incidents.data) {
        return {
          success: false,
          error: {
            code: 'INCIDENT_NOT_FOUND',
            message: 'Could not retrieve incidents for voting',
            severity: 'medium'
          },
          timestamp: new Date()
        };
      }

      const incident = incidents.data.find(i => i.id === incidentId);
      if (!incident) {
        return {
          success: false,
          error: {
            code: 'INCIDENT_NOT_FOUND',
            message: 'Incident not found',
            severity: 'medium'
          },
          timestamp: new Date()
        };
      }

      // Check if user already voted
      const existingVote = await this.getUserVote(incidentId, userId);
      
      // Update vote counts
      if (existingVote) {
        // Remove previous vote
        if (existingVote.vote === 'up') incident.upvotes--;
        if (existingVote.vote === 'down') incident.downvotes--;
      }

      // Add new vote
      if (vote === 'up') incident.upvotes++;
      if (vote === 'down') incident.downvotes++;

      // Store updated incident
      await this.updateIncident(incident);

      // Store vote record
      await this.storeVote({
        incidentId,
        userId,
        vote,
        timestamp: new Date()
      });

      return {
        success: true,
        data: true,
        timestamp: new Date()
      };

    } catch (error) {
      return {
        success: false,
        error: {
          code: 'VOTE_ERROR',
          message: 'Failed to record vote',
          severity: 'medium',
          details: { error: error instanceof Error ? error.message : 'Unknown error' }
        },
        timestamp: new Date()
      };
    }
  }

  /**
   * Get analytics for incidents
   */
  async getIncidentAnalytics(location?: Location, radius?: number): Promise<SecurityResult<IncidentAnalytics>> {
    try {
      let incidents: IncidentReport[];
      
      if (location && radius) {
        const nearbyResult = await this.getIncidentsNearLocation(location, radius);
        if (!nearbyResult.success || !nearbyResult.data) {
          throw new Error('Failed to get nearby incidents');
        }
        incidents = nearbyResult.data;
      } else {
        const allResult = await this.getAllIncidents();
        if (!allResult.success || !allResult.data) {
          throw new Error('Failed to get all incidents');
        }
        incidents = allResult.data;
      }

      const now = new Date();
      const oneDayAgo = new Date(now.getTime() - MS_PER_DAY);

      const recentIncidents = incidents.filter(incident => 
        incident.timestamp >= oneDayAgo
      );

      const typeCounts = incidents.reduce((acc, incident) => {
        acc[incident.type] = (acc[incident.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const trendingTypes = Object.entries(typeCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, ANALYTICS.MAX_TRENDING_TYPES)
        .map(([type]) => type as IncidentReport['type']);

      const analytics: IncidentAnalytics = {
        totalReports: incidents.length,
        recentReports: recentIncidents.length,
        trendingTypes,
        hotspots: this.identifyHotspots(incidents),
        averageResolutionTime: this.calculateAverageResolutionTime(incidents)
      };

      return {
        success: true,
        data: analytics,
        timestamp: new Date()
      };

    } catch (error) {
      return {
        success: false,
        error: {
          code: 'ANALYTICS_ERROR',
          message: 'Failed to generate analytics',
          severity: 'medium',
          details: { error: error instanceof Error ? error.message : 'Unknown error' }
        },
        timestamp: new Date()
      };
    }
  }

  // Private helper methods

  private async validateSubmission(
    submission: IncidentSubmission,
    context: IncidentSecurityContext
  ): Promise<IncidentValidation> {
    const errors: string[] = [];
    const warnings: string[] = [];
    let securityScore = SECURITY.INITIAL_SCORE;

    // Validate required fields
    if (!submission.title?.trim()) errors.push('Title is required');
    if (!submission.description?.trim()) errors.push('Description is required');
    if (!submission.location) errors.push('Location is required');

    // Validate content length
    if (submission.title && submission.title.length > VALIDATION.MAX_TITLE_LENGTH) {
      errors.push(`Title must be ${VALIDATION.MAX_TITLE_LENGTH} characters or less`);
    }
    if (submission.description && submission.description.length > VALIDATION.MAX_DESCRIPTION_LENGTH) {
      errors.push(`Description must be ${VALIDATION.MAX_DESCRIPTION_LENGTH} characters or less`);
    }

    // Security validations
    if (context.locationAccuracy > VALIDATION.LOCATION_ACCURACY_THRESHOLD) {
      warnings.push('Location accuracy is low, incident may be less precise');
      securityScore -= SECURITY.PENALTY_LOW_ACCURACY;
    }

    // Check for suspicious patterns
    const suspiciousWords = ['test', 'fake', 'spam'];
    const contentToCheck = `${submission.title} ${submission.description}`.toLowerCase();
    if (suspiciousWords.some(word => contentToCheck.includes(word))) {
      securityScore -= SECURITY.PENALTY_SUSPICIOUS_CONTENT;
      warnings.push('Content may require additional verification');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      securityScore
    };
  }

  private async checkRateLimit(deviceId: string): Promise<{ allowed: boolean; resetTime: Date }> {
    try {
      const submissionsData = await AsyncStorage.getItem(`${this.submissionLimitKey}_${deviceId}`);
      const now = new Date();
      
      if (!submissionsData) {
        return { allowed: true, resetTime: new Date(now.getTime() + TIME_CONSTANTS.MS_PER_HOUR) };
      }

      const submissions = JSON.parse(submissionsData);
      const hourAgo = new Date(now.getTime() - TIME_CONSTANTS.MS_PER_HOUR);
      
      // Filter submissions within the last hour
      const recentSubmissions = submissions.filter((timestamp: string) => 
        new Date(timestamp) > hourAgo
      );

      const allowed = recentSubmissions.length < RATE_LIMITING.MAX_SUBMISSIONS_PER_HOUR;
      const oldestSubmission = recentSubmissions.length > 0 
        ? new Date(Math.min(...recentSubmissions.map((ts: string) => new Date(ts).getTime())))
        : now;
      const resetTime = new Date(oldestSubmission.getTime() + TIME_CONSTANTS.MS_PER_HOUR);

      return { allowed, resetTime };

    } catch {
      // If there's an error checking rate limit, allow the submission
      return { allowed: true, resetTime: new Date() };
    }
  }

  private async recordSubmission(deviceId: string): Promise<void> {
    try {
      const submissionsData = await AsyncStorage.getItem(`${this.submissionLimitKey}_${deviceId}`);
      const submissions = submissionsData ? JSON.parse(submissionsData) : [];
      
      submissions.push(new Date().toISOString());
      
      // Keep only last 24 hours
      const dayAgo = new Date(Date.now() - MS_PER_DAY);
      const recentSubmissions = submissions.filter((timestamp: string) => 
        new Date(timestamp) > dayAgo
      );

      await AsyncStorage.setItem(
        `${this.submissionLimitKey}_${deviceId}`,
        JSON.stringify(recentSubmissions)
      );
    } catch (error) {
      console.error('Failed to record submission for rate limiting:', error);
    }
  }

  private generateIncidentId(): string {
    return `incident_${Date.now()}_${Math.random().toString(RANDOM_STRING_BASE).substr(2, RANDOM_STRING_LENGTH)}`;
  }

  private async storeIncident(incident: IncidentReport): Promise<void> {
    const existingData = await AsyncStorage.getItem(this.storageKey);
    const incidents = existingData ? JSON.parse(existingData) : [];
    incidents.push(incident);
    await AsyncStorage.setItem(this.storageKey, JSON.stringify(incidents));
  }

  private async getAllIncidents(): Promise<SecurityResult<IncidentReport[]>> {
    try {
      const data = await AsyncStorage.getItem(this.storageKey);
      if (!data) {
        return {
          success: true,
          data: [],
          timestamp: new Date()
        };
      }

      const encryptedIncidents = JSON.parse(data);
      const incidents: IncidentReport[] = [];

      for (const encryptedIncident of encryptedIncidents) {
        try {
          // Decrypt description
          const decryptionResult = await this.encryptionService.decrypt({
            encryptedData: encryptedIncident.description,
            iv: encryptedIncident._encryption.iv,
            tag: encryptedIncident._encryption.tag,
            algorithm: encryptedIncident._encryption.algorithm
          });

          if (decryptionResult.success && decryptionResult.data) {
            const incident: IncidentReport = {
              ...encryptedIncident,
              description: decryptionResult.data,
              timestamp: new Date(encryptedIncident.timestamp),
              lastUpdated: new Date(encryptedIncident.lastUpdated)
            };
            delete (incident as unknown as Record<string, unknown>)._encryption;
            incidents.push(incident);
          }
        } catch (error) {
          console.error('Failed to decrypt incident:', error);
          // Skip corrupted incident
        }
      }

      return {
        success: true,
        data: incidents,
        timestamp: new Date()
      };

    } catch (error) {
      return {
        success: false,
        error: {
          code: 'STORAGE_ERROR',
          message: 'Failed to retrieve incidents from storage',
          severity: 'medium',
          details: { error: error instanceof Error ? error.message : 'Unknown error' }
        },
        timestamp: new Date()
      };
    }
  }

  private async updateIncident(incident: IncidentReport): Promise<void> {
    const data = await AsyncStorage.getItem(this.storageKey);
    if (!data) return;

    const incidents = JSON.parse(data);
    const index = incidents.findIndex((i: IncidentReport) => i.id === incident.id);
    if (index !== -1) {
      // Encrypt updated incident
      const encryptedDescription = await this.encryptionService.encrypt(incident.description);
      if (encryptedDescription.success && encryptedDescription.data) {
        incidents[index] = {
          ...incident,
          description: encryptedDescription.data.encryptedData,
          _encryption: {
            iv: encryptedDescription.data.iv,
            tag: encryptedDescription.data.tag,
            algorithm: encryptedDescription.data.algorithm
          }
        };
        await AsyncStorage.setItem(this.storageKey, JSON.stringify(incidents));
      }
    }
  }

  private async getUserVote(incidentId: string, userId: string): Promise<IncidentVote | null> {
    try {
      const votesData = await AsyncStorage.getItem(this.votesKey);
      if (!votesData) return null;

      const votes: IncidentVote[] = JSON.parse(votesData);
      return votes.find(vote => vote.incidentId === incidentId && vote.userId === userId) || null;
    } catch {
      return null;
    }
  }

  private async storeVote(vote: IncidentVote): Promise<void> {
    try {
      const votesData = await AsyncStorage.getItem(this.votesKey);
      const votes = votesData ? JSON.parse(votesData) : [];
      
      // Remove existing vote if any
      const existingIndex = votes.findIndex((v: IncidentVote) => 
        v.incidentId === vote.incidentId && v.userId === vote.userId
      );
      if (existingIndex !== -1) {
        votes.splice(existingIndex, 1);
      }

      votes.push(vote);
      await AsyncStorage.setItem(this.votesKey, JSON.stringify(votes));
    } catch (error) {
      console.error('Failed to store vote:', error);
    }
  }

  private calculateDistance(loc1: Location, loc2: Location): number {
    const R = EARTH_RADIUS_METERS;
    const φ1 = loc1.latitude * Math.PI/DEGREES_TO_RADIANS;
    const φ2 = loc2.latitude * Math.PI/DEGREES_TO_RADIANS;
    const Δφ = (loc2.latitude-loc1.latitude) * Math.PI/DEGREES_TO_RADIANS;
    const Δλ = (loc2.longitude-loc1.longitude) * Math.PI/DEGREES_TO_RADIANS;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c;
  }

  private applyFilters(incidents: IncidentReport[], filter: IncidentFilter): IncidentReport[] {
    return incidents.filter(incident => {
      if (filter.types && !filter.types.includes(incident.type)) return false;
      if (filter.severity && !filter.severity.includes(incident.severity)) return false;
      if (filter.status && !filter.status.includes(incident.status)) return false;
      if (filter.timeRange) {
        if (incident.timestamp < filter.timeRange.start || incident.timestamp > filter.timeRange.end) {
          return false;
        }
      }
      return true;
    });
  }

  private identifyHotspots(incidents: IncidentReport[]): Location[] {
    // Simple clustering algorithm to identify hotspots
    const clusters: { location: Location; count: number }[] = [];

    for (const incident of incidents) {
      let addedToCluster = false;
      
      for (const cluster of clusters) {
        if (this.calculateDistance(incident.location, cluster.location) <= LOCATION.CLUSTER_RADIUS_METERS) {
          cluster.count++;
          addedToCluster = true;
          break;
        }
      }

      if (!addedToCluster) {
        clusters.push({
          location: incident.location,
          count: 1
        });
      }
    }

    return clusters
      .filter(cluster => cluster.count >= ANALYTICS.MIN_HOTSPOT_INCIDENTS)
      .sort((a, b) => b.count - a.count)
      .slice(0, ANALYTICS.MAX_HOTSPOTS)
      .map(cluster => cluster.location);
  }

  private calculateAverageResolutionTime(incidents: IncidentReport[]): number {
    const resolvedIncidents = incidents.filter(i => i.status === 'resolved');
    if (resolvedIncidents.length === 0) return 0;

    const totalTime = resolvedIncidents.reduce((acc, incident) => {
      const resolutionTime = incident.lastUpdated.getTime() - incident.timestamp.getTime();
      return acc + resolutionTime;
    }, 0);

    return totalTime / resolvedIncidents.length / TIME_CONSTANTS.MS_PER_HOUR; // Convert to hours
  }
}
