import { View } from 'react-native';
import { Tabs } from 'expo-router';
import CustomTabBar from '@/components/CustomTabBar';
import EmergencyCallButton from '@/components/EmergencyCallButton';
import { useStealthMode } from '@/components/StealthModeManager';

export default function TabLayout() {
  const { isActive: isStealthModeActive } = useStealthMode();
  
  return (
    <View style={{ flex: 1 }}>
      <Tabs
        screenOptions={{
          headerShown: false,
        }}
        tabBar={() => <CustomTabBar />}
      >
        <Tabs.Screen
          name="index"
          options={{
            href: "/",
          }}
        />
        <Tabs.Screen name="record" />
        <Tabs.Screen name="incidents" />
        <Tabs.Screen name="badges" />
        <Tabs.Screen name="legal-help" />
        <Tabs.Screen name="documents" />
        <Tabs.Screen name="settings" />
      </Tabs>
      {!isStealthModeActive && <EmergencyCallButton />}
    </View>
  );
}