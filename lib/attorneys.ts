import { performanceOptimizer } from '@/utils/performanceOptimizer';
import { searchStateBarAttorneys, hasStateBarAPI } from './stateBarAPI';
import { searchLSCAttorneys, searchLegalAidOrganizations, hasLegalAidOrganization } from './legalAidAPI';
import { searchACLUAttorneys, searchNLGAttorneys, searchCivilRightsOrganizations, hasCivilRightsOrganization } from './civilRightsAPI';

export interface Attorney {
  id: string;
  name: string;
  cases?: number;
  detailedLocation: string;
  featured: boolean;
  image: string;
  languages: string[];
  lat: number;
  lng: number;
  location: string;
  phone?: string;
  rating: number;
  specialization: string;
  website?: string;
  email?: string;
  // Enhanced properties for filtering
  feeStructure: 'pro-bono' | 'sliding-scale' | 'contingency' | 'flat-fee' | 'hourly' | 'mixed';
  firmSize: 'solo' | 'small-firm' | 'large-firm';
  experienceYears: number;
  availability: 'immediate' | 'within-week' | 'within-month' | 'consultation-only';
  consultationFee?: number;
  acceptsNewClients: boolean;
  emergencyAvailable: boolean;
  virtualConsultation: boolean;
  inPersonConsultation: boolean;
  // Verification fields
  verified: boolean;
  source: string; // Which organization verified this attorney
  lastVerified: string; // Date of last verification
}

// Real data sources for attorney information across the U.S.
const ATTORNEY_DATA_SOURCES = {
  // American Bar Association - National attorney directory
  ABA_DIRECTORY: 'https://www.americanbar.org/groups/civil_rights/',
  // Legal Services Corporation - National legal aid directory
  LSC_DIRECTORY: 'https://www.lsc.gov/find-legal-aid',
  // Pro Bono Net - National pro bono attorney directory
  PROBONO_NET: 'https://www.probono.net/',
  // Immigration Advocates Network - National immigration attorney directory
  IAN_DIRECTORY: 'https://www.immigrationadvocates.org/nonprofit/legaldirectory/search',
  // ACLU Affiliates - National civil rights attorneys
  ACLU_AFFILIATES: 'https://www.aclu.org/affiliates/',
  // National Immigration Law Center - National immigration attorneys
  NILC: 'https://www.nilc.org/',
  // National Lawyers Guild - National civil rights attorneys
  NLG: 'https://www.nlg.org/',
  // State Bar Associations - All 50 states + territories
  STATE_BARS: {
    AL: 'https://www.alabar.org/',
    AK: 'https://www.alaskabar.org/',
    AZ: 'https://www.azbar.org/',
    AR: 'https://www.arkbar.com/',
    CA: 'https://www.calbar.ca.gov/',
    CO: 'https://www.cobar.org/',
    CT: 'https://www.ctbar.org/',
    DE: 'https://www.dsba.org/',
    FL: 'https://www.floridabar.org/',
    GA: 'https://www.gabar.org/',
    HI: 'https://www.hsba.org/',
    ID: 'https://isb.idaho.gov/',
    IL: 'https://www.isba.org/',
    IN: 'https://www.inbar.org/',
    IA: 'https://www.iowabar.org/',
    KS: 'https://www.ksbar.org/',
    KY: 'https://www.kybar.org/',
    LA: 'https://www.lsba.org/',
    ME: 'https://www.mainebar.org/',
    MD: 'https://www.msba.org/',
    MA: 'https://www.massbar.org/',
    MI: 'https://www.michbar.org/',
    MN: 'https://www.mnbar.org/',
    MS: 'https://www.msbar.org/',
    MO: 'https://www.mobar.org/',
    MT: 'https://www.montanabar.org/',
    NE: 'https://www.nebar.com/',
    NV: 'https://nvbar.org/',
    NH: 'https://www.nhbar.org/',
    NJ: 'https://www.njsba.com/',
    NM: 'https://www.nmbar.org/',
    NY: 'https://nysba.org/',
    NC: 'https://www.ncbar.org/',
    ND: 'https://www.sband.org/',
    OH: 'https://www.ohiobar.org/',
    OK: 'https://www.okbar.org/',
    OR: 'https://www.osbar.org/',
    PA: 'https://www.pabar.org/',
    RI: 'https://www.ribar.com/',
    SC: 'https://www.scbar.org/',
    SD: 'https://www.sdbar.org/',
    TN: 'https://www.tba.org/',
    TX: 'https://www.texasbar.com/',
    UT: 'https://www.utahbar.org/',
    VT: 'https://www.vtbar.org/',
    VA: 'https://www.vsb.org/',
    WA: 'https://www.wsba.org/',
    WV: 'https://www.wvbar.org/',
    WI: 'https://www.wisbar.org/',
    WY: 'https://www.wyomingbar.org/',
    // Territories
    PR: 'https://www.capr.org/',
    VI: 'https://www.vibar.org/',
    GU: 'https://www.guambar.org/',
    AS: 'https://www.amsamoa.gov/',
    MP: 'https://www.cnmilaw.org/',
    DC: 'https://www.dcbar.org/'
  },
  // Legal Aid Organizations by State
  LEGAL_AID_ORGANIZATIONS: {
    // This would be populated with real legal aid organizations for each state
    NATIONAL: 'https://www.lsc.gov/find-legal-aid',
    CALIFORNIA: 'https://www.lsc.gov/grants/grantee/california-rural-legal-assistance',
    TEXAS: 'https://www.lsc.gov/grants/grantee/texas-legal-services-center',
    FLORIDA: 'https://www.floridalegal.org/',
    NEW_YORK: 'https://www.legalaidnyc.org/',
    // ... more states
  }
};

