#!/usr/bin/env node

/**
 * Google Places API Configuration Validator
 * 
 * This script validates that the Google Places API is properly configured
 * for the DESIST mobile app and can be used to troubleshoot configuration issues.
 */

const fs = require('fs');
const path = require('path');

function validateGooglePlacesConfig() {
  console.log('🔧 Google Places API Configuration Validator\n');
  
  // Check app.json configuration
  console.log('📋 Checking app.json configuration...');
  
  try {
    const appJsonPath = path.join(__dirname, '../app.json');
    const appJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));
    
    const apiKey = appJson.expo?.extra?.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY;
    
    if (!apiKey) {
      console.log('❌ EXPO_PUBLIC_GOOGLE_PLACES_API_KEY not found in app.json extra configuration');
      return false;
    }
    
    console.log('✅ API key found in app.json');
    console.log(`   - Key length: ${apiKey.length}`);
    console.log(`   - Key preview: ${apiKey.substring(0, 8)}...`);
    
    // Validate key format
    if (!apiKey.startsWith('AIza') || apiKey.length < 30) {
      console.log('❌ API key format appears invalid');
      console.log('   Expected: AIzaSy... (at least 30 characters)');
      return false;
    }
    
    console.log('✅ API key format is valid');
    
    // Check for duplicate extra entries
    const appJsonContent = fs.readFileSync(appJsonPath, 'utf8');
    const extraCount = (appJsonContent.match(/"extra"\s*:/g) || []).length;
    
    if (extraCount > 1) {
      console.log('⚠️  Warning: Multiple "extra" entries detected in app.json');
      console.log('   This could cause configuration issues');
    } else {
      console.log('✅ Single extra configuration found');
    }
    
    return true;
    
  } catch (error) {
    console.log('❌ Error reading app.json:', error.message);
    return false;
  }
}

function checkEnvironmentVariables() {
  console.log('\n🌍 Checking environment variables...');
  
  // Check .env file
  try {
    const envPath = path.join(__dirname, '../.env');
    const envContent = fs.readFileSync(envPath, 'utf8');
    
    const envApiKey = envContent
      .split('\n')
      .find(line => line.startsWith('EXPO_PUBLIC_GOOGLE_PLACES_API_KEY='))
      ?.split('=')[1]?.trim();
    
    if (envApiKey) {
      console.log('✅ API key found in .env file');
      console.log(`   - Key preview: ${envApiKey.substring(0, 8)}...`);
    } else {
      console.log('ℹ️  API key not found in .env file (using app.json configuration)');
    }
    
  } catch (error) {
    console.log('ℹ️  .env file not found or unreadable (using app.json configuration)');
  }
}

function provideTroubleshootingTips() {
  console.log('\n🛠️  Troubleshooting Tips:');
  console.log('');
  console.log('If you\'re still experiencing issues:');
  console.log('');
  console.log('1. Verify Google Cloud Configuration:');
  console.log('   - Ensure Places API is enabled in Google Cloud Console');
  console.log('   - Check that billing is set up for the project');
  console.log('   - Verify API key restrictions allow your app\'s usage');
  console.log('');
  console.log('2. Check Expo Configuration:');
  console.log('   - Clear Expo cache: expo start --clear');
  console.log('   - Rebuild the project: expo prebuild --clean');
  console.log('');
  console.log('3. Test API Key:');
  console.log('   - Use Google\'s API key testing tool');
  console.log('   - Try a simple Places API request in browser/Postman');
  console.log('');
  console.log('4. Monitor Console Logs:');
  console.log('   - Check for detailed error messages in app console');
  console.log('   - Look for "Google Places Availability Check" debug output');
}

// Run validation
const isValid = validateGooglePlacesConfig();
checkEnvironmentVariables();

console.log('\n📊 Validation Results:');
if (isValid) {
  console.log('✅ Google Places API configuration appears correct');
  console.log('   The app should be able to access the Google Places API');
} else {
  console.log('❌ Google Places API configuration has issues');
  console.log('   Please fix the issues above before using the app');
}

provideTroubleshootingTips();

process.exit(isValid ? 0 : 1);