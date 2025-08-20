import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

const supabase = createClient(
  'https://tscvzrxnxadnvgnsdrqx.supabase.co'!,
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRzY3Z6cnhueGFkbnZnbnNkcnF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ3NDcxMjgsImV4cCI6MjA2MDMyMzEyOH0.cvE6KoZXbSnigKUpbFzFwLtN-O6H4SxIyu5bn9rU1lY'!
);

export type UserSettings = {
  stealth_mode_enabled: boolean;
  cover_story_screen: string;
  panic_gesture_type: string;
  auto_upload_enabled: boolean;
  auto_wipe_after_upload: boolean;
  emergency_sms_enabled: boolean;
};

class UserSettingsManager {
  private static instance: UserSettingsManager;
  private settings: UserSettings | null = null;
  private settingsKey = 'user_settings';
  private appVersion = '1.0.0'; // Should be dynamically fetched in a real app

  private constructor() {}

  public static getInstance(): UserSettingsManager {
    if (!UserSettingsManager.instance) {
      UserSettingsManager.instance = new UserSettingsManager();
    }
    return UserSettingsManager.instance;
  }

  async loadSettings(): Promise<UserSettings> {
    try {
      // Try to get settings from local storage first
      const cachedSettings = await AsyncStorage.getItem(this.settingsKey);
      if (cachedSettings) {
        this.settings = JSON.parse(cachedSettings);
        return this.settings;
      }

      // If no cached settings, fetch from Supabase
      const { data: settings, error } = await supabase
        .from('user_settings')
        .select('*')
        .single();

      if (error) throw error;

      // Cache the settings locally
      this.settings = settings;
      await AsyncStorage.setItem(this.settingsKey, JSON.stringify(settings));

      return settings;
    } catch (error) {
      console.error('Error loading settings:', error);

      // Return default settings if nothing is available
      const defaultSettings: UserSettings = {
        stealth_mode_enabled: false,
        cover_story_screen: 'notes',
        panic_gesture_type: 'triple_power_press',
        auto_upload_enabled: true,
        auto_wipe_after_upload: false,
        emergency_sms_enabled: true,
      };

      this.settings = defaultSettings;
      return defaultSettings;
    }
  }

  async updateSettings(updates: Partial<UserSettings>): Promise<UserSettings> {
    try {
      // Set app platform for audit logging
      const headers = {
        'X-Client-Info': Platform.OS,
        'X-App-Version': this.appVersion,
      };

      // Update Supabase
      const { data: updatedSettings, error } = await supabase
        .from('user_settings')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      // Update local cache
      this.settings = updatedSettings;
      await AsyncStorage.setItem(
        this.settingsKey,
        JSON.stringify(updatedSettings)
      );

      return updatedSettings;
    } catch (error) {
      console.error('Error updating settings:', error);
      throw error;
    }
  }

  async toggleStealthMode(): Promise<boolean> {
    try {
      const settings = await this.loadSettings();
      const newValue = !settings.stealth_mode_enabled;

      await this.updateSettings({ stealth_mode_enabled: newValue });
      return newValue;
    } catch (error) {
      console.error('Error toggling stealth mode:', error);
      throw error;
    }
  }

  async setCoverStoryScreen(screen: string): Promise<void> {
    try {
      await this.updateSettings({ cover_story_screen: screen });
    } catch (error) {
      console.error('Error setting cover story screen:', error);
      throw error;
    }
  }

  async setPanicGesture(gestureType: string): Promise<void> {
    try {
      await this.updateSettings({ panic_gesture_type: gestureType });
    } catch (error) {
      console.error('Error setting panic gesture:', error);
      throw error;
    }
  }

  async toggleAutoUpload(): Promise<boolean> {
    try {
      const settings = await this.loadSettings();
      const newValue = !settings.auto_upload_enabled;

      await this.updateSettings({ auto_upload_enabled: newValue });
      return newValue;
    } catch (error) {
      console.error('Error toggling auto upload:', error);
      throw error;
    }
  }

  async toggleAutoWipe(): Promise<boolean> {
    try {
      const settings = await this.loadSettings();
      const newValue = !settings.auto_wipe_after_upload;

      await this.updateSettings({ auto_wipe_after_upload: newValue });
      return newValue;
    } catch (error) {
      console.error('Error toggling auto wipe:', error);
      throw error;
    }
  }

  async toggleEmergencySMS(): Promise<boolean> {
    try {
      const settings = await this.loadSettings();
      const newValue = !settings.emergency_sms_enabled;

      await this.updateSettings({ emergency_sms_enabled: newValue });
      return newValue;
    } catch (error) {
      console.error('Error toggling emergency SMS:', error);
      throw error;
    }
  }

  async getSettingsAuditLog(days: number = 30): Promise<any[]> {
    try {
      const { data: logs, error } = await supabase
        .from('settings_audit_log')
        .select('*')
        .order('changed_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      return logs;
    } catch (error) {
      console.error('Error fetching audit log:', error);
      return [];
    }
  }

  async clearLocalSettings(): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.settingsKey);
      this.settings = null;
    } catch (error) {
      console.error('Error clearing local settings:', error);
      throw error;
    }
  }
}

export default UserSettingsManager;
