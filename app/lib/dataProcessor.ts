// Data Processing & Deduplication Module
// Feature Set 8: Data Processing & Deduplication

export interface ProcessedAttorney {
  id: string;
  name: string;
  detailedLocation: string;
  location: string;
  lat: number;
  lng: number;
  phone?: string;
  website?: string;
  rating: number;
  cases: number;
  featured: boolean;
  image: string;
  languages: string[];
  specialization: string;
  email?: string;
  feeStructure: 'hourly' | 'contingency' | 'flat-fee' | 'mixed';
  firmSize: 'solo' | 'small' | 'medium' | 'large';
  experienceYears: number;
  availability: 'immediate' | 'consultation-only' | 'limited';
  consultationFee?: number;
  acceptsNewClients: boolean;
  emergencyAvailable: boolean;
  virtualConsultation: boolean;
  inPersonConsultation: boolean;
  verified: boolean;
  source: string;
  lastVerified: string;
  distance?: number;
  // Enhanced fields for civil rights focus
  proBonoAvailable?: boolean;
  slidingScale?: boolean;
  civilRightsSpecializations?: string[];
  immigrationSpecializations?: string[];
}

/**
 * Calculate distance between two points using Haversine formula
 * Feature Set 8: Distance Calculations
 */
export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
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
 * Remove duplicate attorneys across multiple sources
 * Feature Set 8: Duplicate Removal
 */
export function removeDuplicates(attorneys: ProcessedAttorney[]): ProcessedAttorney[] {
  const seen = new Set<string>();
  const uniqueAttorneys: ProcessedAttorney[] = [];

  for (const attorney of attorneys) {
    // Create a unique identifier based on name and location
    const identifier = `${attorney.name.toLowerCase().trim()}_${attorney.lat.toFixed(3)}_${attorney.lng.toFixed(3)}`;
    
    if (!seen.has(identifier)) {
      seen.add(identifier);
      uniqueAttorneys.push(attorney);
    } else {
      // Merge data from duplicate entries
      const existingIndex = uniqueAttorneys.findIndex(a => 
        `${a.name.toLowerCase().trim()}_${a.lat.toFixed(3)}_${a.lng.toFixed(3)}` === identifier
      );
      
      if (existingIndex !== -1) {
        const existing = uniqueAttorneys[existingIndex];
        uniqueAttorneys[existingIndex] = mergeAttorneyData(existing, attorney);
      }
    }
  }

  return uniqueAttorneys;
}

/**
 * Merge data from duplicate attorney entries
 */
function mergeAttorneyData(existing: ProcessedAttorney, duplicate: ProcessedAttorney): ProcessedAttorney {
  return {
    ...existing,
    // Take the higher rating
    rating: Math.max(existing.rating, duplicate.rating),
    // Merge languages
    languages: [...new Set([...existing.languages, ...duplicate.languages])],
    // Merge specializations
    specialization: existing.specialization !== duplicate.specialization 
      ? `${existing.specialization}, ${duplicate.specialization}`
      : existing.specialization,
    // Take the most comprehensive data
    phone: duplicate.phone || existing.phone,
    website: duplicate.website || existing.website,
    email: duplicate.email || existing.email,
    // Merge civil rights specializations
    civilRightsSpecializations: [
      ...(existing.civilRightsSpecializations || []),
      ...(duplicate.civilRightsSpecializations || [])
    ].filter((v, i, a) => a.indexOf(v) === i),
    // Merge immigration specializations
    immigrationSpecializations: [
      ...(existing.immigrationSpecializations || []),
      ...(duplicate.immigrationSpecializations || [])
    ].filter((v, i, a) => a.indexOf(v) === i),
    // Take the most favorable availability
    acceptsNewClients: existing.acceptsNewClients || duplicate.acceptsNewClients,
    emergencyAvailable: existing.emergencyAvailable || duplicate.emergencyAvailable,
    // Update source to reflect multiple sources
    source: `${existing.source}, ${duplicate.source}`,
    lastVerified: new Date().toISOString()
  };
}

/**
 * Standardize data format across different API sources
 * Feature Set 8: Data Transformation
 */
export function standardizeAttorneyData(rawAttorney: any, userLat: number, userLng: number): ProcessedAttorney {
  const distance = calculateDistance(userLat, userLng, rawAttorney.lat, rawAttorney.lng);
  
  return {
    id: rawAttorney.id || `attorney_${Date.now()}_${Math.random()}`,
    name: rawAttorney.name || 'Unknown Attorney',
    detailedLocation: rawAttorney.detailedLocation || rawAttorney.location || 'Location not available',
    location: `${(distance / 1609.34).toFixed(1)} mi`, // Convert meters to miles
    lat: rawAttorney.lat || 0,
    lng: rawAttorney.lng || 0,
    phone: rawAttorney.phone,
    website: rawAttorney.website,
    rating: rawAttorney.rating || 0,
    cases: rawAttorney.cases || 0,
    featured: rawAttorney.featured || false,
    image: rawAttorney.image || '',
    languages: Array.isArray(rawAttorney.languages) ? rawAttorney.languages : ['English'],
    specialization: rawAttorney.specialization || 'General Practice',
    email: rawAttorney.email,
    feeStructure: rawAttorney.feeStructure || 'mixed',
    firmSize: rawAttorney.firmSize || 'solo',
    experienceYears: rawAttorney.experienceYears || 5,
    availability: rawAttorney.availability || 'consultation-only',
    consultationFee: rawAttorney.consultationFee,
    acceptsNewClients: rawAttorney.acceptsNewClients !== false,
    emergencyAvailable: rawAttorney.emergencyAvailable || false,
    virtualConsultation: rawAttorney.virtualConsultation || false,
    inPersonConsultation: rawAttorney.inPersonConsultation !== false,
    verified: rawAttorney.verified || false,
    source: rawAttorney.source || 'Unknown',
    lastVerified: rawAttorney.lastVerified || new Date().toISOString(),
    distance,
    proBonoAvailable: rawAttorney.proBonoAvailable || false,
    slidingScale: rawAttorney.slidingScale || false,
    civilRightsSpecializations: rawAttorney.civilRightsSpecializations || [],
    immigrationSpecializations: rawAttorney.immigrationSpecializations || []
  };
}

