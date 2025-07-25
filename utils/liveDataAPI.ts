import { performanceOptimizer } from '@/utils/performanceOptimizer';
import { errorHandler } from '@/utils/errorHandler';
import { calculateDistance } from '@/utils/helpers';

// API Configuration
const API_CONFIG = {
  BASE_URL: process.env.EXPO_PUBLIC_API_BASE_URL || 'https://api.desist.app',
  TIMEOUT: 10000,
  RETRY_ATTEMPTS: 3,
} as const;

// Types for live data
export interface LiveIncident {
  id: string;
  type: 'ICE Activity' | 'Border Patrol Activity' | 'Checkpoint' | 'Raid in Progress' | 'Suspicious Vehicle' | 'Police Activity';
  description: string;
  location: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  status: 'active' | 'resolved' | 'false_alarm';
  created_at: string;
  updated_at: string;
  verified: boolean;
  media_urls?: string[];
  tags: string[];
  distance?: number;
}

export interface LiveAttorney {
  id: string;
  name: string;
  specialization: 'civil_rights' | 'immigration' | 'both';
  location: {
    latitude: number;
    longitude: number;
    address: string;
    city: string;
    state: string;
    zip: string;
  };
  contact: {
    phone?: string;
    email?: string;
    website?: string;
  };
  services: {
    pro_bono: boolean;
    sliding_scale: boolean;
    consultation_free: boolean;
  };
  languages: string[];
  rating: number;
  cases_handled: number;
  verified: boolean;
  distance?: number;
}

export interface LiveNewsItem {
  id: string;
  title: string;
  description: string;
  content: string;
  url: string;
  source: string;
  source_url: string;
  published_at: string;
  category: 'civil_rights' | 'immigration' | 'policing' | 'police_brutality' | 'community_safety';
  location: {
    type: 'local' | 'national';
    latitude?: number;
    longitude?: number;
    city?: string;
    state?: string;
  };
  image_url?: string;
  tags: string[];
  importance: 'low' | 'normal' | 'high' | 'urgent';
}

// API Response types
interface APIResponse<T> {
  data: T[];
  pagination: {
    current_page: number;
    total_pages: number;
    total_items: number;
    items_per_page: number;
    has_more: boolean;
  };
  meta: {
    timestamp: string;
    cache_status: 'hit' | 'miss';
  };
}

// Generic API client
class APIClient {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    params: Record<string, any> = {}
  ): Promise<T> {
    const url = new URL(`${API_CONFIG.BASE_URL}${endpoint}`);
    
    // Add query parameters
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.append(key, String(value));
      }
    });

    const config: RequestInit = {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'DESIST-Mobile-App/1.0',
      },
      ...options,
    };

    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= API_CONFIG.RETRY_ATTEMPTS; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT);
        
        const response = await fetch(url.toString(), {
          ...config,
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        return data as T;
      } catch (error) {
        lastError = error as Error;
        
        if (attempt === API_CONFIG.RETRY_ATTEMPTS) {
          break;
        }
        
        // Wait before retrying (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    }
    
    throw lastError || new Error('API request failed');
  }

  // Incidents API
  async getIncidents(params: {
    latitude: number;
    longitude: number;
    radius_km?: number;
    limit?: number;
    page?: number;
    status?: 'active' | 'resolved' | 'false_alarm';
    type?: string[];
  }): Promise<APIResponse<LiveIncident>> {
    return this.request<APIResponse<LiveIncident>>('/incidents', {}, params);
  }

  // Attorneys API (filtered for civil rights and immigration)
  async getAttorneys(params: {
    latitude: number;
    longitude: number;
    radius_km?: number;
    specialization?: 'civil_rights' | 'immigration' | 'both';
    pro_bono?: boolean;
    languages?: string[];
    limit?: number;
    page?: number;
  }): Promise<APIResponse<LiveAttorney>> {
    return this.request<APIResponse<LiveAttorney>>('/attorneys', {}, params);
  }

  // News API (separated by local and national)
  async getNews(params: {
    location_type: 'local' | 'national';
    latitude?: number;
    longitude?: number;
    radius_km?: number;
    categories?: string[];
    limit?: number;
    page?: number;
    importance?: string[];
  }): Promise<APIResponse<LiveNewsItem>> {
    return this.request<APIResponse<LiveNewsItem>>('/news', {}, params);
  }
}

// Create API client instance
const apiClient = new APIClient();

// Enhanced data services with caching and error handling
export class LiveDataService {
  // Incidents service with radius adjustment
  static async getIncidentsWithRadius(
    userLocation: { latitude: number; longitude: number },
    radiusKm: number = 5,
    options: {
      status?: 'active' | 'resolved' | 'false_alarm';
      type?: string[];
      limit?: number;
      page?: number;
    } = {}
  ): Promise<LiveIncident[]> {
    const cacheKey = `live_incidents_${userLocation.latitude}_${userLocation.longitude}_${radiusKm}_${JSON.stringify(options)}`;
    
    try {
      const response = await performanceOptimizer.fetchWithCache(cacheKey, async () => {
        const data = await apiClient.getIncidents({
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
          radius_km: radiusKm,
          limit: options.limit || 50,
          page: options.page || 1,
          status: options.status || 'active',
          type: options.type,
        });

        // Add distance calculations
        const incidentsWithDistance = data.data.map(incident => ({
          ...incident,
          distance: calculateDistance(
            userLocation.latitude,
            userLocation.longitude,
            incident.location.latitude,
            incident.location.longitude
          ),
        }));

        // Sort by distance and recency
        return incidentsWithDistance.sort((a, b) => {
          if (a.verified !== b.verified) {
            return a.verified ? -1 : 1; // Verified incidents first
          }
          if (Math.abs((a.distance || 0) - (b.distance || 0)) > 1000) {
            return (a.distance || 0) - (b.distance || 0); // Closer incidents first
          }
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime(); // Recent first
        });
      }, {
        key: cacheKey,
        duration: 2 * 60 * 1000, // 2 minutes cache for live incidents
      });

      return response;
    } catch (error) {
      errorHandler(error);
      console.error('Error fetching live incidents:', error);
      return [];
    }
  }

