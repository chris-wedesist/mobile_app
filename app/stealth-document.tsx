import { MaterialIcons } from '@expo/vector-icons';
import { useState } from 'react';
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  GestureHandlerRootView,
  LongPressGestureHandler,
} from 'react-native-gesture-handler';
import { useStealthMode } from '../components/StealthModeManager';
import { useStealthAutoTimeout } from '../hooks/useStealthAutoTimeout';
import {
  colors,
  radius,
  shadows,
  spacing,
  typography,
} from '../constants/theme';

export default function StealthDocumentScreen() {
  const { deactivate } = useStealthMode();
  const [zoomLevel, setZoomLevel] = useState(1);

  // Use the auto timeout hook - exit stealth mode after 10 minutes of inactivity
  useStealthAutoTimeout(10);

  const handleLongPress = () => {
    deactivate('gesture');
  };

  const handleZoom = (direction: 'in' | 'out') => {
    setZoomLevel((prev) => {
      if (direction === 'in' && prev < 2) return prev + 0.1;
      if (direction === 'out' && prev > 0.5) return prev - 0.1;
      return prev;
    });
  };

  return (
    <GestureHandlerRootView style={styles.container}>
      <LongPressGestureHandler
        minDurationMs={3000}
        onHandlerStateChange={({ nativeEvent }) => {
          if (nativeEvent.state === 4) {
            // 4 = ACTIVE (long press triggered)
            handleLongPress();
          }
        }}
      >
        <View style={styles.container}>
          {/* Toolbar */}
          <View style={styles.toolbar}>
            <View style={styles.toolbarLeft}>
              <MaterialIcons
                name="insert-drive-file"
                size={24}
                color={colors.text.secondary}
              />
              <View style={styles.documentInfo}>
                <Text style={styles.documentTitle}>
                  Q4 Financial Report.pdf
                </Text>
                <Text style={styles.documentMeta}>
                  Last opened {new Date().toLocaleDateString()}
                </Text>
              </View>
            </View>

            <View style={styles.toolbarActions}>
              <TouchableOpacity style={styles.toolbarButton}>
                <MaterialIcons
                  name="search"
                  size={20}
                  color={colors.text.muted}
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.toolbarButton}
                onPress={() => handleZoom('out')}
              >
                <MaterialIcons
                  name="zoom-out"
                  size={20}
                  color={colors.text.muted}
                />
              </TouchableOpacity>
              <Text style={styles.zoomText}>
                {Math.round(zoomLevel * 100)}%
              </Text>
              <TouchableOpacity
                style={styles.toolbarButton}
                onPress={() => handleZoom('in')}
              >
                <MaterialIcons
                  name="zoom-in"
                  size={20}
                  color={colors.text.muted}
                />
              </TouchableOpacity>
              <TouchableOpacity style={styles.toolbarButton}>
                <MaterialIcons
                  name="file-download"
                  size={20}
                  color={colors.text.muted}
                />
              </TouchableOpacity>
              <TouchableOpacity style={styles.toolbarButton}>
                <MaterialIcons
                  name="share"
                  size={20}
                  color={colors.text.muted}
                />
              </TouchableOpacity>
              <TouchableOpacity style={styles.toolbarButton}>
                <MaterialIcons
                  name="print"
                  size={20}
                  color={colors.text.muted}
                />
              </TouchableOpacity>
              <TouchableOpacity style={styles.toolbarButton}>
                <MaterialIcons
                  name="more-vert"
                  size={20}
                  color={colors.text.muted}
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Document Content */}
          <ScrollView style={styles.content}>
            <View style={[styles.page, { transform: [{ scale: zoomLevel }] }]}>
              <View style={styles.pageContent}>
                <Text style={styles.pageHeader}>Q4 Financial Report</Text>
                <Text style={styles.pageSubheader}>Fiscal Year 2024</Text>

                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Executive Summary</Text>
                  <Text style={styles.paragraph}>
                    The fourth quarter of fiscal year 2024 demonstrated strong
                    performance across key metrics, with revenue growth
                    exceeding projections by 15%. Operating margins improved by
                    2.3 percentage points year-over-year, driven by operational
                    efficiencies and strategic cost management initiatives.
                  </Text>
                </View>

                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Financial Highlights</Text>
                  <View style={styles.bulletPoints}>
                    <Text style={styles.bullet}>
                      • Revenue: $142.8M (+18% YoY)
                    </Text>
                    <Text style={styles.bullet}>
                      • Operating Income: $38.4M (+24% YoY)
                    </Text>
                    <Text style={styles.bullet}>
                      • Net Profit Margin: 22.4% (+2.1pts)
                    </Text>
                    <Text style={styles.bullet}>
                      • Free Cash Flow: $45.2M (+31% YoY)
                    </Text>
                  </View>
                </View>

                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>
                    Key Performance Indicators
                  </Text>
                  <Text style={styles.paragraph}>
                    Customer acquisition costs decreased by 12% while customer
                    lifetime value increased by 18%, indicating improving
                    operational efficiency and market positioning. Our expansion
                    into new markets has exceeded initial projections, with
                    international revenue now accounting for 34% of total
                    revenue.
                  </Text>
                </View>
              </View>
            </View>
          </ScrollView>

          {/* Page Navigation */}
          <View style={styles.footer}>
            <Text style={styles.pageCount}>Page 1 of 12</Text>
          </View>
        </View>
      </LongPressGestureHandler>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  toolbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  toolbarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  documentInfo: {
    marginLeft: spacing.xs,
  },
  documentTitle: {
    fontSize: typography.fontSize.body,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  documentMeta: {
    fontSize: typography.fontSize.caption,
    color: colors.text.muted,
  },
  toolbarActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  toolbarButton: {
    padding: spacing.xs,
    borderRadius: 6,
    backgroundColor: colors.surface,
  },
  zoomText: {
    fontSize: typography.fontSize.small,
    color: colors.text.muted,
    marginHorizontal: spacing.xs,
  },
  content: {
    flex: 1,
    padding: spacing.lg,
  },
  page: {
    backgroundColor: colors.background,
    borderRadius: radius.small,
    padding: spacing.xxl,
    marginBottom: spacing.lg,
    ...Platform.select({
      web: {
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      },
      default: {
        ...shadows.small,
      },
    }),
  },
  pageContent: {
    maxWidth: 800,
    marginHorizontal: 'auto',
  },
  pageHeader: {
    fontSize: typography.fontSize.title,
    fontWeight: 'bold',
    color: colors.text.secondary,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  pageSubheader: {
    fontSize: typography.fontSize.subheading,
    color: colors.text.muted,
    marginBottom: spacing.xxl,
    textAlign: 'center',
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: typography.fontSize.subheading,
    fontWeight: '600',
    color: colors.text.secondary,
    marginBottom: spacing.sm,
  },
  paragraph: {
    fontSize: typography.fontSize.small,
    lineHeight: 24,
    color: colors.text.secondary,
    marginBottom: spacing.md,
  },
  bulletPoints: {
    marginLeft: spacing.xs,
  },
  bullet: {
    fontSize: typography.fontSize.small,
    lineHeight: 24,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  footer: {
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
    alignItems: 'center',
  },
  pageCount: {
    fontSize: typography.fontSize.small,
    color: colors.text.muted,
  },
});
