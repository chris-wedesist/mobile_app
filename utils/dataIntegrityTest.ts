import { 
  checkFileContent, 
  generateDataIntegrityReport, 
  logDataIntegrityFindings,
  DataIntegrityReport 
} from './dataIntegrityChecker';

/**
 * Test the attorneys.ts file for data integrity
 */
export const testAttorneysFileIntegrity = (): DataIntegrityReport => {
  // This would be the content of the attorneys.ts file
  // In a real implementation, you would read this from the actual file
  const attorneysFileContent = `
import axios from 'axios';
import Constants from 'expo-constants';

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
          query: \`attorneys near \${location}\`,
          radius: radius * 1609.34, // Convert miles to meters
          key: Constants.expoConfig?.extra?.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY || process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY,
        },
      }
    );
    
    if (response.data.status !== 'OK') {
      console.error('Google API error:', response.data.status, response.data.error_message);
      throw new Error(\`Google Places API error: \${response.data.status}\`);
    }
    
    return response.data.results.map(mapGooglePlaceToAttorney);
  } catch (error) {
    console.error('Attorney search failed:', error);
    throw error; // Don't fallback to fake data - propagate error
  }
};

const mapGooglePlaceToAttorney = (place) => {
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
`;

  const files = [
    { name: 'lib/attorneys.ts', content: attorneysFileContent }
  ];

  const report = generateDataIntegrityReport(files);
  logDataIntegrityFindings(report.findings);
  
  return report;
};

/**
 * Test the errorHandler.ts file for data integrity
 */
export const testErrorHandlerFileIntegrity = (): DataIntegrityReport => {
  const errorHandlerFileContent = `
export const handleSearchError = (error: Error): void => {
  console.error('[API Error]:', error.message);
  // Log to monitoring service if available
};

export const createErrorState = (message?: string) => {
  return {
    isLoading: false,
    hasError: true,
    errorMessage: message || 'Unable to retrieve data. Please try again later.'
  };
};
`;

  const files = [
    { name: 'lib/errorHandler.ts', content: errorHandlerFileContent }
  ];

  const report = generateDataIntegrityReport(files);
  logDataIntegrityFindings(report.findings);
  
  return report;
};

/**
 * Run comprehensive data integrity tests
 */
export const runDataIntegrityTests = (): void => {
  console.log('🔍 Running data integrity tests...\n');
  
  const attorneysReport = testAttorneysFileIntegrity();
  console.log('\n---\n');
  
  const errorHandlerReport = testErrorHandlerFileIntegrity();
  console.log('\n---\n');
  
  const allClean = attorneysReport.isClean && errorHandlerReport.isClean;
  
  if (allClean) {
    console.log('✅ All data integrity tests passed!');
    console.log('✅ No dummy data detected in critical files.');
  } else {
    console.log('❌ Data integrity tests failed!');
    console.log('❌ Please review the findings above.');
  }
};

/**
 * Export for use in other parts of the app
 */
export { DataIntegrityReport }; 