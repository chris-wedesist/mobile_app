import AsyncStorage from '@react-native-async-storage/async-storage';
import * as LocalAuthentication from 'expo-local-authentication';
import * as Crypto from 'expo-crypto';

// Types for enhanced authentication
export interface EnhancedUser {
  id: string;
  username?: string;
  email: string;
  role?: string;
  isActive?: boolean;
  createdAt: string;
  lastSignInAt?: string;
}

export interface EnhancedSession {
  user: EnhancedUser;
  tokens: {
    accessToken: string;
    refreshToken: string;
  };
  expires_at: number;
}

export interface LoginCredentials {
  email?: string;
  username?: string;
  password: string;
}

export interface RegisterCredentials {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface AuthResponse {
  success: boolean;
  error?: string;
  session?: EnhancedSession;
  message?: string;
}

class EnhancedAuthService {
  private currentSession: EnhancedSession | null = null;
  private biometricEnabled: boolean = false;

  /**
   * Initialize the enhanced authentication service
   */
  async initialize(): Promise<void> {
    try {
      // Check if biometric authentication is available
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      this.biometricEnabled = hasHardware && isEnrolled;

      // Restore session from storage
      const session = await this.getStoredSession();
      if (session && session.expires_at > Date.now()) {
        this.currentSession = session;
      } else if (session) {
        // Clear expired session
        await this.clearStoredSession();
      }
    } catch (error) {
      console.error('Enhanced auth service initialization error:', error);
    }
  }

  /**
   * Register a new user
   */
  async register(credentials: RegisterCredentials): Promise<AuthResponse> {
    try {
      // Mock registration for now
      const mockUser: EnhancedUser = {
        id: '1',
        email: credentials.email,
        username: credentials.username,
        role: 'user',
        isActive: true,
        createdAt: new Date().toISOString(),
      };

      const session: EnhancedSession = {
        user: mockUser,
        tokens: {
          accessToken: await this.generateMockToken(),
          refreshToken: await this.generateMockToken(),
        },
        expires_at: Date.now() + (60 * 60 * 1000), // 1 hour
      };

      this.currentSession = session;
      await this.storeSession(session);

      return { success: true, session };
    } catch (error) {
      console.error('Registration error:', error);
      return { success: false, error: 'Registration failed' };
    }
  }

  /**
   * Login with email
   */
  async loginWithEmail(credentials: { email: string; password: string }): Promise<AuthResponse> {
    try {
      // Mock login for now
      const mockUser: EnhancedUser = {
        id: '1',
        email: credentials.email,
        username: credentials.email.split('@')[0],
        role: 'user',
        isActive: true,
        createdAt: new Date().toISOString(),
        lastSignInAt: new Date().toISOString(),
      };

      const session: EnhancedSession = {
        user: mockUser,
        tokens: {
          accessToken: await this.generateMockToken(),
          refreshToken: await this.generateMockToken(),
        },
        expires_at: Date.now() + (60 * 60 * 1000), // 1 hour
      };

      this.currentSession = session;
      await this.storeSession(session);

      return { success: true, session };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'Login failed' };
    }
  }

