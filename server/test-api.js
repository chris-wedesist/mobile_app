#!/usr/bin/env node

/**
 * DESIST Management Server API Test Suite
 * Tests all endpoints to ensure they're working correctly
 */

const axios = require('axios');

const API_BASE_URL = 'http://localhost:3000';
const TEST_DEVICE_ID = 'test_device_' + Date.now();

let authTokens = {};
let adminToken = '';

// Test data
const testDevice = {
  deviceId: TEST_DEVICE_ID,
  appVersion: '1.0.0',
  platform: 'ios',
  securityConfig: {
    encryptionEnabled: true,
    biometricEnabled: true,
  },
};

const testConfig = {
  isEnabled: true,
  activationMethod: 'both',
  longPressDeactivationDuration: 3000,
  testingMode: true,
};

// Utility functions
function log(message) {
  console.log(`[${new Date().toLocaleTimeString()}] ${message}`);
}

function logError(message, error) {
  console.error(
    `[${new Date().toLocaleTimeString()}] ❌ ${message}:`,
    error.response?.data || error.message
  );
}

function logSuccess(message) {
  console.log(`[${new Date().toLocaleTimeString()}] ✅ ${message}`);
}

// Test functions
async function testHealthCheck() {
  try {
    const response = await axios.get(`${API_BASE_URL}/health`);
    logSuccess(`Health check passed - Server status: ${response.data.status}`);
    return true;
  } catch (error) {
    logError('Health check failed', error);
    return false;
  }
}

async function testDeviceRegistration() {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/api/auth/register`,
      testDevice
    );
    authTokens = response.data.tokens;
    logSuccess(
      `Device registration successful - Device ID: ${response.data.deviceId}`
    );
    return true;
  } catch (error) {
    logError('Device registration failed', error);
    return false;
  }
}

async function testDeviceStatus() {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/api/devices/${TEST_DEVICE_ID}/status`,
      {
        headers: { Authorization: `Bearer ${authTokens.accessToken}` },
      }
    );
    logSuccess(`Device status retrieved - Online: ${response.data.isOnline}`);
    return true;
  } catch (error) {
    logError('Device status check failed', error);
    return false;
  }
}

async function testConfigUpdate() {
  try {
    const response = await axios.put(
      `${API_BASE_URL}/api/devices/${TEST_DEVICE_ID}/config`,
      { config: testConfig },
      { headers: { Authorization: `Bearer ${authTokens.accessToken}` } }
    );
    logSuccess(`Configuration updated - Version: ${response.data.version}`);
    return true;
  } catch (error) {
    logError('Configuration update failed', error);
    return false;
  }
}

async function testDeviceSync() {
  try {
    const syncData = {
      deviceId: TEST_DEVICE_ID,
      timestamp: new Date().toISOString(),
      config: testConfig,
      performanceMetrics: {
        activationTime: 100,
        deactivationTime: 50,
        totalUsageCount: 1,
        averageDuration: 30000,
        lastUsageTimestamp: new Date().toISOString(),
      },
      accessAttempts: 0,
      isLockedOut: false,
    };

    const response = await axios.post(
      `${API_BASE_URL}/api/devices/${TEST_DEVICE_ID}/sync`,
      syncData,
      { headers: { Authorization: `Bearer ${authTokens.accessToken}` } }
    );

    logSuccess(
      `Device sync successful - Pending commands: ${response.data.pendingCommands.length}`
    );
    return true;
  } catch (error) {
    logError('Device sync failed', error);
    return false;
  }
}

