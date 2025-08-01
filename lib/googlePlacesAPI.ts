// Using fetch instead of axios to avoid dependency issues
import Constants from 'expo-constants';

// Google Places API configuration with enhanced validation
const GOOGLE_PLACES_API_KEY = Constants.expoConfig?.extra?.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY || 
                             process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY || '';
const GOOGLE_PLACES_BASE_URL = 'https://maps.googleapis.com/maps/api/place';

// Enhanced environment variable validation and debugging
console.log('🔧 Environment Variable Debug:');
console.log('  - Constants.expoConfig?.extra?.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY exists:', !!Constants.expoConfig?.extra?.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY);
console.log('  - process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY exists:', !!process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY);
console.log('  - GOOGLE_PLACES_API_KEY length:', GOOGLE_PLACES_API_KEY.length);
console.log('  - GOOGLE_PLACES_API_KEY starts with AIza:', GOOGLE_PLACES_API_KEY.startsWith('AIza'));

export interface GooglePlacesAttorney {
  place_id: string;
  name: string;
  formatted_address: string;
  formatted_phone_number?: string;
  website?: string;
  rating?: number;
  user_ratings_total?: number;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
  types: string[];
  business_status?: string;
  opening_hours?: {
    open_now: boolean;
  };
  photos?: Array<{
    photo_reference: string;
    height: number;
    width: number;
  }>;
  reviews?: Array<{
    author_name: string;
    rating: number;
    text: string;
    time: number;
  }>;
}

export interface GooglePlacesSearchResult {
  results: GooglePlacesAttorney[];
  status: string;
  next_page_token?: string;
}

/**
 * Search for attorneys using Google Places API
 * This function searches for law firms and attorneys in a specific area
 */
export async function searchAttorneysWithGooglePlaces(
  latitude: number,
  longitude: number,
  radius: number = 50000, // Default 50km radius
  keyword: string = 'attorney lawyer law firm'
): Promise<GooglePlacesAttorney[]> {
  try {
    console.log(`🔍 Attempting Google Places search for attorneys near ${latitude}, ${longitude} with radius ${radius}m`);
    
    if (!isGooglePlacesAvailable()) {
      console.warn('⚠️ Google Places API not configured - primary source unavailable');
      console.warn('⚠️ This means attorney search functionality will be limited');
      return [];
    }

    console.log(`🔍 Searching Google Places for attorneys near ${latitude}, ${longitude} with radius ${radius}m`);

    // Build URL with query parameters
    const params = new URLSearchParams({
      location: `${latitude},${longitude}`,
      radius: radius.toString(),
      keyword: keyword,
      type: 'lawyer', // Google Places type for legal services
      key: GOOGLE_PLACES_API_KEY
    });

    const url = `${GOOGLE_PLACES_BASE_URL}/nearbysearch/json?${params}`;
    console.log(`🌐 Making request to: ${GOOGLE_PLACES_BASE_URL}/nearbysearch/json?location=${latitude},${longitude}&radius=${radius}&keyword=${keyword}&type=lawyer&key=${GOOGLE_PLACES_API_KEY.substring(0, 8)}...`);

    const response = await fetch(url);

    if (response.ok) {
      const data = await response.json();
      console.log(`📊 Google Places API Response Status: ${data.status}`);
      
      if (data.status === 'OK') {
        console.log(`✅ Found ${data.results.length} attorneys via Google Places API`);
        return data.results;
      } else if (data.status === 'ZERO_RESULTS') {
        console.log(`ℹ️ No attorneys found in the specified area via Google Places API`);
        return [];
      } else if (data.status === 'REQUEST_DENIED') {
        console.error(`❌ Google Places API request denied: ${data.error_message || 'Unknown error'}`);
        console.error(`❌ This usually indicates API key issues or service not enabled`);
        return [];
      } else {
        console.error(`❌ Google Places API error: ${data.status} - ${data.error_message || 'Unknown error'}`);
        return [];
      }
    } else {
      console.error(`❌ HTTP error: ${response.status} ${response.statusText}`);
      return [];
    }
  } catch (error) {
    console.error('❌ Error searching Google Places API:', error);
    console.error('❌ This could be due to network issues or API configuration problems');
    return [];
  }
}

/**
 * Get detailed information about a specific attorney/place
 * This function retrieves comprehensive contact and business details
 */
export async function getAttorneyDetails(placeId: string): Promise<GooglePlacesAttorney | null> {
  try {
    if (!isGooglePlacesAvailable()) {
      console.warn('⚠️ Google Places API not configured - primary source unavailable');
      return null;
    }

    console.log(`🔍 Getting detailed information for place ID: ${placeId}`);

    const params = new URLSearchParams({
      place_id: placeId,
      fields: 'place_id,name,formatted_address,formatted_phone_number,website,rating,user_ratings_total,geometry,types,business_status,opening_hours,photos,reviews',
      key: GOOGLE_PLACES_API_KEY
    });

    const response = await fetch(`${GOOGLE_PLACES_BASE_URL}/details/json?${params}`);

    if (response.ok) {
      const data = await response.json();
      console.log(`📊 Google Places Details API Response Status: ${data.status}`);
      
      if (data.status === 'OK') {
        console.log(`✅ Retrieved detailed information for ${data.result.name}`);
        return data.result;
      } else if (data.status === 'REQUEST_DENIED') {
        console.error(`❌ Google Places Details API request denied: ${data.error_message || 'Unknown error'}`);
        return null;
      } else {
        console.error(`❌ Google Places Details API error: ${data.status} - ${data.error_message || 'Unknown error'}`);
        return null;
      }
    } else {
      console.error(`❌ HTTP error: ${response.status} ${response.statusText}`);
      return null;
    }
  } catch (error) {
    console.error('❌ Error getting attorney details from Google Places API:', error);
    return null;
  }
}

