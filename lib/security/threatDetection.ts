import * as Device from 'expo-device';
import * as Application from 'expo-application';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface ThreatDetectionConfig {
  isEnabled: boolean;
  checkJailbreak: boolean;
  checkDebugging: boolean;
  checkTamper: boolean;
  monitorUsagePatterns: boolean;
  logSecurityEvents: boolean;
  alertThreshold: number;
  autoResponseEnabled: boolean;
}

export interface SecurityThreat {
  id: string;
  type: 'jailbreak' | 'debugging' | 'tamper' | 'unusual_pattern' | 'unknown';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  timestamp: Date;
  details?: any;
}

export interface UsagePattern {
  timestamp: Date;
  action: string;
  duration?: number;
  details?: any;
}

const THREAT_DETECTION_CONFIG_KEY = 'desist_threat_detection_config';
const SECURITY_LOG_KEY = 'desist_security_log';
const USAGE_PATTERNS_KEY = 'desist_usage_patterns';

const DEFAULT_CONFIG: ThreatDetectionConfig = {
  isEnabled: true,
  checkJailbreak: true,
  checkDebugging: true,
  checkTamper: true,
  monitorUsagePatterns: true,
  logSecurityEvents: true,
  alertThreshold: 3, // Number of threats before auto-response
  autoResponseEnabled: false,
};

export class ThreatDetectionEngine {
  private static instance: ThreatDetectionEngine;
  private config: ThreatDetectionConfig = DEFAULT_CONFIG;
  private initialized = false;
  private securityLog: SecurityThreat[] = [];
  private usagePatterns: UsagePattern[] = [];
  private monitoring = false;
  private threatCount = 0;

