import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<{ error: any }>;
}

export interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  created_at: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('AuthContext: Initializing with fallback...');
    
    // Try to load stored session
    loadStoredSession();
    
    // Set loading to false after a short delay
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  }, []);

  const loadStoredSession = async () => {
    try {
      const storedSession = await AsyncStorage.getItem('user_session');
      if (storedSession) {
        const sessionData = JSON.parse(storedSession);
        console.log('AuthContext: Loaded stored session:', sessionData);
        
        // Create mock session and user
        const mockSession: Session = {
          access_token: 'mock_token',
          refresh_token: 'mock_refresh',
          expires_in: 3600,
          expires_at: Date.now() + 3600000,
          token_type: 'bearer',
          user: sessionData.user || {
            id: sessionData.profile?.id || 'mock_id',
            email: sessionData.profile?.email || 'mock@example.com',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            aud: 'authenticated',
            role: 'authenticated',
            email_confirmed_at: new Date().toISOString(),
            phone: '',
            confirmed_at: new Date().toISOString(),
            last_sign_in_at: new Date().toISOString(),
            app_metadata: {},
            user_metadata: {},
            identities: [],
            factors: [],
          }
        };
        
        setSession(mockSession);
        setUser(mockSession.user);
        setUserProfile(sessionData.profile);
      }
    } catch (error) {
      console.error('AuthContext: Error loading stored session:', error);
    }
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      console.log('AuthContext: Mock signup for:', email);
      
      // Create mock user profile
      const mockProfile: UserProfile = {
        id: 'mock_' + Date.now(),
        email,
        full_name: fullName,
        created_at: new Date().toISOString(),
      };

      // Create mock session
      const mockSession: Session = {
        access_token: 'mock_token_' + Date.now(),
        refresh_token: 'mock_refresh_' + Date.now(),
        expires_in: 3600,
        expires_at: Date.now() + 3600000,
        token_type: 'bearer',
        user: {
          id: mockProfile.id,
          email,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          aud: 'authenticated',
          role: 'authenticated',
          email_confirmed_at: new Date().toISOString(),
          phone: '',
          confirmed_at: new Date().toISOString(),
          last_sign_in_at: new Date().toISOString(),
          app_metadata: {},
          user_metadata: {},
          identities: [],
          factors: [],
        }
      };

      // Store session data
      await AsyncStorage.setItem('user_session', JSON.stringify({
        user: mockSession.user,
        profile: mockProfile
      }));

      setSession(mockSession);
      setUser(mockSession.user);
      setUserProfile(mockProfile);

      return { error: null };
    } catch (error) {
      console.error('AuthContext: Mock signup error:', error);
      return { error };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      console.log('AuthContext: Mock signin for:', email);
      
      // For demo purposes, accept any email/password
      const mockProfile: UserProfile = {
        id: 'mock_' + Date.now(),
        email,
        full_name: 'Demo User',
        created_at: new Date().toISOString(),
      };

      const mockSession: Session = {
        access_token: 'mock_token_' + Date.now(),
        refresh_token: 'mock_refresh_' + Date.now(),
        expires_in: 3600,
        expires_at: Date.now() + 3600000,
        token_type: 'bearer',
        user: {
          id: mockProfile.id,
          email,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          aud: 'authenticated',
          role: 'authenticated',
          email_confirmed_at: new Date().toISOString(),
          phone: '',
          confirmed_at: new Date().toISOString(),
          last_sign_in_at: new Date().toISOString(),
          app_metadata: {},
          user_metadata: {},
          identities: [],
          factors: [],
        }
      };

      // Store session data
      await AsyncStorage.setItem('user_session', JSON.stringify({
        user: mockSession.user,
        profile: mockProfile
      }));

      setSession(mockSession);
      setUser(mockSession.user);
      setUserProfile(mockProfile);

      return { error: null };
    } catch (error) {
      console.error('AuthContext: Mock signin error:', error);
      return { error };
    }
  };

  const signOut = async () => {
    try {
      console.log('AuthContext: Mock signout');
      await AsyncStorage.removeItem('user_session');
      setSession(null);
      setUser(null);
      setUserProfile(null);
    } catch (error) {
      console.error('AuthContext: Mock signout error:', error);
    }
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    try {
      if (!userProfile) {
        return { error: new Error('No user profile available') };
      }

      const updatedProfile = { ...userProfile, ...updates };
      setUserProfile(updatedProfile);

      // Update stored session
      await AsyncStorage.setItem('user_session', JSON.stringify({
        user: user,
        profile: updatedProfile
      }));

      return { error: null };
    } catch (error) {
      console.error('AuthContext: Mock update profile error:', error);
      return { error };
    }
  };

  const value = {
    session,
    user,
    userProfile,
    loading,
    signUp,
    signIn,
    signOut,
    updateProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};