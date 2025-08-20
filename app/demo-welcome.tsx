import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import {
  Image,
  ImageStyle,
  Platform,
  StyleSheet,
  Text,
  TextStyle,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import { colors, radius, shadows } from '../constants/theme';

export default function DemoWelcomeScreen() {
  return (
    <View style={styles.container as ViewStyle}>
      <View style={styles.header as ViewStyle}>
        <TouchableOpacity
          style={styles.backButton as ViewStyle}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText as TextStyle}>Skip Demo</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content as ViewStyle}>
        <View style={styles.imageContainer as ViewStyle}>
          <Image
            source={{
              uri: 'https://images.pexels.com/photos/3184465/pexels-photo-3184465.jpeg',
            }}
            style={styles.image as ImageStyle}
            resizeMode="cover"
          />
          <View style={styles.overlay as ViewStyle} />
          <View style={styles.iconContainer as ViewStyle}>
            <MaterialIcons name="shield" size={64} color={colors.accent} />
          </View>
        </View>

        <View style={styles.textContent as ViewStyle}>
          <Text style={styles.title as TextStyle}>Welcome to DESIST!</Text>
          <Text style={styles.subtitle as TextStyle}>
            Your Digital Safety Companion
          </Text>

          <View style={styles.featureList as ViewStyle}>
            <View style={styles.featureItem as ViewStyle}>
              <View style={styles.featureDot as ViewStyle} />
              <Text style={styles.featureText as TextStyle}>
                Quick emergency recording and alerts
              </Text>
            </View>
            <View style={styles.featureItem as ViewStyle}>
              <View style={styles.featureDot as ViewStyle} />
              <Text style={styles.featureText as TextStyle}>
                Instant stealth mode activation
              </Text>
            </View>
            <View style={styles.featureItem as ViewStyle}>
              <View style={styles.featureDot as ViewStyle} />
              <Text style={styles.featureText as TextStyle}>
                Secure evidence preservation
              </Text>
            </View>
          </View>

          <Text style={styles.description as TextStyle}>
            Let's walk through a guided demo to ensure you're ready to use
            DESIST! when it matters most. We'll test all emergency features in a
            safe environment.
          </Text>
        </View>

        <TouchableOpacity
          style={styles.startButton as ViewStyle}
          onPress={() => router.push('/test-panic-flow')}
        >
          <Text style={styles.startButtonText as TextStyle}>
            Start Mission Demo
          </Text>
          <MaterialIcons
            name="chevron-right"
            size={24}
            color={colors.text.primary}
          />
        </TouchableOpacity>

        <Text style={styles.disclaimer as TextStyle}>
          Don't worry - no real alerts will be sent during the demo
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primary,
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  backButton: {
    alignSelf: 'flex-start',
  },
  backButtonText: {
    color: colors.text.muted,
    fontSize: 16,
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    padding: 20,
  },
  imageContainer: {
    width: '100%',
    height: 240,
    borderRadius: radius.lg,
    overflow: 'hidden',
    marginBottom: 30,
    position: 'relative',
    ...shadows.md,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: `${colors.primary}99`,
  },
  iconContainer: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -32 }, { translateY: -32 }],
    width: 64,
    height: 64,
  },
  textContent: {
    flex: 1,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: colors.accent,
    marginBottom: 30,
  },
  featureList: {
    marginBottom: 30,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  featureDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.accent,
    marginRight: 12,
  },
  featureText: {
    color: colors.text.primary,
    fontSize: 16,
  },
  description: {
    color: colors.text.secondary,
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 30,
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accent,
    padding: 20,
    borderRadius: radius.lg,
    marginBottom: 20,
    ...shadows.md,
  },
  startButtonText: {
    color: colors.text.primary,
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 8,
  },
  disclaimer: {
    color: colors.text.muted,
    fontSize: 14,
    textAlign: 'center',
  },
});
