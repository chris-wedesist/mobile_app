// Security Components Integration Tests
import { jest } from '@jest/globals';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState } from 'react-native';

// Import security components
import { blankScreenStealthManager } from '../lib/security/blankScreenStealth';
import { screenProtectionManager } from '../lib/security/screenProtection';
import { threatDetectionEngine } from '../lib/security/threatDetection';
import { biometricAuthManager } from '../lib/security/biometricAuth';

// Mocks
jest.mock('@react-native-async-storage/async-storage');
jest.mock('react-native', () => {
  return {
    AppState: {
      currentState: 'active',
      addEventListener: jest.fn(() => ({ remove: jest.fn() })),
    },
  };
});

describe('Security Components Integration', () => {
  // Reset all mocks and initialize components before each test
  beforeEach(async () => {
    jest.clearAllMocks();
    await Promise.all([
      blankScreenStealthManager.initialize(),
      screenProtectionManager.initialize(),
      threatDetectionEngine.initialize(),
      biometricAuthManager.initialize(),
    ]);
  });

  test('Threat detection triggers blank screen', async () => {
    // Setup spy on blankScreenStealthManager
    const activateSpy = jest.spyOn(
      blankScreenStealthManager,
      'activateBlankScreen'
    );

    // Mock threat detection finding a threat
    const mockThreat = {
      type: 'debugging',
      severity: 'high',
      details: 'Debug mode detected',
      timestamp: Date.now(),
    };

    // Simulate threat detection
    await threatDetectionEngine.handleThreatDetected(mockThreat);

    // Verify blank screen was activated
    expect(activateSpy).toHaveBeenCalled();
  });

  test('App going to background activates screen protection', async () => {
    // Setup spy on screenProtectionManager
    const protectSpy = jest.spyOn(screenProtectionManager, 'protectScreen');

    // Get the AppState listener callback
    const appStateListener = AppState.addEventListener.mock.calls[0][1];

    // Simulate app going to background
    appStateListener('background');

    // Verify screen protection was activated
    expect(protectSpy).toHaveBeenCalled();
  });

  test('Failed biometric authentication triggers security measures', async () => {
    // Setup spies
    const blankScreenSpy = jest.spyOn(
      blankScreenStealthManager,
      'activateBlankScreen'
    );
    const threatLogSpy = jest.spyOn(threatDetectionEngine, 'logSecurityEvent');

    // Mock failed authentication
    jest
      .spyOn(biometricAuthManager, 'authenticate')
      .mockImplementationOnce(() =>
        Promise.resolve({ success: false, error: 'too_many_attempts' })
      );

    // Attempt authentication
    const result = await biometricAuthManager.authenticate();

    // Verify security measures were triggered
    expect(result.success).toBe(false);
    expect(blankScreenSpy).toHaveBeenCalled();
    expect(threatLogSpy).toHaveBeenCalledWith({
      type: 'authentication',
      severity: 'high',
      details: expect.any(String),
      timestamp: expect.any(Number),
    });
  });

  test('Coordinated response to multiple security events', async () => {
    // Setup spies
    const blankScreenSpy = jest.spyOn(
      blankScreenStealthManager,
      'activateBlankScreen'
    );
    const screenProtectSpy = jest.spyOn(
      screenProtectionManager,
      'protectScreen'
    );
    const threatResponderSpy = jest.spyOn(
      threatDetectionEngine,
      'respondToThreat'
    );

    // Simulate multiple security events in sequence

    // 1. Failed authentication
    jest
      .spyOn(biometricAuthManager, 'authenticate')
      .mockImplementationOnce(() =>
        Promise.resolve({ success: false, error: 'user_cancel' })
      );
    await biometricAuthManager.authenticate();

    // 2. App going to background
    const appStateListener = AppState.addEventListener.mock.calls[0][1];
    appStateListener('background');

    // 3. Threat detected
    await threatDetectionEngine.handleThreatDetected({
      type: 'root',
      severity: 'critical',
      details: 'Root access detected',
      timestamp: Date.now(),
    });

    // Verify coordinated response
    expect(blankScreenSpy).toHaveBeenCalled();
    expect(screenProtectSpy).toHaveBeenCalled();
    expect(threatResponderSpy).toHaveBeenCalled();

    // Verify security state is properly escalated
    expect(threatDetectionEngine.getCurrentThreatLevel()).toBe('critical');
  });

  // TODO: Add more integration tests between components
});

// Mock implementations needed for integration tests
async function mockSecurityEvent(eventType, details) {
  switch (eventType) {
    case 'background':
      const appStateListener = AppState.addEventListener.mock.calls[0][1];
      appStateListener('background');
      break;
    case 'threat':
      await threatDetectionEngine.handleThreatDetected({
        type: details.type || 'unknown',
        severity: details.severity || 'medium',
        details: details.message || 'Unknown threat',
        timestamp: Date.now(),
      });
      break;
    case 'authFailure':
      jest
        .spyOn(biometricAuthManager, 'authenticate')
        .mockImplementationOnce(() =>
          Promise.resolve({
            success: false,
            error: details.error || 'user_cancel',
          })
        );
      await biometricAuthManager.authenticate();
      break;
  }
}
