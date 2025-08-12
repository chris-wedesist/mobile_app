import axios from 'axios';
import Constants from 'expo-constants';

export interface Attorney {
  id: string;
  name: string;
  location: {
    address: string;
    latitude?: number;
    longitude?: number;
  };
  rating?: number;
  userRatingsTotal?: number;
  distance?: number;
  photoReference?: string;
  businessStatus?: string;
  placeId: string;
  // Additional fields that might be used in the UI
  lat?: number;
  lng?: number;
  specialization?: string;
  languages?: string[];
  detailedLocation?: string;
  feeStructure?: string;
  firmSize?: string;
  // Missing fields found in TypeScript errors
  experienceYears?: number;
  phone?: string;
  email?: string;
  website?: string;
  availability?: string; // Changed from object to string to match usage
  virtualConsultation?: boolean;
  inPersonConsultation?: boolean;
  acceptsNewClients?: boolean;
  emergencyAvailable?: boolean;
  consultationFee?: number | string;
  cases?: Array<{
    type: string;
    outcome: string;
    year: number;
  }>;
}

const API_TIMEOUT_MS = 15000;

export const searchAttorneys = async (location: string, radius: number) => {
  try {
    const apiClient = axios.create({
      timeout: API_TIMEOUT_MS,
    });
    
    const response = await apiClient.get(
      'https://maps.googleapis.com/maps/api/place/textsearch/json',
      {
        params: {
          query: `attorneys near ${location}`,
          radius: radius * 1609.34, // Convert miles to meters
          key: Constants.expoConfig?.extra?.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY || process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY,
        },
      }
    );
    
    if (response.data.status !== 'OK') {
      console.error('Google API error:', response.data.status, response.data.error_message);
      throw new Error(`Google Places API error: ${response.data.status}`);
    }
    
    return response.data.results.map(mapGooglePlaceToAttorney);
  } catch (error) {
    console.error('Attorney search failed:', error);
    throw error; // Don't fallback to fake data - propagate error
  }
};

const mapGooglePlaceToAttorney = (place: any): Attorney => {
  // Only map fields actually available from Google Places API
  return {
    id: place.place_id,
    name: place.name,
    location: {
      address: place.formatted_address || '',
      latitude: place.geometry?.location?.lat,
      longitude: place.geometry?.location?.lng,
    },
    // Only include fields directly available from the API
    rating: place.rating || 0,
    userRatingsTotal: place.user_ratings_total || 0,
    // Include place_id for fetching additional details if needed
    placeId: place.place_id,
    // Add photo reference if available
    photoReference: place.photos?.[0]?.photo_reference,
    // Include business status
    businessStatus: place.business_status || 'UNKNOWN'
  };
}; 