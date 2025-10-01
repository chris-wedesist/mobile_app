import { View } from 'react-native';
import { Tabs } from 'expo-router';
import CustomTabBar from '@/components/CustomTabBar';

export default function TabLayout() {
  return (
    <View style={{ flex: 1 }}>
      <Tabs
        screenOptions={{
          headerShown: false,
        }}
        tabBar={() => <CustomTabBar />}
      >
        <Tabs.Screen name="record" />
        <Tabs.Screen name="incidents" />
        <Tabs.Screen name="badges" />
        <Tabs.Screen name="legal-help" />
        <Tabs.Screen name="documents" />
      </Tabs>
    </View>
  );
}