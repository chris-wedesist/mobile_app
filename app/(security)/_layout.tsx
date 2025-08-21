import { Stack } from 'expo-router';
import { colors, typography } from '../../constants/theme';

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
            backgroundColor: colors.surface,
          },
          headerTitleStyle: {
            color: colors.text.primary,
            fontSize: typography.fontSize.subheading,
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
            backgroundColor: colors.surface,
          },
          headerTitleStyle: {
            color: colors.text.primary,
            fontSize: typography.fontSize.subheading,
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
            backgroundColor: colors.surface,
          },
          headerTitleStyle: {
            color: colors.text.primary,
            fontSize: typography.fontSize.subheading,
            fontWeight: '600',
          },
        }}
      />
    </Stack>
  );
}
