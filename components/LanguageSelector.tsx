import { MaterialIcons } from '@expo/vector-icons';
import * as React from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors } from '../constants/theme';
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
      <View style={styles.overlay}>
        <View style={styles.container}>
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
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    width: '80%',
    maxWidth: 400,
    maxHeight: '70%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 15,
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
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
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
