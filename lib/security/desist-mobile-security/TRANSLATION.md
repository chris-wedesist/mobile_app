# Translation System Documentation

## Overview

The Desist Mobile Security library includes a comprehensive internationalization (i18n) system built on TypeScript and i18next, supporting 10 languages with RTL capabilities and locale-aware formatting.

## Supported Languages

- **English (en)** - English 🇺🇸 ✅ **Complete**
- **Spanish (es)** - Español 🇪🇸 ✅ **Complete**
- **French (fr)** - Français 🇫🇷 ✅ **Complete**
- **German (de)** - Deutsch 🇩🇪 ✅ **Complete** 
- **Portuguese (pt)** - Português 🇵🇹 ✅ **Complete**
- **Chinese (zh)** - 中文 🇨🇳 ⏳ **Planned**
- **Japanese (ja)** - 日本語 🇯🇵 ⏳ **Planned**
- **Korean (ko)** - 한국어 🇰🇷 ⏳ **Planned**
- **Arabic (ar)** - العربية 🇸🇦 ⏳ **Planned** (RTL)
- **Hindi (hi)** - हिन्दी 🇮🇳 ⏳ **Planned**

### Implementation Status
✅ **Production Ready**: EN, ES, FR, DE, PT  
⏳ **In Development**: ZH, JA, KO, AR, HI (using English fallback)  
🔄 **Testing Phase**: Device validation and user experience testing in progress

## Quick Start

### 1. Import the Translation Hook

```tsx
import { useTranslation } from '@desist/mobile-security';

const MyComponent = () => {
  const { t, currentLanguage, setLanguage } = useTranslation();
  
  return (
    <Text>{t('common.loading')}</Text>
  );
};
```

### 2. Use Translation Keys

```tsx
// Basic translation
<Text>{t('performance.title')}</Text>

// With fallback
<Text>{t('network.status', 'Status')}</Text>

// Conditional translation
<Text>{isConnected ? t('network.connected') : t('network.disconnected')}</Text>
```

### 3. Language Switching

```tsx
import { LanguageSelector } from '@desist/mobile-security';

const SettingsScreen = () => {
  const [showLanguageSelector, setShowLanguageSelector] = useState(false);
  
  return (
    <>
      <TouchableOpacity onPress={() => setShowLanguageSelector(true)}>
        <Text>Change Language</Text>
      </TouchableOpacity>
      
      <LanguageSelector
        visible={showLanguageSelector}
        onClose={() => setShowLanguageSelector(false)}
      />
    </>
  );
};
```

## API Reference

### useTranslation Hook

```tsx
const {
  t,                    // Translation function
  currentLanguage,      // Current language code (SupportedLanguage)
  setLanguage,          // Language setter function
  isRTL,               // RTL language detection
  formatDate,          // Locale-aware date formatting
  formatTime,          // Locale-aware time formatting  
  formatNumber,        // Locale-aware number formatting
  formatCurrency       // Locale-aware currency formatting
} = useTranslation();
```

### Translation Function

```tsx
// Basic usage
t('common.loading')                    // "Loading..."

// With interpolation (when supported)
t('welcome.message', { name: 'John' }) // "Welcome, John!"

// With fallback
t('unknown.key', 'Fallback text')      // Returns fallback if key not found
```

### Language Management

```tsx
// Get current language
const language = currentLanguage; // 'en' | 'es' | 'fr' | etc.

// Change language (persisted automatically)
await setLanguage('es');

// Check RTL support
if (isRTL) {
  // Apply RTL-specific styling
}
```

### Locale Formatting

```tsx
// Format dates
formatDate(new Date())              // "12/25/2023" (en) | "25/12/2023" (es)

// Format times  
formatTime(new Date())              // "3:30 PM" (en) | "15:30" (es)

// Format numbers
formatNumber(12345.67)              // "12,345.67" (en) | "12.345,67" (es)

// Format currency
formatCurrency(99.99, 'USD')        // "$99.99" (en) | "99,99 US$" (es)
formatCurrency(99.99, 'EUR')        // "€99.99" (en) | "99,99 €" (es)
```

## Translation Keys Structure

### Common Keys
```
common.loading          // "Loading..."
common.error           // "Error"  
common.success         // "Success"
common.cancel          // "Cancel"
common.save            // "Save"
common.delete          // "Delete"
common.unknown         // "Unknown"
common.good            // "Good"
common.poor            // "Poor"
```