// Civil rights and immigration law specializations
const CIVIL_RIGHTS_SPECIALIZATIONS = [
  'Civil Rights Law',
  'Immigration Law',
  'Constitutional Law',
  'Human Rights Law',
  'Discrimination Law',
  'Police Misconduct',
  'Voting Rights',
  'Employment Discrimination',
  'Housing Discrimination',
  'Education Rights',
  'Disability Rights',
  'LGBTQ+ Rights',
  'Women\'s Rights',
  'Racial Justice',
  'Criminal Justice Reform',
  'Prisoners\' Rights',
  'Environmental Justice',
  'Immigrant Rights',
  'Asylum & Refugee Law',
  'Deportation Defense',
  'First Amendment Rights',
  'Due Process',
  'Equal Protection',
  'Fair Housing',
  'Voting Rights',
  'Police Brutality',
  'Wrongful Arrest',
  'Excessive Force',
  'Racial Profiling'
];

// API configuration
const API_CONFIG = {
  TIMEOUT: 15000, // 15 seconds for real API calls
  MAX_RETRIES: 3,
  CACHE_DURATION: 30 * 60 * 1000, // 30 minutes
  MAX_RESULTS: 50,
  SEARCH_RADIUS: 25, // 25 miles default
};

// State and territory information for location-based attorney search
const US_STATES_AND_TERRITORIES = {
  AL: { name: 'Alabama', lat: 32.3182, lng: -86.9023 },
  AK: { name: 'Alaska', lat: 63.5887, lng: -154.4931 },
  AZ: { name: 'Arizona', lat: 33.7298, lng: -111.4312 },
  AR: { name: 'Arkansas', lat: 34.9697, lng: -92.3731 },
  CA: { name: 'California', lat: 36.7783, lng: -119.4179 },
  CO: { name: 'Colorado', lat: 39.5501, lng: -105.7821 },
  CT: { name: 'Connecticut', lat: 41.6032, lng: -73.0877 },
  DE: { name: 'Delaware', lat: 38.9108, lng: -75.5277 },
  FL: { name: 'Florida', lat: 27.6648, lng: -81.5158 },
  GA: { name: 'Georgia', lat: 32.1656, lng: -82.9001 },
  HI: { name: 'Hawaii', lat: 19.8968, lng: -155.5828 },
  ID: { name: 'Idaho', lat: 44.2405, lng: -114.4788 },
  IL: { name: 'Illinois', lat: 40.3495, lng: -88.9861 },
  IN: { name: 'Indiana', lat: 39.8494, lng: -86.2583 },
  IA: { name: 'Iowa', lat: 42.0329, lng: -93.6238 },
  KS: { name: 'Kansas', lat: 38.5266, lng: -96.7265 },
  KY: { name: 'Kentucky', lat: 37.6681, lng: -84.6701 },
  LA: { name: 'Louisiana', lat: 31.1695, lng: -91.8678 },
  ME: { name: 'Maine', lat: 44.6939, lng: -69.3819 },
  MD: { name: 'Maryland', lat: 39.0639, lng: -76.8021 },
  MA: { name: 'Massachusetts', lat: 42.2304, lng: -71.5301 },
  MI: { name: 'Michigan', lat: 44.3148, lng: -85.6024 },
  MN: { name: 'Minnesota', lat: 46.7296, lng: -94.6859 },
  MS: { name: 'Mississippi', lat: 32.7416, lng: -89.6787 },
  MO: { name: 'Missouri', lat: 38.4561, lng: -92.2884 },
  MT: { name: 'Montana', lat: 46.8797, lng: -110.3626 },
  NE: { name: 'Nebraska', lat: 41.4925, lng: -99.9018 },
  NV: { name: 'Nevada', lat: 38.8026, lng: -116.4194 },
  NH: { name: 'New Hampshire', lat: 43.1939, lng: -71.5724 },
  NJ: { name: 'New Jersey', lat: 40.0583, lng: -74.4057 },
  NM: { name: 'New Mexico', lat: 34.5199, lng: -105.8701 },
  NY: { name: 'New York', lat: 42.1657, lng: -74.9481 },
  NC: { name: 'North Carolina', lat: 35.7596, lng: -79.0193 },
  ND: { name: 'North Dakota', lat: 47.5515, lng: -101.0020 },
  OH: { name: 'Ohio', lat: 40.4173, lng: -82.9071 },
  OK: { name: 'Oklahoma', lat: 35.0078, lng: -97.0929 },
  OR: { name: 'Oregon', lat: 44.5720, lng: -122.0709 },
  PA: { name: 'Pennsylvania', lat: 40.5908, lng: -77.2098 },
  RI: { name: 'Rhode Island', lat: 41.6809, lng: -71.5118 },
  SC: { name: 'South Carolina', lat: 33.8569, lng: -80.9450 },
  SD: { name: 'South Dakota', lat: 44.2998, lng: -99.4388 },
  TN: { name: 'Tennessee', lat: 35.7478, lng: -86.6923 },
  TX: { name: 'Texas', lat: 31.9686, lng: -99.9018 },
  UT: { name: 'Utah', lat: 39.3210, lng: -111.0937 },
  VT: { name: 'Vermont', lat: 44.0459, lng: -72.7107 },
  VA: { name: 'Virginia', lat: 37.4316, lng: -78.6569 },
  WA: { name: 'Washington', lat: 47.7511, lng: -120.7401 },
  WV: { name: 'West Virginia', lat: 38.5976, lng: -80.4549 },
  WI: { name: 'Wisconsin', lat: 44.3148, lng: -89.6385 },
  WY: { name: 'Wyoming', lat: 42.7475, lng: -107.2085 },
  // Territories
  PR: { name: 'Puerto Rico', lat: 18.2208, lng: -66.5901 },
  VI: { name: 'U.S. Virgin Islands', lat: 18.3358, lng: -64.8963 },
  GU: { name: 'Guam', lat: 13.4443, lng: 144.7937 },
  AS: { name: 'American Samoa', lat: -14.2750, lng: -170.1320 },
  MP: { name: 'Northern Mariana Islands', lat: 17.3308, lng: 145.3847 },
  DC: { name: 'District of Columbia', lat: 38.9072, lng: -77.0369 }
};

