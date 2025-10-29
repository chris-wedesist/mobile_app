import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, ScrollView, Switch } from 'react-native';
import { router } from 'expo-router';
import { colors, shadows, radius } from '@/constants/theme';
import { MaterialIcons } from '@expo/vector-icons';
import { useStealthMode } from '@/components/StealthModeManager';

type CoverStoryType = {
  id: string;
  name: string;
  icon: React.ReactNode;
  description: string;
};

const COVER_STORIES: CoverStoryType[] = [
  {
    id: 'notes',
    name: 'Notes App',
    icon: <MaterialIcons name="notes" size={24} color={colors.accent} />,
    description: 'Transform into a simple notes application with realistic content.',
  },
  {
    id: 'calculator',
    name: 'Calculator',
    icon: <MaterialIcons name="calculate" size={24} color={colors.accent} />,
    description: 'Show a functional calculator interface.',
  },
  {
    id: 'calendar',
    name: 'Calendar',
    icon: <MaterialIcons name="event-note" size={24} color={colors.accent} />,
    description: 'Display a calendar with fake events and appointments.',
  },
  {
    id: 'browser',
    name: 'Web Browser',
    icon: <MaterialIcons name="web" size={24} color={colors.accent} />,
    description: 'Display a mock web browser interface.',
  }
];

export default function StealthModeScreen() {
  const { isActive, activate, deactivate } = useStealthMode();
  const [selectedStory, setSelectedStory] = useState('calculator');
  const [autoActivate, setAutoActivate] = useState(false);
  const [isActivating, setIsActivating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleActivation = async () => {
    try {
      setIsActivating(true);
      setError(null);

      if (isActive) {
        await deactivate('manual');
      } else {
        await activate('manual');
      }
      
      setIsActivating(false);
    } catch (error) {
      console.error('Error toggling stealth mode:', error);
      setError('Failed to toggle stealth mode. Please try again.');
      setIsActivating(false);
    }
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
          <MaterialIcons name="shield" size={32} color={colors.accent} />
          <Text style={styles.title}>Cover Story</Text>
        </View>

        <Text style={styles.description}>
          Quickly disguise DESIST! as a calculator. When enabled, the app transforms into a functional calculator.
        </Text>

        {error && (
          <View style={styles.errorContainer}>
            <MaterialIcons name="error" color={colors.status.error} size={20} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cover Story</Text>
          <View style={styles.storyOption}>
            <View style={styles.storyHeader}>
              <MaterialIcons name="calculate" size={24} color={colors.accent} />
              <View style={styles.checkmark}>
                <MaterialIcons name="check" size={16} color={colors.text.primary} />
              </View>
            </View>
            <Text style={styles.storyName}>Calculator</Text>
            <Text style={styles.storyDescription}>
              Transform the app into a functional calculator.
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <MaterialIcons name="visibility" size={24} color={colors.accent} />
              <View>
                <Text style={styles.settingTitle}>Auto-Activate</Text>
                <Text style={styles.settingDescription}>
                  Automatically show cover story when app loses focus
                </Text>
              </View>
            </View>
            <Switch
              value={autoActivate}
              onValueChange={setAutoActivate}
              trackColor={{ false: colors.text.muted, true: colors.accent }}
              thumbColor={autoActivate ? colors.text.primary : colors.text.secondary}
            />
          </View>
        </View>

        <TouchableOpacity
          style={[
            styles.activateButton,
            isActivating && styles.activateButtonDisabled,
            isActive && styles.activateButtonActive
          ]}
          onPress={handleActivation}
          disabled={isActivating}>
          {isActive ? (
            <MaterialIcons name="visibility-off" size={24} color={colors.text.primary} />
          ) : (
            <MaterialIcons name="visibility" size={24} color={colors.text.primary} />
          )}
          <Text style={styles.activateButtonText}>
            {isActivating ? 'Activating...' : isActive ? 'Exit Cover Story' : 'Activate Cover Story'}
          </Text>
        </TouchableOpacity>

        <Text style={styles.tip}>
          Tip: Long press anywhere on the calculator screen for 3 seconds to exit stealth mode
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
    fontFamily: 'Inter-Regular',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text.primary,
    fontFamily: 'Inter-Bold',
  },
  description: {
    fontSize: 16,
    color: colors.text.secondary,
    marginBottom: 30,
    lineHeight: 24,
    fontFamily: 'Inter-Regular',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${colors.status.error}20`,
    padding: 15,
    borderRadius: radius.lg,
    marginBottom: 20,
    gap: 10,
  },
  errorText: {
    color: colors.status.error,
    flex: 1,
    fontFamily: 'Inter-Regular',
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
  storiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 15,
  },
  storyOption: {
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    padding: 20,
    ...shadows.sm,
  },
  selectedStory: {
    backgroundColor: `${colors.accent}20`,
    borderColor: colors.accent,
    borderWidth: 2,
  },
  storyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  checkmark: {
    backgroundColor: colors.accent,
    borderRadius: radius.round,
    padding: 4,
  },
  storyName: {
    color: colors.text.primary,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    fontFamily: 'Inter-SemiBold',
  },
  storyDescription: {
    color: colors.text.muted,
    fontSize: 12,
    lineHeight: 16,
    fontFamily: 'Inter-Regular',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 15,
  },
  settingTitle: {
    color: colors.text.primary,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
    fontFamily: 'Inter-SemiBold',
  },
  settingDescription: {
    color: colors.text.muted,
    fontSize: 12,
    fontFamily: 'Inter-Regular',
  },
  activateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accent,
    padding: 20,
    borderRadius: radius.lg,
    gap: 10,
    marginBottom: 20,
    ...shadows.md,
  },
  activateButtonDisabled: {
    opacity: 0.7,
  },
  activateButtonActive: {
    backgroundColor: colors.status.error,
  },
  activateButtonText: {
    color: colors.text.primary,
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: 'Inter-Bold',
  },
  tip: {
    color: colors.text.muted,
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 30,
    fontFamily: 'Inter-Regular',
  },
});