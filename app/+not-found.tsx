import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors } from '../constants/theme';

export default function NotFoundScreen() {
  return (
    <View style={styles.container}>
      <MaterialIcons
        name="error-outline"
        size={80}
        color={colors.status.error}
      />
      <Text style={styles.title}>Oops!</Text>
      <Text style={styles.message}>
        We couldn't find the page you're looking for.
      </Text>
      <TouchableOpacity
        style={styles.button}
        onPress={() => {
          console.log('Navigating to home from not found screen');
          router.replace('/(tabs)' as any);
        }}
      >
        <Text style={styles.buttonText}>Go to Home</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginTop: 20,
    marginBottom: 10,
  },
  message: {
    fontSize: 16,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: 30,
  },
  button: {
    backgroundColor: colors.accent,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  buttonText: {
    color: colors.text.primary,
    fontSize: 16,
    fontWeight: '600',
  },
});
