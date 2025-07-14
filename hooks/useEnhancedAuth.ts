import { useState, useEffect } from 'react';
import enhancedAuthService, { EnhancedSession, EnhancedUser } from '@/utils/enhanced-auth-service';

export function useEnhancedAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<EnhancedUser | null>(null);
  const [currentSession, setCurrentSession] = useState<EnhancedSession | null>(null);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        await enhancedAuthService.initialize();
        
        const session = enhancedAuthService.getCurrentSession();
        const authenticated = enhancedAuthService.isAuthenticated();
        const biometric = enhancedAuthService.isBiometricEnabled();

        setCurrentSession(session);
        setCurrentUser(session?.user || null);
        setIsAuthenticated(authenticated);
        setBiometricEnabled(biometric);
      } catch (err) {
        console.error('Auth initialization error:', err);
        setError('Failed to initialize authentication');
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const updateAuthState = (session: EnhancedSession | null) => {
    setCurrentSession(session);
    setCurrentUser(session?.user || null);
    setIsAuthenticated(session !== null);
    setError(null);
  };

  const loginWithEmail = async (credentials: { email: string; password: string }): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await enhancedAuthService.loginWithEmail(credentials);
      
      if (response.success && response.session) {
        updateAuthState(response.session);
        return true;
      } else {
        setError(response.error || 'Login failed');
        return false;
      }
    } catch (err) {
      setError('Login failed');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithUsername = async (credentials: { username: string; password: string }): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await enhancedAuthService.loginWithUsername(credentials);
      
      if (response.success && response.session) {
        updateAuthState(response.session);
        return true;
      } else {
        setError(response.error || 'Login failed');
        return false;
      }
    } catch (err) {
      setError('Login failed');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (credentials: { username: string; email: string; password: string; confirmPassword: string }): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await enhancedAuthService.register(credentials);
      
      if (response.success && response.session) {
        updateAuthState(response.session);
        return true;
      } else {
        setError(response.error || 'Registration failed');
        return false;
      }
    } catch (err) {
      setError('Registration failed');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await enhancedAuthService.logout();
      
      if (response.success) {
        updateAuthState(null);
        return true;
      } else {
        setError(response.error || 'Logout failed');
        return false;
      }
    } catch (err) {
      setError('Logout failed');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const refreshSession = async (): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await enhancedAuthService.refreshSession();
      
      if (response.success && response.session) {
        updateAuthState(response.session);
        return true;
      } else {
        setError(response.error || 'Session refresh failed');
        return false;
      }
    } catch (err) {
      setError('Session refresh failed');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const enableBiometric = async (): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await enhancedAuthService.enableBiometric();
      
      if (response.success) {
        setBiometricEnabled(true);
        return true;
      } else {
        setError(response.error || 'Failed to enable biometric');
        return false;
      }
    } catch (err) {
      setError('Failed to enable biometric');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithBiometric = async (): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await enhancedAuthService.loginWithBiometric();
      
      if (response.success && response.session) {
        updateAuthState(response.session);
        return true;
      } else {
        setError(response.error || 'Biometric login failed');
        return false;
      }
    } catch (err) {
      setError('Biometric login failed');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isAuthenticated,
    currentUser,
    currentSession,
    biometricEnabled,
    isLoading,
    error,
    loginWithEmail,
    loginWithUsername,
    register,
    logout,
    refreshSession,
    enableBiometric,
    loginWithBiometric,
  };
} 