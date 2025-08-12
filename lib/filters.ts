import { debug } from '../utils/debug';

export const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  // Earth radius in miles
  const R = 3958.8;
  
  // Convert latitude and longitude from degrees to radians
  const φ1 = lat1 * Math.PI/180;
  const φ2 = lat2 * Math.PI/180;
  const Δφ = (lat2-lat1) * Math.PI/180;
  const Δλ = (lon2-lon1) * Math.PI/180;

  // Haversine formula
  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  
  // Distance in miles
  return R * c;
};

export const applyRadiusFilter = (
  attorneys: any[],
  userLat: number,
  userLng: number,
  radius: number
): any[] => {
  debug('FILTER', `Filtering ${attorneys.length} attorneys within ${radius} miles`);
  
  // If radius is 0 or not provided, return all results
  if (!radius) return attorneys;
  
  const filteredResults = attorneys.filter(attorney => {
    // Skip if attorney has no location data
    if (!attorney.location?.latitude || !attorney.location?.longitude) {
      debug('FILTER', `Attorney ${attorney.id} has no valid location data`);
      return false;
    }
    
    const distance = calculateDistance(
      userLat,
      userLng,
      attorney.location.latitude,
      attorney.location.longitude
    );
    
    // Add distance to attorney object for UI display
    attorney.distance = distance;
    
    return distance <= radius;
  });
  
  debug('FILTER', `After filtering: ${filteredResults.length} attorneys within radius`);
  return filteredResults;
}; 