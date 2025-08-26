import { MaterialIcons } from '@expo/vector-icons';
import * as React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import {
  colors,
  radius,
  shadows,
  spacing,
  typography,
} from '../constants/theme';
import { useTranslation } from '../hooks/useTranslation';
import { AccessibleButton } from './AccessibleButton';
import {
  AccessibleBody,
  AccessibleHeading,
  AccessibleText,
} from './AccessibleText';
import { LanguageSelector } from './LanguageSelector';

/**
 * Example component demonstrating internationalization features
 * Shows how to use translations, language switching, and language detection
 */
export default function InternationalizationExample() {
  const { t, currentLanguage, getLanguageName, switchLanguage } =
    useTranslation();

  const [showLanguageSelector, setShowLanguageSelector] = React.useState(false);

  const handleLanguageChange = async (language: string) => {
    await switchLanguage(language);
  };

  return (
    <ScrollView style={styles.container}>
      <AccessibleHeading style={styles.title}>
        {t('common.welcome')} - Internationalization Demo
      </AccessibleHeading>

      <AccessibleBody style={styles.description}>
        This screen demonstrates the internationalization features including
        language switching, translation usage, and language detection.
      </AccessibleBody>

      {/* Current Language Display */}
      <View style={styles.section}>
        <AccessibleText variant="subheading" style={styles.sectionTitle}>
          Current Language
        </AccessibleText>

        <View style={styles.languageInfo}>
          <MaterialIcons name="language" size={24} color={colors.primary} />
          <AccessibleBody style={styles.languageText}>
            {getLanguageName(currentLanguage)} ({currentLanguage.toUpperCase()})
          </AccessibleBody>
        </View>
      </View>

      {/* Quick Language Switcher */}
      <View style={styles.section}>
        <AccessibleText variant="subheading" style={styles.sectionTitle}>
          Quick Language Switch
        </AccessibleText>

        <View style={styles.languageButtons}>
          <AccessibleButton
            onPress={() => handleLanguageChange('en')}
            style={
              [
                styles.languageButton,
                currentLanguage === 'en' && styles.activeLanguageButton,
              ] as any
            }
            accessibilityLabel={`Switch to ${getLanguageName('en')}`}
          >
            {getLanguageName('en')}
          </AccessibleButton>

          <AccessibleButton
            onPress={() => handleLanguageChange('es')}
            style={
              [
                styles.languageButton,
                currentLanguage === 'es' && styles.activeLanguageButton,
              ] as any
            }
            accessibilityLabel={`Switch to ${getLanguageName('es')}`}
          >
            {getLanguageName('es')}
          </AccessibleButton>

          <AccessibleButton
            onPress={() => handleLanguageChange('fr')}
            style={
              [
                styles.languageButton,
                currentLanguage === 'fr' && styles.activeLanguageButton,
              ] as any
            }
            accessibilityLabel={`Switch to ${getLanguageName('fr')}`}
          >
            {getLanguageName('fr')}
          </AccessibleButton>
        </View>
      </View>

      {/* Language Selector Modal */}
      <View style={styles.section}>
        <AccessibleText variant="subheading" style={styles.sectionTitle}>
          Advanced Language Selection
        </AccessibleText>

        <AccessibleButton
          onPress={() => setShowLanguageSelector(true)}
          style={styles.selectorButton}
          accessibilityLabel="Open language selector"
        >
          <MaterialIcons name="settings" size={20} color={colors.background} />
          <Text style={styles.selectorButtonText}>
            {t('settings.language')}
          </Text>
        </AccessibleButton>
      </View>

      {/* Translation Examples */}
      <View style={styles.section}>
        <AccessibleText variant="subheading" style={styles.sectionTitle}>
          Translation Examples
        </AccessibleText>

        <View style={styles.translationGrid}>
          <View style={styles.translationItem}>
            <AccessibleText style={styles.translationKey}>
              common.welcome
            </AccessibleText>
            <AccessibleText style={styles.translationValue}>
              {t('common.welcome')}
            </AccessibleText>
          </View>

          <View style={styles.translationItem}>
            <AccessibleText style={styles.translationKey}>
              common.loading
            </AccessibleText>
            <AccessibleText style={styles.translationValue}>
              {t('common.loading')}
            </AccessibleText>
          </View>

          <View style={styles.translationItem}>
            <AccessibleText style={styles.translationKey}>
              navigation.home
            </AccessibleText>
            <AccessibleText style={styles.translationValue}>
              {t('navigation.home')}
            </AccessibleText>
          </View>

          <View style={styles.translationItem}>
            <AccessibleText style={styles.translationKey}>
              auth.login
            </AccessibleText>
            <AccessibleText style={styles.translationValue}>
              {t('auth.login')}
            </AccessibleText>
          </View>

          <View style={styles.translationItem}>
            <AccessibleText style={styles.translationKey}>
              settings.general
            </AccessibleText>
            <AccessibleText style={styles.translationValue}>
              {t('settings.general')}
            </AccessibleText>
          </View>

          <View style={styles.translationItem}>
            <AccessibleText style={styles.translationKey}>
              incidents.report_incident
            </AccessibleText>
            <AccessibleText style={styles.translationValue}>
              {t('incidents.report_incident')}
            </AccessibleText>
          </View>
        </View>
      </View>

      {/* Navigation Examples */}
      <View style={styles.section}>
        <AccessibleText variant="subheading" style={styles.sectionTitle}>
          Navigation Examples
        </AccessibleText>

        <View style={styles.navigationGrid}>
          {['home', 'profile', 'settings', 'incidents', 'legal_help'].map(
            (item) => (
              <View key={item} style={styles.navigationItem}>
                <MaterialIcons
                  name="navigate-next"
                  size={16}
                  color={colors.text.muted}
                />
                <AccessibleText style={styles.navigationText}>
                  {t(`navigation.${item}`)}
                </AccessibleText>
              </View>
            )
          )}
        </View>
      </View>

      {/* Language Selector Modal */}
      <LanguageSelector
        visible={showLanguageSelector}
        onClose={() => setShowLanguageSelector(false)}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.md,
    backgroundColor: colors.surface,
  },
  title: {
    textAlign: 'center',
    marginBottom: spacing.md,
    color: colors.text.primary,
  },
  description: {
    textAlign: 'center',
    marginBottom: spacing.xl,
    color: colors.text.secondary,
  },
  section: {
    marginBottom: spacing.xl,
    padding: spacing.md,
    backgroundColor: colors.background,
    borderRadius: radius.small,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    marginBottom: spacing.md,
    color: colors.text.primary,
  },
  languageInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  languageText: {
    fontSize: 16,
    color: colors.text.primary,
  },
  languageButtons: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
  },
  languageButton: {
    flex: 1,
    minWidth: 80,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  activeLanguageButton: {
    backgroundColor: colors.primary,
  },
  selectorButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  selectorButtonText: {
    color: colors.background,
    fontSize: typography.fontSize.body,
    fontWeight: '600',
  },
  translationGrid: {
    gap: spacing.md,
  },
  translationItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.small,
  },
  translationKey: {
    fontSize: typography.fontSize.caption,
    color: colors.text.muted,
    fontFamily: typography.fontFamily.regular,
  },
  translationValue: {
    fontSize: typography.fontSize.small,
    color: colors.text.primary,
    fontWeight: '500',
  },
  navigationGrid: {
    gap: 10,
  },
  navigationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.small,
  },
  navigationText: {
    fontSize: 14,
    color: colors.text.primary,
  },
});
