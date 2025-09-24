import { Platform } from 'react-native';
import * as SMS from 'expo-sms';
import { supabase } from '@/lib/supabase';

class SMSManager {
  private static instance: SMSManager;
  private retryAttempts: number = 3;
  private retryDelay: number = 2000; // 2 seconds
  
  private constructor() {}

  public static getInstance(): SMSManager {
    if (!SMSManager.instance) {
      SMSManager.instance = new SMSManager();
    }
    return SMSManager.instance;
  }

  async sendEmergencyMessages(
    location: { latitude: number; longitude: number },
    customMessage?: string
  ) {
    try {
      if (Platform.OS === 'web') {
        console.log('SMS not available on web platform');
        return;
      }

      const isAvailable = await SMS.isAvailableAsync();
      if (!isAvailable) {
        throw new Error('SMS is not available on this device');
      }

      const contacts = await this.getEmergencyContacts();
      if (!contacts || contacts.length === 0) {
        throw new Error('No emergency contacts found');
      }

      const locationUrl = `https://maps.google.com/?q=${location.latitude},${location.longitude}`;
      const defaultMessage = `EMERGENCY ALERT: I need immediate assistance. My current location: ${locationUrl}`;
      const messageToSend = customMessage || defaultMessage;

      for (const contact of contacts) {
        await this.sendSMSWithRetry(contact.contact_phone, messageToSend);
        
        // Log the SMS event
        await this.logSMSEvent({
          contact_name: contact.contact_name,
          contact_phone: contact.contact_phone,
          message: messageToSend,
          location: { latitude: location.latitude, longitude: location.longitude }
        });
      }

      return true;
    } catch (error) {
      console.error('Error sending emergency messages:', error);
      throw error;
    }
  }

  private async sendSMSWithRetry(
    phoneNumber: string,
    message: string,
    attempt: number = 1
  ): Promise<void> {
    try {
      const result = await SMS.sendSMSAsync([phoneNumber], message);
      
      if (result.result !== 'sent') {
        throw new Error('SMS failed to send');
      }
    } catch (error) {
      if (attempt < this.retryAttempts) {
        await new Promise(resolve => setTimeout(resolve, this.retryDelay));
        return this.sendSMSWithRetry(phoneNumber, message, attempt + 1);
      }
      throw error;
    }
  }

  private async getEmergencyContacts() {
    try {
      const { data: contacts, error } = await supabase
        .from('emergency_contacts')
        .select('*')
        .eq('active', true)
        .order('priority', { ascending: true });

      if (error) throw error;
      return contacts;
    } catch (error) {
      console.error('Error fetching emergency contacts:', error);
      return null;
    }
  }

  private async logSMSEvent(eventData: {
    contact_name: string;
    contact_phone: string;
    message: string;
    location: { latitude: number; longitude: number };
  }) {
    try {
      await supabase.from('sms_events').insert([{
        contact_name: eventData.contact_name,
        contact_phone: eventData.contact_phone,
        message: eventData.message,
        location: `POINT(${eventData.location.longitude} ${eventData.location.latitude})`,
        status: 'sent'
      }]);
    } catch (error) {
      console.error('Error logging SMS event:', error);
    }
  }

  async sendStatusUpdate(
    status: 'safe' | 'resolved' | 'false_alarm',
    location?: { latitude: number; longitude: number }
  ) {
    try {
      const contacts = await this.getEmergencyContacts();
      if (!contacts || contacts.length === 0) return;

      let message = '';
      switch (status) {
        case 'safe':
          message = 'UPDATE: I am safe now. Thank you for your concern.';
          break;
        case 'resolved':
          message = 'UPDATE: The situation has been resolved. I am safe.';
          break;
        case 'false_alarm':
          message = 'False alarm - please disregard the previous alert. I am safe.';
          break;
      }

      if (location) {
        const locationUrl = `https://maps.google.com/?q=${location.latitude},${location.longitude}`;
        message += `\nCurrent location: ${locationUrl}`;
      }

      for (const contact of contacts) {
        await this.sendSMSWithRetry(contact.contact_phone, message);
      }

      return true;
    } catch (error) {
      console.error('Error sending status update:', error);
      throw error;
    }
  }
}

export default SMSManager;