  /**
   * Login with username
   */
  async loginWithUsername(credentials: { username: string; password: string }): Promise<AuthResponse> {
    try {
      // Mock login for now
      const mockUser: EnhancedUser = {
        id: '1',
        email: `${credentials.username}@example.com`,
        username: credentials.username,
        role: 'user',
        isActive: true,
        createdAt: new Date().toISOString(),
        lastSignInAt: new Date().toISOString(),
      };

      const session: EnhancedSession = {
        user: mockUser,
        tokens: {
          accessToken: await this.generateMockToken(),
          refreshToken: await this.generateMockToken(),
        },
        expires_at: Date.now() + (60 * 60 * 1000), // 1 hour
      };

      this.currentSession = session;
      await this.storeSession(session);

      return { success: true, session };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'Login failed' };
    }
  }

  /**
   * Logout user
   */
  async logout(): Promise<AuthResponse> {
    try {
      this.currentSession = null;
      await this.clearStoredSession();
      return { success: true, message: 'Logged out successfully' };
    } catch (error) {
      console.error('Logout error:', error);
      return { success: false, error: 'Logout failed' };
    }
  }

  /**
   * Refresh session
   */
  async refreshSession(): Promise<AuthResponse> {
    try {
      if (!this.currentSession) {
        return { success: false, error: 'No session to refresh' };
      }

      // Mock refresh
      const newSession: EnhancedSession = {
        ...this.currentSession,
        tokens: {
          accessToken: await this.generateMockToken(),
          refreshToken: await this.generateMockToken(),
        },
        expires_at: Date.now() + (60 * 60 * 1000), // 1 hour
      };

      this.currentSession = newSession;
      await this.storeSession(newSession);

      return { success: true, session: newSession };
    } catch (error) {
      console.error('Session refresh error:', error);
      return { success: false, error: 'Session refresh failed' };
    }
  }

  /**
   * Enable biometric authentication
   */
  async enableBiometric(): Promise<AuthResponse> {
    try {
      if (!this.biometricEnabled) {
        return { success: false, error: 'Biometric authentication not available' };
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Authenticate to enable biometric login',
        fallbackLabel: 'Use passcode',
      });

      if (result.success) {
        // Store biometric preference
        await AsyncStorage.setItem('biometric_enabled', 'true');
        return { success: true, message: 'Biometric authentication enabled' };
      } else {
        return { success: false, error: 'Biometric authentication failed' };
      }
    } catch (error) {
      console.error('Enable biometric error:', error);
      return { success: false, error: 'Failed to enable biometric' };
    }
  }

  /**
   * Login with biometric
   */
  async loginWithBiometric(): Promise<AuthResponse> {
    try {
      if (!this.biometricEnabled) {
        return { success: false, error: 'Biometric authentication not available' };
      }

      const biometricEnabled = await AsyncStorage.getItem('biometric_enabled');
      if (biometricEnabled !== 'true') {
        return { success: false, error: 'Biometric authentication not enabled' };
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Login with biometric',
        fallbackLabel: 'Use passcode',
      });

      if (result.success) {
        // Restore session from storage
        const session = await this.getStoredSession();
        if (session && session.expires_at > Date.now()) {
          this.currentSession = session;
          return { success: true, session };
        } else {
          return { success: false, error: 'No valid session found' };
        }
      } else {
        return { success: false, error: 'Biometric authentication failed' };
      }
    } catch (error) {
      console.error('Biometric login error:', error);
      return { success: false, error: 'Biometric login failed' };
    }
  }

  /**
   * Get current session
   */
  getCurrentSession(): EnhancedSession | null {
    return this.currentSession;
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return this.currentSession !== null && this.currentSession.expires_at > Date.now();
  }

  /**
   * Check if biometric is enabled
   */
  isBiometricEnabled(): boolean {
    return this.biometricEnabled;
  }

  /**
   * Generate mock JWT token
   */
  private async generateMockToken(): Promise<string> {
    const randomBytes = await Crypto.getRandomBytesAsync(32);
    // Convert Uint8Array to base64 string without using Buffer
    const base64 = btoa(String.fromCharCode(...randomBytes));
    return base64;
  }

  /**
   * Store session in AsyncStorage
   */
  private async storeSession(session: EnhancedSession): Promise<void> {
    try {
      await AsyncStorage.setItem('enhanced_auth_session', JSON.stringify(session));
    } catch (error) {
      console.error('Store session error:', error);
    }
  }

  /**
   * Get stored session from AsyncStorage
   */
  private async getStoredSession(): Promise<EnhancedSession | null> {
    try {
      const sessionData = await AsyncStorage.getItem('enhanced_auth_session');
      return sessionData ? JSON.parse(sessionData) : null;
    } catch (error) {
      console.error('Get stored session error:', error);
      return null;
    }
  }

  /**
   * Clear stored session from AsyncStorage
   */
  private async clearStoredSession(): Promise<void> {
    try {
      await AsyncStorage.removeItem('enhanced_auth_session');
    } catch (error) {
      console.error('Clear stored session error:', error);
    }
  }
}

// Export singleton instance
const enhancedAuthService = new EnhancedAuthService();
export default enhancedAuthService; 