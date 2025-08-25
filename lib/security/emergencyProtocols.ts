import AsyncStorage from '@react-native-async-storage/async-storage';
import { stealthManager } from '../stealth';
import { screenProtectionManager } from './screenProtection';
import * as Linking from 'expo-linking';

export interface EmergencyContact {
  id: string;
  name: string;
  phoneNumber: string;
  relationship: string;
  isPrimary: boolean;
}

export interface EmergencyConfig {
  isEnabled: boolean;
  emergencyContacts: EmergencyContact[];
  panicGestureEnabled: boolean;
  autoCallEnabled: boolean;
  autoTextEnabled: boolean;
  locationSharingEnabled: boolean;
  emergencyMessage: string;
  quickResetEnabled: boolean;
  remoteDisableEnabled: boolean;
  lastEmergencyTime: Date;
}

const EMERGENCY_CONFIG_KEY = 'desist_emergency_config';
const EMERGENCY_LOG_KEY = 'desist_emergency_log';

const DEFAULT_CONFIG: EmergencyConfig = {
  isEnabled: false,
  emergencyContacts: [],
  panicGestureEnabled: true,
  autoCallEnabled: false,
  autoTextEnabled: true,
  locationSharingEnabled: false,
  emergencyMessage:
    'This is an emergency alert from DESIST app. I may need assistance.',
  quickResetEnabled: true,
  remoteDisableEnabled: false,
  lastEmergencyTime: new Date(0),
};

export class EmergencyProtocolManager {
  private static instance: EmergencyProtocolManager;
  private config: EmergencyConfig = DEFAULT_CONFIG;
  private initialized = false;
  private emergencyActive = false;
  private panicGestureSequence: number[] = [];
  private panicGestureTimeout: ReturnType<typeof setTimeout> | null = null;

