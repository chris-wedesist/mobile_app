// Real-Time Location Integration Module
// Feature Set 10: Real-Time Location Integration

import * as Location from 'expo-location';

export interface LocationData {
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp: number;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
}

export interface LocationPermissions {
  granted: boolean;
  canAskAgain: boolean;
  status: 'granted' | 'denied' | 'restricted' | 'undetermined';
}

export interface LocationUpdateCallback {
  (location: LocationData): void;
}

/**
 * Real-Time Location Service
 * Feature Set 10: Real-Time Location Integration
 */
export class LocationService {
  private static instance: LocationService;
  private locationSubscription: Location.LocationSubscription | null = null;
  private updateCallbacks: LocationUpdateCallback[] = [];
  private currentLocation: LocationData | null = null;
  private isTracking = false;
  private updateInterval = 30000; // 30 seconds
  private highAccuracy = true;

  static getInstance(): LocationService {
    if (!LocationService.instance) {
      LocationService.instance = new LocationService();
    }
    return LocationService.instance;
  }

  /**
   * Request location permissions
   * Feature Set 10: Location Permissions
   */
  async requestPermissions(): Promise<LocationPermissions> {
    try {
      console.log('🔐 Requesting location permissions...');
      
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      const permissions: LocationPermissions = {
        granted: status === 'granted',
        canAskAgain: status !== 'denied',
        status: status as 'granted' | 'denied' | 'restricted' | 'undetermined'
      };

      console.log(`✅ Location permissions: ${permissions.status}`);
      return permissions;
    } catch (error) {
      console.error('❌ Error requesting location permissions:', error);
      return {
        granted: false,
        canAskAgain: false,
        status: 'denied'
      };
    }
  }

  /**
   * Check current location permissions
   */
  async checkPermissions(): Promise<LocationPermissions> {
    try {
      const { status, canAskAgain } = await Location.getForegroundPermissionsAsync();
      
      return {
        granted: status === 'granted',
        canAskAgain,
        status: status as 'granted' | 'denied' | 'restricted' | 'undetermined'
      };
    } catch (error) {
      console.error('❌ Error checking location permissions:', error);
      return {
        granted: false,
        canAskAgain: false,
        status: 'denied'
      };
    }
  }

