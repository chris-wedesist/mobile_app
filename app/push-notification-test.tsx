import React from 'react';
import { View, StyleSheet } from 'react-native';
import PushNotificationTest from '@/components/PushNotificationTest';

export default function PushNotificationTestScreen() {
  return (
    <View style={styles.container}>
      <PushNotificationTest />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1B2D45',
  },
});
