import React, { useEffect } from 'react';
import { View, StyleSheet, Image, ActivityIndicator, Text } from 'react-native';
import { colors } from '@/constants/theme';

export default function SplashScreen() {
  useEffect(() => {
    console.log('SplashScreen mounted');
    return () => console.log('SplashScreen unmounted');
  }, []);

  return (
    <View style={styles.container}>
      <Image 
        source={require('@/assets/images/splash.png')} 
        style={styles.logo} 
        resizeMode="contain"
      />
      <Text style={styles.loadingText}>Loading DESIST...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 200,
    height: 200,
  },
  loader: {
    marginTop: 20,
  },
  loadingText: {
    marginTop: 10,
    color: colors.text.secondary,
    fontSize: 16,
  }
});
