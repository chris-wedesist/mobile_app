import * as Crypto from 'expo-crypto';
import DeviceInfo from 'react-native-device-info';
import NetInfo from '@react-native-community/netinfo';

export interface CryptoConfig {
  hashAlgorithm: Crypto.CryptoDigestAlgorithm;
  deviceFingerprintEnabled: boolean;
  networkSecurityEnabled: boolean;
  tamperDetectionEnabled: boolean;
}

export interface DeviceFingerprint {
  deviceId: string;
  deviceHash: string;
  systemInfo: {
    model: string;
    brand: string;
    systemVersion: string;
    buildNumber: string;
  };
  securityFeatures: {
    biometricsAvailable: boolean;
    screenLockEnabled: boolean;
    isEmulator: boolean;
    isRooted: boolean;
  };
  networkInfo: {
    connectionType: string;
    isConnected: boolean;
    isWifiEnabled: boolean;
  };
  timestamp: string;
  hash: string;
}

const DEFAULT_CONFIG: CryptoConfig = {
  hashAlgorithm: Crypto.CryptoDigestAlgorithm.SHA256,
  deviceFingerprintEnabled: true,
  networkSecurityEnabled: true,
  tamperDetectionEnabled: true,
};

export class CryptoManager {
  private static instance: CryptoManager;
  private config: CryptoConfig = DEFAULT_CONFIG;
  private initialized = false;
  private deviceFingerprint: DeviceFingerprint | null = null;
  private networkStateListener: (() => void) | null = null;
  private currentNetworkState: any = null;
  private networkSecurityCallbacks: Array<(securityInfo: any) => void> = [];

