import React, { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { COLORS } from '../constants/theme';
import { useTranslation } from '../hooks/useTranslation';
import LanguageSelector from './LanguageSelector';

interface TranslationDemoProps {
  onBack?: () => void;
}

const TranslationDemo: React.FC<TranslationDemoProps> = ({ onBack }) => {
  const { t, currentLanguage, isRTL, formatDate, formatNumber, formatCurrency } = useTranslation();
  const [showLanguageSelector, setShowLanguageSelector] = useState(false);

  const demoData = {
    date: new Date(),
    number: 12345.67,
    currency: 99.99,
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        {onBack && (
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
        )}
        <Text style={styles.headerTitle}>Translation Demo</Text>
        <TouchableOpacity
          style={styles.languageButton}
          onPress={() => setShowLanguageSelector(true)}
        >
          <Text style={styles.languageButtonText}>🌐 {currentLanguage.toUpperCase()}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {/* Current Language Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Current Language</Text>
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>Language Code:</Text>
            <Text style={styles.infoValue}>{currentLanguage}</Text>
          </View>
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>RTL Support:</Text>
            <Text style={styles.infoValue}>{isRTL ? 'Yes' : 'No'}</Text>
          </View>
        </View>

        {/* Common Translations */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Common Translations</Text>
          <View style={styles.translationGrid}>
            <View style={styles.translationCard}>
              <Text style={styles.translationKey}>common.loading</Text>
              <Text style={styles.translationValue}>{t('common.loading')}</Text>
            </View>
            <View style={styles.translationCard}>
              <Text style={styles.translationKey}>common.error</Text>
              <Text style={styles.translationValue}>{t('common.error')}</Text>
            </View>
            <View style={styles.translationCard}>
              <Text style={styles.translationKey}>common.success</Text>
              <Text style={styles.translationValue}>{t('common.success')}</Text>
            </View>
            <View style={styles.translationCard}>
              <Text style={styles.translationKey}>common.cancel</Text>
              <Text style={styles.translationValue}>{t('common.cancel')}</Text>
            </View>
          </View>
        </View>

        {/* Performance Translations */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Performance Section</Text>
          <View style={styles.translationGrid}>
            <View style={styles.translationCard}>
              <Text style={styles.translationKey}>performance.title</Text>
              <Text style={styles.translationValue}>{t('performance.title')}</Text>
            </View>
            <View style={styles.translationCard}>
              <Text style={styles.translationKey}>performance.metrics</Text>
              <Text style={styles.translationValue}>{t('performance.metrics')}</Text>
            </View>
            <View style={styles.translationCard}>
              <Text style={styles.translationKey}>performance.battery</Text>
              <Text style={styles.translationValue}>{t('performance.battery')}</Text>
            </View>
            <View style={styles.translationCard}>
              <Text style={styles.translationKey}>performance.memory</Text>
              <Text style={styles.translationValue}>{t('performance.memory')}</Text>
            </View>
          </View>
        </View>

        {/* Network Translations */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Network Section</Text>
          <View style={styles.translationGrid}>
            <View style={styles.translationCard}>
              <Text style={styles.translationKey}>network.status</Text>
              <Text style={styles.translationValue}>{t('network.status')}</Text>
            </View>
            <View style={styles.translationCard}>
              <Text style={styles.translationKey}>network.connected</Text>
              <Text style={styles.translationValue}>{t('network.connected')}</Text>
            </View>
            <View style={styles.translationCard}>
              <Text style={styles.translationKey}>network.wifi</Text>
              <Text style={styles.translationValue}>{t('network.wifi')}</Text>
            </View>
            <View style={styles.translationCard}>
              <Text style={styles.translationKey}>network.speed</Text>
              <Text style={styles.translationValue}>{t('network.speed')}</Text>
            </View>
          </View>
        </View>

        {/* Locale Formatting */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Locale Formatting</Text>
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>Date:</Text>
            <Text style={styles.infoValue}>{formatDate(demoData.date)}</Text>
          </View>
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>Number:</Text>
            <Text style={styles.infoValue}>{formatNumber(demoData.number)}</Text>
          </View>
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>Currency (USD):</Text>
            <Text style={styles.infoValue}>{formatCurrency(demoData.currency, 'USD')}</Text>
          </View>
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>Currency (EUR):</Text>
            <Text style={styles.infoValue}>{formatCurrency(demoData.currency, 'EUR')}</Text>
          </View>
        </View>

        {/* Instructions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>How to Use</Text>
          <Text style={styles.instructionText}>
            1. Tap the language button (🌐) in the header to open the language selector
          </Text>
          <Text style={styles.instructionText}>
            2. Select a different language to see translations update in real-time
          </Text>
          <Text style={styles.instructionText}>
            3. Notice how formatting adapts to the selected locale
          </Text>
          <Text style={styles.instructionText}>
            4. Language preference is automatically saved using AsyncStorage
          </Text>
        </View>
      </ScrollView>

      <LanguageSelector
        visible={showLanguageSelector}
        onClose={() => setShowLanguageSelector(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    fontSize: 24,
    color: COLORS.primary,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.dark,
  },
  languageButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: COLORS.primaryLight,
    borderRadius: 16,
  },
  languageButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.white,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.dark,
    marginBottom: 12,
  },
  infoCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 14,
    color: COLORS.medium,
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 14,
    color: COLORS.dark,
    fontWeight: '600',
  },
  translationGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  translationCard: {
    width: '48%',
    backgroundColor: COLORS.white,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    margin: 4,
  },
  translationKey: {
    fontSize: 12,
    color: COLORS.medium,
    marginBottom: 4,
  },
  translationValue: {
    fontSize: 14,
    color: COLORS.dark,
    fontWeight: '500',
  },
  instructionText: {
    fontSize: 14,
    color: COLORS.medium,
    lineHeight: 20,
    marginBottom: 8,
  },
});

export default TranslationDemo;
