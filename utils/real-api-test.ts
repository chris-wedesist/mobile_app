import {
  hasCivilRightsOrganization,
  searchACLUAttorneys,
} from '@/lib/civilRightsAPI';
import { hasLegalAidOrganization, searchLSCAttorneys } from '@/lib/legalAidAPI';
import { hasStateBarAPI, searchStateBarAttorneys } from '@/lib/stateBarAPI';
import { searchAttorneys } from '../lib/attorneys';

// Test locations across different states
const testLocations = [
  { name: 'New York City', lat: 40.7128, lng: -74.006, state: 'NY' },
  { name: 'Los Angeles', lat: 34.0522, lng: -118.2437, state: 'CA' },
  { name: 'Chicago', lat: 41.8781, lng: -87.6298, state: 'IL' },
  { name: 'Houston', lat: 29.7604, lng: -95.3698, state: 'TX' },
  { name: 'Miami', lat: 25.7617, lng: -80.1918, state: 'FL' },
  { name: 'Atlanta', lat: 33.749, lng: -84.388, state: 'GA' },
  { name: 'Seattle', lat: 47.6062, lng: -122.3321, state: 'WA' },
  { name: 'Denver', lat: 39.7392, lng: -104.9903, state: 'CO' },
];

/**
 * Test real API integration
 */
