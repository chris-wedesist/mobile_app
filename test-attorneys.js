// Simple test to verify attorney data fetching works for any U.S. location
const { getAttorneys } = require('./lib/attorneys.ts');

async function testAttorneyFetching() {
  console.log('🧪 Testing attorney data fetching for U.S. locations...\n');
  
  const testLocations = [
    { name: 'New York City', lat: 40.7128, lng: -74.0060 },
    { name: 'Los Angeles', lat: 34.0522, lng: -118.2437 },
    { name: 'Chicago', lat: 41.8781, lng: -87.6298 },
    { name: 'Houston', lat: 29.7604, lng: -95.3698 },
    { name: 'San Francisco', lat: 37.7749, lng: -122.4194 },
    { name: 'Miami', lat: 25.7617, lng: -80.1918 },
    { name: 'Seattle', lat: 47.6062, lng: -122.3321 },
    { name: 'Denver', lat: 39.7392, lng: -104.9903 },
    { name: 'Washington DC', lat: 38.9072, lng: -77.0369 },
    // Territories
    { name: 'San Juan, Puerto Rico', lat: 18.2208, lng: -66.5901 },
    { name: 'Charlotte Amalie, USVI', lat: 18.3358, lng: -64.8963 },
    { name: 'Hagåtña, Guam', lat: 13.4443, lng: 144.7937 },
  ];

  let allTestsPassed = true;

  for (const location of testLocations) {
    try {
      console.log(`📍 Testing ${location.name} (${location.lat}, ${location.lng})...`);
      
      const attorneys = await getAttorneys(location.lat, location.lng, 25);
      
      // Basic validation
      if (!attorneys || !Array.isArray(attorneys)) {
        console.log(`❌ ${location.name}: No attorneys returned`);
        allTestsPassed = false;
        continue;
      }
      
      if (attorneys.length === 0) {
        console.log(`❌ ${location.name}: No attorneys found`);
        allTestsPassed = false;
        continue;
      }
      
      // Validate attorney data structure
      const validAttorneys = attorneys.filter(attorney => {
        return attorney.id && 
               attorney.name && 
               attorney.specialization && 
               attorney.lat && 
               attorney.lng &&
               attorney.feeStructure &&
               attorney.firmSize &&
               attorney.experienceYears &&
               attorney.availability;
      });
      
      if (validAttorneys.length !== attorneys.length) {
        console.log(`❌ ${location.name}: Invalid attorney data structure`);
        allTestsPassed = false;
        continue;
      }
      
      // Check for civil rights specializations
      const civilRightsCount = attorneys.filter(a => 
        a.specialization === 'Civil Rights Law' || 
        a.specialization === 'Immigration Law' ||
        a.specialization === 'Constitutional Law' ||
        a.specialization === 'Police Misconduct'
      ).length;
      
      const civilRightsPercentage = (civilRightsCount / attorneys.length) * 100;
      
      console.log(`✅ ${location.name}: Found ${attorneys.length} attorneys (${civilRightsPercentage.toFixed(1)}% civil rights)`);
      
      // Show sample attorney
      const sampleAttorney = attorneys[0];
      console.log(`   Sample: ${sampleAttorney.name} - ${sampleAttorney.specialization} (${sampleAttorney.feeStructure})`);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.log(`❌ ${location.name}: Error - ${errorMessage}`);
      allTestsPassed = false;
    }
  }
  
  console.log('\n📊 Test Summary:');
  if (allTestsPassed) {
    console.log('✅ All location tests passed! Attorney data fetching works for any U.S. location.');
  } else {
    console.log('❌ Some location tests failed. Check the implementation.');
  }
  
  return allTestsPassed;
}

// Run the test
testAttorneyFetching().then(success => {
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('Test failed:', error);
  process.exit(1);
}); 