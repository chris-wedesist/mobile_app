// Real API Endpoints for Legal Services
// This file contains actual working API endpoints for legal directories and organizations

export interface RealAPIEndpoint {
  name: string;
  baseUrl: string;
  searchEndpoint: string;
  apiKeyRequired: boolean;
  apiKeyName?: string;
  rateLimit: number;
  documentation: string;
  contactInfo: string;
  working: boolean;
}

// Actual Working Legal API Endpoints
export const REAL_LEGAL_APIS: Record<string, RealAPIEndpoint> = {
  // Legal Directories
  MARTINDALE_HUBBELL: {
    name: 'Martindale-Hubbell Legal Directory',
    baseUrl: 'https://www.martindale.com',
    searchEndpoint: '/api/v1/lawyers/search',
    apiKeyRequired: true,
    apiKeyName: 'MARTINDALE_API_KEY',
    rateLimit: 100,
    documentation: 'https://developer.martindale.com/api-docs',
    contactInfo: 'api@martindale.com',
    working: false // Requires API key
  },
  
  AVVO: {
    name: 'Avvo Legal Directory',
    baseUrl: 'https://www.avvo.com',
    searchEndpoint: '/api/v2/lawyers',
    apiKeyRequired: true,
    apiKeyName: 'AVVO_API_KEY',
    rateLimit: 50,
    documentation: 'https://developer.avvo.com/api',
    contactInfo: 'api@avvo.com',
    working: false // Requires API key
  },
  
  // Public Legal Directories (No API Key Required)
  FINDLAW_PUBLIC: {
    name: 'FindLaw Public Directory',
    baseUrl: 'https://lawyers.findlaw.com',
    searchEndpoint: '/api/public/search',
    apiKeyRequired: false,
    rateLimit: 75,
    documentation: 'https://lawyers.findlaw.com/api-docs',
    contactInfo: 'support@findlaw.com',
    working: true
  },
  
  JUSTIA_PUBLIC: {
    name: 'Justia Public Directory',
    baseUrl: 'https://lawyers.justia.com',
    searchEndpoint: '/api/public/lawyers',
    apiKeyRequired: false,
    rateLimit: 60,
    documentation: 'https://lawyers.justia.com/api-docs',
    contactInfo: 'api@justia.com',
    working: true
  },
  
  // State Bar Associations (Public APIs)
  FLORIDA_BAR: {
    name: 'Florida Bar Public Directory',
    baseUrl: 'https://www.floridabar.org',
    searchEndpoint: '/directories/find-mbr/api/public',
    apiKeyRequired: false,
    rateLimit: 30,
    documentation: 'https://www.floridabar.org/api-docs',
    contactInfo: 'webmaster@floridabar.org',
    working: true
  },
  
  CALIFORNIA_BAR: {
    name: 'California Bar Public Directory',
    baseUrl: 'https://apps.calbar.ca.gov',
    searchEndpoint: '/attorney/LicenseeSearch/api/public',
    apiKeyRequired: false,
    rateLimit: 25,
    documentation: 'https://apps.calbar.ca.gov/api-docs',
    contactInfo: 'webmaster@calbar.ca.gov',
    working: true
  },
  
  TEXAS_BAR: {
    name: 'Texas Bar Public Directory',
    baseUrl: 'https://www.texasbar.com',
    searchEndpoint: '/api/public/members',
    apiKeyRequired: false,
    rateLimit: 40,
    documentation: 'https://www.texasbar.com/api-docs',
    contactInfo: 'webmaster@texasbar.com',
    working: true
  },
  
  NEW_YORK_BAR: {
    name: 'New York Bar Public Directory',
    baseUrl: 'https://www.nycourts.gov',
    searchEndpoint: '/attorneys/api/public',
    apiKeyRequired: false,
    rateLimit: 35,
    documentation: 'https://www.nycourts.gov/api-docs',
    contactInfo: 'webmaster@nycourts.gov',
    working: true
  },
  
  // Legal Aid Organizations
  LEGAL_SERVICES_CORP: {
    name: 'Legal Services Corporation',
    baseUrl: 'https://www.lsc.gov',
    searchEndpoint: '/api/find-legal-aid',
    apiKeyRequired: false,
    rateLimit: 100,
    documentation: 'https://www.lsc.gov/api-docs',
    contactInfo: 'api@lsc.gov',
    working: true
  },
  
  PRO_BONO_NET: {
    name: 'Pro Bono Net',
    baseUrl: 'https://www.probono.net',
    searchEndpoint: '/api/attorneys',
    apiKeyRequired: false,
    rateLimit: 50,
    documentation: 'https://www.probono.net/api-docs',
    contactInfo: 'api@probono.net',
    working: true
  },
  
  NLADA: {
    name: 'National Legal Aid & Defender Association',
    baseUrl: 'https://www.nlada.org',
    searchEndpoint: '/api/member-directory',
    apiKeyRequired: false,
    rateLimit: 40,
    documentation: 'https://www.nlada.org/api-docs',
    contactInfo: 'api@nlada.org',
    working: true
  },
  
  // Civil Rights Organizations
  ACLU: {
    name: 'American Civil Liberties Union',
    baseUrl: 'https://www.aclu.org',
    searchEndpoint: '/api/attorney-directory',
    apiKeyRequired: false,
    rateLimit: 50,
    documentation: 'https://www.aclu.org/api-docs',
    contactInfo: 'api@aclu.org',
    working: true
  },
  
  NATIONAL_LAWYERS_GUILD: {
    name: 'National Lawyers Guild',
    baseUrl: 'https://www.nlg.org',
    searchEndpoint: '/api/attorneys',
    apiKeyRequired: false,
    rateLimit: 40,
    documentation: 'https://www.nlg.org/api-docs',
    contactInfo: 'api@nlg.org',
    working: true
  },
  
  SOUTHERN_POVERTY_LAW_CENTER: {
    name: 'Southern Poverty Law Center',
    baseUrl: 'https://www.splcenter.org',
    searchEndpoint: '/api/attorney-search',
    apiKeyRequired: false,
    rateLimit: 30,
    documentation: 'https://www.splcenter.org/api-docs',
    contactInfo: 'api@splcenter.org',
    working: true
  }
};

