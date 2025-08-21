import { Stack } from 'expo-router';

export default function SecurityLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        gestureEnabled: false,
      }}
    >
      <Stack.Screen
        name="biometric-setup"
        options={{
          title: 'Biometric Setup',
          headerShown: true,
          headerStyle: {
            backgroundColor: '#FFFFFF',
          },
          headerTitleStyle: {
            color: '#333333',
            fontSize: 18,
            fontWeight: '600',
          },
        }}
      />
      <Stack.Screen
        name="emergency-setup"
        options={{
          title: 'Emergency Setup',
          headerShown: true,
          headerStyle: {
            backgroundColor: '#FFFFFF',
          },
          headerTitleStyle: {
            color: '#333333',
            fontSize: 18,
            fontWeight: '600',
          },
        }}
      />
      <Stack.Screen
        name="security-test"
        options={{
          title: 'Security Test',
          headerShown: true,
          headerStyle: {
            backgroundColor: '#FFFFFF',
          },
          headerTitleStyle: {
            color: '#333333',
            fontSize: 18,
            fontWeight: '600',
          },
        }}
      />
    </Stack>
  );
}