/**
 * Fetch real attorney data from multiple sources based on location
 * IMPORTANT: This function ONLY returns verified, real attorney data.
 * No fake or generated data is ever returned.
 */
export const fetchRealAttorneys = async (
  latitude: number,
  longitude: number,
  radius: number = API_CONFIG.SEARCH_RADIUS
): Promise<Attorney[]> => {
  const cacheKey = `real_attorneys_${latitude}_${longitude}_${radius}`;
  
  try {
    console.log('🔍 Fetching REAL attorney data for location:', { latitude, longitude, radius });
    
    return await performanceOptimizer.fetchWithCache(cacheKey, async () => {
      const attorneys = await fetchFromMultipleRealSources(latitude, longitude, radius);
      console.log('✅ Successfully fetched real attorneys:', attorneys.length);
      return attorneys;
    }, {
      key: cacheKey,
      duration: API_CONFIG.CACHE_DURATION
    });
  } catch (error) {
    console.error('❌ Error fetching real attorneys:', error);
    console.log('⚠️ No attorneys found - returning empty array to maintain trust');
    return []; // Return empty array instead of fake data
  }
};

/**
 * Fetch attorney data from multiple REAL sources for any U.S. location
 * This function ONLY returns verified, real attorney data from legitimate sources.
 */
const fetchFromMultipleRealSources = async (
  latitude: number,
  longitude: number,
  radius: number
): Promise<Attorney[]> => {
  console.log('🔍 Fetching REAL attorney data from multiple sources for U.S. location...');
  
  // Determine the state/territory based on coordinates
  const locationInfo = getLocationInfo(latitude, longitude);
  console.log('📍 Location detected:', locationInfo);
  
  // Fetch from multiple real sources based on location
  const promises = [
    fetchFromStateBarAssociation(latitude, longitude, radius, locationInfo),
    fetchFromLegalAidOrganizations(latitude, longitude, radius, locationInfo),
    fetchFromProBonoNetworks(latitude, longitude, radius, locationInfo),
    fetchFromCivilRightsOrganizations(latitude, longitude, radius, locationInfo),
    fetchFromImmigrationOrganizations(latitude, longitude, radius, locationInfo),
  ];

  try {
    const results = await Promise.allSettled(promises);
    const allAttorneys: Attorney[] = [];
    
    results.forEach((result, index) => {
      if (result.status === 'fulfilled' && result.value) {
        allAttorneys.push(...result.value);
        console.log(`✅ Source ${index + 1} returned ${result.value.length} real attorneys`);
      } else {
        console.warn(`⚠️ Source ${index + 1} failed:`, result.status === 'rejected' ? result.reason : 'No data');
      }
    });

    // Remove duplicates and filter for civil rights/immigration specialists
    const uniqueAttorneys = removeDuplicates(allAttorneys);
    const filteredAttorneys = filterCivilRightsAttorneys(uniqueAttorneys);
    
    console.log(`📊 Total real attorneys found: ${allAttorneys.length}, Unique: ${uniqueAttorneys.length}, Civil Rights: ${filteredAttorneys.length}`);
    
    // If no real attorneys found, return empty array
    if (filteredAttorneys.length === 0) {
      console.log('⚠️ No real attorneys found in this area');
      return [];
    }
    
    return filteredAttorneys.slice(0, API_CONFIG.MAX_RESULTS);
  } catch (error) {
    console.error('❌ Error in fetchFromMultipleRealSources:', error);
    console.log('⚠️ Error occurred while fetching real attorneys. Returning empty array to maintain trust.');
    return []; // Return empty array instead of fake data
  }
};