  // Attorneys service (filtered for civil rights and immigration)
  static async getAttorneysWithSpecialization(
    userLocation: { latitude: number; longitude: number },
    radiusKm: number = 50,
    options: {
      specialization?: 'civil_rights' | 'immigration' | 'both';
      pro_bono?: boolean;
      languages?: string[];
      limit?: number;
      page?: number;
    } = {}
  ): Promise<LiveAttorney[]> {
    const cacheKey = `live_attorneys_${userLocation.latitude}_${userLocation.longitude}_${radiusKm}_${JSON.stringify(options)}`;
    
    try {
      const response = await performanceOptimizer.fetchWithCache(cacheKey, async () => {
        const data = await apiClient.getAttorneys({
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
          radius_km: radiusKm,
          specialization: options.specialization || 'both', // Default to both civil rights and immigration
          pro_bono: options.pro_bono,
          languages: options.languages,
          limit: options.limit || 100,
          page: options.page || 1,
        });

        // Add distance calculations
        const attorneysWithDistance = data.data.map(attorney => ({
          ...attorney,
          distance: calculateDistance(
            userLocation.latitude,
            userLocation.longitude,
            attorney.location.latitude,
            attorney.location.longitude
          ),
        }));

        // Sort by rating, verified status, and distance
        return attorneysWithDistance.sort((a, b) => {
          if (a.verified !== b.verified) {
            return a.verified ? -1 : 1; // Verified attorneys first
          }
          if (Math.abs(a.rating - b.rating) > 0.5) {
            return b.rating - a.rating; // Higher rating first
          }
          return (a.distance || 0) - (b.distance || 0); // Closer attorneys first
        });
      }, {
        key: cacheKey,
        duration: 10 * 60 * 1000, // 10 minutes cache for attorney data
      });

      return response;
    } catch (error) {
      errorHandler(error);
      console.error('Error fetching live attorneys:', error);
      return [];
    }
  }

  // News service (separated by local and national)
  static async getNewsByLocation(
    locationType: 'local' | 'national',
    userLocation?: { latitude: number; longitude: number },
    radiusKm: number = 50,
    options: {
      categories?: string[];
      importance?: string[];
      limit?: number;
      page?: number;
    } = {}
  ): Promise<LiveNewsItem[]> {
    const cacheKey = `live_news_${locationType}_${userLocation ? `${userLocation.latitude}_${userLocation.longitude}` : 'national'}_${radiusKm}_${JSON.stringify(options)}`;
    
    try {
      const response = await performanceOptimizer.fetchWithCache(cacheKey, async () => {
        const data = await apiClient.getNews({
          location_type: locationType,
          latitude: userLocation?.latitude,
          longitude: userLocation?.longitude,
          radius_km: locationType === 'local' ? radiusKm : undefined,
          categories: options.categories || ['civil_rights', 'immigration', 'policing', 'police_brutality', 'community_safety'],
          importance: options.importance || ['urgent', 'high', 'normal'],
          limit: options.limit || 20,
          page: options.page || 1,
        });

        // Sort by importance and recency
        return data.data.sort((a, b) => {
          const importanceOrder = { urgent: 1, high: 2, normal: 3, low: 4 };
          const aImportance = importanceOrder[a.importance] || 3;
          const bImportance = importanceOrder[b.importance] || 3;
          
          if (aImportance !== bImportance) {
            return aImportance - bImportance; // Higher importance first
          }
          return new Date(b.published_at).getTime() - new Date(a.published_at).getTime(); // Recent first
        });
      }, {
        key: cacheKey,
        duration: 5 * 60 * 1000, // 5 minutes cache for news data
      });

      return response;
    } catch (error) {
      errorHandler(error);
      console.error('Error fetching live news:', error);
      return [];
    }
  }

  // Combined news service for both local and national
  static async getCombinedNews(
    userLocation?: { latitude: number; longitude: number },
    options: {
      localRadiusKm?: number;
      categories?: string[];
      importance?: string[];
      localLimit?: number;
      nationalLimit?: number;
    } = {}
  ): Promise<{ local: LiveNewsItem[]; national: LiveNewsItem[] }> {
    try {
      const [localNews, nationalNews] = await Promise.all([
        this.getNewsByLocation('local', userLocation, options.localRadiusKm || 50, {
          categories: options.categories,
          importance: options.importance,
          limit: options.localLimit || 10,
        }),
        this.getNewsByLocation('national', undefined, undefined, {
          categories: options.categories,
          importance: options.importance,
          limit: options.nationalLimit || 10,
        }),
      ]);

      return { local: localNews, national: nationalNews };
    } catch (error) {
      errorHandler(error);
      console.error('Error fetching combined news:', error);
      return { local: [], national: [] };
    }
  }
}

// Export service
export default LiveDataService; 