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

  // Phase 4 additions
  scheduledScans: boolean;
  scanInterval: number; // milliseconds
  lastScanTime: Date | null;
  intelligenceDbEnabled: boolean;
  intelligenceDbLastUpdate: Date | null;
  userDefinedThreats: string[]; // patterns to look for
  customThreats: Record<string, ThreatPattern>;
  sensitivityLevel: 'low' | 'medium' | 'high';
  threatResponseActions: ThreatResponseAction[];
}

export interface ThreatPattern {
  name: string;
  pattern: string;
  isRegex: boolean;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  enabled: boolean;
}

export interface ThreatResponseAction {
  id: string;
  name: string;
  threatTypes: Array<
    | 'jailbreak'
    | 'debugging'
    | 'tamper'
    | 'unusual_pattern'
    | 'custom'
    | 'unknown'
  >;
  minSeverity: 'low' | 'medium' | 'high' | 'critical';
  action: 'notify' | 'log' | 'block' | 'lockdown' | 'custom';
  customAction?: string;
  enabled: boolean;
}

export interface SecurityThreat {
  id: string;
  type:
    | 'jailbreak'
    | 'debugging'
    | 'tamper'
    | 'unusual_pattern'
    | 'custom'
    | 'unknown';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  timestamp: Date;
  details?: any;
  patternId?: string;
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

  // Phase 4 default configurations
  scheduledScans: true,
  scanInterval: 86400000, // 24 hours in milliseconds
  lastScanTime: null,
  intelligenceDbEnabled: true,
  intelligenceDbLastUpdate: null,
  userDefinedThreats: [],
  customThreats: {},
  sensitivityLevel: 'medium',
  threatResponseActions: [
    {
      id: 'default_notify',
      name: 'Default Notification',
      threatTypes: [
        'jailbreak',
        'debugging',
        'tamper',
        'unusual_pattern',
        'custom',
        'unknown',
      ],
      minSeverity: 'medium',
      action: 'notify',
      enabled: true,
    },
    {
      id: 'critical_lockdown',
      name: 'Critical Lockdown',
      threatTypes: ['jailbreak', 'tamper'],
      minSeverity: 'critical',
      action: 'lockdown',
      enabled: false,
    },
  ],
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

  // Phase 4 methods

  // Scheduled scanning
  async enableScheduledScans(enabled: boolean): Promise<void> {
    this.config.scheduledScans = enabled;
    await this.saveConfig();

    if (enabled) {
      this.setupScheduledScan();
    }
  }

  async setScanInterval(milliseconds: number): Promise<void> {
    this.config.scanInterval = Math.max(3600000, milliseconds); // Minimum 1 hour
    await this.saveConfig();

    if (this.config.scheduledScans) {
      this.setupScheduledScan(); // Re-setup with new interval
    }
  }

  private scanTimer: ReturnType<typeof setTimeout> | null = null;

  private setupScheduledScan(): void {
    if (this.scanTimer) {
      clearTimeout(this.scanTimer);
    }

    this.scanTimer = setTimeout(() => {
      this.performSecurityScan();
      this.setupScheduledScan(); // Schedule next scan
    }, this.config.scanInterval);
  }

  // Enhanced security scan with Phase 4 features
  private async enhancedSecurityScan(): Promise<SecurityThreat[]> {
    // Call the base security scan
    const threats = await this.performSecurityScan();

    // Then add Phase 4 custom threat checks
    await this.checkCustomThreats(threats);

    // Update last scan time
    this.config.lastScanTime = new Date();
    await this.saveConfig();

    return threats;

    // Check custom threat patterns
    await this.checkCustomThreats(threats);

    // Log all detected threats
    for (const threat of threats) {
      this.logSecurityThreat(threat);
    }

    // Update last scan time
    this.config.lastScanTime = new Date();
    await this.saveConfig();

    return threats;
  }

  // Threat Intelligence Database
  async enableIntelligenceDb(enabled: boolean): Promise<void> {
    this.config.intelligenceDbEnabled = enabled;
    await this.saveConfig();

    if (enabled) {
      await this.updateThreatIntelligence();
    }
  }

  async updateThreatIntelligence(): Promise<boolean> {
    try {
      // In a real implementation, this would fetch updated threat signatures
      // from a server or other source

      console.log('Updating threat intelligence database...');

      // Simulate updating with a delay
      await new Promise((resolve) => setTimeout(resolve, 500));

      this.config.intelligenceDbLastUpdate = new Date();
      await this.saveConfig();

      return true;
    } catch (error) {
      console.error('Failed to update threat intelligence:', error);
      return false;
    }
  }

  // Custom threat patterns
  async addCustomThreatPattern(
    name: string,
    pattern: string,
    isRegex: boolean,
    severity: 'low' | 'medium' | 'high' | 'critical',
    description: string
  ): Promise<string> {
    const id = `pattern_${Date.now()}_${Math.random()
      .toString(36)
      .substring(2, 9)}`;

    this.config.customThreats[id] = {
      name,
      pattern,
      isRegex,
      severity,
      description,
      enabled: true,
    };

    await this.saveConfig();
    return id;
  }

  async updateCustomThreatPattern(
    id: string,
    updates: Partial<Omit<ThreatPattern, 'id'>>
  ): Promise<boolean> {
    if (!this.config.customThreats[id]) {
      return false;
    }

    this.config.customThreats[id] = {
      ...this.config.customThreats[id],
      ...updates,
    };

    await this.saveConfig();
    return true;
  }

  async removeCustomThreatPattern(id: string): Promise<boolean> {
    if (!this.config.customThreats[id]) {
      return false;
    }

    delete this.config.customThreats[id];
    await this.saveConfig();

    return true;
  }

