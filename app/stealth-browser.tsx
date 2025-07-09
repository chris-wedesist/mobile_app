import { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Platform, Image } from 'react-native';
import { GestureHandlerRootView, LongPressGestureHandler } from 'react-native-gesture-handler';
import { useStealthMode } from '@/components/StealthModeManager';
import { useStealthAutoTimeout } from '@/hooks/useStealthAutoTimeout';
import { colors, shadows, radius } from '@/constants/theme';
import { MaterialIcons } from '@expo/vector-icons';

export default function StealthBrowserScreen() {
  const { deactivate } = useStealthMode();
  const [url, setUrl] = useState('https://example.com');
  const [isLoading, setIsLoading] = useState(false);
  const [isSecure, setIsSecure] = useState(true);
  
  // Use the auto timeout hook - exit stealth mode after 10 minutes of inactivity
  useStealthAutoTimeout(10);

  const handleLongPress = () => {
    deactivate('gesture');
  };

  const handleRefresh = () => {
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 1000);
  };

  return (
    <GestureHandlerRootView style={styles.container}>
      <LongPressGestureHandler
        minDurationMs={3000}
        onHandlerStateChange={({ nativeEvent }) => {
          if (nativeEvent.state === 4) { // 4 = ACTIVE (long press triggered)
            handleLongPress();
          }
        }}
      >
        <View style={styles.container}>
          {/* Browser Toolbar */}
          <View style={styles.toolbar}>
            <View style={styles.navigationButtons}>
              <TouchableOpacity style={styles.navButton}>
                <MaterialIcons name="chevron-left" size={20} color={colors.text.muted} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.navButton}>
                <MaterialIcons name="chevron-right" size={20} color={colors.text.muted} />
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.navButton, isLoading && styles.activeButton]}
                onPress={handleRefresh}>
                <MaterialIcons name="refresh" size={20} color={isLoading ? colors.accent : colors.text.muted} />
              </TouchableOpacity>
            </View>

            <View style={styles.addressBar}>
              {isSecure && (
                <MaterialIcons name="lock-outline" size={16} color={colors.status.success} style={styles.lockIcon} />
              )}
              <TextInput
                style={styles.urlInput}
                value={url}
                onChangeText={setUrl}
                selectTextOnFocus
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity style={styles.starButton}>
                <MaterialIcons name="star" size={16} color={colors.text.muted} />
              </TouchableOpacity>
            </View>

            <View style={styles.toolbarActions}>
              <TouchableOpacity style={styles.actionButton}>
                <MaterialIcons name="share" size={20} color={colors.text.muted} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton}>
                <MaterialIcons name="menu" size={20} color={colors.text.muted} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Browser Content */}
          <ScrollView style={styles.content}>
            <View style={styles.page}>
              <View style={styles.header}>
                <Image
                  source={{ uri: 'https://images.pexels.com/photos/3184465/pexels-photo-3184465.jpeg' }}
                  style={styles.headerImage}
                />
                <View style={styles.overlay} />
                <Text style={styles.headerTitle}>Welcome to Example</Text>
                <Text style={styles.headerSubtitle}>Your trusted source for information</Text>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Latest Updates</Text>
                <View style={styles.cardGrid}>
                  {[1, 2, 3, 4].map((i) => (
                    <View key={i} style={styles.card}>
                      <Image
                        source={{ uri: `https://images.pexels.com/photos/${3184465 + i}/pexels-photo-${3184465 + i}.jpeg` }}
                        style={styles.cardImage}
                      />
                      <View style={styles.cardContent}>
                        <Text style={styles.cardTitle}>Article Title {i}</Text>
                        <Text style={styles.cardDescription}>
                          Lorem ipsum dolor sit amet, consectetur adipiscing elit. 
                          Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
                        </Text>
                        <Text style={styles.cardMeta}>5 min read • Today</Text>
                      </View>
                    </View>
                  ))}
                </View>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Featured Content</Text>
                <View style={styles.featuredContent}>
                  <Text style={styles.paragraph}>
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do 
                    eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut 
                    enim ad minim veniam, quis nostrud exercitation ullamco laboris 
                    nisi ut aliquip ex ea commodo consequat.
                  </Text>
                  <Text style={styles.paragraph}>
                    Duis aute irure dolor in reprehenderit in voluptate velit esse 
                    cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat 
                    cupidatat non proident, sunt in culpa qui officia deserunt mollit 
                    anim id est laborum.
                  </Text>
                </View>
              </View>

              <View style={styles.footer}>
                <Text style={styles.footerText}>© 2024 Example.com. All rights reserved.</Text>
              </View>
            </View>
          </ScrollView>
        </View>
      </LongPressGestureHandler>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primary,
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: colors.secondary,
    borderBottomWidth: 1,
    borderBottomColor: `${colors.text.muted}20`,
    gap: 10,
  },
  navigationButtons: {
    flexDirection: 'row',
    gap: 5,
  },
  navButton: {
    padding: 8,
    borderRadius: radius.round,
    backgroundColor: colors.primary,
  },
  activeButton: {
    backgroundColor: `${colors.accent}20`,
  },
  addressBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    paddingHorizontal: 12,
    height: 36,
  },
  lockIcon: {
    marginRight: 8,
  },
  urlInput: {
    flex: 1,
    color: colors.text.primary,
    fontSize: 14,
  },
  starButton: {
    padding: 8,
  },
  toolbarActions: {
    flexDirection: 'row',
    gap: 5,
  },
  actionButton: {
    padding: 8,
    borderRadius: radius.round,
    backgroundColor: colors.primary,
  },
  content: {
    flex: 1,
  },
  page: {
    flex: 1,
    backgroundColor: colors.primary,
  },
  header: {
    height: 300,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  headerImage: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: `${colors.primary}80`,
  },
  headerTitle: {
    fontSize: 36,
    fontWeight: 'bold',
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: 10,
  },
  headerSubtitle: {
    fontSize: 18,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  section: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: `${colors.text.muted}20`,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 20,
  },
  cardGrid: {
    flexDirection: Platform.OS === 'web' ? 'row' : 'column',
    flexWrap: 'wrap',
    gap: 20,
  },
  card: {
    width: Platform.OS === 'web' ? 'calc(50% - 10px)' : '100%',
    backgroundColor: colors.secondary,
    borderRadius: radius.lg,
    overflow: 'hidden',
    ...shadows.sm,
  },
  cardImage: {
    width: '100%',
    height: 200,
  },
  cardContent: {
    padding: 15,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 8,
  },
  cardDescription: {
    fontSize: 14,
    color: colors.text.secondary,
    marginBottom: 12,
    lineHeight: 20,
  },
  cardMeta: {
    fontSize: 12,
    color: colors.text.muted,
  },
  featuredContent: {
    backgroundColor: colors.secondary,
    borderRadius: radius.lg,
    padding: 20,
    ...shadows.sm,
  },
  paragraph: {
    fontSize: 16,
    color: colors.text.secondary,
    marginBottom: 15,
    lineHeight: 24,
  },
  footer: {
    padding: 20,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: colors.text.muted,
  },
});