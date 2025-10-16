import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { initializePushNotifications } from '@/utils/push-notifications';
import { sendConfirmationEmail, resendConfirmationEmail } from '@/utils/email-confirmation';
import { testUsersTableSchema, testUserProfileCreation } from '@/utils/database-test';
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
  ) => Promise<{ error: any; requiresConfirmation?: boolean; message?: string }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<{ error: any }>;
  fetchUserProfile: (userId: string) => Promise<void>;
  resendConfirmation: (email: string) => Promise<{ error: any }>;
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

      const { data, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            username: username,
          },
        },
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

      if (!data.user) {
        return { error: new Error('No user data returned') };
      }

      // Test database schema first
      const schemaTest = await testUsersTableSchema();
      if (!schemaTest.success) {
        console.error('Database schema test failed:', schemaTest.error);
        return { 
          error: new Error(`Database setup issue: ${schemaTest.error}. Please contact support.`) 
        };
      }

      // Create user profile in database using upsert to handle duplicates
      try {
        const { data: profileData, error: profileError } = await supabase
          .from('users')
          .upsert({
            id: data.user.id,
            email: email,
            full_name: fullName,
            username: username,
            created_at: new Date().toISOString(),
            email_confirmed: false,
          }, {
            onConflict: 'id'
          })
          .select()
          .single();

        if (profileError) {
          console.error('Profile creation error:', profileError);
          // If profile creation fails, we can't proceed with email confirmation
          return { 
            error: new Error('Failed to create user profile. Please try again.') 
          };
        } else {
          console.log('User profile created successfully');
        }
      } catch (error) {
        console.error('Profile creation exception:', error);
        return { 
          error: new Error('Failed to create user profile. Please try again.') 
        };
      }

      // Send custom confirmation email
      try {
        const result = await sendConfirmationEmail({
          email: email,
          username: fullName,
          userId: data.user.id,
        });

        if (!result.success) {
          console.error('Failed to send confirmation email:', result.error);
          // Don't fail signup if email sending fails
        } else {
          console.log('Confirmation email sent successfully');
        }
      } catch (error) {
        console.error('Error sending confirmation email:', error);
        // Don't fail signup if email sending fails
      }

      return { 
        error: null, 
        requiresConfirmation: true,
        message: 'Please check your email and enter the 6-digit confirmation code to verify your account.'
      };
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

      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        console.error('Auth error:', authError);
        return { error: authError };
      }

      if (!data.user) {
        return { error: new Error('No user data returned') };
      }

      // Check if email is confirmed in our users table
      const { data: userProfile, error: profileError } = await supabase
        .from('users')
        .select('email_confirmed')
        .eq('id', data.user.id)
        .single();

      if (profileError || !userProfile) {
        return { 
          error: new Error('User profile not found. Please sign up again.') 
        };
      }

      if (!userProfile.email_confirmed) {
        return { 
          error: new Error('Please verify your email address before signing in. Check your email for a confirmation code.') 
        };
      }

      await AsyncStorage.setItem('user_id', data.user.id);
      await fetchUserProfile(data.user.id);

      // Initialize push notifications for the user
      await initializePushNotifications(data.user.id);

      return { error: null };
    } catch (error) {
      console.error('Signin error:', error);
      return { error };
    }
  };

  const resendConfirmation = async (email: string) => {
    try {
      // Get username from email (part before @)
      const username = email.split('@')[0];
      
      const result = await resendConfirmationEmail(email, username);

      if (!result.success) {
        return { error: new Error(result.error || 'Failed to resend confirmation email') };
      }

      return { error: null };
    } catch (error) {
      console.error('Resend confirmation error:', error);
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
    resendConfirmation,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};