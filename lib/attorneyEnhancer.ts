// Attorney Web Enhancement Module
// Provides functionality to enhance attorney data with web scraping

// Local Attorney interface to avoid import issues
interface Attorney {
  id: string;
  name: string;
  address: string;
  phone: string;
  website?: string;
  rating?: number;
  distance?: number;
  specializations: string[];
  languages: string[];
  proBono?: boolean;
  slidingScale?: boolean;
  feeStructure?: 'hourly' | 'flat-fee' | 'contingency' | 'mixed';
  firmSize?: 'solo' | 'small' | 'medium' | 'large';
  experience?: number;
  acceptsNewClients?: boolean;
  emergencyAvailable?: boolean;
  consultationType?: 'virtual' | 'in-person' | 'both';
}

interface EnhancedAttorney extends Attorney {
  enhancedData?: {
    proBono: boolean;
    slidingScale: boolean;
    feeStructure: 'hourly' | 'flat-fee' | 'contingency' | 'mixed';
    firmSize: 'solo' | 'small' | 'medium' | 'large';
    experience: number;
    acceptsNewClients: boolean;
    emergencyAvailable: boolean;
    consultationType: 'virtual' | 'in-person' | 'both';
    languages: string[];
    specializations: string[];
  };
}

// Google Search API configuration
const GOOGLE_SEARCH_CONFIG = {
  API_KEY: process.env.EXPO_PUBLIC_GOOGLE_SEARCH_API_KEY || '',
  ENGINE_ID: process.env.EXPO_PUBLIC_GOOGLE_SEARCH_ENGINE_ID || '',
  BASE_URL: 'https://www.googleapis.com/customsearch/v1',
  MAX_RESULTS: 3,
  RATE_LIMIT_DELAY: 1000, // 1 second between requests
};

// Web scraping configuration
const SCRAPING_CONFIG = {
  TIMEOUT: 10000, // 10 seconds
  MAX_RETRIES: 2,
  USER_AGENT: 'Mozilla/5.0 (compatible; LegalApp/1.0)',
};

/**
 * Find attorney website using Google Search API
 */
export async function findAttorneyWebsite(
  attorney: Attorney
): Promise<string | null> {
  if (!GOOGLE_SEARCH_CONFIG.API_KEY || !GOOGLE_SEARCH_CONFIG.ENGINE_ID) {
    console.log(
      '⚠️ Google Search API not configured - skipping website discovery'
    );
    return null;
  }

  try {
    const searchQuery = `${attorney.name} ${attorney.address} attorney law firm website`;
    const params = new URLSearchParams({
      key: GOOGLE_SEARCH_CONFIG.API_KEY,
      cx: GOOGLE_SEARCH_CONFIG.ENGINE_ID,
      q: searchQuery,
      num: GOOGLE_SEARCH_CONFIG.MAX_RESULTS.toString(),
    });

    const response = await fetch(`${GOOGLE_SEARCH_CONFIG.BASE_URL}?${params}`, {
      headers: {
        'User-Agent': SCRAPING_CONFIG.USER_AGENT,
      },
      signal: AbortSignal.timeout(SCRAPING_CONFIG.TIMEOUT),
    });

    if (!response.ok) {
      throw new Error(`Google Search API error: ${response.status}`);
    }

    const data = await response.json();

    if (!data.items || data.items.length === 0) {
      return null;
    }

    // Find the most relevant result (usually the first one)
    const bestResult = data.items[0];
    return bestResult.link || null;
  } catch (error) {
    console.log(`❌ Error finding website for ${attorney.name}:`, error);
    return null;
  }
}

/**
 * Scrape attorney website for enhanced data
 */
