// Using fetch instead of axios to avoid dependency issues

// Google Places API configuration
const GOOGLE_PLACES_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY || '';
const GOOGLE_PLACES_BASE_URL = 'https://maps.googleapis.com/maps/api/place';

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
    if (!GOOGLE_PLACES_API_KEY) {
      console.warn('⚠️ Google Places API key not configured');
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

    const response = await fetch(`${GOOGLE_PLACES_BASE_URL}/nearbysearch/json?${params}`);

    if (response.ok) {
      const data = await response.json();
      if (data.status === 'OK') {
        console.log(`✅ Found ${data.results.length} attorneys via Google Places API`);
        return data.results;
      } else {
        console.error(`❌ Google Places API error: ${data.status}`);
        return [];
      }
    } else {
      console.error(`❌ HTTP error: ${response.status}`);
      return [];
    }
  } catch (error) {
    console.error('❌ Error searching Google Places API:', error);
    return [];
  }
}

/**
 * Get detailed information about a specific attorney/place
 * This function retrieves comprehensive contact and business details
 */
export async function getAttorneyDetails(placeId: string): Promise<GooglePlacesAttorney | null> {
  try {
    if (!GOOGLE_PLACES_API_KEY) {
      console.warn('⚠️ Google Places API key not configured');
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
      if (data.status === 'OK') {
        console.log(`✅ Retrieved detailed information for ${data.result.name}`);
        return data.result;
      } else {
        console.error(`❌ Google Places Details API error: ${data.status}`);
        return null;
      }
    } else {
      console.error(`❌ HTTP error: ${response.status}`);
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
    if (!GOOGLE_PLACES_API_KEY) {
      console.warn('⚠️ Google Places API key not configured');
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
      if (data.status === 'OK') {
        console.log(`✅ Found ${data.results.length} results for query: "${query}"`);
        return data.results;
      } else {
        console.error(`❌ Google Places Text Search API error: ${data.status}`);
        return [];
      }
    } else {
      console.error(`❌ HTTP error: ${response.status}`);
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
  return !!GOOGLE_PLACES_API_KEY;
}
