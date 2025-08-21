import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { router } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, typography, spacing, radius } from '../constants/theme';

export default function LegalRightsScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialIcons name="chevron-left" color={colors.text.primary} size={24} />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Know Your Rights</Text>
        <Text style={styles.subtitle}>What to do if detained</Text>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialIcons name="error" color={colors.status.error} size={24} />
            <Text style={styles.sectionTitle}>Stay Calm & Assert Your Rights</Text>
          </View>
          <Text style={styles.text}>
            • Remain calm and composed{'\n'}
            • State clearly: "I am exercising my right to remain silent"{'\n'}
            • Ask: "Am I free to go?" If yes, calmly leave{'\n'}
            • Say: "I do not consent to any searches"{'\n'}
            • Request to speak to an attorney immediately
          </Text>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialIcons name="message" color={colors.status.error} size={24} />
            <Text style={styles.sectionTitle}>What to Say</Text>
          </View>
          <Text style={styles.text}>
            • "I wish to remain silent"{'\n'}
            • "I want to speak to an attorney"{'\n'}
            • "I do not consent to this search"{'\n'}
            • "I want to make a phone call"{'\n'}
            • Document badge numbers and names if possible
          </Text>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialIcons name="camera" color={colors.status.error} size={24} />
            <Text style={styles.sectionTitle}>Documentation</Text>
          </View>
          <Text style={styles.text}>
            • If safe, record the interaction{'\n'}
            • Note time, location, and officer details{'\n'}
            • Remember or write down badge numbers{'\n'}
            • Document any witnesses present{'\n'}
            • Save any evidence or injuries with photos
          </Text>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialIcons name="phone" color={colors.status.error} size={24} />
            <Text style={styles.sectionTitle}>Emergency Contacts</Text>
          </View>
          <Text style={styles.text}>
            • Legal Aid Hotline: 1-800-LEGAL-AID{'\n'}
            • National Lawyers Guild: 1-212-679-5100{'\n'}
            • ACLU National: 1-212-549-2500{'\n'}
            • Local Police Complaints: File within 24 hours
          </Text>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialIcons name="volume-up" color={colors.status.error} size={24} />
            <Text style={styles.sectionTitle}>After the Incident</Text>
          </View>
          <Text style={styles.text}>
            • Write down everything you remember{'\n'}
            • File a complaint if rights were violated{'\n'}
            • Contact a civil rights attorney{'\n'}
            • Seek medical attention if needed{'\n'}
            • Keep all documentation and evidence
          </Text>
        </View>

        <TouchableOpacity 
          style={styles.emergencyButton}
          onPress={() => router.push('./report-incident')}>
          <Text style={styles.emergencyButtonText}>Report an Incident</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backText: {
    color: colors.text.primary,
    fontSize: typography.fontSize.body,
    marginLeft: 8,
    fontFamily: typography.fontFamily.regular,
  },
  content: {
    flex: 1,
    padding: spacing.lg,
  },
  title: {
    fontSize: typography.fontSize.display,
    fontWeight: '700' as const,
    color: colors.text.primary,
    marginBottom: 8,
    fontFamily: typography.fontFamily.bold,
  },
  subtitle: {
    fontSize: typography.fontSize.subheading,
    color: colors.status.error,
    marginBottom: spacing.xl,
    fontFamily: typography.fontFamily.medium,
  },
  section: {
    backgroundColor: colors.surface,
    borderRadius: radius.large,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  sectionTitle: {
    fontSize: typography.fontSize.subheading,
    fontWeight: '600' as const,
    color: colors.text.primary,
    fontFamily: typography.fontFamily.semiBold,
  },
  text: {
    color: colors.text.secondary,
    fontSize: typography.fontSize.body,
    lineHeight: 24,
    fontFamily: typography.fontFamily.regular,
  },
  emergencyButton: {
    backgroundColor: colors.status.error,
    padding: spacing.lg,
    borderRadius: radius.medium,
    alignItems: 'center',
    marginVertical: spacing.lg,
  },
  emergencyButtonText: {
    color: colors.text.primary,
    fontSize: typography.fontSize.subheading,
    fontWeight: '600' as const,
    fontFamily: typography.fontFamily.semiBold,
  },
});