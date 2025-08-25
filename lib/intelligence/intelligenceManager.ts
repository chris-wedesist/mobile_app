import AsyncStorage from '@react-native-async-storage/async-storage';
import { threatIntelligenceEngine } from './threatIntelligence';
import { networkSecurityManager } from './networkSecurity';
import { privacyEngineManager } from './privacyEngine';
import { coverApplicationsManager } from '../stealth-advanced/coverApplications';
import { antiDetectionManager } from '../stealth-advanced/antiDetection';

// Central manager for Phase 3 Intelligence Features
export interface IntelligenceConfig {
  threatIntelligenceEnabled: boolean;
  networkSecurityEnabled: boolean;
  privacyEngineEnabled: boolean;
  advancedCoverAppsEnabled: boolean;
  antiDetectionEnabled: boolean;
  lastScanTime: Date;
  scanInterval: number; // milliseconds
  securityLevel: 'standard' | 'enhanced' | 'maximum';
  activeCoverAppName: string | null;
}

const INTELLIGENCE_CONFIG_KEY = 'desist_intelligence_config';

const DEFAULT_CONFIG: IntelligenceConfig = {
  threatIntelligenceEnabled: true,
  networkSecurityEnabled: true,
  privacyEngineEnabled: true,
  advancedCoverAppsEnabled: true,
  antiDetectionEnabled: true,
  lastScanTime: new Date(0),
  scanInterval: 30 * 60 * 1000, // 30 minutes
  securityLevel: 'enhanced',
  activeCoverAppName: 'Calculator',
};

export class IntelligenceManager {
  private static instance: IntelligenceManager;
  private config: IntelligenceConfig = DEFAULT_CONFIG;
  private initialized = false;
  private scanTimer: any = null;

