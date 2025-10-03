import { supabase } from '@/lib/supabase';
import * as Location from 'expo-location';

export interface IncidentLocation {
  latitude: number;
  longitude: number;
}

export interface IncidentRestrictionResult {
  canReport: boolean;
  reason?: string;
  remainingReports?: number;
}

/**
 * Calculates the distance between two geographic points using the Haversine formula
 * @param lat1 Latitude of first point
 * @param lon1 Longitude of first point
 * @param lat2 Latitude of second point
 * @param lon2 Longitude of second point
 * @returns Distance in meters
 */
export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000; // Earth's radius in meters
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
 * Converts meters to miles
 * @param meters Distance in meters
 * @returns Distance in miles
 */
export function metersToMiles(meters: number): number {
  return meters * 0.000621371;
}

/**
 * Checks if a user email is verified
 * @param user The Supabase user object
 * @returns True if user email is verified
 */
export function isUserVerified(user: any): boolean {
  return user && user.email_confirmed_at !== null;
}

/**
 * Checks if incident location is within 10 miles of user's current location
 * @param userLocation User's current location
 * @param incidentLocation Incident location to report
 * @returns True if within 10 miles, false otherwise
 */
export function isWithinReportingRadius(userLocation: Location.LocationObject | null, incidentLocation: IncidentLocation): boolean {
  if (!userLocation) {
    return false;
  }

  const distance = calculateDistance(
    userLocation.coords.latitude,
    userLocation.coords.longitude,
    incidentLocation.latitude,
    incidentLocation.longitude
  );

  const distanceInMiles = metersToMiles(distance);
  return distanceInMiles <= 10;
}

/**
 * Gets the beginning of the current month in ISO format
 * @returns ISO string of the first day of current month at 00:00:00
 */
export function getCurrentMonthStart(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  return new Date(year, month, 1).toISOString();
}

/**
 * Counts how many incidents a user has reported in the current month
 * @param userId The user's ID
 * @returns Number of incidents reported this month
 */
export async function getMonthlyIncidentCount(userId: string): Promise<number> {
  try {
    const monthStart = getCurrentMonthStart();
    
    const { count, error } = await supabase
      .from('incidents')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', monthStart);

    if (error) {
      console.error('Error counting monthly incidents:', error);
      return 0;
    }

    return count || 0;
  } catch (error) {
    console.error('Error getting monthly incident count:', error);
    return 0;
  }
}

/**
 * Checks if user can report an incident based on all restrictions
 * @param user The Supabase user object
 * @param userLocation User's current location
 * @param incidentLocation Location of incident to report
 * @returns IncidentRestrictionResult with canReport status and reason
 */
export async function checkIncidentRestrictions(
  user: any,
  userLocation: Location.LocationObject | null,
  incidentLocation: IncidentLocation
): Promise<IncidentRestrictionResult> {
  // Check if user is verified
  if (!isUserVerified(user)) {
    return {
      canReport: false,
      reason: 'Only verified users can report incidents. Please verify your email address first.'
    };
  }

  // Check location radius
  if (!isWithinReportingRadius(userLocation, incidentLocation)) {
    return {
      canReport: false,
      reason: 'Incidents can only be reported within 10 miles of your current location.'
    };
  }

  // Check monthly incident limit
  const monthlyCount = await getMonthlyIncidentCount(user.id);
  const maxIncidentsPerMonth = 3;
  
  if (monthlyCount >= maxIncidentsPerMonth) {
    return {
      canReport: false,
      reason: `You have reached the monthly limit of ${maxIncidentsPerMonth} incident reports. Try again next month.`
    };
  }

  // User can report
  const remainingReports = maxIncidentsPerMonth - monthlyCount;
  return {
    canReport: true,
    remainingReports
  };
}

/**
 * Gets user's current location with proper permission handling
 * @returns Promise<Location.LocationObject | null>
 */
export async function getUserCurrentLocation(): Promise<Location.LocationObject | null> {
  try {
    // Request location permission
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      console.log('Location permission denied');
      return null;
    }

    // Get current location
    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });

    return location;
  } catch (error) {
    console.error('Error getting user location:', error);
    return null;
  }
}