### Performance Keys
```
performance.title      // "Performance & Network"
performance.metrics    // "Performance Metrics"
performance.battery    // "Battery Level"
performance.memory     // "Memory Usage"
performance.cpu        // "CPU Usage"
performance.disk       // "Disk Usage"
performance.optimize   // "Optimize Performance"
```

### Network Keys
```
network.status         // "Network Status"
network.connected      // "Connected"
network.disconnected   // "Disconnected"
network.wifi           // "WiFi"
network.cellular       // "Cellular"
network.speed          // "Connection Speed"
network.download       // "Download"
network.upload         // "Upload"
```

### Security Keys
```
security.encryption    // "Encryption"
security.authentication // "Authentication"
security.biometric     // "Biometric"
security.twoFactor     // "Two Factor"
```

## Components

### LanguageSelector

A modal component for language selection:

```tsx
<LanguageSelector
  visible={boolean}
  onClose={() => void}
/>
```

**Props:**
- `visible` - Controls modal visibility
- `onClose` - Called when modal should close

### TranslationDemo

A demonstration component showcasing translation features:

```tsx
<TranslationDemo onBack={() => void} />
```

## Integration Examples

### Performance Screen Integration

```tsx
import { useTranslation } from '@desist/mobile-security';

const PerformanceScreen = () => {
  const { t } = useTranslation();
  
  return (
    <View>
      <Text style={styles.title}>{t('performance.title')}</Text>
      <Text>{t('performance.battery')}: 85%</Text>
      <Text>{t('performance.memory')}: 2.1 GB</Text>
      <TouchableOpacity>
        <Text>{t('performance.optimize')}</Text>
      </TouchableOpacity>
    </View>
  );
};
```

### Alert Messages

```tsx
const showErrorAlert = () => {
  Alert.alert(
    t('common.error'),
    t('network.diagnosticsError')
  );
};

const showSuccessAlert = () => {
  Alert.alert(
    t('common.success'),
    t('common.syncSuccess')
  );
};
```

### Tab Navigation

```tsx
const TabNavigator = () => {
  const { t } = useTranslation();
  
  return (
    <TabNavigator>
      <Tab.Screen 
        name="Performance" 
        options={{ title: t('performance.tab') }}
      />
      <Tab.Screen 
        name="Network" 
        options={{ title: t('network.tab') }}
      />
      <Tab.Screen 
        name="Security" 
        options={{ title: t('security.encryption') }}
      />
    </TabNavigator>
  );
};
```

## Advanced Usage

### Custom Translation Service

```tsx
import { TranslationService } from '@desist/mobile-security';

// Initialize service directly
const translationService = new TranslationService();

// Set language programmatically
await translationService.setLanguage('fr');

// Get translation directly
const text = translationService.translate('common.loading');

// Format with locale
const price = translationService.formatCurrency(29.99, 'EUR');
```

### RTL Layout Support

```tsx
const MyComponent = () => {
  const { isRTL } = useTranslation();
  
  const styles = StyleSheet.create({
    container: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      textAlign: isRTL ? 'right' : 'left',
    }
  });
  
  return <View style={styles.container}>...</View>;
};
```

### Language Persistence

The translation system automatically persists language preferences using AsyncStorage. Language selection survives app restarts and updates.

## Adding New Languages

To add support for additional languages:

1. **Update Types** - Add language code to `SupportedLanguage` enum
2. **Create Translation File** - Add new locale file (e.g., `src/locales/fr.ts`)
3. **Update Service** - Add language to TranslationService resources
4. **Add to Selector** - Include in LanguageSelector options

Example:
```tsx
// src/locales/fr.ts
export const fr: TranslationResource = {
  common: {
    loading: 'Chargement...',
    error: 'Erreur',
    // ... more translations
  },
  // ... other sections
};
```

## Best Practices

1. **Use Descriptive Keys** - `performance.batteryLevel` vs `perf.bat`
2. **Group Related Keys** - Organize by feature/screen
3. **Provide Fallbacks** - Always include fallback text
4. **Test RTL Languages** - Verify layout with Arabic/Hebrew
5. **Keep Translations Short** - Consider UI space constraints
6. **Use Placeholders** - For dynamic content interpolation

## Troubleshooting

**Translation not updating?**
- Ensure component re-renders when language changes
- Check if translation key exists in locale files

**RTL layout issues?**
- Use `isRTL` from useTranslation hook
- Test with Arabic or Hebrew languages

**Performance concerns?**
- Translations are cached after first load
- Language switching is optimized with AsyncStorage

**Missing translations?**
- Check console for missing key warnings
- Verify locale files export correctly
````