export async function scrapeAttorneyWebsite(
  websiteUrl: string
): Promise<Partial<EnhancedAttorney['enhancedData']> | null> {
  try {
    const response = await fetch(websiteUrl, {
      headers: {
        'User-Agent': SCRAPING_CONFIG.USER_AGENT,
      },
      signal: AbortSignal.timeout(SCRAPING_CONFIG.TIMEOUT),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const html = await response.text();
    const enhancedData: Partial<EnhancedAttorney['enhancedData']> = {};

    // Extract pro bono information
    const proBonoPatterns = [
      /pro\s*bono/i,
      /free\s*legal\s*services/i,
      /no\s*cost\s*consultation/i,
      /free\s*consultation/i,
    ];
    enhancedData.proBono = proBonoPatterns.some((pattern) =>
      pattern.test(html)
    );

    // Extract sliding scale information
    const slidingScalePatterns = [
      /sliding\s*scale/i,
      /income\s*based/i,
      /payment\s*plans/i,
      /flexible\s*pricing/i,
    ];
    enhancedData.slidingScale = slidingScalePatterns.some((pattern) =>
      pattern.test(html)
    );

    // Extract fee structure
    if (/hourly\s*rate/i.test(html)) {
      enhancedData.feeStructure = 'hourly';
    } else if (/flat\s*fee/i.test(html) || /fixed\s*price/i.test(html)) {
      enhancedData.feeStructure = 'flat-fee';
    } else if (
      /contingency/i.test(html) ||
      /no\s*fee\s*unless\s*we\s*win/i.test(html)
    ) {
      enhancedData.feeStructure = 'contingency';
    } else {
      enhancedData.feeStructure = 'mixed';
    }

    // Extract firm size indicators
    if (
      /solo\s*practitioner/i.test(html) ||
      /individual\s*practice/i.test(html)
    ) {
      enhancedData.firmSize = 'solo';
    } else if (/small\s*firm/i.test(html) || /boutique/i.test(html)) {
      enhancedData.firmSize = 'small';
    } else if (/large\s*firm/i.test(html) || /national\s*firm/i.test(html)) {
      enhancedData.firmSize = 'large';
    } else {
      enhancedData.firmSize = 'medium';
    }

    // Extract experience information
    const experienceMatch = html.match(/(\d+)\s*(?:years?|yrs?)\s*experience/i);
    if (experienceMatch) {
      enhancedData.experience = parseInt(experienceMatch[1]);
    }

    // Extract new client acceptance
    const newClientPatterns = [
      /accepting\s*new\s*clients/i,
      /taking\s*new\s*cases/i,
      /open\s*to\s*new\s*clients/i,
    ];
    enhancedData.acceptsNewClients = newClientPatterns.some((pattern) =>
      pattern.test(html)
    );

    // Extract emergency availability
    const emergencyPatterns = [
      /emergency\s*services/i,
      /24\s*hour/i,
      /after\s*hours/i,
      /urgent\s*legal\s*help/i,
    ];
    enhancedData.emergencyAvailable = emergencyPatterns.some((pattern) =>
      pattern.test(html)
    );

    // Extract consultation type
    if (/virtual\s*consultation/i.test(html) && /in\s*person/i.test(html)) {
      enhancedData.consultationType = 'both';
    } else if (
      /virtual\s*consultation/i.test(html) ||
      /video\s*consultation/i.test(html)
    ) {
      enhancedData.consultationType = 'virtual';
    } else if (/in\s*person/i.test(html) || /office\s*visit/i.test(html)) {
      enhancedData.consultationType = 'in-person';
    }

    // Extract languages
    const languagePatterns = [
      /spanish/i,
      /french/i,
      /german/i,
      /italian/i,
      /portuguese/i,
      /chinese/i,
      /japanese/i,
      /korean/i,
      /vietnamese/i,
      /arabic/i,
      /russian/i,
      /polish/i,
      /greek/i,
      /hebrew/i,
      /hindi/i,
    ];
    enhancedData.languages = languagePatterns
      .map((pattern) => {
        const match = html.match(pattern);
        return match ? match[0] : null;
      })
      .filter((lang) => lang !== null) as string[];

    // Extract specializations
    const specializationPatterns = [
      /civil\s*rights/i,
      /immigration/i,
      /constitutional/i,
      /police\s*misconduct/i,
      /discrimination/i,
      /asylum/i,
      /deportation/i,
      /first\s*amendment/i,
      /voting\s*rights/i,
      /employment\s*discrimination/i,
      /housing\s*discrimination/i,
      /education\s*law/i,
      /disability\s*rights/i,
      /lgbtq/i,
      /women\s*rights/i,
      /racial\s*justice/i,
      /criminal\s*justice/i,
      /prisoners\s*rights/i,
      /environmental\s*justice/i,
      /immigrant\s*rights/i,
    ];
    enhancedData.specializations = specializationPatterns
      .map((pattern) => {
        const match = html.match(pattern);
        return match ? match[0] : null;
      })
      .filter((spec) => spec !== null) as string[];

    return enhancedData;
  } catch (error) {
    console.log(`❌ Error scraping website ${websiteUrl}:`, error);
    return null;
  }
}

/**
 * Enhance attorneys with web data
 */
export async function enhanceAttorneysWithWebData(
  attorneys: Attorney[]
): Promise<EnhancedAttorney[]> {
  console.log(`🔍 Enhancing ${attorneys.length} attorneys with web data...`);

  const enhancedAttorneys: EnhancedAttorney[] = [];
  let processedCount = 0;
  const maxConcurrent = 3; // Rate limiting

  for (const attorney of attorneys) {
    try {
      // Find website
      const websiteUrl = await findAttorneyWebsite(attorney);

      if (websiteUrl) {
        // Scrape website for enhanced data
        const enhancedData = await scrapeAttorneyWebsite(websiteUrl);

        if (enhancedData) {
          enhancedAttorneys.push({
            ...attorney,
            website: websiteUrl,
            enhancedData: enhancedData as any,
          });
        } else {
          enhancedAttorneys.push({
            ...attorney,
            website: websiteUrl,
          });
        }
      } else {
        enhancedAttorneys.push(attorney);
      }

      processedCount++;
      console.log(
        `✅ Enhanced ${processedCount}/${attorneys.length}: ${attorney.name}`
      );

      // Rate limiting
      if (processedCount % maxConcurrent === 0) {
        await new Promise((resolve) =>
          setTimeout(resolve, GOOGLE_SEARCH_CONFIG.RATE_LIMIT_DELAY)
        );
      }
    } catch (error) {
      console.log(`❌ Error enhancing ${attorney.name}:`, error);
      enhancedAttorneys.push(attorney);
    }
  }

  console.log(
    `✅ Enhanced ${enhancedAttorneys.length} attorneys with web data`
  );
  return enhancedAttorneys;
}

/**
 * Filter attorneys based on enhanced criteria
 */
export function filterEnhancedAttorneys(
  attorneys: EnhancedAttorney[],
  filters: {
    proBono?: boolean;
    slidingScale?: boolean;
    feeStructure?: string[];
    firmSize?: string[];
    experience?: number;
    acceptsNewClients?: boolean;
    emergencyAvailable?: boolean;
    consultationType?: string[];
    languages?: string[];
    specializations?: string[];
  }
): EnhancedAttorney[] {
  return attorneys.filter((attorney) => {
    // Pro Bono filter
    if (filters.proBono && !attorney.enhancedData?.proBono) {
      return false;
    }

    // Sliding scale filter
    if (filters.slidingScale && !attorney.enhancedData?.slidingScale) {
      return false;
    }

    // Fee structure filter
    if (filters.feeStructure && filters.feeStructure.length > 0) {
      if (
        !attorney.enhancedData?.feeStructure ||
        !filters.feeStructure.includes(attorney.enhancedData.feeStructure)
      ) {
        return false;
      }
    }

    // Firm size filter
    if (filters.firmSize && filters.firmSize.length > 0) {
      if (
        !attorney.enhancedData?.firmSize ||
        !filters.firmSize.includes(attorney.enhancedData.firmSize)
      ) {
        return false;
      }
    }

    // Experience filter
    if (filters.experience && attorney.enhancedData?.experience) {
      if (attorney.enhancedData.experience < filters.experience) {
        return false;
      }
    }

    // New client acceptance filter
    if (
      filters.acceptsNewClients &&
      !attorney.enhancedData?.acceptsNewClients
    ) {
      return false;
    }

    // Emergency availability filter
    if (
      filters.emergencyAvailable &&
      !attorney.enhancedData?.emergencyAvailable
    ) {
      return false;
    }

    // Consultation type filter
    if (filters.consultationType && filters.consultationType.length > 0) {
      if (
        !attorney.enhancedData?.consultationType ||
        !filters.consultationType.includes(
          attorney.enhancedData.consultationType
        )
      ) {
        return false;
      }
    }

    // Languages filter
    if (filters.languages && filters.languages.length > 0) {
      const attorneyLanguages = [
        ...(attorney.languages || []),
        ...(attorney.enhancedData?.languages || []),
      ];
      if (!filters.languages.some((lang) => attorneyLanguages.includes(lang))) {
        return false;
      }
    }

    // Specializations filter
    if (filters.specializations && filters.specializations.length > 0) {
      const attorneySpecializations = [
        ...(attorney.specializations || []),
        ...(attorney.enhancedData?.specializations || []),
      ];
      if (
        !filters.specializations.some((spec) =>
          attorneySpecializations.includes(spec)
        )
      ) {
        return false;
      }
    }

    return true;
  });
}

/**
 * Sort attorneys by relevance using enhanced data
 */
export function sortEnhancedAttorneysByRelevance(
  attorneys: EnhancedAttorney[],
  priority: 'proBono' | 'slidingScale' | 'experience' | 'distance' = 'distance'
): EnhancedAttorney[] {
  return [...attorneys].sort((a, b) => {
    switch (priority) {
      case 'proBono':
        if (a.enhancedData?.proBono && !b.enhancedData?.proBono) return -1;
        if (!a.enhancedData?.proBono && b.enhancedData?.proBono) return 1;
        break;

      case 'slidingScale':
        if (a.enhancedData?.slidingScale && !b.enhancedData?.slidingScale)
          return -1;
        if (!a.enhancedData?.slidingScale && b.enhancedData?.slidingScale)
          return 1;
        break;

      case 'experience':
        const expA = a.enhancedData?.experience || 0;
        const expB = b.enhancedData?.experience || 0;
        return expB - expA;

      case 'distance':
      default:
        const distA = a.distance || 0;
        const distB = b.distance || 0;
        return distA - distB;
    }

    return 0;
  });
}

export default {
  findAttorneyWebsite,
  scrapeAttorneyWebsite,
  enhanceAttorneysWithWebData,
  filterEnhancedAttorneys,
  sortEnhancedAttorneysByRelevance,
};
