import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
  Dimensions,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { colors, radius, shadows } from '../constants/theme';

const { width } = Dimensions.get('window');

type OnboardingSlide = {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
};

const slides: OnboardingSlide[] = [
  {
    id: '1',
    title: 'Welcome to DESIST!',
    description:
      'Your personal safety companion that helps you document, protect, and respond to incidents.',
    icon: (
      <Image
        source={require('../assets/images/splash.png')}
        style={{ height: 220, width: 220 }}
      />
    ),
  },
  {
    id: '2',
    title: 'Quick Emergency Response',
    description:
      'Access emergency features with one tap. Record incidents and alert trusted contacts instantly.',
    icon: <MaterialIcons name="emergency" size={100} color={colors.accent} />,
  },
  {
    id: '3',
    title: 'Stealth Mode Protection',
    description:
      'Quickly disguise the app as something innocent if you need privacy or are being observed.',
    icon: (
      <MaterialIcons name="visibility-off" size={100} color={colors.accent} />
    ),
  },
  {
    id: '4',
    title: 'Your Rights Matter',
    description:
      'Access legal resources and document incidents to protect your rights when it matters most.',
    icon: <MaterialIcons name="gavel" size={100} color={colors.accent} />,
  },
];

export default function Onboarding() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const [isCompleting, setIsCompleting] = useState(false);

  const renderItem = ({ item }: { item: OnboardingSlide }) => {
    return (
      <View style={styles.slide}>
        <View style={styles.iconContainer}>{item.icon}</View>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.description}>{item.description}</Text>
      </View>
    );
  };

  const handleNext = () => {
    if (currentIndex < slides.length - 1) {
      flatListRef.current?.scrollToIndex({
        index: currentIndex + 1,
        animated: true,
      });
    }
  };

  const handleSkip = async () => {
    try {
      setIsCompleting(true);
      await AsyncStorage.setItem('onboarding_completed', 'true');
      router.replace('/');
    } catch (error) {
      console.error('Error completing onboarding:', error);
      setIsCompleting(false);
    }
  };

  const handleComplete = async () => {
    try {
      console.log('Completing onboarding...');
      setIsCompleting(true);

      // Set onboarding as completed
      await AsyncStorage.setItem('onboarding_completed', 'true');
      console.log('Onboarding marked as completed');

      // Award founding protector badge
      await AsyncStorage.setItem('founding_protector_badge', 'awarded');
      console.log('Founding protector badge awarded');

      // Navigate directly to home screen instead of badge unlock
      console.log('Navigating to home screen');
      router.replace('/(tabs)');
    } catch (error) {
      console.error('Error completing onboarding:', error);
      setIsCompleting(false);

      // Fallback navigation in case of error
      router.replace('/(tabs)');
    }
  };

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index);
    }
  }).current;

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={slides}
        renderItem={renderItem}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.id}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={{ viewAreaCoveragePercentThreshold: 50 }}
      />

      <View style={styles.pagination}>
        {slides.map((_, index) => (
          <View
            key={index}
            style={[
              styles.paginationDot,
              index === currentIndex && styles.paginationDotActive,
            ]}
          />
        ))}
      </View>

      <View style={styles.buttonsContainer}>
        {currentIndex < slides.length - 1 ? (
          <>
            <TouchableOpacity
              style={styles.skipButton}
              onPress={handleSkip}
              disabled={isCompleting}
            >
              <Text style={styles.skipButtonText}>Skip</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
              <Text style={styles.nextButtonText}>Next</Text>
              <MaterialIcons
                name="arrow-forward"
                size={20}
                color={colors.text.primary}
              />
            </TouchableOpacity>
          </>
        ) : (
          <TouchableOpacity
            style={[
              styles.getStartedButton,
              isCompleting && styles.disabledButton,
            ]}
            onPress={handleComplete}
            disabled={isCompleting}
          >
            <Text style={styles.getStartedButtonText}>
              {isCompleting ? 'Getting Started...' : 'Get Started'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primary,
  },
  slide: {
    width,
    padding: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    width: 180,
    height: 180,
    borderRadius: radius.round,
    backgroundColor: colors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
    ...shadows.md,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: 20,
  },
  description: {
    fontSize: 16,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 40,
  },
  paginationDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.text.muted,
    marginHorizontal: 5,
  },
  paginationDotActive: {
    backgroundColor: colors.accent,
    width: 20,
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 40,
    paddingBottom: 40,
  },
  skipButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  skipButtonText: {
    color: colors.text.secondary,
    fontSize: 16,
    fontWeight: '500',
  },
  nextButton: {
    backgroundColor: colors.accent,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: radius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    ...shadows.sm,
  },
  nextButtonText: {
    color: colors.text.primary,
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
  },
  getStartedButton: {
    backgroundColor: colors.accent,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: radius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    ...shadows.md,
  },
  getStartedButtonText: {
    color: colors.text.primary,
    fontSize: 18,
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.7,
  },
});