  private async checkCustomThreats(threats: SecurityThreat[]): Promise<void> {
    // In a real implementation, this would scan various system aspects
    // against custom patterns

    // For this example, we'll just simulate some basic checks
    for (const [id, pattern] of Object.entries(this.config.customThreats)) {
      if (!pattern.enabled) continue;

      // Simple simulation of pattern matching
      const shouldMatch = Math.random() < 0.1; // 10% chance of a match for demo

      if (shouldMatch) {
        threats.push({
          id: `custom_${Date.now()}_${id}`,
          type: 'custom',
          severity: pattern.severity,
          description: `Custom threat detected: ${pattern.name}`,
          timestamp: new Date(),
          patternId: id,
          details: { pattern: pattern.pattern },
        });
      }
    }
  }

  // Response actions
  async addThreatResponseAction(
    name: string,
    threatTypes: Array<
      | 'jailbreak'
      | 'debugging'
      | 'tamper'
      | 'unusual_pattern'
      | 'custom'
      | 'unknown'
    >,
    minSeverity: 'low' | 'medium' | 'high' | 'critical',
    action: 'notify' | 'log' | 'block' | 'lockdown' | 'custom',
    customAction?: string
  ): Promise<string> {
    const id = `action_${Date.now()}_${Math.random()
      .toString(36)
      .substring(2, 9)}`;

    const newAction: ThreatResponseAction = {
      id,
      name,
      threatTypes,
      minSeverity,
      action,
      customAction,
      enabled: true,
    };

    this.config.threatResponseActions.push(newAction);
    await this.saveConfig();

    return id;
  }

  async updateThreatResponseAction(
    id: string,
    updates: Partial<Omit<ThreatResponseAction, 'id'>>
  ): Promise<boolean> {
    const index = this.config.threatResponseActions.findIndex(
      (a) => a.id === id
    );

    if (index === -1) {
      return false;
    }

    this.config.threatResponseActions[index] = {
      ...this.config.threatResponseActions[index],
      ...updates,
    };

    await this.saveConfig();
    return true;
  }

  async removeThreatResponseAction(id: string): Promise<boolean> {
    // Don't allow removing default actions
    if (id === 'default_notify' || id === 'critical_lockdown') {
      return false;
    }

    const initialLength = this.config.threatResponseActions.length;
    this.config.threatResponseActions =
      this.config.threatResponseActions.filter((a) => a.id !== id);

    if (initialLength !== this.config.threatResponseActions.length) {
      await this.saveConfig();
      return true;
    }

    return false;
  }

  // Sensitivity configuration
  async setSensitivityLevel(level: 'low' | 'medium' | 'high'): Promise<void> {
    this.config.sensitivityLevel = level;

    switch (level) {
      case 'low':
        this.config.alertThreshold = 5;
        break;
      case 'medium':
        this.config.alertThreshold = 3;
        break;
      case 'high':
        this.config.alertThreshold = 1;
        break;
    }

    await this.saveConfig();
  }

  // Get custom threats
  getCustomThreatPatterns(): Record<string, ThreatPattern> {
    return { ...this.config.customThreats };
  }

  // Get threat response actions
  getThreatResponseActions(): ThreatResponseAction[] {
    return [...this.config.threatResponseActions];
  }

  // Get threat intelligence status
  getThreatIntelligenceStatus(): {
    enabled: boolean;
    lastUpdate: Date | null;
    isUpToDate: boolean;
  } {
    const now = new Date();
    const lastUpdate = this.config.intelligenceDbLastUpdate;

    // Consider up to date if updated in the last 7 days
    const isUpToDate = lastUpdate
      ? now.getTime() - lastUpdate.getTime() < 7 * 24 * 60 * 60 * 1000
      : false;

    return {
      enabled: this.config.intelligenceDbEnabled,
      lastUpdate: this.config.intelligenceDbLastUpdate,
      isUpToDate,
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

// Phase 4 helper exports
export const enableScheduledScans = (enabled: boolean) =>
  threatDetectionEngine.enableScheduledScans(enabled);
export const setScanInterval = (milliseconds: number) =>
  threatDetectionEngine.setScanInterval(milliseconds);
export const updateThreatIntelligence = () =>
  threatDetectionEngine.updateThreatIntelligence();
export const addCustomThreatPattern = (
  name: string,
  pattern: string,
  isRegex: boolean,
  severity: 'low' | 'medium' | 'high' | 'critical',
  description: string
) =>
  threatDetectionEngine.addCustomThreatPattern(
    name,
    pattern,
    isRegex,
    severity,
    description
  );
export const updateCustomThreatPattern = (
  id: string,
  updates: Partial<Omit<ThreatPattern, 'id'>>
) => threatDetectionEngine.updateCustomThreatPattern(id, updates);
export const removeCustomThreatPattern = (id: string) =>
  threatDetectionEngine.removeCustomThreatPattern(id);
export const addThreatResponseAction = (
  name: string,
  threatTypes: Array<
    | 'jailbreak'
    | 'debugging'
    | 'tamper'
    | 'unusual_pattern'
    | 'custom'
    | 'unknown'
  >,
  minSeverity: 'low' | 'medium' | 'high' | 'critical',
  action: 'notify' | 'log' | 'block' | 'lockdown' | 'custom',
  customAction?: string
) =>
  threatDetectionEngine.addThreatResponseAction(
    name,
    threatTypes,
    minSeverity,
    action,
    customAction
  );
export const setSensitivityLevel = (level: 'low' | 'medium' | 'high') =>
  threatDetectionEngine.setSensitivityLevel(level);
export const getCustomThreatPatterns = () =>
  threatDetectionEngine.getCustomThreatPatterns();
export const getThreatResponseActions = () =>
  threatDetectionEngine.getThreatResponseActions();
