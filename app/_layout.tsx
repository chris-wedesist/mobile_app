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

// Prevent the splash screen from auto-hiding before asset loading is complete
SplashScreen.preventAutoHideAsync().catch(() => {
  // Ignore errors - this happens on web
});

export default function RootLayout() {
  useFrameworkReady();
  const router = useRouter();
  const [isReady, setIsReady] = useState(false);
  const [initialRoute, setInitialRoute] = useState<string | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    console.log('RootLayout mounted, checking first launch...');
    checkFirstLaunch();

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
        router.replace(initialRoute as any);
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
  );
}