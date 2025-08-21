# Stealth Mode Implementation Guide

## Overview

This document provides detailed technical specifications for implementing stealth mode functionality in the DESIST mobile app.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    App Launch                                │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│            Mode Detection                                    │
│  - Check AsyncStorage for saved mode                        │
│  - Default to stealth mode on first launch                  │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│               Route Decision                                 │
└─────────────┬───────────────────┬───────────────────────────┘
              │                   │
              ▼                   ▼
    ┌─────────────────┐   ┌─────────────────┐
    │  Stealth Mode   │   │  Normal Mode    │
    │   (Disguise)    │   │  (Real App)     │
    └─────────────────┘   └─────────────────┘
```

## Core Components to Implement

### 1. Mode Management (`lib/stealth.ts`)

```typescript
export type AppMode = 'stealth' | 'normal';

export interface StealthConfig {
  currentMode: AppMode;
  isFirstLaunch: boolean;
  lastToggleTime: Date;
  toggleCount: number;
  securityEnabled: boolean;
}

export class StealthManager {
  private static instance: StealthManager;
  private config: StealthConfig;

  static getInstance(): StealthManager {
    if (!StealthManager.instance) {
      StealthManager.instance = new StealthManager();
    }
    return StealthManager.instance;
  }

  async getCurrentMode(): Promise<AppMode> {
    // Implementation needed
  }

  async toggleMode(password?: string): Promise<boolean> {
    // Implementation needed
  }

  async resetToStealth(): Promise<void> {
    // Emergency reset - Implementation needed
  }
}
```

### 2. Root Layout (`app/_layout.tsx`)

```typescript
import { StealthManager } from '../lib/stealth';
import { StealthNavigator } from './(stealth)/_layout';
import { NormalNavigator } from './(tabs)/_layout';

export default function RootLayout() {
  const [appMode, setAppMode] = useState<AppMode>('stealth');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadMode() {
      const mode = await StealthManager.getInstance().getCurrentMode();
      setAppMode(mode);
      setIsLoading(false);
    }
    loadMode();
  }, []);

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <StealthProvider value={{ appMode, setAppMode }}>
      {appMode === 'stealth' ? <StealthNavigator /> : <NormalNavigator />}
    </StealthProvider>
  );
}
```

### 3. Stealth Navigation (`app/(stealth)/_layout.tsx`)

```typescript
import { Tabs } from 'expo-router';

export default function StealthLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarStyle: { backgroundColor: '#f8f9fa' },
        headerStyle: { backgroundColor: '#f8f9fa' },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Calculator',
          tabBarIcon: ({ color }) => (
            <Ionicons name="calculator" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="notes"
        options={{
          title: 'Notes',
          tabBarIcon: ({ color }) => (
            <Ionicons name="document-text" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color }) => <Ionicons name="settings" color={color} />,
        }}
      />
    </Tabs>
  );
}
```

### 4. Stealth Components

#### Calculator Disguise (`app/(stealth)/index.tsx`)

```typescript
export default function CalculatorScreen() {
  const [display, setDisplay] = useState('0');
  const [tapCount, setTapCount] = useState(0);
  const [lastTapTime, setLastTapTime] = useState(0);

  const handleHiddenToggle = async () => {
    const now = Date.now();

    if (now - lastTapTime > 3000) {
      setTapCount(0);
    }

    setTapCount((prev) => prev + 1);
    setLastTapTime(now);

    if (tapCount === 6) {
      // 7 taps total
      // Show hidden input for PIN or immediate toggle
      await handleModeSwitch();
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={handleHiddenToggle}>
        <Text style={styles.display}>{display}</Text>
      </TouchableOpacity>
      {/* Calculator buttons implementation */}
    </View>
  );
}
```

#### Hidden Settings (`app/(stealth)/settings.tsx`)

```typescript
export default function StealthSettings() {
  const [showHidden, setShowHidden] = useState(false);
  const [tapSequence, setTapSequence] = useState([]);

  const handleVersionTap = () => {
    // Implement specific tap sequence for hidden menu
    // e.g., tap version number with specific pattern
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>General</Text>
        {/* Normal settings items */}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About</Text>
        <TouchableOpacity onPress={handleVersionTap}>
          <Text style={styles.versionText}>Version 1.0.0</Text>
        </TouchableOpacity>
      </View>

      {showHidden && <HiddenSettingsPanel onModeSwitch={handleModeSwitch} />}
    </ScrollView>
  );
}
```

### 5. Security Components

#### Privacy Guard (`components/stealth/PrivacyGuard.tsx`)

```typescript
export function PrivacyGuard({ children }: { children: React.ReactNode }) {
  const [isBackground, setIsBackground] = useState(false);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      setIsBackground(nextAppState !== 'active');
    });

    return () => subscription?.remove();
  }, []);

  if (isBackground) {
    return <PrivacyOverlay />;
  }

  return <>{children}</>;
}

