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
              <MaterialIcons name="insert-drive-file" size={24} color="#444" />
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
                <MaterialIcons name="search" size={20} color="#666" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.toolbarButton}
                onPress={() => handleZoom('out')}
              >
                <MaterialIcons name="zoom-out" size={20} color="#666" />
              </TouchableOpacity>
              <Text style={styles.zoomText}>
                {Math.round(zoomLevel * 100)}%
              </Text>
              <TouchableOpacity
                style={styles.toolbarButton}
                onPress={() => handleZoom('in')}
              >
                <MaterialIcons name="zoom-in" size={20} color="#666" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.toolbarButton}>
                <MaterialIcons name="file-download" size={20} color="#666" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.toolbarButton}>
                <MaterialIcons name="share" size={20} color="#666" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.toolbarButton}>
                <MaterialIcons name="print" size={20} color="#666" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.toolbarButton}>
                <MaterialIcons name="more-vert" size={20} color="#666" />
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
    backgroundColor: '#F5F5F5',
  },
  toolbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  toolbarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  documentInfo: {
    marginLeft: 8,
  },
  documentTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  documentMeta: {
    fontSize: 12,
    color: '#666',
  },
  toolbarActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  toolbarButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#F5F5F5',
  },
  zoomText: {
    fontSize: 14,
    color: '#666',
    marginHorizontal: 8,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  page: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 40,
    marginBottom: 20,
    ...Platform.select({
      web: {
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
      },
    }),
  },
  pageContent: {
    maxWidth: 800,
    marginHorizontal: 'auto',
  },
  pageHeader: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  pageSubheader: {
    fontSize: 18,
    color: '#666',
    marginBottom: 32,
    textAlign: 'center',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  paragraph: {
    fontSize: 14,
    lineHeight: 24,
    color: '#444',
    marginBottom: 16,
  },
  bulletPoints: {
    marginLeft: 8,
  },
  bullet: {
    fontSize: 14,
    lineHeight: 24,
    color: '#444',
    marginBottom: 8,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  pageCount: {
    fontSize: 14,
    color: '#666',
  },
});