/**
 * Search for attorneys by text query
 * This function searches for attorneys using a text query in a specific area
 */
export async function searchAttorneysByQuery(
  query: string,
  latitude: number,
  longitude: number,
  radius: number = 50000
): Promise<GooglePlacesAttorney[]> {
  try {
    if (!isGooglePlacesAvailable()) {
      console.warn('⚠️ Google Places API not configured - primary source unavailable');
      return [];
    }

    console.log(`🔍 Searching Google Places for: "${query}" near ${latitude}, ${longitude}`);

    const params = new URLSearchParams({
      query: query,
      location: `${latitude},${longitude}`,
      radius: radius.toString(),
      type: 'lawyer',
      key: GOOGLE_PLACES_API_KEY
    });

    const response = await fetch(`${GOOGLE_PLACES_BASE_URL}/textsearch/json?${params}`);

    if (response.ok) {
      const data = await response.json();
      console.log(`📊 Google Places Text Search API Response Status: ${data.status}`);
      
      if (data.status === 'OK') {
        console.log(`✅ Found ${data.results.length} results for query: "${query}"`);
        return data.results;
      } else if (data.status === 'ZERO_RESULTS') {
        console.log(`ℹ️ No results found for query: "${query}"`);
        return [];
      } else if (data.status === 'REQUEST_DENIED') {
        console.error(`❌ Google Places Text Search API request denied: ${data.error_message || 'Unknown error'}`);
        return [];
      } else {
        console.error(`❌ Google Places Text Search API error: ${data.status} - ${data.error_message || 'Unknown error'}`);
        return [];
      }
    } else {
      console.error(`❌ HTTP error: ${response.status} ${response.statusText}`);
      return [];
    }
  } catch (error) {
    console.error('❌ Error searching Google Places API by query:', error);
    return [];
  }
}

/**
 * Convert Google Places attorney data to our Attorney interface format
 * This function transforms Google Places data to match our existing attorney structure
 */
export function convertGooglePlacesToAttorney(
  googleAttorney: GooglePlacesAttorney,
  userLat: number,
  userLng: number
): any {
  // Calculate distance from user
  const distance = calculateDistance(
    userLat,
    userLng,
    googleAttorney.geometry.location.lat,
    googleAttorney.geometry.location.lng
  );

  return {
    id: googleAttorney.place_id,
    name: googleAttorney.name,
    detailedLocation: googleAttorney.formatted_address,
    location: `${(distance / 1609.34).toFixed(1)} mi`, // Convert meters to miles
    lat: googleAttorney.geometry.location.lat,
    lng: googleAttorney.geometry.location.lng,
    phone: googleAttorney.formatted_phone_number,
    website: googleAttorney.website,
    rating: googleAttorney.rating || 0,
    // Default values for required fields
    cases: 0,
    featured: false,
    image: '',
    languages: ['English'],
    specialization: 'General Practice',
    email: undefined,
    // Enhanced properties with defaults
    feeStructure: 'mixed' as const,
    firmSize: 'solo' as const,
    experienceYears: 5,
    availability: 'consultation-only' as const,
    consultationFee: undefined,
    acceptsNewClients: true,
    emergencyAvailable: false,
    virtualConsultation: false,
    inPersonConsultation: true,
    verified: false,
    source: 'Google Places',
    lastVerified: new Date().toISOString()
  };
}

/**
 * Calculate distance between two points using Haversine formula
 */
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
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
 * Check if Google Places API is available and configured
 */
export function isGooglePlacesAvailable(): boolean {
  const hasKey = !!GOOGLE_PLACES_API_KEY;
  const isValidKey = GOOGLE_PLACES_API_KEY.length >= 30 && 
                     (GOOGLE_PLACES_API_KEY.startsWith('AIza') || 
                      GOOGLE_PLACES_API_KEY.startsWith('AIza')); // Allow for any valid Google API key format
  
  console.log('🔧 Google Places Availability Check:');
  console.log('  - Has API Key:', hasKey);
  console.log('  - API Key Length:', GOOGLE_PLACES_API_KEY.length);
  console.log('  - API Key Preview:', GOOGLE_PLACES_API_KEY ? GOOGLE_PLACES_API_KEY.substring(0, 8) + '...' : 'None');
  console.log('  - Valid API Key Format:', isValidKey);
  console.log('  - Final Status:', hasKey && isValidKey ? '✅ AVAILABLE' : '❌ NOT AVAILABLE');
  
  if (!hasKey) {
    console.warn('⚠️ Google Places API Key not found. Check environment variable configuration.');
  } else if (!isValidKey) {
    console.warn('⚠️ Google Places API Key format appears invalid. Expected 30+ characters starting with AIza.');
  }
  
  return hasKey && isValidKey;
}

// Default export for Expo Router compatibility
export default {
  searchAttorneysWithGooglePlaces,
  getAttorneyDetails,
  searchAttorneysByQuery,
  convertGooglePlacesToAttorney,
  isGooglePlacesAvailable
};
