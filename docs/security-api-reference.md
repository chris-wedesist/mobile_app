# Security Components API Reference

This document outlines the available API methods for all security components in the mobile app. Use this as a reference when implementing tests, integrations, or extending functionality.

## BlankScreenStealth Manager

```typescript
// Import
import { blankScreenStealthManager } from '../lib/security/blankScreenStealth';
```

### Methods

- `initialize(): Promise<void>` - Initialize the manager with default or stored configuration
- `activateBlankScreen(): Promise<boolean>` - Activate blank screen stealth mode
- `deactivateBlankScreen(): Promise<boolean>` - Deactivate blank screen stealth mode
- `isActive(): boolean` - Check if blank screen stealth mode is currently active
- `getConfig(): Promise<BlankScreenConfig>` - Get current configuration
- `updateConfig(config: Partial<BlankScreenConfig>): Promise<void>` - Update configuration
- `activateFakeScreen(mode: FakeScreenMode): Promise<boolean>` - Activate fake screen mode
- `addScheduledActivation(schedule: ScheduledActivation): Promise<void>` - Add scheduled activation
- `removeScheduledActivation(id: string): Promise<void>` - Remove scheduled activation
- `getAccessAttempts(): Promise<AccessAttempt[]>` - Get access attempt logs
- `clearAccessAttempts(): Promise<void>` - Clear access attempt logs

## ScreenProtection Manager

```typescript
// Import
import { screenProtectionManager } from '../lib/security/screenProtection';
```

### Methods

- `initialize(): Promise<void>` - Initialize the manager with default or stored configuration
- `enableScreenProtection(): Promise<boolean>` - Enable screen protection features
- `disableScreenProtection(): Promise<boolean>` - Disable screen protection features
- `isEnabled(): boolean` - Check if screen protection is currently enabled
- `getConfig(): Promise<ScreenProtectionConfig>` - Get current configuration
- `updateConfig(config: Partial<ScreenProtectionConfig>): Promise<void>` - Update configuration
- `addPrivacyFilter(filter: PrivacyFilter): Promise<void>` - Add privacy filter
- `removePrivacyFilter(id: string): Promise<void>` - Remove privacy filter
- `getPrivacyFilters(): Promise<PrivacyFilter[]>` - Get all privacy filters
- `handleBackgroundChange(state: string): void` - Handle app state changes
- `activateScreenProtection(): Promise<void>` - Activate screen protection
- `deactivateScreenProtection(): Promise<void>` - Deactivate screen protection
- `detectScreenRecording(): Promise<boolean>` - Check if screen recording is active

## ThreatDetection Engine

```typescript
// Import
import { threatDetectionEngine } from '../lib/security/threatDetection';
```

### Methods

- `initialize(): Promise<void>` - Initialize the engine with default or stored configuration
- `startDetection(): Promise<boolean>` - Start threat detection processes
- `stopDetection(): Promise<boolean>` - Stop threat detection processes
- `isRunning(): boolean` - Check if threat detection is currently running
- `getConfig(): Promise<ThreatDetectionConfig>` - Get current configuration
- `updateConfig(config: Partial<ThreatDetectionConfig>): Promise<void>` - Update configuration
- `detectThreats(): Promise<ThreatDetectionResult>` - Run immediate threat detection
- `addThreatPattern(pattern: ThreatPattern): Promise<void>` - Add custom threat pattern
- `removeThreatPattern(id: string): Promise<void>` - Remove threat pattern
- `getThreatPatterns(): Promise<ThreatPattern[]>` - Get all threat patterns
- `addResponseAction(action: ThreatResponseAction): Promise<void>` - Add response action
- `removeResponseAction(id: string): Promise<void>` - Remove response action
- `getResponseActions(): Promise<ThreatResponseAction[]>` - Get all response actions
- `onThreatDetected(callback: ThreatCallback): () => void` - Register threat callback
- `logSecurityEvent(event: SecurityEvent): Promise<void>` - Log security event
- `handleThreatDetected(threat: Threat): Promise<void>` - Handle detected threat
- `respondToThreat(threat: Threat): Promise<void>` - Respond to threat with configured actions
- `getCurrentThreatLevel(): ThreatLevel` - Get current threat level
- `addScheduledScan(schedule: ScanSchedule): Promise<void>` - Add scheduled scan
- `removeScheduledScan(id: string): Promise<void>` - Remove scheduled scan
- `getScheduledScans(): Promise<ScanSchedule[]>` - Get all scheduled scans

## BiometricAuth Manager

```typescript
// Import
import { biometricAuthManager } from '../lib/security/biometricAuth';
```

### Methods

- `initialize(): Promise<void>` - Initialize the manager with default or stored configuration
- `isAvailable(): Promise<boolean>` - Check if biometric authentication is available
- `enroll(): Promise<boolean>` - Enroll biometric data
- `authenticate(options?: AuthOptions): Promise<AuthResult>` - Authenticate user with biometrics
- `getConfig(): Promise<BiometricConfig>` - Get current configuration
- `updateConfig(config: Partial<BiometricConfig>): Promise<void>` - Update configuration
- `setPINFallback(enabled: boolean): Promise<void>` - Enable/disable PIN fallback
- `verifyPIN(pin: string): Promise<boolean>` - Verify PIN code
- `changePIN(oldPin: string, newPin: string): Promise<boolean>` - Change PIN code
- `getLockoutStatus(): Promise<LockoutStatus>` - Get current lockout status
- `resetLockout(): Promise<void>` - Reset lockout status
- `setSecurityLevel(level: SecurityLevel): Promise<void>` - Set security level

## Common Types

```typescript
// Threat Detection Types
type ThreatLevel = 'none' | 'low' | 'medium' | 'high' | 'critical';

interface Threat {
  type: string;
  severity: ThreatLevel;
  details: string;
  timestamp: number;
}

interface SecurityEvent {
  type: string;
  severity: ThreatLevel;
  details: string;
  timestamp: number;
}

// Authentication Types
interface AuthResult {
  success: boolean;
  error?: string;
  timestamp?: number;
}

// Screen Protection Types
interface PrivacyFilter {
  id: string;
  name: string;
  patterns: string[];
  replacementChar?: string;
  style?: 'blur' | 'hide' | 'replace';
  priority: number;
}
```

## Integration Points

### Threat Detection → Blank Screen Stealth

When a threat is detected, the Threat Detection Engine can activate the Blank Screen Stealth:

```typescript
threatDetectionEngine.onThreatDetected((threat) => {
  if (threat.severity === 'high' || threat.severity === 'critical') {
    blankScreenStealthManager.activateBlankScreen();
  }
});
```

### App State → Screen Protection

When app goes to background, Screen Protection should activate:

```typescript
import { AppState } from 'react-native';

AppState.addEventListener('change', (nextAppState) => {
  if (nextAppState === 'background' || nextAppState === 'inactive') {
    screenProtectionManager.activateScreenProtection();
  } else if (nextAppState === 'active') {
    screenProtectionManager.deactivateScreenProtection();
  }
});
```

### Biometric Auth → Threat Detection

When authentication fails multiple times, log security event:

```typescript
async function authenticate() {
  const result = await biometricAuthManager.authenticate();

  if (!result.success && result.error === 'too_many_attempts') {
    await threatDetectionEngine.logSecurityEvent({
      type: 'authentication',
      severity: 'high',
      details: 'Multiple failed authentication attempts',
      timestamp: Date.now(),
    });
  }

  return result;
}
```