  static getInstance(): EmergencyProtocolManager {
    if (!EmergencyProtocolManager.instance) {
      EmergencyProtocolManager.instance = new EmergencyProtocolManager();
    }
    return EmergencyProtocolManager.instance;
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      const storedConfig = await AsyncStorage.getItem(EMERGENCY_CONFIG_KEY);
      if (storedConfig) {
        this.config = {
          ...DEFAULT_CONFIG,
          ...JSON.parse(storedConfig),
          lastEmergencyTime: new Date(
            JSON.parse(storedConfig).lastEmergencyTime
          ),
        };
      }

      this.initialized = true;
      console.log('EmergencyProtocolManager initialized');
    } catch (error) {
      console.error('Failed to initialize EmergencyProtocolManager:', error);
      this.config = DEFAULT_CONFIG;
      this.initialized = true;
    }
  }

  async addEmergencyContact(
    contact: Omit<EmergencyContact, 'id'>
  ): Promise<string> {
    if (!this.initialized) {
      await this.initialize();
    }

    const id = `contact_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;
    const newContact: EmergencyContact = {
      ...contact,
      id,
    };

    // If this is set as primary, remove primary status from others
    if (contact.isPrimary) {
      this.config.emergencyContacts = this.config.emergencyContacts.map(
        (c) => ({
          ...c,
          isPrimary: false,
        })
      );
    }

    this.config.emergencyContacts.push(newContact);
    await this.saveConfig();

    return id;
  }

  async removeEmergencyContact(contactId: string): Promise<boolean> {
    if (!this.initialized) {
      await this.initialize();
    }

    const initialLength = this.config.emergencyContacts.length;
    this.config.emergencyContacts = this.config.emergencyContacts.filter(
      (contact) => contact.id !== contactId
    );

    if (this.config.emergencyContacts.length < initialLength) {
      await this.saveConfig();
      return true;
    }
    return false;
  }

  async updateEmergencyContact(
    contactId: string,
    updates: Partial<EmergencyContact>
  ): Promise<boolean> {
    if (!this.initialized) {
      await this.initialize();
    }

    const contactIndex = this.config.emergencyContacts.findIndex(
      (c) => c.id === contactId
    );
    if (contactIndex === -1) {
      return false;
    }

    // If setting as primary, remove primary from others
    if (updates.isPrimary) {
      this.config.emergencyContacts = this.config.emergencyContacts.map(
        (c) => ({
          ...c,
          isPrimary: false,
        })
      );
    }

    this.config.emergencyContacts[contactIndex] = {
      ...this.config.emergencyContacts[contactIndex],
      ...updates,
    };

    await this.saveConfig();
    return true;
  }

  async triggerEmergency(
    triggerType: 'manual' | 'panic_gesture' | 'remote'
  ): Promise<boolean> {
    if (!this.initialized) {
      await this.initialize();
    }

    if (!this.config.isEnabled) {
      console.warn('Emergency protocols are disabled');
      return false;
    }

    if (this.emergencyActive) {
      console.warn('Emergency already active');
      return false;
    }

    try {
      this.emergencyActive = true;
      this.config.lastEmergencyTime = new Date();

      console.log(`Emergency triggered by: ${triggerType}`);

      // Log the emergency event
      await this.logEmergencyEvent(triggerType);

      // Execute emergency protocols
      await this.executeEmergencyProtocols();

      // Quick reset to stealth mode if enabled
      if (this.config.quickResetEnabled) {
        await this.performQuickReset();
      }

      await this.saveConfig();
      return true;
    } catch (error) {
      console.error('Failed to trigger emergency:', error);
      this.emergencyActive = false;
      return false;
    }
  }

  private async executeEmergencyProtocols(): Promise<void> {
    const protocols: Promise<void>[] = [];

    // Auto-call primary contact
    if (this.config.autoCallEnabled) {
      protocols.push(this.makeEmergencyCall());
    }

    // Send emergency text
    if (this.config.autoTextEnabled) {
      protocols.push(this.sendEmergencyText());
    }

    // Share location (placeholder - would need location permissions)
    if (this.config.locationSharingEnabled) {
      protocols.push(this.shareLocation());
    }

    // Execute all protocols concurrently
    await Promise.allSettled(protocols);
  }

  private async makeEmergencyCall(): Promise<void> {
    const primaryContact = this.config.emergencyContacts.find(
      (c) => c.isPrimary
    );
    if (!primaryContact) {
      console.warn('No primary emergency contact configured');
      return;
    }

    try {
      const phoneUrl = `tel:${primaryContact.phoneNumber}`;
      const canOpen = await Linking.canOpenURL(phoneUrl);

      if (canOpen) {
        await Linking.openURL(phoneUrl);
        console.log(`Emergency call initiated to ${primaryContact.name}`);
      } else {
        console.error('Cannot open phone dialer');
      }
    } catch (error) {
      console.error('Failed to make emergency call:', error);
    }
  }

  private async sendEmergencyText(): Promise<void> {
    // Note: SMS sending would require expo-sms and proper implementation
    // This is a placeholder for the text messaging functionality
    const contacts = this.config.emergencyContacts.slice(0, 3); // Limit to first 3 contacts

    for (const contact of contacts) {
      try {
        const smsUrl = `sms:${contact.phoneNumber}?body=${encodeURIComponent(
          this.config.emergencyMessage
        )}`;
        const canOpen = await Linking.canOpenURL(smsUrl);

        if (canOpen) {
          await Linking.openURL(smsUrl);
          console.log(`Emergency text prepared for ${contact.name}`);
        }
      } catch (error) {
        console.error(
          `Failed to send emergency text to ${contact.name}:`,
          error
        );
      }
    }
  }

  private async shareLocation(): Promise<void> {
    // Placeholder for location sharing functionality
    // Would require expo-location and proper implementation
    console.log('Location sharing triggered (placeholder)');
  }

  private async performQuickReset(): Promise<void> {
    try {
      // Reset to stealth mode
      await stealthManager.resetToStealth();

      // Disable screen protection temporarily for emergency
      await screenProtectionManager.emergencyDisable();

      console.log('Quick emergency reset completed');
    } catch (error) {
      console.error('Failed to perform quick reset:', error);
    }
  }

  registerPanicGestureTap(): void {
    if (!this.config.panicGestureEnabled) return;

    const now = Date.now();
    this.panicGestureSequence.push(now);

    // Clear old taps (older than 3 seconds)
    this.panicGestureSequence = this.panicGestureSequence.filter(
      (tap) => now - tap < 3000
    );

    // Check for panic pattern: 5 rapid taps within 3 seconds
    if (this.panicGestureSequence.length >= 5) {
      this.triggerEmergency('panic_gesture');
      this.panicGestureSequence = [];
    }

    // Clear timeout and set new one
    if (this.panicGestureTimeout) {
      clearTimeout(this.panicGestureTimeout);
    }

    this.panicGestureTimeout = setTimeout(() => {
      this.panicGestureSequence = [];
    }, 3000);
  }

  async deactivateEmergency(): Promise<void> {
    this.emergencyActive = false;
    console.log('Emergency deactivated');
  }

  isEmergencyActive(): boolean {
    return this.emergencyActive;
  }

  getEmergencyContacts(): EmergencyContact[] {
    return [...this.config.emergencyContacts];
  }

  async updateConfig(updates: Partial<EmergencyConfig>): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }

    this.config = {
      ...this.config,
      ...updates,
    };

    await this.saveConfig();
  }

  getConfig(): EmergencyConfig {
    return { ...this.config };
  }

  private async logEmergencyEvent(triggerType: string): Promise<void> {
    try {
      const logEntry = {
        timestamp: new Date().toISOString(),
        triggerType,
        contactsNotified: this.config.emergencyContacts.length,
        protocolsExecuted: {
          call: this.config.autoCallEnabled,
          text: this.config.autoTextEnabled,
          location: this.config.locationSharingEnabled,
        },
      };

      const existingLog = await AsyncStorage.getItem(EMERGENCY_LOG_KEY);
      const log = existingLog ? JSON.parse(existingLog) : [];

      log.push(logEntry);

      // Keep only last 10 emergency events
      if (log.length > 10) {
        log.splice(0, log.length - 10);
      }

      await AsyncStorage.setItem(EMERGENCY_LOG_KEY, JSON.stringify(log));
    } catch (error) {
      console.error('Failed to log emergency event:', error);
    }
  }

  async getEmergencyLog(): Promise<any[]> {
    try {
      const log = await AsyncStorage.getItem(EMERGENCY_LOG_KEY);
      return log ? JSON.parse(log) : [];
    } catch (error) {
      console.error('Failed to get emergency log:', error);
      return [];
    }
  }

  private async saveConfig(): Promise<void> {
    try {
      await AsyncStorage.setItem(
        EMERGENCY_CONFIG_KEY,
        JSON.stringify(this.config)
      );
    } catch (error) {
      console.error('Failed to save emergency config:', error);
      throw error;
    }
  }

  // Clean up timers
  destroy(): void {
    if (this.panicGestureTimeout) {
      clearTimeout(this.panicGestureTimeout);
      this.panicGestureTimeout = null;
    }
  }
}

// Export singleton instance
export const emergencyProtocolManager = EmergencyProtocolManager.getInstance();

// Export helper functions
export const triggerEmergency = (
  triggerType: 'manual' | 'panic_gesture' | 'remote'
) => emergencyProtocolManager.triggerEmergency(triggerType);
export const addEmergencyContact = (contact: Omit<EmergencyContact, 'id'>) =>
  emergencyProtocolManager.addEmergencyContact(contact);
export const registerPanicTap = () =>
  emergencyProtocolManager.registerPanicGestureTap();
