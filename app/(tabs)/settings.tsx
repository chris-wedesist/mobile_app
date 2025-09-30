import { View, Text, StyleSheet, TouchableOpacity, Switch, TextInput, Platform, ScrollView, KeyboardAvoidingView } from 'react-native';
import { BlurView } from 'expo-blur';
import { useState, useEffect, useCallback } from 'react';
import * as Notifications from 'expo-notifications';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { colors, shadows, radius } from '@/constants/theme';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';


interface Incident {
  id: string;
  title: string;
  latitude: number;
  longitude: number;
  // Add other incident fields as needed
}

export default function SettingsScreen() {
  const { signOut, userProfile, user, fetchUserProfile } = useAuth();
  const [highQuality, setHighQuality] = useState(true);
  const [enableSound, setEnableSound] = useState(true);
  const [notifications, setNotifications] = useState(true);
  const [incidentAlerts, setIncidentAlerts] = useState(true);
  const [locationEnabled, setLocationEnabled] = useState(false);
  const [emergencyContact, setEmergencyContact] = useState('');
  const [emergencyMessage, setEmergencyMessage] = useState(
    'EMERGENCY: I need immediate assistance. My location is attached.'
  );
  const [isEditingContact, setIsEditingContact] = useState(false);

  useEffect(() => {
    // Configure notification handler
    const configureNotifications = async () => {
      await Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: true,
          shouldShowBanner: true,
          shouldShowList: true
        }),
      });
    };

    configureNotifications();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut();
      // Navigation will be handled by AuthProvider
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // Set up real-time incident notifications
  useEffect(() => {
    let subscription: any;

    const setupIncidentNotifications = async () => {
      try {
        // Get user's location
        const { status: locationStatus } = await Location.getForegroundPermissionsAsync();
        if (locationStatus !== 'granted') {
          console.log('Location permission not granted');
          return;
        }

        const location = await Location.getCurrentPositionAsync({});
        const { latitude, longitude } = location.coords;

        // Get user's notification radius from settings
        const settingsStr = await AsyncStorage.getItem('notification_settings');
        const settings = settingsStr ? JSON.parse(settingsStr) : { notification_radius: 50 };
        const radius = settings.notification_radius;

        // Subscribe to new incidents using channel
        const channel = supabase
          .channel('incidents')
          .on('postgres_changes', 
            { 
              event: 'INSERT', 
              schema: 'public', 
              table: 'incidents' 
            }, 
            async (payload: { new: Incident }) => {
              const newIncident = payload.new;
              
              // Calculate distance between user and incident
              const distance = calculateDistance(
                latitude,
                longitude,
                newIncident.latitude,
                newIncident.longitude
              );

              // If incident is within user's radius, send notification
              if (distance <= radius) {
                await Notifications.scheduleNotificationAsync({
                  content: {
                    title: 'New Incident Nearby',
                    body: `${newIncident.title} - ${distance.toFixed(1)} km away`,
                    data: { 
                      type: 'incident',
                      incidentId: newIncident.id 
                    },
                  },
                  trigger: null, // Show immediately
                });
              }
            }
          )
          .subscribe();
        
        subscription = channel;
      } catch (error) {
        console.error('Error setting up incident notifications:', error);
      }
    };

    setupIncidentNotifications();

    // Cleanup subscription
    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, []);

  // Helper function to calculate distance between two points
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Earth's radius in km
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const toRad = (value: number) => {
    return value * Math.PI / 180;
  };

  useFocusEffect(
    useCallback(() => {
      const loadData = async () => {
        await checkPermissions();
        await loadEmergencySettings();
        // Fetch user profile if user exists but profile is not loaded
        if (user && !userProfile) {
          console.log('Settings: Fetching user profile for user:', user.id);
          await fetchUserProfile(user.id);
        }
      };
      loadData();
    }, [user, userProfile, fetchUserProfile])
  );


  const handleEmergencyContactChange = (text: string) => {
    setEmergencyContact(text);
  };

  const handleEmergencyMessageChange = (text: string) => {
    setEmergencyMessage(text);
  };

  const checkPermissions = async () => {
    const { status: locationStatus } = await Location.getForegroundPermissionsAsync();
    setLocationEnabled(locationStatus === 'granted');

    if (Platform.OS !== 'web') {
      const { status: notificationStatus } = await Notifications.getPermissionsAsync();
      setNotifications(notificationStatus === 'granted');
    }
  };

  const loadEmergencySettings = async () => {
    try {
      const contact = await AsyncStorage.getItem('emergencyContact');
      const message = await AsyncStorage.getItem('emergencyMessage');
      setEmergencyContact(contact || '');
      setEmergencyMessage(message || 'EMERGENCY: I need immediate assistance. My location is attached.');
    } catch (error) {
      console.error('Error loading emergency settings:', error);
    }
  };

  const saveEmergencySettings = async () => {
    try {
      await AsyncStorage.setItem('emergencyContact', emergencyContact);
      await AsyncStorage.setItem('emergencyMessage', emergencyMessage);
      setIsEditingContact(false);
    } catch (error) {
      console.error('Error saving emergency settings:', error);
    }
  };

  const toggleIncidentAlerts = async (value: boolean) => {
    if (value && Platform.OS !== 'web') {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') {
        alert('Notification permissions are required for incident alerts');
        return;
      }
    }
    setIncidentAlerts(value);
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
    >
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Settings</Text>
        
        {/* User Profile Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Account</Text>
            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <MaterialIcons name="person" size={20} color={colors.accent} />
                <View>
                  <Text style={styles.settingText}>
                    {userProfile?.full_name || (user?.user_metadata?.full_name) || 'Loading...'}
                  </Text>
                  <Text style={styles.messagePreview}>
                    @{userProfile?.username || (user?.user_metadata?.username) || 'Loading...'}
                  </Text>
                </View>
              </View>
            </View>
            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <MaterialIcons name="email" size={20} color={colors.accent} />
                <Text style={styles.settingText}>
                  {userProfile?.email || user?.email || 'Loading...'}
                </Text>
              </View>
            </View>
            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
              <MaterialIcons name="logout" size={20} color={colors.text.primary} />
              <Text style={styles.logoutButtonText}>Sign Out</Text>
            </TouchableOpacity>
          </View>

        <View style={styles.securitySection}>
          <View style={styles.securityHeader}>
            <MaterialIcons name="security" size={20} color={colors.accent} />
            <Text style={styles.securitySectionTitle}>Security Features</Text>
            <View style={styles.betaBadge}>
              <Text style={styles.betaText}>COMING SOON</Text>
            </View>
          </View>
          <Text style={styles.securitySubtitle}>Advanced protection features coming soon</Text>

          <BlurView intensity={80} style={styles.securityBlurWrapper}>
            <View style={styles.stealthModeContainer}>
              <View style={styles.stealthModeContent}>
                <MaterialIcons name="visibility" size={24} color={colors.accent} style={styles.blurredIcon} />
                <View style={styles.stealthModeTextContainer}>
                  <View style={styles.stealthModeTitleRow}>
                    <Text style={styles.stealthModeTitle}>Stealth Mode</Text>
                    {/* <View style={styles.comingSoonBadge}>
                      <Text style={styles.comingSoonText}>Coming Soon</Text>
                    </View> */}
                  </View>
                  <Text style={styles.stealthModeDescription}>
                    Quickly disguise app as a calculator or notes app
                  </Text>
                </View>
              </View>

              <View style={styles.additionalFeature}>
                <MaterialIcons name="fingerprint" size={24} color={colors.accent} style={styles.blurredIcon} />
                <View style={styles.stealthModeTextContainer}>
                  <View style={styles.stealthModeTitleRow}>
                    <Text style={styles.stealthModeTitle}>Biometric Lock</Text>
                    {/* <View style={styles.comingSoonBadge}>
                      <Text style={styles.comingSoonText}>Coming Soon</Text>
                    </View> */}
                  </View>
                  <Text style={styles.stealthModeDescription}>
                    Secure app access with fingerprint or face unlock
                  </Text>
                </View>
              </View>

              <View style={styles.additionalFeature}>
                <MaterialIcons name="vpn-key" size={24} color={colors.accent} style={styles.blurredIcon} />
                <View style={styles.stealthModeTextContainer}>
                  <View style={styles.stealthModeTitleRow}>
                    <Text style={styles.stealthModeTitle}>Panic Mode</Text>
                    {/* <View style={styles.comingSoonBadge}>
                      <Text style={styles.comingSoonText}>Coming Soon</Text>
                    </View> */}
                  </View>
                  <Text style={styles.stealthModeDescription}>
                    Instantly clear sensitive data with emergency gesture
                  </Text>
                </View>
              </View>
            </View>
          </BlurView>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recording</Text>
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <MaterialIcons name="video-label" size={24} color={colors.accent} />
              <Text style={styles.settingText}>High Quality Recording</Text>
            </View>
            <Switch
              value={highQuality}
              onValueChange={setHighQuality}
              trackColor={{ false: colors.text.muted, true: colors.accent }}
              thumbColor={highQuality ? colors.text.primary : colors.text.secondary}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <MaterialIcons name="volume-up" size={24} color={colors.accent} />
              <Text style={styles.settingText}>Enable Sound</Text>
            </View>
            <Switch
              value={enableSound}
              onValueChange={setEnableSound}
              trackColor={{ false: colors.text.muted, true: colors.accent }}
              thumbColor={enableSound ? colors.text.primary : colors.text.secondary}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Emergency Contact</Text>
          {isEditingContact ? (
            <View style={styles.emergencyForm}>
              <TextInput
                style={styles.input}
                placeholder="Emergency Contact Phone Number"
                placeholderTextColor={colors.text.muted}
                value={emergencyContact}
                onChangeText={handleEmergencyContactChange}
                keyboardType="phone-pad"
              />
              <TextInput
                style={[styles.input, styles.messageInput]}
                placeholder="Custom Emergency Message"
                placeholderTextColor={colors.text.muted}
                value={emergencyMessage}
                onChangeText={handleEmergencyMessageChange}
                multiline
                numberOfLines={3}
              />
              <TouchableOpacity style={styles.saveButton} onPress={saveEmergencySettings}>
                <Text style={styles.saveButtonText}>Save Emergency Contact</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity 
              style={styles.emergencyContactButton}
              onPress={() => router.push('/emergency-setup')}>
              <View style={styles.settingInfo}>
                <MaterialIcons name="phone" size={24} color={colors.accent} />
                <View>
                  <Text style={styles.settingText}>
                    {emergencyContact ? 'Edit Emergency Contact' : 'Set Up Emergency Contact'}
                  </Text>
                  {emergencyContact && (
                    <Text style={styles.messagePreview} numberOfLines={1}>
                      Contact: {emergencyContact}
                    </Text>
                  )}
                </View>
              </View>
              <Text style={[styles.configureText, emergencyContact && { position: 'absolute', right: 0, top: 15}]}>
                {emergencyContact ? 'Edit' : 'Configure'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notifications</Text>
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <MaterialIcons name="notifications" size={24} color={colors.accent} />
              <Text style={styles.settingText}>Push Notifications</Text>
            </View>
            <TouchableOpacity onPress={() => router.push('/notification-settings')}>
              <Text style={styles.configureText}>Configure</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity 
            style={styles.settingItem}
            onPress={async () => {
              try {
                // Check notification permissions
                const { status: existingStatus } = await Notifications.getPermissionsAsync();
                let finalStatus = existingStatus;
                
                // If permission not granted, request it
                if (existingStatus !== 'granted') {
                  console.log('Requesting notification permissions...');
                  const { status } = await Notifications.requestPermissionsAsync();
                  finalStatus = status;
                }

                // If still not granted, show error
                if (finalStatus !== 'granted') {
                  console.error('Notification permission not granted');
                  alert('Please enable notifications in your device settings to receive test notifications.');
                  return;
                }

                console.log('Scheduling test notification for 3 seconds from now...');
                await Notifications.scheduleNotificationAsync({
                  content: {
                    title: 'Test Notification',
                    body: 'This is a test notification from DESIST!',
                    data: { type: 'test' },
                  },
                  trigger: {
                    seconds: 3,
                  } as Notifications.TimeIntervalTriggerInput,
                });
                console.log('Test notification scheduled successfully!');
              } catch (error) {
                console.error('Error scheduling test notification:', error);
                alert('Failed to schedule notification. Please check console for details.');
              }
            }}>
            <View style={styles.settingInfo}>
              <MaterialIcons name="notifications" size={24} color={colors.accent} />
              <Text style={styles.settingText}>Test Notification</Text>
            </View>
            <Text style={styles.configureText}>Send Test</Text>
          </TouchableOpacity>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <MaterialIcons name="notifications" size={24} color={colors.accent} />
              <Text style={styles.settingText}>Incident Alerts</Text>
            </View>
            <Switch
              value={incidentAlerts}
              onValueChange={toggleIncidentAlerts}
              trackColor={{ false: colors.text.muted, true: colors.accent }}
              thumbColor={incidentAlerts ? colors.text.primary : colors.text.secondary}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <MaterialIcons name="location-on" size={24} color={colors.accent} />
              <Text style={styles.settingText}>Location Services</Text>
            </View>
            <Switch
              value={locationEnabled}
              onValueChange={(value) => {
                if (value) {
                  Location.requestForegroundPermissionsAsync();
                }
              }}
              trackColor={{ false: colors.text.muted, true: colors.accent }}
              thumbColor={locationEnabled ? colors.text.primary : colors.text.secondary}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Advanced</Text>
          <TouchableOpacity 
            style={styles.advancedItem}
            onPress={() => router.push('/settings-history')}>
            <View style={styles.advancedItemContent}>
              <MaterialIcons name="history" size={24} color={colors.accent} />
              <View>
                <Text style={styles.advancedItemTitle}>Settings History</Text>
                <Text style={styles.advancedItemDescription}>
                  View a log of all changes made to your settings
                </Text>
              </View>
            </View>
            <Text style={styles.advancedItemAction}>View</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>About DESIST!</Text>
          <Text style={styles.infoText}>Version 1.0.0</Text>
          <Text style={styles.infoText}>© 2024 DESIST!. All rights reserved.</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primary,
  },
  scrollView: {
    flex: 1,
    padding: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
  },
  scrollContent: {
    paddingBottom: 20, // Extra padding at the bottom
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 30,
    fontFamily: 'Inter-Bold',
  },
  section: {
    backgroundColor: colors.secondary,
    borderRadius: radius.lg,
    padding: 20,
    marginBottom: 20,
    ...shadows.sm,
  },
  sectionTitle: {
    color: colors.text.muted,
    fontSize: 14,
    textTransform: 'uppercase',
    marginBottom: 15,
    fontFamily: 'Inter-Medium',
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: `${colors.text.muted}30`,
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
    flex: 1,
  },
  settingText: {
    color: colors.text.primary,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
  },
  messagePreview: {
    color: colors.text.muted,
    fontSize: 12,
    marginTop: 4,
    fontFamily: 'Inter-Regular',
  },
  emergencyForm: {
    marginTop: 10,
  },
  input: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    padding: 12,
    color: colors.text.primary,
    marginBottom: 10,
    fontFamily: 'Inter-Regular',
  },
  messageInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  saveButton: {
    backgroundColor: colors.accent,
    padding: 15,
    borderRadius: radius.lg,
    alignItems: 'center',
    marginTop: 10,
    ...shadows.sm,
  },
  saveButtonText: {
    color: colors.text.primary,
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  logoutButton: {
    backgroundColor: colors.accent,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: radius.lg,
    marginTop: 15,
    gap: 8,
    ...shadows.sm,
  },
  logoutButtonText: {
    color: colors.text.primary,
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  emergencyContactButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: `${colors.text.muted}30`,
  },
  configureText: {
    color: colors.accent,
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  advancedItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: `${colors.text.muted}30`,
  },
  advancedItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
    flex: 1,
  },
  advancedItemTitle: {
    color: colors.text.primary,
    fontSize: 16,
    fontWeight: '500',
    fontFamily: 'Inter-Medium',
  },
  advancedItemDescription: {
    color: colors.text.muted,
    fontSize: 12,
    marginTop: 2,
    fontFamily: 'Inter-Regular',
  },
  advancedItemAction: {
    color: colors.accent,
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    position: 'absolute',
    right: 0,
    top: 15,
  },
  infoSection: {
    marginTop: 20,
    alignItems: 'center',
  },
  infoTitle: {
    color: colors.text.muted,
    fontSize: 18,
    marginBottom: 10,
    fontFamily: 'Inter-Medium',
  },
  infoText: {
    color: colors.text.muted,
    fontSize: 14,
    marginBottom: 5,
    fontFamily: 'Inter-Regular',
  },
  // Security Section Styles
  securitySection: {
    backgroundColor: colors.secondary,
    borderRadius: radius.lg,
    padding: 20,
    marginBottom: 20,
    ...shadows.sm,
    borderWidth: 2,
    borderColor: `${colors.accent}30`,
  },
  securityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  securitySectionTitle: {
    color: colors.text.primary,
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    flex: 1,
  },
  betaBadge: {
    backgroundColor: `${colors.accent}20`,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.accent,
  },
  betaText: {
    color: colors.accent,
    fontSize: 9,
    fontWeight: '800',
    fontFamily: 'Inter-ExtraBold',
    letterSpacing: 0.5,
  },
  securitySubtitle: {
    color: colors.text.muted,
    fontSize: 13,
    fontFamily: 'Inter-Medium',
    marginBottom: 15,
    fontStyle: 'italic',
  },
  securityBlurWrapper: {
    borderRadius: radius.md,
    overflow: 'hidden',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  // Stealth Mode Styles
  stealthModeContainer: {
    paddingVertical: 4,
    paddingHorizontal: 15,
  },
  stealthModeContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: `${colors.text.muted}20`,
  },
  additionalFeature: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: `${colors.text.muted}20`,
  },
  blurredIcon: {
    opacity: 0.6,
  },
  stealthModeTextContainer: {
    flex: 1,
  },
  stealthModeTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  stealthModeTitle: {
    color: colors.text.primary,
    fontSize: 16,
    fontWeight: '500',
    fontFamily: 'Inter-Medium',
    opacity: 0.8,
  },
  stealthModeDescription: {
    color: colors.text.muted,
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    opacity: 0.7,
  },
  comingSoonBadge: {
    backgroundColor: colors.accent,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  comingSoonText: {
    color: colors.text.primary,
    fontSize: 10,
    fontWeight: '700',
    fontFamily: 'Inter-Bold',
    textTransform: 'uppercase',
  },
});