  /**
   * Get current location once
   */
  async getCurrentLocation(): Promise<LocationData | null> {
    try {
      const permissions = await this.checkPermissions();
      
      if (!permissions.granted) {
        console.log('❌ Location permissions not granted');
        return null;
      }

      console.log('📍 Getting current location...');
      
      const location = await Location.getCurrentPositionAsync({
        accuracy: this.highAccuracy ? Location.Accuracy.High : Location.Accuracy.Balanced,
        timeInterval: 5000,
        distanceInterval: 10
      });

      const locationData: LocationData = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy || undefined,
        timestamp: location.timestamp
      };

      // Get address information
      try {
        const address = await this.getAddressFromCoords(locationData.latitude, locationData.longitude);
        Object.assign(locationData, address);
      } catch (error) {
        console.log('⚠️ Could not get address information:', error);
      }

      this.currentLocation = locationData;
      console.log(`✅ Current location: ${locationData.latitude}, ${locationData.longitude}`);
      
      return locationData;
    } catch (error) {
      console.error('❌ Error getting current location:', error);
      return null;
    }
  }

  /**
   * Start real-time location tracking
   * Feature Set 10: Dynamic Updates
   */
  async startLocationTracking(): Promise<boolean> {
    try {
      const permissions = await this.checkPermissions();
      
      if (!permissions.granted) {
        console.log('❌ Location permissions not granted for tracking');
        return false;
      }

      if (this.isTracking) {
        console.log('⚠️ Location tracking already active');
        return true;
      }

      console.log('🔄 Starting real-time location tracking...');

      this.locationSubscription = await Location.watchPositionAsync(
        {
          accuracy: this.highAccuracy ? Location.Accuracy.High : Location.Accuracy.Balanced,
          timeInterval: this.updateInterval,
          distanceInterval: 50 // Update every 50 meters
        },
        (location) => {
          this.handleLocationUpdate(location);
        }
      );

      this.isTracking = true;
      console.log('✅ Real-time location tracking started');
      return true;
    } catch (error) {
      console.error('❌ Error starting location tracking:', error);
      return false;
    }
  }

  /**
   * Stop real-time location tracking
   */
  stopLocationTracking(): void {
    if (this.locationSubscription) {
      this.locationSubscription.remove();
      this.locationSubscription = null;
      this.isTracking = false;
      console.log('🛑 Location tracking stopped');
    }
  }

  /**
   * Handle location updates from tracking
   * Feature Set 10: Dynamic Updates
   */
  private async handleLocationUpdate(location: Location.LocationObject): Promise<void> {
    const locationData: LocationData = {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      accuracy: location.coords.accuracy || undefined,
      timestamp: location.timestamp
    };

    // Get address information
    try {
      const address = await this.getAddressFromCoords(locationData.latitude, locationData.longitude);
      Object.assign(locationData, address);
    } catch (error) {
      console.log('⚠️ Could not get address information for update:', error);
    }

    this.currentLocation = locationData;
    
    // Notify all registered callbacks
    this.updateCallbacks.forEach(callback => {
      try {
        callback(locationData);
      } catch (error) {
        console.error('❌ Error in location update callback:', error);
      }
    });

    console.log(`📍 Location update: ${locationData.latitude}, ${locationData.longitude}`);
  }

  /**
   * Get address from coordinates using reverse geocoding
   */
  private async getAddressFromCoords(latitude: number, longitude: number): Promise<Partial<LocationData>> {
    try {
      const results = await Location.reverseGeocodeAsync({
        latitude,
        longitude
      });

      if (results.length > 0) {
        const result = results[0];
        return {
          address: `${result.street || ''} ${result.name || ''}`.trim(),
          city: result.city || '',
          state: result.region || '',
          country: result.country || ''
        };
      }
    } catch (error) {
      console.log('⚠️ Reverse geocoding failed:', error);
    }

    return {};
  }

  /**
   * Register callback for location updates
   * Feature Set 10: Dynamic Updates
   */
  onLocationUpdate(callback: LocationUpdateCallback): void {
    this.updateCallbacks.push(callback);
    console.log(`📝 Registered location update callback (total: ${this.updateCallbacks.length})`);
  }

  /**
   * Unregister callback for location updates
   */
  offLocationUpdate(callback: LocationUpdateCallback): void {
    const index = this.updateCallbacks.indexOf(callback);
    if (index > -1) {
      this.updateCallbacks.splice(index, 1);
      console.log(`📝 Unregistered location update callback (remaining: ${this.updateCallbacks.length})`);
    }
  }

  /**
   * Get current cached location
   */
  getCurrentLocationData(): LocationData | null {
    return this.currentLocation;
  }

  /**
   * Check if location tracking is active
   */
  isLocationTrackingActive(): boolean {
    return this.isTracking;
  }

  /**
   * Set location update interval
   */
  setUpdateInterval(interval: number): void {
    this.updateInterval = interval;
    console.log(`⏱️ Location update interval set to ${interval}ms`);
  }

  /**
   * Set location accuracy mode
   */
  setHighAccuracy(highAccuracy: boolean): void {
    this.highAccuracy = highAccuracy;
    console.log(`🎯 Location accuracy set to ${highAccuracy ? 'high' : 'balanced'}`);
  }

  /**
   * Calculate geographic distribution of attorneys around user
   * Feature Set 10: Geographic Distribution
   */
  calculateGeographicDistribution(
    attorneys: any[],
    userLat: number,
    userLng: number,
    maxRadius: number = 100
  ): {
    nearby: any[];
    regional: any[];
    distant: any[];
    distribution: {
      nearby: number;
      regional: number;
      distant: number;
      total: number;
    };
  } {
    const nearby: any[] = [];
    const regional: any[] = [];
    const distant: any[] = [];

    attorneys.forEach(attorney => {
      if (!attorney.lat || !attorney.lng) return;

      const distance = this.calculateDistance(userLat, userLng, attorney.lat, attorney.lng);
      const distanceMiles = distance / 1609.34; // Convert meters to miles

      if (distanceMiles <= 10) {
        nearby.push({ ...attorney, distanceMiles });
      } else if (distanceMiles <= 25) {
        regional.push({ ...attorney, distanceMiles });
      } else if (distanceMiles <= maxRadius) {
        distant.push({ ...attorney, distanceMiles });
      }
    });

    const distribution = {
      nearby: nearby.length,
      regional: regional.length,
      distant: distant.length,
      total: attorneys.length
    };

    console.log(`🗺️ Geographic distribution: ${distribution.nearby} nearby, ${distribution.regional} regional, ${distribution.distant} distant`);

    return {
      nearby: nearby.sort((a, b) => a.distanceMiles - b.distanceMiles),
      regional: regional.sort((a, b) => a.distanceMiles - b.distanceMiles),
      distant: distant.sort((a, b) => a.distanceMiles - b.distanceMiles),
      distribution
    };
  }

  /**
   * Calculate distance between two points using Haversine formula
   */
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c; // Distance in meters
  }

  /**
   * Get location-based attorney search parameters
   */
  getLocationSearchParams(radius: number = 25): { latitude: number; longitude: number; radius: number } | null {
    if (!this.currentLocation) {
      console.log('⚠️ No current location available for search');
      return null;
    }

    return {
      latitude: this.currentLocation.latitude,
      longitude: this.currentLocation.longitude,
      radius: radius * 1609.34 // Convert miles to meters
    };
  }

  /**
   * Cleanup resources
   */
  cleanup(): void {
    this.stopLocationTracking();
    this.updateCallbacks = [];
    this.currentLocation = null;
    console.log('🧹 Location service cleaned up');
  }
}

/**
 * Global location service instance
 */
export const locationService = LocationService.getInstance();

/**
 * Utility function to get location with permissions
 */
export async function getLocationWithPermissions(): Promise<LocationData | null> {
  const service = LocationService.getInstance();
  const permissions = await service.requestPermissions();
  
  if (!permissions.granted) {
    console.log('❌ Location permissions denied');
    return null;
  }

  return await service.getCurrentLocation();
}

/**
 * Utility function to start location tracking with permissions
 */
export async function startLocationTrackingWithPermissions(): Promise<boolean> {
  const service = LocationService.getInstance();
  const permissions = await service.requestPermissions();
  
  if (!permissions.granted) {
    console.log('❌ Location permissions denied for tracking');
    return false;
  }

  return await service.startLocationTracking();
}

export default {
  LocationService,
  locationService,
  getLocationWithPermissions,
  startLocationTrackingWithPermissions
}; 