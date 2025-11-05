import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { supabase } from '@/lib/supabase';

export interface PushTokenData {
  token: string;
  deviceId: string;
  platform: string;
  lastUpdated: string;
}

/**
 * Registers the device for push notifications and returns the Expo push token
 */
export async function registerForPushNotificationsAsync(): Promise<string | null> {
  let token: string | null = null;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      console.log('Failed to get push token for push notification!');
      return null;
    }
    
    try {
      // Get project ID from app configuration
      const projectId = Constants.expoConfig?.extra?.eas?.projectId;
      
      if (!projectId) {
        console.error('No project ID found in app configuration');
        return null;
      }

      token = (await Notifications.getExpoPushTokenAsync({
        projectId: projectId
      })).data;
      console.log('Expo push token:', token);
    } catch (error) {
      console.error('Error getting Expo push token:', error);
      return null;
    }
  } else {
    console.log('Must use physical device for Push Notifications');
    return null;
  }

  return token;
}

/**
 * Saves the push token to the user's profile in the database
 */
export async function savePushTokenToProfile(userId: string, token: string): Promise<boolean> {
  try {
    if (!token || !userId) {
      console.error('Invalid token or userId');
      return false;
    }

    console.log('🔍 Attempting to save push token for user:', userId);
    console.log('🔍 Push token:', token);

    const tokenData: PushTokenData = {
      token,
      deviceId: Device.osInternalBuildId || 'unknown',
      platform: Platform.OS,
      lastUpdated: new Date().toISOString(),
    };

    console.log('🔍 Token data:', tokenData);

    // Use UPDATE instead of UPSERT to avoid creating new rows without required fields
    const { data, error } = await supabase
      .from('users')
      .update({
        push_token: token,
        push_token_data: tokenData,
        push_token_updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .select();

    if (error) {
      console.error('❌ Error saving push token to profile:', error);
      return false;
    }

    if (!data || data.length === 0) {
      console.error('❌ User not found with id:', userId);
      return false;
    }

    console.log('✅ Push token saved to user profile successfully');
    console.log('✅ Update result:', data);
    return true;
  } catch (error) {
    console.error('❌ Error in savePushTokenToProfile:', error);
    return false;
  }
}

/**
 * Sends a push notification to a specific user via Expo's push service
 */
export async function sendPushNotificationToUser(
  userId: string,
  title: string,
  body: string,
  data?: any
): Promise<boolean> {
  try {
    // Get user's push token from database
    const { data: user, error: fetchError } = await supabase
      .from('users')
      .select('push_token, push_token_data')
      .eq('id', userId)
      .single();

    if (fetchError || !user?.push_token) {
      console.error('User push token not found:', fetchError);
      return false;
    }

    // Send push notification via Expo's API
    const message = {
      to: user.push_token,
      sound: 'default',
      title,
      body,
      data: data || {},
    };

    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });

    const result = await response.json();
    
    if (result.data && result.data.status === 'ok') {
      console.log('Push notification sent successfully to user:', userId);
      return true;
    } else {
      console.error('Failed to send push notification:', result);
      return false;
    }
  } catch (error) {
    console.error('Error sending push notification:', error);
    return false;
  }
}

/**
 * Sends push notifications to all users with push tokens
 * Note: Location-based filtering is disabled until user location tracking is implemented
 */
export async function sendIncidentNotificationToNearbyUsers(
  incidentLat: number,
  incidentLng: number,
  incidentTitle: string,
  incidentId: string,
  radiusMiles: number = 50
): Promise<void> {
  try {
    console.log('Sending incident notifications to all users with push tokens...');

    // Get all users with push tokens (without location data for now)
    const { data: users, error } = await supabase
      .from('users')
      .select('id, push_token, push_token_data')
      .not('push_token', 'is', null);

    if (error) {
      console.error('Error fetching users with push tokens:', error);
      return;
    }

    if (!users || users.length === 0) {
      console.log('No users with push tokens found');
      return;
    }

    // Send notification to all users with push tokens
    // TODO: Implement location-based filtering when user location tracking is added
    const notifications = users.map(async (user) => {
      await sendPushNotificationToUser(
        user.id,
        'New Incident Reported',
        `${incidentTitle} - Check the incidents tab for details`,
        {
          type: 'incident',
          incidentId,
          latitude: incidentLat,
          longitude: incidentLng,
        }
      );
    });

    await Promise.all(notifications);
    console.log(`Incident notifications sent to ${users.length} users`);
  } catch (error) {
    console.error('Error sending incident notifications:', error);
  }
}

/**
 * Calculates distance between two coordinates using Haversine formula
 * This function is kept for future use when user location tracking is implemented
 */
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

function toRad(value: number): number {
  return value * Math.PI / 180;
}

/**
 * Initializes push notifications for the current user
 * Call this when user logs in or app starts
 */
export async function initializePushNotifications(userId: string): Promise<boolean> {
  try {
    console.log('🚀 Initializing push notifications for user:', userId);
    
    // Register for push notifications
    const token = await registerForPushNotificationsAsync();
    
    if (!token) {
      console.log('❌ Failed to get push token');
      return false;
    }

    console.log('✅ Push token obtained:', token);

    // Save token to user profile
    const saved = await savePushTokenToProfile(userId, token);
    
    if (saved) {
      console.log('✅ Push notifications initialized successfully');
      return true;
    } else {
      console.log('❌ Failed to save push token to profile');
      return false;
    }
  } catch (error) {
    console.error('❌ Error initializing push notifications:', error);
    return false;
  }
}