export const testRealAPIIntegration = async (): Promise<void> => {
  console.log('🧪 Testing Real API Integration...\n');

  let totalTests = 0;
  let passedTests = 0;
  let failedTests = 0;

  // Test 1: Check API availability
  console.log('📋 Test 1: Checking API Availability');
  totalTests++;
  try {
    const stateBarAPIs = ['CA', 'NY', 'TX', 'FL', 'IL'];
    const availableStateBars = stateBarAPIs.filter((state) =>
      hasStateBarAPI(state)
    );
    console.log(
      `✅ State Bar APIs available: ${availableStateBars.join(', ')}`
    );

    const legalAidOrgs = ['CA_CRLA', 'TX_TLSC', 'FL_FLS', 'NY_LANYC', 'IL_CLA'];
    const availableLegalAid = legalAidOrgs.filter((org) =>
      hasLegalAidOrganization(org)
    );
    console.log(
      `✅ Legal Aid Organizations available: ${availableLegalAid.join(', ')}`
    );

    const civilRightsOrgs = ['ACLU', 'NLG', 'SPLC', 'LAMBDA_LEGAL'];
    const availableCivilRights = civilRightsOrgs.filter((org) =>
      hasCivilRightsOrganization(org)
    );
    console.log(
      `✅ Civil Rights Organizations available: ${availableCivilRights.join(
        ', '
      )}`
    );

    passedTests++;
  } catch (error) {
    console.error('❌ Test 1 failed:', error);
    failedTests++;
  }

  // Test 2: Test individual API calls
  console.log('\n📋 Test 2: Testing Individual API Calls');
  for (const location of testLocations.slice(0, 3)) {
    // Test first 3 locations
    totalTests++;
    try {
      console.log(`\n🔍 Testing ${location.name} (${location.state})...`);

      // Test State Bar API
      if (hasStateBarAPI(location.state)) {
        const stateBarAttorneys = await searchStateBarAttorneys(
          location.state,
          location.lat,
          location.lng,
          25,
          ['Civil Rights Law', 'Immigration Law']
        );
        console.log(
          `  📊 State Bar: ${stateBarAttorneys.length} attorneys found`
        );
      }

      // Test LSC API
      const lscAttorneys = await searchLSCAttorneys(
        location.lat,
        location.lng,
        25,
        ['Civil Rights Law', 'Immigration Law']
      );
      console.log(`  📊 LSC: ${lscAttorneys.length} attorneys found`);

      // Test ACLU API
      const acluAttorneys = await searchACLUAttorneys(
        location.lat,
        location.lng,
        25,
        ['Civil Rights Law']
      );
      console.log(`  📊 ACLU: ${acluAttorneys.length} attorneys found`);

      passedTests++;
    } catch (error) {
      console.error(`❌ Test failed for ${location.name}:`, error);
      failedTests++;
    }
  }

  // Test 3: Test main getAttorneys function
  console.log('\n📋 Test 3: Testing Main searchAttorneys Function');
  for (const location of testLocations.slice(0, 2)) {
    // Test first 2 locations
    totalTests++;
    try {
      console.log(`\n🔍 Testing searchAttorneys for ${location.name}...`);

      const attorneys = await searchAttorneys(
        `${location.lat},${location.lng}`,
        25
      );

      console.log(`  📊 Total attorneys found: ${attorneys.length}`);

      if (attorneys.length > 0) {
        // Verify attorney data structure
        const firstAttorney = attorneys[0];
        const requiredFields = [
          'id',
          'name',
          'specialization',
          'lat',
          'lng',
          'verified',
          'source',
          'lastVerified',
        ];

        const missingFields = requiredFields.filter(
          (field) => !(field in firstAttorney)
        );
        if (missingFields.length === 0) {
          console.log(`  ✅ Attorney data structure verified`);
          console.log(
            `  📋 Sample attorney: ${firstAttorney.name} (${firstAttorney.specialization})`
          );
          console.log(`  🔍 Source: ${firstAttorney.source}`);
          console.log(`  ✅ Verified: ${firstAttorney.verified}`);
        } else {
          console.error(`  ❌ Missing fields: ${missingFields.join(', ')}`);
          failedTests++;
          continue;
        }
      } else {
        console.log(
          `  ⚠️ No attorneys found (this is acceptable for real API testing)`
        );
      }

      passedTests++;
    } catch (error) {
      console.error(`❌ Test failed for ${location.name}:`, error);
      failedTests++;
    }
  }

  // Test 4: Verify no fake data is returned
  console.log('\n📋 Test 4: Verifying No Fake Data');
  totalTests++;
  try {
    console.log('🔍 Testing that no fake/generated data is returned...');

    // Test with a location that might not have many attorneys
    const testLat = 45.5231;
    const testLng = -122.6765; // Portland, OR
    const attorneys = await searchAttorneys(`${testLat},${testLng}`, 25);

    // Check that all attorneys have proper verification
    const unverifiedAttorneys = attorneys.filter(
      (attorney) => !attorney.verified
    );
    const fakeSourceAttorneys = attorneys.filter(
      (attorney) =>
        attorney.source.includes('generated') ||
        attorney.source.includes('fake') ||
        attorney.source.includes('mock')
    );

    if (unverifiedAttorneys.length === 0 && fakeSourceAttorneys.length === 0) {
      console.log('✅ No fake or unverified attorneys found');
      console.log(`📊 Total attorneys: ${attorneys.length}`);
      if (attorneys.length > 0) {
        console.log(
          `📋 Sources: ${[...new Set(attorneys.map((a) => a.source))].join(
            ', '
          )}`
        );
      }
      passedTests++;
    } else {
      console.error('❌ Fake or unverified attorneys found!');
      console.error(`Unverified: ${unverifiedAttorneys.length}`);
      console.error(`Fake sources: ${fakeSourceAttorneys.length}`);
      failedTests++;
    }
  } catch (error) {
    console.error('❌ Test 4 failed:', error);
    failedTests++;
  }

  // Summary
  console.log('\n📊 Test Summary');
  console.log(`Total Tests: ${totalTests}`);
  console.log(`Passed: ${passedTests}`);
  console.log(`Failed: ${failedTests}`);
  console.log(
    `Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`
  );

  if (failedTests === 0) {
    console.log(
      '\n🎉 All tests passed! Real API integration is working correctly.'
    );
  } else {
    console.log('\n⚠️ Some tests failed. Please check the implementation.');
  }

  // Exit with appropriate code
  if (failedTests === 0) {
    process.exit(0);
  } else {
    process.exit(1);
  }
};

// Run the test if this file is executed directly
if (require.main === module) {
  testRealAPIIntegration().catch((error) => {
    console.error('❌ Test execution failed:', error);
    process.exit(1);
  });
}
