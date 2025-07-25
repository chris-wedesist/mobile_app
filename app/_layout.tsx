import { useEffect, useState, useRef } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as SplashScreen from 'expo-splash-screen';
import EmergencyCallButton from '@/components/EmergencyCallButton';
import CustomSplashScreen from '@/components/SplashScreen';
import { colors } from '@/constants/theme';
import { View, Text } from 'react-native'
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import * as React from 'react';
import * as Sentry from '@sentry/react-native';
import { errorHandler } from '@/utils/errorHandler';
import { StateManager } from '@/utils/stateManager';

// Initialize i18n system safely
let i18nInitialized = false;
const initializeI18n = () => {
  if (!i18nInitialized) {
    try {
      // Dynamic import to avoid Hermes issues
      import('@/utils/i18n').catch((error) => {
        console.warn('Failed to initialize i18n system:', error);
      });
      i18nInitialized = true;
    } catch (error) {
      console.warn('Failed to initialize i18n system:', error);
    }
  }
};

// Prevent the splash screen from auto-hiding before asset loading is complete
SplashScreen.preventAutoHideAsync().catch(() => {
  // Ignore errors - this happens on web
});

// Initialize Sentry at app startup (only if DSN is properly configured)
const sentryDsn = process.env.EXPO_PUBLIC_SENTRY_DSN;
if (sentryDsn && sentryDsn !== 'YOUR_SENTRY_DSN') {
  Sentry.init({
    dsn: sentryDsn,
    debug: __DEV__,
  });
}

// Global handler for unhandled promise rejections (Hermes compatible)
if (typeof global !== 'undefined' && typeof global.process !== 'undefined' && global.process.on) {
  global.process.on('unhandledRejection', (reason: any) => {
    errorHandler(reason);
  });
}

// Global error boundary component
interface ErrorBoundaryState {
  hasError: boolean;
  error: any;
}
class ErrorBoundary extends React.Component<any, ErrorBoundaryState> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, info: any) {
    errorHandler(error);
  }

  render() {
    if (this.state.hasError) {
      // Show a user-friendly error message
      return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' }}>
          <Text style={{ color: '#fff', fontSize: 18, marginBottom: 16 }}>Something went wrong.</Text>
          <Text style={{ color: '#fff', fontSize: 14 }}>{errorHandler(this.state.error)}</Text>
        </View>
      );
    }
    return this.props.children;
  }
}

export default function RootLayout() {
  useFrameworkReady();
  const router = useRouter();
  const [isReady, setIsReady] = useState(false);
  const [initialRoute, setInitialRoute] = useState<string | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    console.log('RootLayout mounted, checking first launch...');
    
    // Initialize state management
    const initializeApp = async () => {
      try {
        await StateManager.initialize();
        console.log('State management initialized successfully');
      } catch (error) {
        console.error('Failed to initialize state management:', error);
      }
      
      // Continue with existing initialization
      checkFirstLaunch();
    };
    
    initializeApp();

    // Cleanup function to clear timeout if component unmounts
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const checkFirstLaunch = async () => {
    try {
      console.log('Checking if onboarding is completed...');
      const onboardingCompleted = await AsyncStorage.getItem('onboarding_completed');
      console.log('Onboarding completed:', onboardingCompleted);
      
      if (onboardingCompleted !== 'true') {
        console.log('Setting initial route to onboarding');
        setInitialRoute('/onboarding');
      } else {
        console.log('Setting initial route to tabs');
        setInitialRoute('/(tabs)');
      }
      
      // Short timeout to ensure state updates properly
      timeoutRef.current = setTimeout(() => {
        console.log('Setting isReady to true');
        setIsReady(true);
      }, 500);
    } catch (error) {
      console.error('Error checking first launch status:', error);
      setInitialRoute('/(tabs)'); // Default to tabs on error
      setIsReady(true);
    }
  };

  useEffect(() => {
    if (isReady && initialRoute) {
      console.log('App is ready, navigating to:', initialRoute);
      // Use setTimeout to ensure navigation happens after render
      const navigationTimeout = setTimeout(() => {
        router.replace(initialRoute);
        // Hide the native splash screen once navigation is complete
        SplashScreen.hideAsync().catch(() => {
          // Ignore errors - this happens on web
        });
      }, 100);

      // Cleanup navigation timeout
      return () => clearTimeout(navigationTimeout);
    }
  }, [isReady, initialRoute]);

  if (!isReady || !initialRoute) {
    console.log('Showing splash screen');
    return <CustomSplashScreen />;
  }

  console.log('Rendering main layout');
  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <Stack screenOptions={{ 
          headerShown: false,
          contentStyle: { backgroundColor: colors.primary }
        }}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="emergency-setup" options={{ presentation: 'modal' }} />
          <Stack.Screen name="panic-activation" options={{ presentation: 'fullScreenModal' }} />
          <Stack.Screen name="report-incident" options={{ presentation: 'modal' }} />
          <Stack.Screen name="legal-rights" options={{ presentation: 'modal' }} />
          <Stack.Screen name="stealth-mode" options={{ presentation: 'modal' }} />
          <Stack.Screen name="incidents" options={{ headerShown: false }} />
          <Stack.Screen name="settings" options={{ headerShown: false }} />
          <Stack.Screen name="onboarding" options={{ headerShown: false, gestureEnabled: false }} />
          <Stack.Screen name="badge-unlock" options={{ headerShown: false, gestureEnabled: false }} />
          <Stack.Screen name="+not-found" />
        </Stack>
        <StatusBar style="light" />

        {initialRoute !== '/onboarding' && <EmergencyCallButton />}
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}