/**
 * Get location information (state/territory) based on coordinates
 */
const getLocationInfo = (latitude: number, longitude: number): { state: string; name: string; lat: number; lng: number } => {
  // Find the closest state/territory to the given coordinates
  let closestState = 'CA'; // Default to California
  let minDistance = Infinity;
  
  for (const [code, info] of Object.entries(US_STATES_AND_TERRITORIES)) {
    const distance = calculateDistance(latitude, longitude, info.lat, info.lng);
    if (distance < minDistance) {
      minDistance = distance;
      closestState = code;
    }
  }
  
  return {
    state: closestState,
    ...US_STATES_AND_TERRITORIES[closestState as keyof typeof US_STATES_AND_TERRITORIES]
  };
};

/**
 * Fetch from State Bar Association - REAL DATA ONLY
 */
const fetchFromStateBarAssociation = async (
  latitude: number,
  longitude: number,
  radius: number,
  locationInfo: { state: string; name: string; lat: number; lng: number }
): Promise<Attorney[]> => {
  try {
    console.log(`🔍 Fetching from ${locationInfo.name} Bar Association...`);
    
    // Check if state bar API is available
    if (!hasStateBarAPI(locationInfo.state)) {
      console.log(`⚠️ No API available for ${locationInfo.name} State Bar`);
      return [];
    }
    
    // Search for civil rights and immigration attorneys
    const specializations = [
      'Civil Rights Law',
      'Immigration Law',
      'Constitutional Law',
      'Police Misconduct',
      'Employment Discrimination',
      'Housing Discrimination'
    ];
    
    const attorneys = await searchStateBarAttorneys(
      locationInfo.state,
      latitude,
      longitude,
      radius,
      specializations
    );
    
    console.log(`✅ Found ${attorneys.length} verified attorneys from ${locationInfo.name} State Bar`);
    return attorneys;
    
  } catch (error) {
    console.warn(`⚠️ ${locationInfo.name} State Bar Association unavailable:`, error);
    return [];
  }
};