/**
 * Filter for civil rights and immigration law specializations
 * Feature Set 8: Quality Filtering
 */
export function filterCivilRightsAttorneys(attorneys: ProcessedAttorney[]): ProcessedAttorney[] {
  const civilRightsKeywords = [
    'civil rights', 'civil-rights', 'civilrights',
    'immigration', 'immigration law', 'immigration-law',
    'constitutional', 'constitutional law',
    'police misconduct', 'police-misconduct',
    'discrimination', 'discrimination law',
    'asylum', 'refugee', 'asylum-refugee',
    'deportation', 'deportation defense',
    'first amendment', 'first-amendment',
    'voting rights', 'voting-rights',
    'employment discrimination', 'employment-discrimination',
    'housing discrimination', 'housing-discrimination',
    'education law', 'education-law',
    'disability rights', 'disability-rights',
    'lgbtq', 'lgbtq+', 'lgbtq rights',
    'women rights', 'womens rights',
    'racial justice', 'racial-justice',
    'criminal justice reform', 'criminal-justice-reform',
    'prisoners rights', 'prisoners-rights',
    'environmental justice', 'environmental-justice',
    'immigrant rights', 'immigrant-rights'
  ];

  return attorneys.filter(attorney => {
    const specialization = attorney.specialization.toLowerCase();
    const civilRightsSpecs = attorney.civilRightsSpecializations || [];
    const immigrationSpecs = attorney.immigrationSpecializations || [];
    
    // Check if attorney has civil rights specializations
    const hasCivilRightsSpecs = civilRightsSpecs.length > 0 || immigrationSpecs.length > 0;
    
    // Check if specialization contains civil rights keywords
    const hasCivilRightsKeywords = civilRightsKeywords.some(keyword => 
      specialization.includes(keyword.toLowerCase())
    );
    
    // Check if attorney offers pro bono or sliding scale (indicating civil rights focus)
    const offersCivilRightsServices = attorney.proBonoAvailable || attorney.slidingScale;
    
    return hasCivilRightsSpecs || hasCivilRightsKeywords || offersCivilRightsServices;
  });
}

/**
 * Sort attorneys by relevance and quality
 */
export function sortAttorneysByRelevance(attorneys: ProcessedAttorney[]): ProcessedAttorney[] {
  return attorneys.sort((a, b) => {
    // Priority 1: Civil rights specializations
    const aCivilRights = (a.civilRightsSpecializations?.length || 0) + (a.immigrationSpecializations?.length || 0);
    const bCivilRights = (b.civilRightsSpecializations?.length || 0) + (b.immigrationSpecializations?.length || 0);
    
    if (aCivilRights !== bCivilRights) {
      return bCivilRights - aCivilRights;
    }
    
    // Priority 2: Pro bono availability
    if (a.proBonoAvailable !== b.proBonoAvailable) {
      return a.proBonoAvailable ? -1 : 1;
    }
    
    // Priority 3: Rating
    if (a.rating !== b.rating) {
      return b.rating - a.rating;
    }
    
    // Priority 4: Distance
    const aDistance = a.distance || 0;
    const bDistance = b.distance || 0;
    if (aDistance !== bDistance) {
      return aDistance - bDistance;
    }
    
    // Priority 5: Experience
    return b.experienceYears - a.experienceYears;
  });
}

/**
 * Main data processing pipeline
 * Feature Set 8: Complete Data Processing
 */
export function processAttorneyData(
  rawAttorneys: any[], 
  userLat: number, 
  userLng: number
): ProcessedAttorney[] {
  console.log(`🔧 Processing ${rawAttorneys.length} raw attorney records...`);
  
  // Step 1: Standardize data format
  const standardizedAttorneys = rawAttorneys.map(attorney => 
    standardizeAttorneyData(attorney, userLat, userLng)
  );
  
  console.log(`✅ Standardized ${standardizedAttorneys.length} attorney records`);
  
  // Step 2: Remove duplicates
  const uniqueAttorneys = removeDuplicates(standardizedAttorneys);
  
  console.log(`✅ Removed duplicates: ${standardizedAttorneys.length} → ${uniqueAttorneys.length} attorneys`);
  
  // Step 3: Filter for civil rights focus
  const civilRightsAttorneys = filterCivilRightsAttorneys(uniqueAttorneys);
  
  console.log(`✅ Filtered for civil rights: ${uniqueAttorneys.length} → ${civilRightsAttorneys.length} attorneys`);
  
  // Step 4: Sort by relevance
  const sortedAttorneys = sortAttorneysByRelevance(civilRightsAttorneys);
  
  console.log(`✅ Sorted ${sortedAttorneys.length} attorneys by relevance`);
  
  return sortedAttorneys;
}

export default {
  calculateDistance,
  removeDuplicates,
  standardizeAttorneyData,
  filterCivilRightsAttorneys,
  sortAttorneysByRelevance,
  processAttorneyData
}; 