  static getInstance(): IntelligenceManager {
    if (!IntelligenceManager.instance) {
      IntelligenceManager.instance = new IntelligenceManager();
    }
    return IntelligenceManager.instance;
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      const storedConfig = await AsyncStorage.getItem(INTELLIGENCE_CONFIG_KEY);
      if (storedConfig) {
        this.config = {
          ...DEFAULT_CONFIG,
          ...JSON.parse(storedConfig),
          lastScanTime: new Date(JSON.parse(storedConfig).lastScanTime),
        };
      }

      // Initialize sub-systems as needed based on config
      if (this.config.advancedCoverAppsEnabled && this.config.activeCoverAppName) {
        coverApplicationsManager.activateCover(this.config.activeCoverAppName);
      }

      // Schedule regular security scans
      this.scheduleScan();

      this.initialized = true;
      console.log('IntelligenceManager initialized');
    } catch (error) {
      console.error('Failed to initialize IntelligenceManager:', error);
      this.config = DEFAULT_CONFIG;
      this.initialized = true;
    }
  }

  // Full security scan across all systems
  async performSecurityScan(): Promise<{
    threatScore: number;
    networkSecure: boolean;
    privacyProtected: boolean;
    stealthActive: boolean;
    recommendations: string[];
  }> {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      const results = {
        threatScore: 0,
        networkSecure: true,
        privacyProtected: true,
        stealthActive: true,
        recommendations: [] as string[],
      };

      // Run enabled scans in parallel
      const scanPromises: Promise<void>[] = [];

      if (this.config.threatIntelligenceEnabled) {
        scanPromises.push(
          threatIntelligenceEngine.assessThreat({}).then(threat => {
            results.threatScore = threat.riskScore;
            if (threat.recommendations.length > 0) {
              results.recommendations.push(...threat.recommendations);
            }
          })
        );
      }

      if (this.config.networkSecurityEnabled) {
        scanPromises.push(
          networkSecurityManager.monitorConnections().then(issues => {
            if (issues.length > 0 && issues[0] !== 'No suspicious connections detected') {
              results.networkSecure = false;
              results.recommendations.push('Network security issues detected');
            }
          })
        );

        scanPromises.push(
          networkSecurityManager.detectVPN().then(vpnDetected => {
            if (vpnDetected) {
              results.recommendations.push('VPN connection detected');
            }
          })
        );
      }

      if (this.config.antiDetectionEnabled) {
        scanPromises.push(
          antiDetectionManager.maskNetworkSignature().then(success => {
            if (!success) {
              results.stealthActive = false;
              results.recommendations.push('Network signature masking failed');
            }
          })
        );
      }

      // Wait for all scans to complete
      await Promise.all(scanPromises);

      // Update last scan time
      this.config.lastScanTime = new Date();
      await this.saveConfig();

      return results;
    } catch (error) {
      console.error('Failed to perform security scan:', error);
      return {
        threatScore: 50, // Medium risk as fallback
        networkSecure: false,
        privacyProtected: false,
        stealthActive: false,
        recommendations: ['Error performing security scan, manual review recommended'],
      };
    }
  }

  // Set active cover application
  async setCoverApplication(name: string): Promise<boolean> {
    try {
      const covers = coverApplicationsManager.getAvailableCovers();
      const coverExists = covers.some(cover => cover.name === name);
      
      if (!coverExists) {
        console.error(`Cover application "${name}" not found`);
        return false;
      }

      coverApplicationsManager.activateCover(name);
      this.config.activeCoverAppName = name;
      await this.saveConfig();
      
      return true;
    } catch (error) {
      console.error('Failed to set cover application:', error);
      return false;
    }
  }

  // Anonymize user data
  async anonymizeUserData(data: any): Promise<any> {
    if (!this.config.privacyEngineEnabled) {
      return data;
    }

    return privacyEngineManager.anonymizeData(data);
  }

  // Obfuscate user location
  async obfuscateLocation(location: { lat: number; lng: number }): Promise<{ lat: number; lng: number }> {
    if (!this.config.privacyEngineEnabled) {
      return location;
    }

    return privacyEngineManager.obfuscateLocation(location);
  }

  // Activate all anti-detection measures
  async activateAntiDetection(): Promise<boolean> {
    if (!this.config.antiDetectionEnabled) {
      return false;
    }

    try {
      const promises = [
        antiDetectionManager.obfuscateProcess(),
        antiDetectionManager.hideMemoryPatterns(),
        antiDetectionManager.maskNetworkSignature(),
        antiDetectionManager.preventInstallationDetection(),
      ];

      const results = await Promise.all(promises);
      return results.every(Boolean);
    } catch (error) {
      console.error('Failed to activate anti-detection:', error);
      return false;
    }
  }

  // Check if security scan is due
  async isScanDue(): Promise<boolean> {
    if (!this.initialized) {
      await this.initialize();
    }

    const now = new Date();
    const timeSinceLastScan = now.getTime() - this.config.lastScanTime.getTime();
    return timeSinceLastScan > this.config.scanInterval;
  }

  private scheduleScan(): void {
    // Clear any existing timer
    if (this.scanTimer) {
      clearTimeout(this.scanTimer);
    }

    // Schedule next scan
    this.scanTimer = setTimeout(async () => {
      await this.performSecurityScan();
      this.scheduleScan(); // Re-schedule after completion
    }, this.config.scanInterval);
  }

  // Enable/disable threat intelligence
  async enableThreatIntelligence(enabled: boolean): Promise<void> {
    this.config.threatIntelligenceEnabled = enabled;
    await this.saveConfig();
  }

  // Enable/disable network security
  async enableNetworkSecurity(enabled: boolean): Promise<void> {
    this.config.networkSecurityEnabled = enabled;
    await this.saveConfig();
  }

  // Enable/disable privacy engine
  async enablePrivacyEngine(enabled: boolean): Promise<void> {
    this.config.privacyEngineEnabled = enabled;
    await this.saveConfig();
  }

  // Enable/disable advanced cover apps
  async enableAdvancedCoverApps(enabled: boolean): Promise<void> {
    this.config.advancedCoverAppsEnabled = enabled;
    await this.saveConfig();
  }

  // Enable/disable anti-detection
  async enableAntiDetection(enabled: boolean): Promise<void> {
    this.config.antiDetectionEnabled = enabled;
    await this.saveConfig();
  }

  // Set security level
  async setSecurityLevel(level: 'standard' | 'enhanced' | 'maximum'): Promise<void> {
    this.config.securityLevel = level;
    await this.saveConfig();
  }

  // Set scan interval
  async setScanInterval(interval: number): Promise<void> {
    this.config.scanInterval = Math.max(5 * 60 * 1000, interval); // Minimum 5 minutes
    await this.saveConfig();
    this.scheduleScan(); // Re-schedule with new interval
  }

  // Get current intelligence config
  getConfig(): IntelligenceConfig {
    return { ...this.config };
  }

  // Get active cover app
  getActiveCoverApp(): CoverApplication | null {
    return coverApplicationsManager.getActiveCover();
  }

  // Get all available cover apps
  getAvailableCoverApps(): CoverApplication[] {
    return coverApplicationsManager.getAvailableCovers();
  }

  private async saveConfig(): Promise<void> {
    try {
      await AsyncStorage.setItem(
        INTELLIGENCE_CONFIG_KEY,
        JSON.stringify(this.config)
      );
    } catch (error) {
      console.error('Failed to save intelligence config:', error);
      throw error;
    }
  }

  // Clean up resources
  destroy(): void {
    if (this.scanTimer) {
      clearTimeout(this.scanTimer);
      this.scanTimer = null;
    }
  }
}

// Export singleton instance
export const intelligenceManager = IntelligenceManager.getInstance();

// Export helper functions
export const performSecurityScan = () => intelligenceManager.performSecurityScan();
export const setCoverApplication = (name: string) => intelligenceManager.setCoverApplication(name);
export const anonymizeUserData = (data: any) => intelligenceManager.anonymizeUserData(data);
export const obfuscateLocation = (location: { lat: number; lng: number }) => 
  intelligenceManager.obfuscateLocation(location);
export const activateAntiDetection = () => intelligenceManager.activateAntiDetection();
export const isScanDue = () => intelligenceManager.isScanDue();

// Import type for IntelligenceManager to use
import { CoverApplication } from '../stealth-advanced/coverApplications';
