import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { colors } from '../../constants/theme';

export default function StealthLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarStyle: {
          backgroundColor: '#f8f9fa',
          borderTopColor: '#e9ecef',
          borderTopWidth: 1,
        },
        headerStyle: {
          backgroundColor: '#f8f9fa',
          borderBottomColor: '#e9ecef',
          borderBottomWidth: 1,
        },
        headerTintColor: '#495057',
        tabBarActiveTintColor: '#007bff',
        tabBarInactiveTintColor: '#6c757d',
        headerShown: true,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Calculator',
          headerTitle: 'Calculator',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="calculator" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="notes"
        options={{
          title: 'Notes',
          headerTitle: 'Notes',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="document-text" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          headerTitle: 'Settings',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="settings" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
