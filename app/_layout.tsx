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
import { AuthProvider, useAuth } from '@/contexts/AuthContext';


// Prevent the splash screen from auto-hiding before asset loading is complete
SplashScreen.preventAutoHideAsync().catch(() => {
  // Ignore errors - this happens on web
});

function AppContent() {
  useFrameworkReady();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [isReady, setIsReady] = useState(false);
  const [initialRoute, setInitialRoute] = useState<string | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    console.log('AppContent mounted, checking authentication...');
    checkInitialRoute();
  }, [user, authLoading]);

  const checkInitialRoute = async () => {
    try {
      console.log('Checking authentication status...');

      if (authLoading) {
        console.log('Auth is still loading...');
        return;
      }

      if (user && user.id) {
        console.log('User is authenticated, checking onboarding...');
        const onboardingCompleted = await AsyncStorage.getItem('onboarding_completed');
        console.log('Onboarding completed:', onboardingCompleted);
        
        if (onboardingCompleted !== 'true') {
          console.log('Setting initial route to onboarding');
          setInitialRoute('/onboarding');
        } else {
          console.log('Setting initial route to tabs');
          setInitialRoute('/(tabs)');
        }
      } else {
        console.log('User not authenticated, checking if onboarding was ever completed...');
        const onboardingCompleted = await AsyncStorage.getItem('onboarding_completed');
        
        if (onboardingCompleted !== 'true') {
          console.log('Onboarding never completed, setting initial route to onboarding');
          setInitialRoute('/onboarding');
        } else {
          console.log('Onboarding completed before, setting initial route to login');
          setInitialRoute('/login');
        }
      }

      // Short timeout to ensure state updates properly
      setTimeout(() => {
        console.log('Setting isReady to true');
        setIsReady(true);
      }, 500);
    } catch (error) {
      console.error('Error checking initial route:', error);
      setInitialRoute('/login'); // Default to login on error
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

  if (!isReady || !initialRoute || authLoading) {
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
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="signup" options={{ headerShown: false }} />
        <Stack.Screen name="auth-test" options={{ headerShown: false }} />
        <Stack.Screen name="auth" options={{ headerShown: false }} />
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

      {initialRoute !== '/login' && initialRoute !== '/signup' && initialRoute !== '/onboarding' && initialRoute !== '/auth/confirmation' && <EmergencyCallButton />}
    </GestureHandlerRootView>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}