async function testStatusReport() {
  try {
    const statusData = {
      deviceId: TEST_DEVICE_ID,
      isActive: false,
      lastActivationTime: new Date().toISOString(),
      performanceMetrics: {
        activationTime: 100,
        deactivationTime: 50,
        totalUsageCount: 1,
        averageDuration: 30000,
        lastUsageTimestamp: new Date().toISOString(),
      },
      accessAttempts: 0,
      isLockedOut: false,
      timestamp: new Date().toISOString(),
    };

    const response = await axios.post(
      `${API_BASE_URL}/api/devices/${TEST_DEVICE_ID}/status-report`,
      statusData,
      { headers: { Authorization: `Bearer ${authTokens.accessToken}` } }
    );

    logSuccess(
      `Status report sent - Threat level: ${response.data.threatLevel}`
    );
    return true;
  } catch (error) {
    logError('Status report failed', error);
    return false;
  }
}

async function testPendingCommands() {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/api/devices/${TEST_DEVICE_ID}/commands`,
      {
        headers: { Authorization: `Bearer ${authTokens.accessToken}` },
      }
    );

    logSuccess(
      `Pending commands retrieved - Count: ${response.data.commands.length}`
    );
    return true;
  } catch (error) {
    logError('Pending commands check failed', error);
    return false;
  }
}

async function testAdminLogin() {
  try {
    const response = await axios.post(`${API_BASE_URL}/api/auth/admin/login`, {
      username: 'admin',
      password: 'change-this-secure-password',
    });

    adminToken = response.data.token;
    logSuccess(
      `Admin login successful - Username: ${response.data.admin.username}`
    );
    return true;
  } catch (error) {
    logError('Admin login failed', error);
    return false;
  }
}

async function testAdminDashboard() {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/admin/dashboard`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    logSuccess(
      `Admin dashboard loaded - Total devices: ${response.data.overview.totalDevices}`
    );
    return true;
  } catch (error) {
    logError('Admin dashboard failed', error);
    return false;
  }
}

async function testTokenRefresh() {
  try {
    const response = await axios.post(`${API_BASE_URL}/api/auth/refresh`, {
      refreshToken: authTokens.refreshToken,
    });

    authTokens = response.data.tokens;
    logSuccess('Token refresh successful');
    return true;
  } catch (error) {
    logError('Token refresh failed', error);
    return false;
  }
}

async function testDeviceLogout() {
  try {
    const response = await axios.post(`${API_BASE_URL}/api/auth/logout`, {
      deviceId: TEST_DEVICE_ID,
    });

    logSuccess('Device logout successful');
    return true;
  } catch (error) {
    logError('Device logout failed', error);
    return false;
  }
}

// Main test runner
async function runTests() {
  console.log('🧪 Starting DESIST Management Server API Tests\n');

  const tests = [
    { name: 'Health Check', fn: testHealthCheck },
    { name: 'Device Registration', fn: testDeviceRegistration },
    { name: 'Device Status', fn: testDeviceStatus },
    { name: 'Configuration Update', fn: testConfigUpdate },
    { name: 'Device Sync', fn: testDeviceSync },
    { name: 'Status Report', fn: testStatusReport },
    { name: 'Pending Commands', fn: testPendingCommands },
    { name: 'Token Refresh', fn: testTokenRefresh },
    { name: 'Admin Login', fn: testAdminLogin },
    { name: 'Admin Dashboard', fn: testAdminDashboard },
    { name: 'Device Logout', fn: testDeviceLogout },
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    log(`Running test: ${test.name}`);
    try {
      const result = await test.fn();
      if (result) {
        passed++;
      } else {
        failed++;
      }
    } catch (error) {
      logError(`Test ${test.name} crashed`, error);
      failed++;
    }
    console.log(''); // Empty line for readability
  }

  console.log('📊 Test Summary:');
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(
    `📈 Success Rate: ${Math.round((passed / (passed + failed)) * 100)}%`
  );

  if (failed === 0) {
    console.log(
      '\n🎉 All tests passed! The DESIST Management Server is working correctly.'
    );
  } else {
    console.log(
      '\n⚠️  Some tests failed. Please check the server logs for details.'
    );
  }

  process.exit(failed === 0 ? 0 : 1);
}

// Run tests if this script is executed directly
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { runTests };
