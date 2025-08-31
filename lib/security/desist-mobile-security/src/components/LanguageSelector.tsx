import React from 'react';
import {
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { COLORS } from '../constants/theme';
import { useTranslation } from '../hooks/useTranslation';
import { SupportedLanguage } from '../types/translation';

interface LanguageSelectorProps {
  visible: boolean;
  onClose: () => void;
}

const LANGUAGE_OPTIONS = [
  { code: 'en' as SupportedLanguage, name: 'English', nativeName: 'English', flag: '🇺🇸' },
  { code: 'es' as SupportedLanguage, name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
  { code: 'fr' as SupportedLanguage, name: 'French', nativeName: 'Français', flag: '🇫🇷' },
  { code: 'de' as SupportedLanguage, name: 'German', nativeName: 'Deutsch', flag: '🇩🇪' },
  { code: 'pt' as SupportedLanguage, name: 'Portuguese', nativeName: 'Português', flag: '🇵🇹' },
  { code: 'zh' as SupportedLanguage, name: 'Chinese', nativeName: '中文', flag: '🇨🇳' },
  { code: 'ja' as SupportedLanguage, name: 'Japanese', nativeName: '日本語', flag: '🇯🇵' },
  { code: 'ko' as SupportedLanguage, name: 'Korean', nativeName: '한국어', flag: '🇰🇷' },
  { code: 'ar' as SupportedLanguage, name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦' },
  { code: 'hi' as SupportedLanguage, name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳' },
];

const LanguageSelector: React.FC<LanguageSelectorProps> = ({ visible, onClose }) => {
  const { currentLanguage, setLanguage } = useTranslation();

  const handleLanguageSelect = async (language: SupportedLanguage) => {
    await setLanguage(language);
    onClose();
  };

  const renderLanguageItem = ({ item }: { item: typeof LANGUAGE_OPTIONS[0] }) => (
    <TouchableOpacity
      style={[
        styles.languageItem,
        currentLanguage === item.code && styles.selectedLanguageItem
      ]}
      onPress={() => handleLanguageSelect(item.code)}
    >
      <Text style={styles.flag}>{item.flag}</Text>
      <View style={styles.languageInfo}>
        <Text style={[styles.languageName, currentLanguage === item.code && styles.selectedText]}>
          {item.nativeName}
        </Text>
        <Text style={[styles.languageSubtext, currentLanguage === item.code && styles.selectedSubtext]}>
          {item.name}
        </Text>
      </View>
      {currentLanguage === item.code && (
        <Text style={styles.checkmark}>✓</Text>
      )}
    </TouchableOpacity>
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.title}>Select Language</Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>
          
          <FlatList
            data={LANGUAGE_OPTIONS}
            renderItem={renderLanguageItem}
            keyExtractor={(item) => item.code}
            style={styles.languageList}
            showsVerticalScrollIndicator={false}
          />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    maxHeight: '80%',
    width: '90%',
    maxWidth: 400,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.dark,
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    fontSize: 18,
    color: COLORS.medium,
  },
  languageList: {
    maxHeight: 400,
  },
  languageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  selectedLanguageItem: {
    backgroundColor: COLORS.primaryLight,
  },
  flag: {
    fontSize: 24,
    marginRight: 16,
  },
  languageInfo: {
    flex: 1,
  },
  languageName: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.dark,
  },
  selectedText: {
    color: COLORS.primary,
  },
  languageSubtext: {
    fontSize: 14,
    color: COLORS.medium,
    marginTop: 2,
  },
  selectedSubtext: {
    color: COLORS.primary,
  },
  checkmark: {
    fontSize: 18,
    color: COLORS.primary,
    fontWeight: 'bold',
  },
});

export default LanguageSelector;