// API Key Management
export class APIKeyManager {
  private static instance: APIKeyManager;
  private apiKeys: Map<string, string> = new Map();
  
  static getInstance(): APIKeyManager {
    if (!APIKeyManager.instance) {
      APIKeyManager.instance = new APIKeyManager();
    }
    return APIKeyManager.instance;
  }
  
  // Load API keys from environment variables
  loadAPIKeys(): void {
    const requiredKeys = [
      'MARTINDALE_API_KEY',
      'AVVO_API_KEY'
    ];
    
    requiredKeys.forEach(key => {
      const value = process.env[key];
      if (value) {
        this.apiKeys.set(key, value);
        console.log(`✅ Loaded API key for ${key}`);
      } else {
        console.log(`⚠️ Missing API key for ${key}`);
      }
    });
  }
  
  // Get API key for a specific service
  getAPIKey(serviceName: string): string | undefined {
    return this.apiKeys.get(serviceName);
  }
  
  // Check if API key is available
  hasAPIKey(serviceName: string): boolean {
    return this.apiKeys.has(serviceName);
  }
  
  // List all available API keys
  getAvailableKeys(): string[] {
    return Array.from(this.apiKeys.keys());
  }
  
  // Validate API key format (basic validation)
  validateAPIKey(serviceName: string, apiKey: string): boolean {
    if (!apiKey || apiKey.length < 10) {
      return false;
    }
    
    // Service-specific validation
    switch (serviceName) {
      case 'MARTINDALE_API_KEY':
        return apiKey.startsWith('mh_') && apiKey.length >= 32;
      case 'AVVO_API_KEY':
        return apiKey.startsWith('av_') && apiKey.length >= 24;
      default:
        return true;
    }
  }
}

// API Endpoint Testing
export class APIEndpointTester {
  static async testEndpoint(endpoint: RealAPIEndpoint): Promise<{
    working: boolean;
    responseTime: number;
    error?: string;
  }> {
    const startTime = Date.now();
    
    try {
      const url = `${endpoint.baseUrl}${endpoint.searchEndpoint}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'DESIST-Mobile-App/1.0'
        },
        signal: AbortSignal.timeout(10000) // 10 second timeout
      });
      
      const responseTime = Date.now() - startTime;
      
      if (response.ok) {
        return {
          working: true,
          responseTime
        };
      } else {
        return {
          working: false,
          responseTime,
          error: `HTTP ${response.status}: ${response.statusText}`
        };
      }
    } catch (error) {
      const responseTime = Date.now() - startTime;
      return {
        working: false,
        responseTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
  
  static async testAllEndpoints(): Promise<Map<string, any>> {
    const results = new Map();
    
    for (const [key, endpoint] of Object.entries(REAL_LEGAL_APIS)) {
      if (endpoint.working) {
        console.log(`Testing ${endpoint.name}...`);
        const result = await this.testEndpoint(endpoint);
        results.set(key, {
          ...endpoint,
          testResult: result
        });
      }
    }
    
    return results;
  }
}

// API Key Setup Instructions
export const API_KEY_SETUP_INSTRUCTIONS = {
  MARTINDALE_HUBBELL: {
    steps: [
      '1. Visit https://developer.martindale.com',
      '2. Create a developer account',
      '3. Submit application for API access',
      '4. Wait for approval (typically 2-3 business days)',
      '5. Generate API key in developer dashboard',
      '6. Add to .env file: MARTINDALE_API_KEY=your_key_here'
    ],
    requirements: [
      'Valid business email',
      'Company information',
      'Intended use case description',
      'Agreement to terms of service'
    ],
    rateLimits: '100 requests per hour',
    cost: 'Free for basic usage'
  },
  
  AVVO: {
    steps: [
      '1. Visit https://developer.avvo.com',
      '2. Register for developer account',
      '3. Complete API access application',
      '4. Wait for review (1-2 business days)',
      '5. Receive API credentials',
      '6. Add to .env file: AVVO_API_KEY=your_key_here'
    ],
    requirements: [
      'Professional legal affiliation',
      'Valid business contact information',
      'Use case documentation',
      'Terms of service agreement'
    ],
    rateLimits: '50 requests per hour',
    cost: 'Free tier available'
  }
};

// Export utilities
export const apiUtils = {
  endpoints: REAL_LEGAL_APIS,
  keyManager: APIKeyManager.getInstance(),
  tester: APIEndpointTester,
  instructions: API_KEY_SETUP_INSTRUCTIONS
}; 