function PrivacyOverlay() {
  return (
    <View style={styles.overlay}>
      <Image source={require('../assets/calculator-icon.png')} />
      <Text>Calculator</Text>
    </View>
  );
}
```

#### Screenshot Prevention (`utils/privacy.ts`)

```typescript
import { Alert } from 'react-native';

export class PrivacyManager {
  static preventScreenshots() {
    // For Android - use native module
    // For iOS - use expo-screen-capture
  }

  static enableScreenshots() {
    // Re-enable when in stealth mode
  }

  static hideContentInRecents() {
    // Hide app content in recent apps
  }
}
```

## Implementation Steps

### Phase 1: Basic Infrastructure (Week 1)

1. Create stealth mode manager
2. Implement mode persistence
3. Set up basic navigation structure
4. Create calculator disguise screen

### Phase 2: Security Layer (Week 2)

1. Implement hidden toggle mechanism
2. Add privacy guards
3. Create emergency reset
4. Add screenshot prevention

### Phase 3: Polish & Testing (Week 3)

1. Refine disguise interfaces
2. Test mode switching extensively
3. Security audit
4. Performance optimization

## Testing Checklist

### Functional Testing

- [ ] Mode switches correctly between stealth/normal
- [ ] Hidden toggle mechanism works reliably
- [ ] Data isolation between modes
- [ ] App launches in correct mode after restart
- [ ] Emergency reset functions properly

### Security Testing

- [ ] No visual indicators of hidden functionality
- [ ] Screenshots blocked in normal mode
- [ ] App content hidden when backgrounded
- [ ] No data leakage between modes
- [ ] Toggle mechanism not accidentally triggered

### User Experience Testing

- [ ] Stealth mode looks authentic
- [ ] Mode transitions are smooth
- [ ] No performance impact
- [ ] Works across different device sizes
- [ ] Accessible to users with disabilities

## Configuration Files

### Update `app.json`

```json
{
  "expo": {
    "name": "Calculator Pro",
    "slug": "calculator-pro",
    "icon": "./assets/calculator-icon.png",
    "scheme": "calculator",
    "privacy": "unlisted"
  }
}
```

### Required Dependencies

```json
{
  "expo-local-authentication": "^14.0.1",
  "expo-secure-store": "^13.0.2",
  "expo-screen-capture": "^6.0.0",
  "react-native-background-timer": "^2.4.1"
}
```

## Security Considerations

1. **Data Isolation**: Ensure no shared state between modes
2. **Memory Management**: Clear sensitive data when switching modes
3. **Network Requests**: Different endpoints/headers per mode
4. **Error Handling**: No error messages that reveal true functionality
5. **Logging**: Disable detailed logging in production stealth mode

## Emergency Protocols

1. **Factory Reset**: Triple tap + hold for 10 seconds on calculator equals button
2. **Safe Mode**: Launch with specific intent/URL scheme
3. **Remote Disable**: API endpoint to force stealth mode
4. **Data Wipe**: Secure deletion of all app data if compromised

---

_This implementation guide should be followed precisely to ensure user safety and app security._
