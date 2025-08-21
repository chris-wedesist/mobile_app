import axios from 'axios';
import Constants from 'expo-constants';

// Google Places API available types that can be used for filtering
export type GooglePlaceType =
  | 'lawyer'
  | 'legal_services'
  | 'establishment'
  | 'point_of_interest';

// Filter categories based on what we can reasonably infer from Google Places data
export type AttorneyTag =
  | 'highly_rated' // rating >= 4.0
  | 'well_reviewed' // userRatingsTotal >= 10
  | 'established' // businessStatus === 'OPERATIONAL'
  | 'verified' // has photo and complete address
  | 'nearby' // within close distance
  | 'accessible' // complete address information
  | 'responsive'; // recently updated or active

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
  // Google Places API derived data
  types?: string[];
  priceLevel?: number; // 0-4 scale from Google Places
  openingHours?: {
    openNow?: boolean;
    periods?: any[];
  };
  // Inferred tags based on available data
  tags?: AttorneyTag[];
  // Legacy fields (kept for compatibility but not populated from Google API)
  lat?: number;
  lng?: number;
  specialization?: string;
  languages?: string[];
  detailedLocation?: string;
  feeStructure?: string;
  firmSize?: string;
  experienceYears?: number;
  phone?: string;
  email?: string;
  website?: string;
  availability?: string;
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
          key:
            Constants.expoConfig?.extra?.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY ||
            process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY,
        },
      }
    );

    if (response.data.status !== 'OK') {
      console.error(
        'Google API error:',
        response.data.status,
        response.data.error_message
      );
      throw new Error(`Google Places API error: ${response.data.status}`);
    }

    return response.data.results.map(mapGooglePlaceToAttorney);
  } catch (error) {
    console.error('Attorney search failed:', error);
    throw error; // Don't fallback to fake data - propagate error
  }
};

const mapGooglePlaceToAttorney = (place: any): Attorney => {
  const attorney: Attorney = {
    id: place.place_id,
    name: place.name,
    location: {
      address: place.formatted_address || '',
      latitude: place.geometry?.location?.lat,
      longitude: place.geometry?.location?.lng,
    },
    rating: place.rating || 0,
    userRatingsTotal: place.user_ratings_total || 0,
    placeId: place.place_id,
    photoReference: place.photos?.[0]?.photo_reference,
    businessStatus: place.business_status || 'UNKNOWN',
    types: place.types || [],
    priceLevel: place.price_level,
    openingHours: place.opening_hours
      ? {
          openNow: place.opening_hours.open_now,
          periods: place.opening_hours.periods,
        }
      : undefined,
  };

  // Generate tags based on available Google Places data
  attorney.tags = generateAttorneyTags(attorney);

  return attorney;
};

// Generate tags based on Google Places API data
const generateAttorneyTags = (attorney: Attorney): AttorneyTag[] => {
  const tags: AttorneyTag[] = [];

  // Highly rated: 4.0+ rating
  if (attorney.rating && attorney.rating >= 4.0) {
    tags.push('highly_rated');
  }

  // Well reviewed: 10+ reviews
  if (attorney.userRatingsTotal && attorney.userRatingsTotal >= 10) {
    tags.push('well_reviewed');
  }

  // Established: operational business
  if (attorney.businessStatus === 'OPERATIONAL') {
    tags.push('established');
  }

  // Verified: has photo and complete address
  if (
    attorney.photoReference &&
    attorney.location.address &&
    attorney.location.latitude &&
    attorney.location.longitude
  ) {
    tags.push('verified');
  }

  // Accessible: has complete location data
  if (
    attorney.location.address &&
    attorney.location.latitude &&
    attorney.location.longitude
  ) {
    tags.push('accessible');
  }

  // Responsive: currently open or has opening hours data
  if (attorney.openingHours?.openNow || attorney.openingHours?.periods) {
    tags.push('responsive');
  }

  return tags;
};