  static getInstance(): ThreatDetectionEngine {
    if (!ThreatDetectionEngine.instance) {
      ThreatDetectionEngine.instance = new ThreatDetectionEngine();
    }
    return ThreatDetectionEngine.instance;
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      // Load configuration
      const storedConfig = await AsyncStorage.getItem(
        THREAT_DETECTION_CONFIG_KEY
      );
      if (storedConfig) {
        this.config = {
          ...DEFAULT_CONFIG,
          ...JSON.parse(storedConfig),
        };
      }

      // Load security log
      const storedLog = await AsyncStorage.getItem(SECURITY_LOG_KEY);
      if (storedLog) {
        this.securityLog = JSON.parse(storedLog).map((threat: any) => ({
          ...threat,
          timestamp: new Date(threat.timestamp),
        }));
      }

      // Load usage patterns
      const storedPatterns = await AsyncStorage.getItem(USAGE_PATTERNS_KEY);
      if (storedPatterns) {
        this.usagePatterns = JSON.parse(storedPatterns).map((pattern: any) => ({
          ...pattern,
          timestamp: new Date(pattern.timestamp),
        }));
      }

      this.initialized = true;
      console.log('ThreatDetectionEngine initialized');

      // Start monitoring if enabled
      if (this.config.isEnabled) {
        await this.startMonitoring();
      }
    } catch (error) {
      console.error('Failed to initialize ThreatDetectionEngine:', error);
      this.config = DEFAULT_CONFIG;
      this.initialized = true;
    }
  }

  async startMonitoring(): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }

    if (this.monitoring) {
      console.warn('Threat detection already monitoring');
      return;
    }

    this.monitoring = true;
    console.log('Threat detection monitoring started');

    // Perform initial security checks
    await this.performSecurityScan();

    // Set up periodic monitoring (every 30 seconds)
    this.schedulePeriodicChecks();
  }

  async stopMonitoring(): Promise<void> {
    this.monitoring = false;
    console.log('Threat detection monitoring stopped');
  }

  private schedulePeriodicChecks(): void {
    if (!this.monitoring) return;

    setTimeout(async () => {
      if (this.monitoring) {
        await this.performSecurityScan();
        this.schedulePeriodicChecks();
      }
    }, 30000); // Check every 30 seconds
  }

  async performSecurityScan(): Promise<SecurityThreat[]> {
    if (!this.config.isEnabled) return [];

    const threats: SecurityThreat[] = [];

    try {
      // Check for jailbreak/root
      if (this.config.checkJailbreak) {
        const jailbreakThreat = await this.checkJailbreak();
        if (jailbreakThreat) threats.push(jailbreakThreat);
      }

      // Check for debugging
      if (this.config.checkDebugging) {
        const debuggingThreat = await this.checkDebugging();
        if (debuggingThreat) threats.push(debuggingThreat);
      }

      // Check for tampering
      if (this.config.checkTamper) {
        const tamperThreat = await this.checkTampering();
        if (tamperThreat) threats.push(tamperThreat);
      }

      // Process any new threats
      for (const threat of threats) {
        await this.logSecurityThreat(threat);
      }

      // Check if auto-response is needed
      if (threats.length > 0 && this.config.autoResponseEnabled) {
        await this.evaluateAutoResponse();
      }
    } catch (error) {
      console.error('Error during security scan:', error);
    }

    return threats;
  }

  private async checkJailbreak(): Promise<SecurityThreat | null> {
    try {
      // Basic jailbreak detection methods
      const deviceInfo = await Device.getDeviceTypeAsync();
      const isRealDevice = Device.isDevice;

      // Check if running on a real device
      if (!isRealDevice) {
        return {
          id: `jailbreak_${Date.now()}`,
          type: 'jailbreak',
          severity: 'medium',
          description: 'App is running on simulator/emulator',
          timestamp: new Date(),
          details: { deviceType: deviceInfo },
        };
      }

      // Additional jailbreak checks would go here
      // For now, this is a basic implementation

      return null;
    } catch (error) {
      console.error('Error checking jailbreak status:', error);
      return null;
    }
  }

  private async checkDebugging(): Promise<SecurityThreat | null> {
    try {
      // Check if the app is in development mode
      const isDev = __DEV__;

      if (isDev) {
        return {
          id: `debugging_${Date.now()}`,
          type: 'debugging',
          severity: 'high',
          description: 'App is running in development mode',
          timestamp: new Date(),
          details: { developmentMode: true },
        };
      }

      // Additional debugging detection would go here
      return null;
    } catch (error) {
      console.error('Error checking debugging status:', error);
      return null;
    }
  }

  private async checkTampering(): Promise<SecurityThreat | null> {
    try {
      // Basic tampering checks
      const appVersion = Application.nativeApplicationVersion;
      const buildVersion = Application.nativeBuildVersion;

      // You would store expected values and check against them
      // For now, this is a placeholder implementation

      return null;
    } catch (error) {
      console.error('Error checking tampering status:', error);
      return null;
    }
  }

  async logUsagePattern(
    action: string,
    duration?: number,
    details?: any
  ): Promise<void> {
    if (!this.config.monitorUsagePatterns) return;

    const pattern: UsagePattern = {
      timestamp: new Date(),
      action,
      duration,
      details,
    };

    this.usagePatterns.push(pattern);

    // Keep only last 100 patterns
    if (this.usagePatterns.length > 100) {
      this.usagePatterns = this.usagePatterns.slice(-100);
    }

    // Check for unusual patterns
    if (this.config.monitorUsagePatterns) {
      const unusualPattern = await this.detectUnusualPattern(pattern);
      if (unusualPattern) {
        await this.logSecurityThreat(unusualPattern);
      }
    }

    await this.saveUsagePatterns();
  }

  private async detectUnusualPattern(
    pattern: UsagePattern
  ): Promise<SecurityThreat | null> {
    // Simple unusual pattern detection
    const recentPatterns = this.usagePatterns.filter(
      (p) => Date.now() - p.timestamp.getTime() < 60000 // Last minute
    );

    // Check for rapid repeated actions
    const sameActionPatterns = recentPatterns.filter(
      (p) => p.action === pattern.action
    );
    if (sameActionPatterns.length > 10) {
      return {
        id: `unusual_pattern_${Date.now()}`,
        type: 'unusual_pattern',
        severity: 'medium',
        description: `Unusual pattern detected: ${pattern.action} repeated ${sameActionPatterns.length} times`,
        timestamp: new Date(),
        details: { action: pattern.action, count: sameActionPatterns.length },
      };
    }

    return null;
  }

  private async logSecurityThreat(threat: SecurityThreat): Promise<void> {
    if (!this.config.logSecurityEvents) return;

    this.securityLog.push(threat);
    this.threatCount++;

    // Keep only last 50 threats
    if (this.securityLog.length > 50) {
      this.securityLog = this.securityLog.slice(-50);
    }

    await this.saveSecurityLog();
    console.warn(
      `Security threat detected: ${threat.type} - ${threat.description}`
    );
  }

  private async evaluateAutoResponse(): Promise<void> {
    const recentThreats = this.securityLog.filter(
      (threat) => Date.now() - threat.timestamp.getTime() < 300000 // Last 5 minutes
    );

    if (recentThreats.length >= this.config.alertThreshold) {
      console.warn(
        `Threat threshold exceeded: ${recentThreats.length} threats in 5 minutes`
      );
      // Here you could trigger emergency protocols or other auto-responses
      // For now, just log the event
    }
  }

  getSecurityLog(): SecurityThreat[] {
    return [...this.securityLog];
  }

  getRecentThreats(minutes: number = 60): SecurityThreat[] {
    const cutoff = Date.now() - minutes * 60 * 1000;
    return this.securityLog.filter(
      (threat) => threat.timestamp.getTime() > cutoff
    );
  }

  getThreatCount(): number {
    return this.threatCount;
  }

  async updateConfig(updates: Partial<ThreatDetectionConfig>): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }

    this.config = {
      ...this.config,
      ...updates,
    };

    await this.saveConfig();

    // Restart monitoring if config changed
    if (this.config.isEnabled && !this.monitoring) {
      await this.startMonitoring();
    } else if (!this.config.isEnabled && this.monitoring) {
      await this.stopMonitoring();
    }
  }

  getConfig(): ThreatDetectionConfig {
    return { ...this.config };
  }

  getSecurityStatus(): {
    monitoring: boolean;
    threatsDetected: number;
    lastScanTime: Date | null;
    riskLevel: 'low' | 'medium' | 'high';
  } {
    const recentThreats = this.getRecentThreats(60);
    const criticalThreats = recentThreats.filter(
      (t) => t.severity === 'critical'
    ).length;
    const highThreats = recentThreats.filter(
      (t) => t.severity === 'high'
    ).length;

    let riskLevel: 'low' | 'medium' | 'high' = 'low';
    if (criticalThreats > 0 || highThreats > 2) {
      riskLevel = 'high';
    } else if (highThreats > 0 || recentThreats.length > 3) {
      riskLevel = 'medium';
    }

    return {
      monitoring: this.monitoring,
      threatsDetected: this.threatCount,
      lastScanTime:
        this.securityLog.length > 0
          ? this.securityLog[this.securityLog.length - 1].timestamp
          : null,
      riskLevel,
    };
  }

  private async saveConfig(): Promise<void> {
    try {
      await AsyncStorage.setItem(
        THREAT_DETECTION_CONFIG_KEY,
        JSON.stringify(this.config)
      );
    } catch (error) {
      console.error('Failed to save threat detection config:', error);
    }
  }

  private async saveSecurityLog(): Promise<void> {
    try {
      await AsyncStorage.setItem(
        SECURITY_LOG_KEY,
        JSON.stringify(this.securityLog)
      );
    } catch (error) {
      console.error('Failed to save security log:', error);
    }
  }

  private async saveUsagePatterns(): Promise<void> {
    try {
      await AsyncStorage.setItem(
        USAGE_PATTERNS_KEY,
        JSON.stringify(this.usagePatterns)
      );
    } catch (error) {
      console.error('Failed to save usage patterns:', error);
    }
  }

  // Clear all security data (for emergency use)
  async clearSecurityData(): Promise<void> {
    this.securityLog = [];
    this.usagePatterns = [];
    this.threatCount = 0;

    await Promise.all([
      AsyncStorage.removeItem(SECURITY_LOG_KEY),
      AsyncStorage.removeItem(USAGE_PATTERNS_KEY),
    ]);

    console.log('Security data cleared');
  }
}

// Export singleton instance
export const threatDetectionEngine = ThreatDetectionEngine.getInstance();

// Export helper functions
export const startThreatMonitoring = () =>
  threatDetectionEngine.startMonitoring();
export const stopThreatMonitoring = () =>
  threatDetectionEngine.stopMonitoring();
export const logUsage = (action: string, duration?: number, details?: any) =>
  threatDetectionEngine.logUsagePattern(action, duration, details);
export const getSecurityStatus = () =>
  threatDetectionEngine.getSecurityStatus();
