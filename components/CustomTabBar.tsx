import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions, Platform } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { colors, shadows, radius } from '@/constants/theme';

const { width } = Dimensions.get('window');
const isNarrowScreen = width < 768;

// Export the tab bar height so other components can use it for padding
export const TAB_BAR_HEIGHT = isNarrowScreen ? 130 : 70; // Two-tier layout is taller

const tabs = [
  { name: '/', title: 'Home', icon: 'home' as const },
  { name: 'record', title: 'Record', icon: 'videocam' as const },
  { name: 'incidents', title: 'Incidents', icon: 'warning' as const },
  { name: 'badges', title: 'Badges', icon: 'emoji-events' as const },
  { name: 'legal-help', title: 'Legal Help', icon: 'gavel' as const },
  { name: 'documents', title: 'Documents', icon: 'description' as const },
  { name: 'settings', title: 'Settings', icon: 'settings' as const },
];

export default function CustomTabBar() {
  const router = useRouter();
  const pathname = usePathname();
  
  const getTabRoute = (tabName: string) => {
    return `/(tabs)/${tabName}`;
  };
  
  const isActive = (tabName: string) => {
    const route = getTabRoute(tabName);
    return pathname === route || pathname.startsWith(route + '/');
  };

  const navigateToTab = (tabName: string) => {
    // Navigate directly to the tab's root screen
    router.replace(getTabRoute(tabName) as any);
  };

  const renderIcon = (iconName: string, size: number, color: string) => {
    // Use Ionicons for videocam instead of camera
    if (iconName === 'videocam') {
      return <Ionicons name="videocam" size={size} color={color} />;
    }
    // Use type assertion to tell TypeScript this is a valid MaterialIcons name
    return <MaterialIcons name={iconName as any} size={size} color={color} />;
  };

  if (isNarrowScreen) {
    // Two-tier layout for narrow screens
    const firstRow = tabs.slice(0, 4);
    const secondRow = tabs.slice(4);
    
    return (
      <View style={styles.container}>
        <View style={styles.twoTierContainer}>
          <View style={styles.tabRow}>
            {firstRow.map(tab => (
              <TouchableOpacity
                key={tab.name}
                style={[styles.tabButton, isActive(tab.name) && styles.activeTabButton]}
                onPress={() => navigateToTab(tab.name)}>
                {renderIcon(
                  tab.icon,
                  24,
                  isActive(tab.name) ? colors.accent : colors.text.muted
                )}
                <Text 
                  style={[
                    styles.tabLabel, 
                    isActive(tab.name) && styles.activeTabLabel
                  ]}>
                  {tab.title}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.tabRow}>
            {secondRow.map(tab => (
              <TouchableOpacity
                key={tab.name}
                style={[styles.tabButton, isActive(tab.name) && styles.activeTabButton]}
                onPress={() => navigateToTab(tab.name)}>
                {renderIcon(
                  tab.icon,
                  24,
                  isActive(tab.name) ? colors.accent : colors.text.muted
                )}
                <Text 
                  style={[
                    styles.tabLabel, 
                    isActive(tab.name) && styles.activeTabLabel
                  ]}>
                  {tab.title}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    );
  }
  
  // Scrollable layout for wider screens
  return (
    <View style={styles.container}>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContainer}>
        {tabs.map(tab => (
          <TouchableOpacity
            key={tab.name}
            style={[styles.scrollableTabButton, isActive(tab.name) && styles.activeScrollableTabButton]}
            onPress={() => navigateToTab(tab.name)}>
            {renderIcon(
              tab.icon,
              28,
              isActive(tab.name) ? colors.accent : colors.text.muted
            )}
            <Text 
              style={[
                styles.scrollableTabLabel, 
                isActive(tab.name) && styles.activeTabLabel
              ]}>
              {tab.title}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.primary,
    borderTopWidth: 1,
    borderTopColor: colors.secondary,
    ...shadows.sm,
    height: Platform.OS === 'ios' ? 170 : 190,
  },
  twoTierContainer: {
    paddingVertical: 5,
  },
  tabRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 8,
  },
  tabButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.md,
  },
  activeTabButton: {
    backgroundColor: `${colors.accent}15`,
  },
  tabLabel: {
    color: colors.text.muted,
    fontSize: 12,
    marginTop: 4,
    fontWeight: '500',
    fontFamily: 'Inter-Medium',
  },
  activeTabLabel: {
    color: colors.accent,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  scrollContainer: {
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  scrollableTabButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginHorizontal: 5,
    borderRadius: radius.lg,
    minWidth: 90,
  },
  activeScrollableTabButton: {
    backgroundColor: `${colors.accent}15`,
  },
  scrollableTabLabel: {
    color: colors.text.muted,
    fontSize: 14,
    marginTop: 5,
    fontWeight: '500',
    fontFamily: 'Inter-Medium',
  },
});
