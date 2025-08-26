export { EncryptionService } from './encryption/index';
export { AuthenticationService } from './authentication/index';
export * from './types/index';

import { EncryptionService } from './encryption/index';
import { AuthenticationService } from './authentication/index';
import { SecurityConfig, SecurityResult } from './types/index';

/**
 * Main Desist Mobile Security class that provides comprehensive security services
 */
export class DesistMobileSecurity {
  private encryptionService: EncryptionService;
  private authenticationService: AuthenticationService;

  constructor(config: SecurityConfig) {
    this.encryptionService = new EncryptionService(config.encryption);
    this.authenticationService = new AuthenticationService(config.authentication);
  }

  /**
   * Get the encryption service
   */
  public getEncryptionService(): EncryptionService {
    return this.encryptionService;
  }

  /**
   * Get the authentication service
   */
  public getAuthenticationService(): AuthenticationService {
    return this.authenticationService;
  }

  /**
   * Perform a comprehensive security health check
   */
  public async performSecurityHealthCheck(): Promise<SecurityResult<{
    encryption: boolean;
    authentication: boolean;
    overall: boolean;
  }>> {
    try {
      // Test encryption
      const testData = 'security-test-data';
      const encryptResult = await this.encryptionService.encrypt(testData);
      const encryptionWorking = encryptResult.success;

      // Test authentication setup
      const authWorking = !!this.authenticationService;

      const overall = encryptionWorking && authWorking;

      return {
        success: true,
        data: {
          encryption: encryptionWorking,
          authentication: authWorking,
          overall
        },
        timestamp: new Date()
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'HEALTH_CHECK_FAILED',
          message: 'Security health check failed',
          severity: 'high',
          details: { error: error instanceof Error ? error.message : 'Unknown error' }
        },
        timestamp: new Date()
      };
    }
  }

  /**
   * Cleanup resources
   */
  public destroy(): void {
    this.encryptionService.destroy();
  }
}