/**
 * Fetch from Legal Aid Organizations - REAL DATA ONLY
 */
const fetchFromLegalAidOrganizations = async (
  latitude: number,
  longitude: number,
  radius: number,
  locationInfo: { state: string; name: string; lat: number; lng: number }
): Promise<Attorney[]> => {
  try {
    console.log('🔍 Fetching from Legal Aid organizations...');
    
    const allAttorneys: Attorney[] = [];
    
    // Search LSC (national)
    try {
      const lscAttorneys = await searchLSCAttorneys(latitude, longitude, radius);
      allAttorneys.push(...lscAttorneys);
    } catch (error) {
      console.warn('⚠️ LSC search failed:', error);
    }
    
    // Search state-specific legal aid organizations
    const stateLegalAidKey = `${locationInfo.state}_${getStateLegalAidSuffix(locationInfo.state)}`;
    if (hasLegalAidOrganization(stateLegalAidKey)) {
      try {
        const stateAttorneys = await searchLegalAidOrganizations(
          latitude,
          longitude,
          radius
        );
        allAttorneys.push(...stateAttorneys);
      } catch (error) {
        console.warn(`⚠️ ${locationInfo.name} Legal Aid search failed:`, error);
      }
    }
    
    console.log(`✅ Found ${allAttorneys.length} verified attorneys from Legal Aid organizations`);
    return allAttorneys;
    
  } catch (error) {
    console.warn('⚠️ Legal Aid organizations unavailable:', error);
    return [];
  }
};

/**
 * Get state-specific legal aid organization suffix
 */
const getStateLegalAidSuffix = (stateCode: string): string => {
  const suffixes: Record<string, string> = {
    CA: 'CRLA',
    TX: 'TLSC',
    FL: 'FLS',
    NY: 'LANYC',
    IL: 'CLA',
  };
  return suffixes[stateCode] || '';
};

/**
 * Fetch from Pro Bono Networks - REAL DATA ONLY
 */
const fetchFromProBonoNetworks = async (
  latitude: number,
  longitude: number,
  radius: number,
  locationInfo: { state: string; name: string; lat: number; lng: number }
): Promise<Attorney[]> => {
  try {
    console.log('🔍 Fetching from Pro Bono networks...');
    
    // Pro Bono Net integration would go here
    // Currently using LSC which includes pro bono attorneys
    // TODO: Add direct Pro Bono Net API integration when available
    
    console.log('⚠️ Pro Bono Net API not yet implemented - using LSC data');
    return []; // Return empty array until Pro Bono Net API is implemented
    
  } catch (error) {
    console.warn('⚠️ Pro Bono networks unavailable:', error);
    return [];
  }
};

/**
 * Fetch from Civil Rights Organizations - REAL DATA ONLY
 */
const fetchFromCivilRightsOrganizations = async (
  latitude: number,
  longitude: number,
  radius: number,
  locationInfo: { state: string; name: string; lat: number; lng: number }
): Promise<Attorney[]> => {
  try {
    console.log('🔍 Fetching from Civil Rights organizations...');
    
    const allAttorneys: Attorney[] = [];
    
    // Search ACLU (national)
    try {
      const acluAttorneys = await searchACLUAttorneys(latitude, longitude, radius);
      allAttorneys.push(...acluAttorneys);
    } catch (error) {
      console.warn('⚠️ ACLU search failed:', error);
    }
    
    // Search NLG (national)
    try {
      const nlgAttorneys = await searchNLGAttorneys(latitude, longitude, radius);
      allAttorneys.push(...nlgAttorneys);
    } catch (error) {
      console.warn('⚠️ NLG search failed:', error);
    }
    
    // Search other civil rights organizations based on location
    const civilRightsOrgs = getRelevantCivilRightsOrganizations(locationInfo.state);
    for (const orgKey of civilRightsOrgs) {
      if (hasCivilRightsOrganization(orgKey)) {
        try {
          const orgAttorneys = await searchCivilRightsOrganizations(
            latitude,
            longitude,
            radius
          );
          allAttorneys.push(...orgAttorneys);
        } catch (error) {
          console.warn(`⚠️ ${orgKey} search failed:`, error);
        }
      }
    }
    
    console.log(`✅ Found ${allAttorneys.length} verified attorneys from Civil Rights organizations`);
    return allAttorneys;
    
  } catch (error) {
    console.warn('⚠️ Civil Rights organizations unavailable:', error);
    return [];
  }
};

