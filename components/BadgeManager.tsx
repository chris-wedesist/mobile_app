import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { useEffect, useState } from 'react';
import BadgeUnlockModal from './BadgeUnlockModal';

const supabase = createClient(
  'https://tscvzrxnxadnvgnsdrqx.supabase.co'!,
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRzY3Z6cnhueGFkbnZnbnNkcnF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ3NDcxMjgsImV4cCI6MjA2MDMyMzEyOH0.cvE6KoZXbSnigKUpbFzFwLtN-O6H4SxIyu5bn9rU1lY'!
);

type Badge = {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  unlocked?: boolean;
  progress?: {
    current: number;
    total: number;
  };
  requirements: {
    type: string;
    value: number;
  };
};

const BADGES: Badge[] = [
  {
    id: 'founding_protector',
    name: 'Founding Protector',
    description:
      'One of the first to join DESIST! and complete safety training',
    icon: <MaterialIcons name="shield" size={32} color="#EA5455" />,
    requirements: {
      type: 'onboarding',
      value: 1,
    },
  },
  {
    id: 'shield_builder',
    name: 'Shield Builder',
    description: 'Growing the community by helping others stay safe',
    icon: <MaterialIcons name="group" size={32} color="#EA5455" />,
    requirements: {
      type: 'invites',
      value: 3,
    },
  },
  {
    id: 'emergency_sentinel',
    name: 'Emergency Sentinel',
    description: 'Actively contributing to community safety awareness',
    icon: <MaterialIcons name="notifications" size={32} color="#EA5455" />,
    requirements: {
      type: 'verified_incidents',
      value: 5,
    },
  },
];

class BadgeManager {
  private static instance: BadgeManager;
  private modalCallback?: (badge: Badge) => void;

  private constructor() {}

  public static getInstance(): BadgeManager {
    if (!BadgeManager.instance) {
      BadgeManager.instance = new BadgeManager();
    }
    return BadgeManager.instance;
  }

  setModalCallback(callback: (badge: Badge) => void) {
    this.modalCallback = callback;
  }

  async checkBadgeEligibility(eventType: string, value: number): Promise<void> {
    try {
      const badge = BADGES.find((b) => b.requirements.type === eventType);
      if (!badge) return;

      const isAwarded = await AsyncStorage.getItem(`${badge.id}_badge`);
      if (isAwarded === 'awarded') return;

      if (value >= badge.requirements.value) {
        await this.awardBadge(badge);
      }
    } catch (error) {
      console.error('Error checking badge eligibility:', error);
    }
  }

  private async awardBadge(badge: Badge): Promise<void> {
    try {
      // Save badge award
      await AsyncStorage.setItem(`${badge.id}_badge`, 'awarded');

      // Log badge event to Supabase
      await supabase.from('badge_events').insert({
        badge_name: badge.id,
        metadata: {
          awarded_at: new Date().toISOString(),
          requirements_met: badge.requirements,
        },
      });

      // Show celebration modal
      if (this.modalCallback) {
        this.modalCallback(badge);
      }
    } catch (error) {
      console.error('Error awarding badge:', error);
    }
  }

  async getBadgeProgress(eventType: string): Promise<number> {
    try {
      switch (eventType) {
        case 'invites':
          const inviteCount = await AsyncStorage.getItem(
            'successful_invite_count'
          );
          return parseInt(inviteCount || '0', 10);
        case 'verified_incidents':
          const incidentCount = await AsyncStorage.getItem(
            'verified_incident_count'
          );
          return parseInt(incidentCount || '0', 10);
        default:
          return 0;
      }
    } catch (error) {
      console.error('Error getting badge progress:', error);
      return 0;
    }
  }

  async getAllBadges(): Promise<{
    awarded: Badge[];
    inProgress: Badge[];
  }> {
    try {
      const awarded: Badge[] = [];
      const inProgress: Badge[] = [];

      for (const badge of BADGES) {
        const isAwarded = await AsyncStorage.getItem(`${badge.id}_badge`);
        if (isAwarded === 'awarded') {
          awarded.push(badge);
        } else {
          const progress = await this.getBadgeProgress(badge.requirements.type);
          inProgress.push({
            ...badge,
            progress: {
              current: progress,
              total: badge.requirements.value,
            },
          });
        }
      }

      return { awarded, inProgress };
    } catch (error) {
      console.error('Error getting all badges:', error);
      return { awarded: [], inProgress: [] };
    }
  }
}

export function useBadgeManager() {
  const [showModal, setShowModal] = useState(false);
  const [currentBadge, setCurrentBadge] = useState<Badge | null>(null);

  useEffect(() => {
    const manager = BadgeManager.getInstance();
    manager.setModalCallback((badge) => {
      setCurrentBadge(badge);
      setShowModal(true);
    });
  }, []);

  return {
    BadgeUnlockModal:
      showModal && currentBadge ? (
        <BadgeUnlockModal
          visible={showModal}
          onClose={() => setShowModal(false)}
          badge={{ ...currentBadge, unlocked: true }}
        />
      ) : null,
    manager: BadgeManager.getInstance(),
  };
}

export default BadgeManager;
