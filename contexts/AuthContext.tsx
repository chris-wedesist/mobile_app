import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  signUp: (
    email: string,
    password: string,
    fullName: string,
    username: string
  ) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<{ error: any }>;
  fetchUserProfile: (userId: string) => Promise<void>;
}

export interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  username: string | null;
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
    const initializeAuth = async () => {
      try {
        setLoading(true);
        const storedUserId = await AsyncStorage.getItem('user_id');
        if (storedUserId !== null) {
          fetchUserProfile(storedUserId)
        } else {
          setUser(null);
          setLoading(false);
          setUserProfile(null);
        }
      } catch (error) {
        console.error('AuthContext: Error initializing auth:', error);
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const fetchUserProfile = async (userId: string) => {
    try {
      if (!supabase) {
        console.error(
          'Supabase client not available for fetching user profile'
        );
        return;
      }

      console.log('AuthContext: Fetching user profile for ID:', userId);
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching user profile:', error);
        setLoading(false);
        return;
      }

      console.log('AuthContext: User profile fetched:', data);
      
      // Create a user object from the profile data
      const userObject = {
        id: data.id,
        email: data.email,
        created_at: data.created_at,
        updated_at: data.created_at,
        aud: 'authenticated',
        role: 'authenticated',
        email_confirmed_at: data.created_at,
        phone: '',
        confirmed_at: data.created_at,
        last_sign_in_at: data.created_at,
        app_metadata: {},
        user_metadata: { full_name: data.full_name, username: data.username },
        identities: [],
        factors: [],
      } as User;
      
      setUser(userObject);
      setUserProfile(data);
      setLoading(false);
    } catch (error) {
      console.error('Error in fetchUserProfile:', error);
      setLoading(false);
    }
  };

  const signUp = async (
    email: string,
    password: string,
    fullName: string,
    username: string
  ) => {
    try {
      if (!supabase || !supabase.auth) {
        return { error: new Error('Supabase client not available') };
      }

      const { user: authUser, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) {
        console.error('Auth error:', authError);
        // Handle duplicate email error specifically
        if (
          authError.message.includes('duplicate key') ||
          authError.message.includes('already registered')
        ) {
          return {
            error: new Error(
              'An account with this email already exists. Please sign in instead.'
            ),
          };
        }
        return { error: authError };
      }

      if (!authUser) {
        return { error: new Error('No user data returned') };
      }

      // Use upsert to handle existing email or create new profile
      const { data: profileData, error: profileError } = await supabase
        .from('users')
        .upsert(
          {
            id: authUser.id,
            email: email,
            full_name: fullName,
            username: username,
            created_at: new Date().toISOString(),
          },
          {
            onConflict: 'email',
          }
        )
        .select()
        .single();

      if (profileError) {
        console.error('Profile error:', profileError);
        return { error: profileError };
      }

      await AsyncStorage.setItem('user_id', authUser.id);

      return { error: null };
    } catch (error) {
      console.error('Signup error:', error);
      return { error };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      if (!supabase || !supabase.auth) {
        return { error: new Error('Supabase client not available') };
      }

      const { user: authUser, error: authError } = await supabase.auth.signIn({
        email,
        password,
      });

      if (authError) {
        console.error('Auth error:', authError);
        return { error: authError };
      }

      if (!authUser) {
        return { error: new Error('No user data returned') };
      }

      await AsyncStorage.setItem('user_id', authUser.id);

      return { error: null };
    } catch (error) {
      console.error('Signin error:', error);
      return { error };
    }
  };

  const signOut = async () => {
    try {
      if (!supabase || !supabase.auth) {
        console.error('Supabase client not available for sign out');
        return;
      }

      await supabase.auth.signOut();

      // Clear user ID from AsyncStorage
      await AsyncStorage.removeItem('user_id');

      // Clear local state
      setUser(null);
      setUserProfile(null);
      setSession(null);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) {
      return { error: new Error('No user logged in') };
    }

    if (!supabase) {
      return { error: new Error('Supabase client not available') };
    }

    try {
      const { data, error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single();

      if (error) {
        return { error };
      }

      setUserProfile(data);
      return { error: null };
    } catch (error) {
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
    fetchUserProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
