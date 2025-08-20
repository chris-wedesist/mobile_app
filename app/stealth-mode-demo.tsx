import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import StealthCountdownDisplay from '../components/StealthCountdownDisplay';
import { colors, radius, shadows } from '../constants/theme';
import { useStealthCountdown } from '../hooks/useStealthCountdown';

type DemoSection = {
  id: string;
  title: string;
  description: string;
};

const DEMO_SECTIONS: DemoSection[] = [
  {
    id: 'countdown',
    title: 'Auto-Exit Countdown',
    description:
      "Stealth mode automatically exits after a set time period to ensure you don't accidentally leave it active.",
  },
  {
    id: 'gesture',
    title: 'Exit Gestures',
    description:
      'Long-press anywhere on the screen for 3 seconds to exit stealth mode immediately.',
  },
  {
    id: 'appearance',
    title: 'Authentic Appearance',
    description:
      'Each cover story looks and functions like a real app, with realistic content and interactions.',
  },
  {
    id: 'security',
    title: 'Security Features',
    description:
      'All stealth mode activations and exits are logged securely for your reference in settings history.',
  },
];

export default function StealthModeDemoScreen() {
  const [selectedSection, setSelectedSection] = useState<string>('countdown');
  const { formattedTime, percentRemaining } = useStealthCountdown({
    initialMinutes: 10,
    autoDeactivate: false,
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <MaterialIcons
            name="chevron-left"
            color={colors.text.primary}
            size={24}
          />
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.titleContainer}>
          <MaterialIcons name="shield" size={32} color={colors.accent} />
          <Text style={styles.title}>Stealth Mode Demo</Text>
        </View>

        <Text style={styles.description}>
          Stealth mode allows you to quickly disguise the app as something
          innocent if you need privacy or are being observed.
        </Text>

        <View style={styles.demoContainer}>
          <View style={styles.countdownSection}>
            <Text style={styles.sectionTitle}>Auto-Exit Countdown</Text>
            <StealthCountdownDisplay
              initialMinutes={10}
              variant="prominent"
              showControls={true}
            />
            <Text style={styles.countdownDescription}>
              For safety, stealth mode automatically exits after the countdown
              reaches zero.
            </Text>
          </View>

          <View style={styles.coverStoriesSection}>
            <Text style={styles.sectionTitle}>Available Cover Stories</Text>
            <View style={styles.coverStoriesGrid}>
              <View style={styles.coverStoryCard}>
                <MaterialIcons name="notes" size={32} color={colors.accent} />
                <Text style={styles.coverStoryName}>Notes App</Text>
              </View>
              <View style={styles.coverStoryCard}>
                <MaterialIcons
                  name="calculate"
                  size={32}
                  color={colors.accent}
                />
                <Text style={styles.coverStoryName}>Calculator</Text>
              </View>
              <View style={styles.coverStoryCard}>
                <MaterialIcons
                  name="event-note"
                  size={32}
                  color={colors.accent}
                />
                <Text style={styles.coverStoryName}>Calendar</Text>
              </View>
              <View style={styles.coverStoryCard}>
                <MaterialIcons
                  name="insert-drive-file"
                  size={32}
                  color={colors.accent}
                />
                <Text style={styles.coverStoryName}>Document</Text>
              </View>
            </View>
          </View>

          <View style={styles.featuresSection}>
            <Text style={styles.sectionTitle}>Key Features</Text>
            <View style={styles.featuresList}>
              {DEMO_SECTIONS.map((section) => (
                <TouchableOpacity
                  key={section.id}
                  style={[
                    styles.featureItem,
                    selectedSection === section.id &&
                      styles.selectedFeatureItem,
                  ]}
                  onPress={() => setSelectedSection(section.id)}
                >
                  <Text style={styles.featureTitle}>{section.title}</Text>
                  {selectedSection === section.id && (
                    <Text style={styles.featureDescription}>
                      {section.description}
                    </Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.activationSection}>
            <Text style={styles.sectionTitle}>How to Activate</Text>
            <View style={styles.activationMethod}>
              <View style={styles.activationIcon}>
                <MaterialIcons
                  name="visibility"
                  size={24}
                  color={colors.accent}
                />
              </View>
              <View style={styles.activationDetails}>
                <Text style={styles.activationTitle}>Settings Menu</Text>
                <Text style={styles.activationDescription}>
                  Go to Settings → Cover Story to configure and activate stealth
                  mode
                </Text>
              </View>
            </View>

            <View style={styles.activationMethod}>
              <View style={styles.activationIcon}>
                <MaterialIcons
                  name="schedule"
                  size={24}
                  color={colors.accent}
                />
              </View>
              <View style={styles.activationDetails}>
                <Text style={styles.activationTitle}>Quick Gesture</Text>
                <Text style={styles.activationDescription}>
                  Triple-tap the status bar to instantly activate your default
                  cover story
                </Text>
              </View>
            </View>
          </View>

          <TouchableOpacity
            style={styles.tryButton}
            onPress={() => router.push('/stealth-mode')}
          >
            <Text style={styles.tryButtonText}>Try Stealth Mode</Text>
          </TouchableOpacity>
        </View>
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
    marginBottom: 20,
    gap: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  description: {
    fontSize: 16,
    color: colors.text.secondary,
    marginBottom: 30,
    lineHeight: 24,
  },
  demoContainer: {
    gap: 30,
  },
  countdownSection: {
    backgroundColor: colors.secondary,
    borderRadius: radius.lg,
    padding: 20,
    ...shadows.sm,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 15,
  },
  countdownDescription: {
    fontSize: 14,
    color: colors.text.muted,
    marginTop: 15,
    textAlign: 'center',
  },
  coverStoriesSection: {
    backgroundColor: colors.secondary,
    borderRadius: radius.lg,
    padding: 20,
    ...shadows.sm,
  },
  coverStoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 15,
  },
  coverStoryCard: {
    width: '47%',
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    padding: 15,
    alignItems: 'center',
    ...shadows.sm,
  },
  coverStoryName: {
    color: colors.text.primary,
    fontSize: 16,
    fontWeight: '500',
    marginTop: 10,
  },
  featuresSection: {
    backgroundColor: colors.secondary,
    borderRadius: radius.lg,
    padding: 20,
    ...shadows.sm,
  },
  featuresList: {
    gap: 10,
  },
  featureItem: {
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    padding: 15,
    ...shadows.sm,
  },
  selectedFeatureItem: {
    borderColor: colors.accent,
    borderWidth: 2,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 8,
  },
  featureDescription: {
    fontSize: 14,
    color: colors.text.secondary,
    lineHeight: 20,
  },
  activationSection: {
    backgroundColor: colors.secondary,
    borderRadius: radius.lg,
    padding: 20,
    ...shadows.sm,
  },
  activationMethod: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 15,
    gap: 15,
  },
  activationIcon: {
    width: 48,
    height: 48,
    borderRadius: radius.round,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activationDetails: {
    flex: 1,
  },
  activationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 4,
  },
  activationDescription: {
    fontSize: 14,
    color: colors.text.secondary,
    lineHeight: 20,
  },
  tryButton: {
    backgroundColor: colors.accent,
    padding: 20,
    borderRadius: radius.lg,
    alignItems: 'center',
    ...shadows.md,
  },
  tryButtonText: {
    color: colors.text.primary,
    fontSize: 18,
    fontWeight: 'bold',
  },
});