  static getInstance(): CryptoManager {
    if (!CryptoManager.instance) {
      CryptoManager.instance = new CryptoManager();
    }
    return CryptoManager.instance;
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      console.log('Initializing CryptoManager with expo-crypto...');
      
      // Initialize network monitoring
      if (this.config.networkSecurityEnabled) {
        this.initializeNetworkMonitoring();
      }
      
      // Generate device fingerprint
      if (this.config.deviceFingerprintEnabled) {
        await this.generateDeviceFingerprint();
      }

      this.initialized = true;
      console.log('CryptoManager initialized successfully with network monitoring');
    } catch (error) {
      console.error('Failed to initialize CryptoManager:', error);
      this.initialized = true; // Set as initialized to prevent loops
    }
  }

  /**
   * Generate secure hash using expo-crypto instead of base64 simulation
   */
  async generateSecureHash(data: string): Promise<string> {
    try {
      // Use real cryptographic hash (SHA-256) instead of Buffer.from(data).toString('base64')
      const hash = await Crypto.digestStringAsync(
        this.config.hashAlgorithm,
        data
      );
      return hash;
    } catch (error) {
      console.error('Failed to generate secure hash:', error);
      throw new Error('Hash generation failed');
    }
  }

  /**
   * Generate multiple hash variants for enhanced security
   */
  async generateHashVariants(data: string): Promise<{
    sha256: string;
    sha384: string;
    sha512: string;
    md5: string;
    sha1: string;
  }> {
    try {
      const [sha256, sha384, sha512, md5, sha1] = await Promise.all([
        Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, data),
        Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA384, data),
        Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA512, data),
        Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.MD5, data),
        Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA1, data),
      ]);

      return { sha256, sha384, sha512, md5, sha1 };
    } catch (error) {
      console.error('Failed to generate hash variants:', error);
      throw new Error('Hash variant generation failed');
    }
  }

  /**
   * Generate secure random string for tokens and keys
   */
  async generateSecureRandom(length: number = 32): Promise<string> {
    try {
      // Generate cryptographically secure random bytes
      const randomBytes = await Crypto.getRandomBytesAsync(length);
      
      // Convert to hex string
      return Array.from(randomBytes)
        .map(byte => byte.toString(16).padStart(2, '0'))
        .join('');
    } catch (error) {
      console.error('Failed to generate secure random:', error);
      throw new Error('Secure random generation failed');
    }
  }

  /**
   * Generate comprehensive device fingerprint for security validation
   */
  async generateDeviceFingerprint(): Promise<DeviceFingerprint> {
    try {
      // Gather device information
      const [
        deviceId,
        model,
        brand,
        systemVersion,
        buildNumber,
        isEmulator,
        // Note: Some methods might not be available on all platforms
      ] = await Promise.all([
        DeviceInfo.getUniqueId(),
        DeviceInfo.getModel(),
        DeviceInfo.getBrand(),
        DeviceInfo.getSystemVersion(),
        DeviceInfo.getBuildNumber(),
        DeviceInfo.isEmulator(),
      ]);

      // Get network information
      const netState = await NetInfo.fetch();

      // Try to get security-related information (with fallbacks)
      let isRooted = false;
      try {
        // Check if device is rooted/jailbroken using available methods
        const [hasGms, hasHms] = await Promise.all([
          DeviceInfo.hasGms(),
          DeviceInfo.hasHms(),
        ]);
        
        // Additional security checks can be added here
        // For now, we'll use a basic detection method
        isRooted = false; // Will be enhanced with proper detection
      } catch (error) {
        console.warn('Security detection not available on this platform');
      }

      // Create device fingerprint object
      const fingerprintData: Omit<DeviceFingerprint, 'hash'> = {
        deviceId,
        deviceHash: await this.generateSecureHash(deviceId + model + brand),
        systemInfo: {
          model,
          brand,
          systemVersion,
          buildNumber,
        },
        securityFeatures: {
          biometricsAvailable: await this.checkBiometricsAvailability(),
          screenLockEnabled: await this.checkScreenLockEnabled(),
          isEmulator,
          isRooted,
        },
        networkInfo: {
          connectionType: netState.type || 'unknown',
          isConnected: netState.isConnected || false,
          isWifiEnabled: netState.type === 'wifi',
        },
        timestamp: new Date().toISOString(),
      };

      // Generate hash of the entire fingerprint
      const fingerprintString = JSON.stringify(fingerprintData);
      const hash = await this.generateSecureHash(fingerprintString);

      const fingerprint: DeviceFingerprint = {
        ...fingerprintData,
        hash,
      };

      this.deviceFingerprint = fingerprint;
      return fingerprint;
    } catch (error) {
      console.error('Failed to generate device fingerprint:', error);
      throw new Error('Device fingerprint generation failed');
    }
  }

  /**
   * Verify device integrity by comparing current fingerprint with stored one
   */
  async verifyDeviceIntegrity(storedFingerprint: DeviceFingerprint): Promise<{
    isValid: boolean;
    differences: string[];
    securityRisk: 'low' | 'medium' | 'high';
  }> {
    try {
      const currentFingerprint = await this.generateDeviceFingerprint();
      const differences: string[] = [];

      // Check critical differences
      if (storedFingerprint.deviceId !== currentFingerprint.deviceId) {
        differences.push('Device ID changed');
      }

      if (storedFingerprint.systemInfo.model !== currentFingerprint.systemInfo.model) {
        differences.push('Device model changed');
      }

      if (storedFingerprint.securityFeatures.isRooted !== currentFingerprint.securityFeatures.isRooted) {
        differences.push('Root status changed');
      }

      if (storedFingerprint.securityFeatures.isEmulator !== currentFingerprint.securityFeatures.isEmulator) {
        differences.push('Emulator status changed');
      }

      // Determine security risk level
      let securityRisk: 'low' | 'medium' | 'high' = 'low';
      
      if (differences.some(diff => diff.includes('Device ID') || diff.includes('Root') || diff.includes('Emulator'))) {
        securityRisk = 'high';
      } else if (differences.length > 2) {
        securityRisk = 'medium';
      }

      return {
        isValid: differences.length === 0,
        differences,
        securityRisk,
      };
    } catch (error) {
      console.error('Failed to verify device integrity:', error);
      return {
        isValid: false,
        differences: ['Verification failed'],
        securityRisk: 'high',
      };
    }
  }

  /**
   * Generate secure token with device binding
   */
  async generateDeviceBoundToken(): Promise<string> {
    try {
      if (!this.deviceFingerprint) {
        await this.generateDeviceFingerprint();
      }

      const randomPart = await this.generateSecureRandom(16);
      const devicePart = this.deviceFingerprint!.deviceHash.substring(0, 16);
      const timestampPart = Date.now().toString(36);

      const tokenData = `${randomPart}-${devicePart}-${timestampPart}`;
      const tokenHash = await this.generateSecureHash(tokenData);

      return tokenHash;
    } catch (error) {
      console.error('Failed to generate device-bound token:', error);
      throw new Error('Token generation failed');
    }
  }

  /**
   * Validate network security state (enhanced with real-time monitoring)
   */
  async validateNetworkSecurity(): Promise<{
    isSecure: boolean;
    issues: string[];
    recommendations: string[];
    realTimeAnalysis?: any;
  }> {
    try {
      // Use current monitored state if available, otherwise fetch fresh
      const netState = this.currentNetworkState || await NetInfo.fetch();
      const issues: string[] = [];
      const recommendations: string[] = [];

      // Check connection security
      if (!netState.isConnected) {
        issues.push('No network connection');
        recommendations.push('Ensure device is connected to a secure network');
      }

      if (netState.type === 'wifi' && netState.details?.isConnectionExpensive === false) {
        // On WiFi - check if it's potentially insecure
        issues.push('Connected to WiFi network');
        recommendations.push('Verify WiFi network security (WPA2/WPA3)');
        recommendations.push('Avoid public/unsecured WiFi networks');
      }

      if (netState.type === 'cellular') {
        // Cellular is generally more secure but check for other issues
        if (netState.details?.cellularGeneration === '2g') {
          issues.push('Using 2G cellular connection (less secure)');
          recommendations.push('Use 3G/4G/5G connection when possible');
        }
      }

      // Add monitoring-specific insights
      if (this.networkStateListener) {
        if (netState.securityAnalysis) {
          issues.push(...netState.securityAnalysis.threats);
          recommendations.push(...netState.securityAnalysis.recommendations);
        }
      } else {
        recommendations.push('Enable real-time network monitoring for enhanced security');
      }

      const isSecure = issues.length === 0;

      return {
        isSecure,
        issues,
        recommendations,
        realTimeAnalysis: netState.securityAnalysis || null,
      };
    } catch (error) {
      console.error('Failed to validate network security:', error);
      return {
        isSecure: false,
        issues: ['Network security validation failed'],
        recommendations: ['Check network connectivity and try again'],
      };
    }
  }

  /**
   * Initialize real-time network monitoring with security callbacks
   */
  private initializeNetworkMonitoring(): void {
    try {
      console.log('🌐 Initializing real-time network security monitoring...');
      
      // Set up NetInfo event listener for real-time network changes
      this.networkStateListener = NetInfo.addEventListener(state => {
        console.log('🔄 Network state changed:');
        console.log('Connection type:', state.type);
        console.log('Is connected?', state.isConnected);
        console.log('Is WiFi enabled?', state.type === 'wifi');
        
        // Store current network state
        this.currentNetworkState = state;
        
        // Analyze security implications of network change
        this.analyzeNetworkSecurityChange(state);
        
        // Trigger security callbacks
        this.triggerNetworkSecurityCallbacks(state);
      });
      
      console.log('✅ Network monitoring initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize network monitoring:', error);
    }
  }

  /**
   * Analyze security implications of network state changes
   */
  private async analyzeNetworkSecurityChange(state: any): Promise<void> {
    try {
      const securityAnalysis = {
        timestamp: new Date().toISOString(),
        connectionType: state.type,
        isConnected: state.isConnected,
        securityLevel: 'unknown' as 'high' | 'medium' | 'low' | 'unknown',
        threats: [] as string[],
        recommendations: [] as string[],
      };

      // Analyze security level based on connection type
      if (!state.isConnected) {
        securityAnalysis.securityLevel = 'low';
        securityAnalysis.threats.push('No network connection - offline mode');
        securityAnalysis.recommendations.push('Ensure secure network connection when needed');
      } else if (state.type === 'wifi') {
        securityAnalysis.securityLevel = 'medium';
        securityAnalysis.threats.push('Connected to WiFi - potential security risk');
        securityAnalysis.recommendations.push('Verify WiFi network security (WPA2/WPA3)');
        securityAnalysis.recommendations.push('Avoid public/unsecured WiFi networks');
      } else if (state.type === 'cellular') {
        securityAnalysis.securityLevel = 'high';
        
        // Check cellular generation for additional security assessment
        if (state.details?.cellularGeneration === '2g') {
          securityAnalysis.securityLevel = 'medium';
          securityAnalysis.threats.push('2G connection - lower security encryption');
          securityAnalysis.recommendations.push('Use 3G/4G/5G when available');
        }
      } else if (state.type === 'ethernet') {
        securityAnalysis.securityLevel = 'high';
      } else {
        securityAnalysis.securityLevel = 'low';
        securityAnalysis.threats.push('Unknown connection type - security risk');
        securityAnalysis.recommendations.push('Verify network connection security');
      }

      // Log security analysis
      console.log('🛡️ Network Security Analysis:', {
        level: securityAnalysis.securityLevel,
        threats: securityAnalysis.threats.length,
        recommendations: securityAnalysis.recommendations.length,
      });

      // Store analysis for retrieval
      this.currentNetworkState.securityAnalysis = securityAnalysis;

    } catch (error) {
      console.error('Failed to analyze network security change:', error);
    }
  }

  /**
   * Register callback for network security changes
   */
  registerNetworkSecurityCallback(callback: (securityInfo: any) => void): void {
    this.networkSecurityCallbacks.push(callback);
  }

  /**
   * Remove network security callback
   */
  removeNetworkSecurityCallback(callback: (securityInfo: any) => void): void {
    const index = this.networkSecurityCallbacks.indexOf(callback);
    if (index > -1) {
      this.networkSecurityCallbacks.splice(index, 1);
    }
  }

  /**
   * Trigger all registered network security callbacks
   */
  private triggerNetworkSecurityCallbacks(state: any): void {
    try {
      const securityInfo = {
        networkState: state,
        timestamp: new Date().toISOString(),
        securityAnalysis: state.securityAnalysis || null,
      };

      this.networkSecurityCallbacks.forEach(callback => {
        try {
          callback(securityInfo);
        } catch (error) {
          console.error('Network security callback error:', error);
        }
      });
    } catch (error) {
      console.error('Failed to trigger network security callbacks:', error);
    }
  }

  /**
   * Get current network security status
   */
  getCurrentNetworkSecurity(): {
    state: any;
    securityLevel: 'high' | 'medium' | 'low' | 'unknown';
    isMonitoring: boolean;
  } {
    return {
      state: this.currentNetworkState,
      securityLevel: this.currentNetworkState?.securityAnalysis?.securityLevel || 'unknown',
      isMonitoring: this.networkStateListener !== null,
    };
  }

  /**
   * Cleanup network monitoring (call when component unmounts)
   */
  cleanup(): void {
    if (this.networkStateListener) {
      this.networkStateListener();
      this.networkStateListener = null;
      console.log('🧹 Network monitoring cleaned up');
    }
  }

  // Helper methods
  private async checkBiometricsAvailability(): Promise<boolean> {
    try {
      // This would need to be implemented with react-native-biometrics or similar
      // For now, return false as a safe default
      return false;
    } catch {
      return false;
    }
  }

  private async checkScreenLockEnabled(): Promise<boolean> {
    try {
      // This would need to be implemented with device-specific checks
      // For now, return false as a safe default
      return false;
    } catch {
      return false;
    }
  }

  /**
   * Get current device fingerprint
   */
  getDeviceFingerprint(): DeviceFingerprint | null {
    return this.deviceFingerprint;
  }

  /**
   * Update configuration
   */
  updateConfig(updates: Partial<CryptoConfig>): void {
    this.config = {
      ...this.config,
      ...updates,
    };
  }

  /**
   * Get configuration
   */
  getConfig(): CryptoConfig {
    return { ...this.config };
  }
}
