import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, ScrollView } from 'react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, shadows, radius } from '@/constants/theme';

type Badge = {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  unlockedAt: string | null;
  requirements: string;
  progress?: {
    current: number;
    total: number;
  };
};

export default function MyBadgesScreen() {
  const [badges, setBadges] = useState<Badge[]>([
    {
      id: 'founding_protector',
      name: 'Founding Protector',
      description: 'One of the first to join DESIST! and complete safety training',
      icon: <MaterialIcons name="shield" size={32} color={colors.accent} />,
      unlockedAt: null,
      requirements: 'Complete the safety mission demo',
    },
    {
      id: 'shield_builder',
      name: 'Shield Builder',
      description: 'Growing the community by helping others stay safe',
      icon: <MaterialIcons name="group" size={32} color={colors.accent} />,
      unlockedAt: null,
      requirements: 'Successfully invite 3 others to join',
      progress: {
        current: 0,
        total: 3,
      },
    },
    {
      id: 'emergency_sentinel',
      name: 'Emergency Sentinel',
      description: 'Actively contributing to community safety awareness',
      icon: <MaterialIcons name="notifications" size={32} color={colors.accent} />,
      unlockedAt: null,
      requirements: 'Report 5 verified incidents',
      progress: {
        current: 0,
        total: 5,
      },
    },
  ]);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBadgeStatus();
  }, []);

  const loadBadgeStatus = async () => {
    try {
      // Load badge statuses
      const foundingProtector = await AsyncStorage.getItem('founding_protector_badge');
      const shieldBuilder = await AsyncStorage.getItem('shield_builder_badge');
      const inviteCount = await AsyncStorage.getItem('successful_invite_count');
      const incidentCount = await AsyncStorage.getItem('verified_incident_count');

      setBadges(prev => prev.map(badge => {
        switch (badge.id) {
          case 'founding_protector':
            return {
              ...badge,
              unlockedAt: foundingProtector === 'awarded' ? new Date().toISOString() : null,
            };
          case 'shield_builder':
            const invites = parseInt(inviteCount || '0', 10);
            return {
              ...badge,
              unlockedAt: shieldBuilder === 'awarded' ? new Date().toISOString() : null,
              progress: {
                current: invites,
                total: 3,
              },
            };
          case 'emergency_sentinel':
            const incidents = parseInt(incidentCount || '0', 10);
            return {
              ...badge,
              progress: {
                current: incidents,
                total: 5,
              },
            };
          default:
            return badge;
        }
      }));
    } catch (error) {
      console.error('Error loading badge status:', error);
    } finally {
      setLoading(false);
    }
  };

  const unlockedCount = badges.filter(badge => badge.unlockedAt).length;

  const renderProgress = (badge: Badge) => {
    if (badge.unlockedAt) {
      return (
        <View style={styles.unlockedStatus}>
          <MaterialIcons name="verified" size={16} color={colors.status.success} />
          <Text style={styles.unlockedText}>Unlocked</Text>
        </View>
      );
    }

    if (badge.progress) {
      return (
        <View style={styles.progressContainer}>
          <View style={styles.badgeProgressBar}>
            <View 
              style={[
                styles.badgeProgressFill,
                { width: `${(badge.progress.current / badge.progress.total) * 100}%` }
              ]}
            />
          </View>
          <Text style={styles.progressText}>
            {badge.progress.current}/{badge.progress.total} {badge.id === 'shield_builder' ? 'invites' : 'incidents'}
          </Text>
        </View>
      );
    }

    return (
      <Text style={styles.requirementText}>{badge.requirements}</Text>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}>
          <MaterialIcons name="chevron-left" color={colors.text.primary} size={24} />
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.titleContainer}>
          <MaterialIcons name="verified" size={32} color={colors.accent} />
          <Text style={styles.title}>My Badges</Text>
        </View>

        <View style={styles.progressCard}>
          <Text style={styles.progressTitle}>Badge Progress</Text>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill,
                { width: `${(unlockedCount / badges.length) * 100}%` }
              ]}
            />
          </View>
          <Text style={styles.progressText}>
            {unlockedCount} of {badges.length} Badges Unlocked
          </Text>
        </View>

        <View style={styles.badgesGrid}>
          {badges.map(badge => (
            <View 
              key={badge.id}
              style={[
                styles.badgeCard,
                badge.unlockedAt && styles.unlockedBadge
              ]}>
              <View style={styles.badgeHeader}>
                <View style={styles.badgeIcon}>
                  {badge.icon}
                </View>
                {!badge.unlockedAt && (
                  <MaterialIcons name="lock" size={20} color={colors.text.muted} />
                )}
              </View>
              <Text style={styles.badgeName}>{badge.name}</Text>
              <Text style={styles.badgeDescription}>
                {badge.description}
              </Text>
              {renderProgress(badge)}
            </View>
          ))}
        </View>

        <Text style={styles.comingSoon}>
          More badges coming soon...
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primary,
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButtonText: {
    color: colors.text.primary,
    fontSize: 16,
    marginLeft: 8,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
    gap: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  progressCard: {
    backgroundColor: colors.secondary,
    borderRadius: radius.lg,
    padding: 20,
    marginBottom: 30,
    ...shadows.sm,
  },
  progressTitle: {
    color: colors.text.primary,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 15,
  },
  progressBar: {
    height: 8,
    backgroundColor: colors.primary,
    borderRadius: radius.round,
    overflow: 'hidden',
    marginBottom: 10,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.accent,
    borderRadius: radius.round,
  },
  progressText: {
    color: colors.text.muted,
    fontSize: 14,
  },
  badgesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 15,
    marginBottom: 30,
  },
  badgeCard: {
    width: '47%',
    backgroundColor: colors.secondary,
    borderRadius: radius.lg,
    padding: 15,
    ...shadows.sm,
  },
  unlockedBadge: {
    borderColor: colors.accent,
    borderWidth: 2,
  },
  badgeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  badgeIcon: {
    width: 48,
    height: 48,
    borderRadius: radius.round,
    backgroundColor: `${colors.accent}20`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeName: {
    color: colors.text.primary,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  badgeDescription: {
    color: colors.text.muted,
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 15,
  },
  unlockedStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  unlockedText: {
    color: colors.status.success,
    fontSize: 12,
    fontWeight: '600',
  },
  requirementText: {
    color: colors.text.muted,
    fontSize: 12,
  },
  progressContainer: {
    gap: 5,
  },
  badgeProgressBar: {
    height: 4,
    backgroundColor: colors.primary,
    borderRadius: radius.round,
    overflow: 'hidden',
  },
  badgeProgressFill: {
    height: '100%',
    backgroundColor: colors.accent,
    borderRadius: radius.round,
  },
  comingSoon: {
    color: colors.text.muted,
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 30,
  },
});