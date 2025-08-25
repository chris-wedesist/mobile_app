import { MaterialIcons } from '@expo/vector-icons';
import * as React from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import {
  colors,
  typography,
  spacing,
  radius,
  shadows,
} from '../constants/theme';
import { useTranslation } from '../hooks/useTranslation';

interface LanguageSelectorProps {
  visible: boolean;
  onClose: () => void;
}

/**
 * Language selector component for changing app language
 * Provides a modal interface for language selection
 */
export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  visible,
  onClose,
}) => {
  const { t, switchLanguage, getLanguages, getLanguageName, currentLanguage } =
    useTranslation();

  const handleLanguageSelect = async (language: string) => {
    await switchLanguage(language);
    onClose();
  };

  const languages = getLanguages();

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalBackground}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.title}>{t('settings.language')}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <MaterialIcons
                name="close"
                size={24}
                color={colors.text.primary}
              />
            </TouchableOpacity>
          </View>

          <View style={styles.languageList}>
            {languages.map((language) => (
              <TouchableOpacity
                key={language}
                style={[
                  styles.languageItem,
                  currentLanguage === language && styles.selectedLanguage,
                ]}
                onPress={() => handleLanguageSelect(language)}
              >
                <Text
                  style={[
                    styles.languageText,
                    currentLanguage === language && styles.selectedLanguageText,
                  ]}
                >
                  {getLanguageName(language)}
                </Text>
                {currentLanguage === language && (
                  <MaterialIcons
                    name="check"
                    size={20}
                    color={colors.primary}
                  />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalBackground: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.lg,
    width: '80%',
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.text.muted,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  closeButton: {
    padding: 5,
  },
  languageList: {
    gap: 10,
  },
  languageItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.small,
    backgroundColor: colors.background,
  },
  selectedLanguage: {
    backgroundColor: colors.primary + '20',
    borderWidth: 1,
    borderColor: colors.primary,
  },
  languageText: {
    fontSize: 16,
    color: colors.text.primary,
  },
  selectedLanguageText: {
    color: colors.primary,
    fontWeight: '600',
  },
});

export default LanguageSelector;
