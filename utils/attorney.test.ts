import { searchAttorneys } from '../lib/attorneys';

describe('Attorney Data Fetching - U.S. Coverage', () => {
  const testLocations = [
    { name: 'New York City', lat: 40.7128, lng: -74.0060 },
    { name: 'Los Angeles', lat: 34.0522, lng: -118.2437 },
    { name: 'Chicago', lat: 41.8781, lng: -87.6298 },
    { name: 'Houston', lat: 29.7604, lng: -95.3698 },
    { name: 'Phoenix', lat: 33.4484, lng: -112.0740 },
    { name: 'Philadelphia', lat: 39.9526, lng: -75.1652 },
    { name: 'San Antonio', lat: 29.4241, lng: -98.4936 },
    { name: 'San Diego', lat: 32.7157, lng: -117.1611 },
    { name: 'Dallas', lat: 32.7767, lng: -96.7970 },
    { name: 'San Jose', lat: 37.3382, lng: -121.8863 },
    { name: 'Austin', lat: 30.2672, lng: -97.7431 },
    { name: 'Jacksonville', lat: 30.3322, lng: -81.6557 },
    { name: 'Fort Worth', lat: 32.7555, lng: -97.3308 },
    { name: 'Columbus', lat: 39.9612, lng: -82.9988 },
    { name: 'Charlotte', lat: 35.2271, lng: -80.8431 },
    { name: 'San Francisco', lat: 37.7749, lng: -122.4194 },
    { name: 'Indianapolis', lat: 39.7684, lng: -86.1581 },
    { name: 'Seattle', lat: 47.6062, lng: -122.3321 },
    { name: 'Denver', lat: 39.7392, lng: -104.9903 },
    { name: 'Washington DC', lat: 38.9072, lng: -77.0369 },
    // Territories
    { name: 'San Juan, Puerto Rico', lat: 18.2208, lng: -66.5901 },
    { name: 'Charlotte Amalie, USVI', lat: 18.3358, lng: -64.8963 },
    { name: 'Hagåtña, Guam', lat: 13.4443, lng: 144.7937 },
    { name: 'Pago Pago, American Samoa', lat: -14.2750, lng: -170.1320 },
    { name: 'Saipan, Northern Mariana Islands', lat: 17.3308, lng: 145.3847 },
  ];

  test.each(testLocations)('should fetch attorneys for $name', async ({ name, lat, lng }) => {
    console.log(`🧪 Testing attorney fetching for ${name} (${lat}, ${lng})`);
    
    const attorneys = await searchAttorneys(`${lat},${lng}`, 25);
    
    expect(attorneys).toBeDefined();
    expect(Array.isArray(attorneys)).toBe(true);
    expect(attorneys.length).toBeGreaterThan(0);
    
    // Verify attorney data structure
    attorneys.forEach(attorney => {
      expect(attorney).toHaveProperty('id');
      expect(attorney).toHaveProperty('name');
      expect(attorney).toHaveProperty('specialization');
      expect(attorney).toHaveProperty('lat');
      expect(attorney).toHaveProperty('lng');
      expect(attorney).toHaveProperty('feeStructure');
      expect(attorney).toHaveProperty('firmSize');
      expect(attorney).toHaveProperty('experienceYears');
      expect(attorney).toHaveProperty('availability');
      
      // Verify coordinates are within reasonable range
      expect(attorney.lat).toBeGreaterThanOrEqual(-90);
      expect(attorney.lat).toBeLessThanOrEqual(90);
      expect(attorney.lng).toBeGreaterThanOrEqual(-180);
      expect(attorney.lng).toBeLessThanOrEqual(180);
      
      // Verify specialization is civil rights related
      const civilRightsSpecializations = [
        'Civil Rights Law',
        'Immigration Law',
        'Constitutional Law',
        'Police Misconduct',
        'Employment Discrimination',
        'Housing Discrimination'
      ];
      expect(civilRightsSpecializations).toContain(attorney.specialization);
      
      // Verify fee structure is valid
      const validFeeStructures = ['pro-bono', 'sliding-scale', 'contingency', 'flat-fee', 'hourly', 'mixed'];
      expect(validFeeStructures).toContain(attorney.feeStructure);
      
      // Verify firm size is valid
      const validFirmSizes = ['solo', 'small-firm', 'large-firm'];
      expect(validFirmSizes).toContain(attorney.firmSize);
      
      // Verify experience years is reasonable
      expect(attorney.experienceYears).toBeGreaterThanOrEqual(0);
      expect(attorney.experienceYears).toBeLessThanOrEqual(50);
      
      // Verify availability is valid
      const validAvailabilities = ['immediate', 'within-week', 'within-month', 'consultation-only'];
      expect(validAvailabilities).toContain(attorney.availability);
    });
    
    console.log(`✅ ${name}: Found ${attorneys.length} attorneys`);
  });

  test('should handle different search radii', async () => {
    const lat = 40.7128; // New York City
    const lng = -74.0060;
    
    const radius10 = await searchAttorneys(`${lat},${lng}`, 10);
    const radius25 = await searchAttorneys(`${lat},${lng}`, 25);
    const radius50 = await searchAttorneys(`${lat},${lng}`, 50);
    
    expect(radius10.length).toBeGreaterThan(0);
    expect(radius25.length).toBeGreaterThan(0);
    expect(radius50.length).toBeGreaterThan(0);
    
    // More attorneys should be found with larger radius
    expect(radius50.length).toBeGreaterThanOrEqual(radius25.length);
    expect(radius25.length).toBeGreaterThanOrEqual(radius10.length);
  });

  test('should prioritize civil rights and immigration attorneys', async () => {
    const lat = 34.0522; // Los Angeles
    const lng = -118.2437;
    
    const attorneys = await searchAttorneys(`${lat},${lng}`, 25);
    
    const civilRightsCount = attorneys.filter(a => 
      a.specialization === 'Civil Rights Law' || 
      a.specialization === 'Constitutional Law' ||
      a.specialization === 'Police Misconduct'
    ).length;
    
    const immigrationCount = attorneys.filter(a => 
      a.specialization === 'Immigration Law'
    ).length;
    
    expect(civilRightsCount + immigrationCount).toBeGreaterThan(0);
    expect(civilRightsCount + immigrationCount).toBeGreaterThanOrEqual(attorneys.length * 0.5);
  });

  test('should include diverse fee structures', async () => {
    const lat = 41.8781; // Chicago
    const lng = -87.6298;
    
    const attorneys = await searchAttorneys(`${lat},${lng}`, 25);
    const feeStructures = [...new Set(attorneys.map(a => a.feeStructure))];
    
    expect(feeStructures.length).toBeGreaterThan(1);
    expect(feeStructures).toContain('pro-bono');
    expect(feeStructures).toContain('sliding-scale');
  });

  test('should handle edge cases and errors gracefully', async () => {
    // Test with invalid coordinates
    const attorneys = await searchAttorneys('999,999', 25);
    expect(attorneys).toBeDefined();
    expect(Array.isArray(attorneys)).toBe(true);
    expect(attorneys.length).toBeGreaterThan(0);
  });

  test('should provide contact information for attorneys', async () => {
    const lat = 29.7604; // Houston
    const lng = -95.3698;
    
    const attorneys = await searchAttorneys(`${lat},${lng}`, 25);
    
    attorneys.forEach(attorney => {
      // At least one contact method should be available
      const hasContact = attorney.phone || attorney.email || attorney.website;
      expect(hasContact).toBeTruthy();
      
      if (attorney.phone) {
        expect(attorney.phone).toMatch(/^\+1-\d{3}-\d{3}-\d{4}$/);
      }
      
      if (attorney.email) {
        expect(attorney.email).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
      }
      
      if (attorney.website) {
        expect(attorney.website).toMatch(/^https?:\/\/.+/);
      }
    });
  });

  test('should include consultation and availability information', async () => {
    const lat = 32.7157; // San Diego
    const lng = -117.1611;
    
    const attorneys = await searchAttorneys(`${lat},${lng}`, 25);
    
    attorneys.forEach(attorney => {
      expect(typeof attorney.acceptsNewClients).toBe('boolean');
      expect(typeof attorney.emergencyAvailable).toBe('boolean');
      expect(typeof attorney.virtualConsultation).toBe('boolean');
      expect(typeof attorney.inPersonConsultation).toBe('boolean');
      
      // At least one consultation type should be available
      expect(attorney.virtualConsultation || attorney.inPersonConsultation).toBe(true);
    });
  });
}); 