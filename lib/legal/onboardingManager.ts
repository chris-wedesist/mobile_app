import AsyncStorage from '@react-native-async-storage/async-storage';
import { complianceManager, ConsentRecord } from './complianceManager';

const ONBOARDING_KEY = '@desist_onboarding_complete';
const ONBOARDING_VERSION = '1.0.0';

export interface OnboardingState {
  completed: boolean;
  version: string;
  completedAt?: string;
  consents?: ConsentRecord;
}

class OnboardingManager {
  /**
   * Check if user has completed onboarding
   */
  async isOnboardingComplete(): Promise<boolean> {
    try {
      const onboardingData = await AsyncStorage.getItem(ONBOARDING_KEY);
      if (!onboardingData) return false;

      const state: OnboardingState = JSON.parse(onboardingData);
      
      // Check if onboarding version matches current version
      if (state.version !== ONBOARDING_VERSION) {
        await this.resetOnboarding();
        return false;
      }

      return state.completed;
    } catch (error) {
      console.error('Error checking onboarding status:', error);
      return false;
    }
  }

  /**
   * Mark onboarding as complete
   */
  async completeOnboarding(consents?: ConsentRecord): Promise<void> {
    try {
      const state: OnboardingState = {
        completed: true,
        version: ONBOARDING_VERSION,
        completedAt: new Date().toISOString(),
        consents,
      };

      await AsyncStorage.setItem(ONBOARDING_KEY, JSON.stringify(state));
      
      // Log compliance event
      await complianceManager.logComplianceEvent({
        type: 'onboarding_completed',
        description: 'User completed onboarding flow',
        metadata: { version: ONBOARDING_VERSION, consents },
      });
    } catch (error) {
      console.error('Error completing onboarding:', error);
      throw new Error('Failed to save onboarding status');
    }
  }

  /**
   * Reset onboarding state (for version updates or re-onboarding)
   */
  async resetOnboarding(): Promise<void> {
    try {
      await AsyncStorage.removeItem(ONBOARDING_KEY);
      
      await complianceManager.logComplianceEvent({
        type: 'onboarding_reset',
        description: 'Onboarding state was reset',
        metadata: { reason: 'version_mismatch_or_manual_reset' },
      });
    } catch (error) {
      console.error('Error resetting onboarding:', error);
    }
  }

  /**
   * Get onboarding state details
   */
  async getOnboardingState(): Promise<OnboardingState | null> {
    try {
      const onboardingData = await AsyncStorage.getItem(ONBOARDING_KEY);
      if (!onboardingData) return null;

      return JSON.parse(onboardingData);
    } catch (error) {
      console.error('Error getting onboarding state:', error);
      return null;
    }
  }

  /**
   * Check if user needs to re-consent due to policy updates
   */
  async needsReConsent(): Promise<boolean> {
    try {
      const currentConsents = await complianceManager.getCurrentConsents();
      const onboardingState = await this.getOnboardingState();
      
      if (!currentConsents || !onboardingState?.consents) {
        return true;
      }

      // Check if required consents are still valid
      const requiredConsents = ['privacyPolicy', 'termsOfService', 'dataCollection'];
      
      for (const consent of requiredConsents) {
        if (!currentConsents[consent as keyof ConsentRecord]?.granted) {
          return true;
        }
      }

      return false;
    } catch (error) {
      console.error('Error checking re-consent status:', error);
      return true; // Default to requiring re-consent on error
    }
  }

  /**
   * Trigger re-onboarding for policy updates
   */
  async triggerReOnboarding(reason: string): Promise<void> {
    try {
      await this.resetOnboarding();
      
      await complianceManager.logComplianceEvent({
        type: 'reonboarding_triggered',
        description: 'Re-onboarding triggered due to policy updates',
        metadata: { reason },
      });
    } catch (error) {
      console.error('Error triggering re-onboarding:', error);
      throw new Error('Failed to trigger re-onboarding');
    }
  }

  /**
   * Get onboarding analytics for compliance reporting
   */
  async getOnboardingAnalytics(): Promise<{
    totalUsers: number;
    completedOnboarding: number;
    currentVersion: string;
    averageCompletionTime?: number;
  }> {
    try {
      const events = await complianceManager.getComplianceEvents();
      const onboardingEvents = events.filter(event => 
        event.type === 'onboarding_completed'
      );

      return {
        totalUsers: onboardingEvents.length,
        completedOnboarding: onboardingEvents.length,
        currentVersion: ONBOARDING_VERSION,
        // Could add completion time calculation here if needed
      };
    } catch (error) {
      console.error('Error getting onboarding analytics:', error);
      return {
        totalUsers: 0,
        completedOnboarding: 0,
        currentVersion: ONBOARDING_VERSION,
      };
    }
  }
}

export const onboardingManager = new OnboardingManager();