/**
 * Get relevant civil rights organizations for a state
 */
const getRelevantCivilRightsOrganizations = (stateCode: string): string[] => {
  const orgsByState: Record<string, string[]> = {
    CA: ['SPLC', 'LAMBDA_LEGAL', 'AAAJ', 'MALDEF'],
    TX: ['SPLC', 'MALDEF'],
    FL: ['SPLC', 'LAMBDA_LEGAL'],
    NY: ['LAMBDA_LEGAL', 'AAAJ'],
    IL: ['LAMBDA_LEGAL', 'AAAJ'],
    GA: ['SPLC'],
    AL: ['SPLC'],
    MS: ['SPLC'],
    LA: ['SPLC'],
  };
  return orgsByState[stateCode] || [];
};

/**
 * Fetch from Immigration Organizations - REAL DATA ONLY
 */
const fetchFromImmigrationOrganizations = async (
  latitude: number,
  longitude: number,
  radius: number,
  locationInfo: { state: string; name: string; lat: number; lng: number }
): Promise<Attorney[]> => {
  try {
    console.log('🔍 Fetching from Immigration organizations...');
    
    // Immigration Advocates Network (IAN) integration would go here
    // National Immigration Law Center (NILC) integration would go here
    // TODO: Add direct immigration organization API integrations when available
    
    console.log('⚠️ Immigration organizations API not yet implemented - using LSC and civil rights data');
    return []; // Return empty array until immigration APIs are implemented
    
  } catch (error) {
    console.warn('⚠️ Immigration organizations unavailable:', error);
    return [];
  }
};

/**
 * Remove duplicate attorneys based on name and location
 */
const removeDuplicates = (attorneys: Attorney[]): Attorney[] => {
  const seen = new Set();
  return attorneys.filter(attorney => {
    const key = `${attorney.name}-${attorney.lat}-${attorney.lng}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
};

/**
 * Filter attorneys to focus on civil rights and immigration law
 */
const filterCivilRightsAttorneys = (attorneys: Attorney[]): Attorney[] => {
  return attorneys.filter(attorney => {
    const specialization = attorney.specialization.toLowerCase();
    return CIVIL_RIGHTS_SPECIALIZATIONS.some(spec => 
      specialization.includes(spec.toLowerCase())
    );
  });
};

/**
 * Calculate distance between two points
 */
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 3959; // Earth's radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

/**
 * Get attorneys with enhanced data for any U.S. location
 * IMPORTANT: This function ONLY returns verified, real attorney data.
 * No fake or generated data is ever returned.
 */
export const getAttorneys = async (
  latitude: number,
  longitude: number,
  radius: number = API_CONFIG.SEARCH_RADIUS
): Promise<Attorney[]> => {
  try {
    const attorneys = await fetchRealAttorneys(latitude, longitude, radius);
    
    // If no real attorneys found, return empty array
    if (attorneys.length === 0) {
      console.log('⚠️ No real attorneys found in this area. Users should be informed that no verified attorneys are available.');
      return [];
    }
    
    // Add distance calculations for real attorneys only
    const attorneysWithDistance = attorneys.map(attorney => ({
      ...attorney,
      distance: calculateDistance(latitude, longitude, attorney.lat, attorney.lng)
    }));
    
    // Sort by distance and rating
    return attorneysWithDistance.sort((a, b) => {
      if (a.distance !== b.distance) {
        return a.distance - b.distance;
      }
      return b.rating - a.rating;
    });
  } catch (error) {
    console.error('❌ Error in getAttorneys:', error);
    console.log('⚠️ Error occurred. Returning empty array to maintain trust.');
    return []; // Return empty array instead of fake data
  }
}; 