import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator, Linking } from 'react-native';
import { colors } from '@/constants/theme';
import { useEffect, useState } from 'react';
import { getNews, NewsItem, fetchNewsForTabs } from '@/lib/news';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';

type LayoutType = 'row' | 'box';
type NewsTab = 'local' | 'national';

const ITEMS_PER_PAGE = 10;

export default function BlogsScreen() {
  const [localNews, setLocalNews] = useState<NewsItem[]>([]);
  const [nationalNews, setNationalNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<NewsTab>('local');
  const [layout, setLayout] = useState<LayoutType>('row');
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | undefined>();

  const loadNews = async () => {
    try {
      setLoading(true);
      
      // Get user location for local news
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const location = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
          setUserLocation({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          });
        }
      } catch (error) {
        console.log('Location permission denied or error:', error);
      }

      // Fetch news for both tabs
      const newsData = await fetchNewsForTabs(userLocation);
      setLocalNews(newsData.local);
      setNationalNews(newsData.national);
    } catch (error) {
      console.error('Error loading news:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load initial news
  useEffect(() => {
    loadNews();
  }, []);

  // Reload news when user location changes
  useEffect(() => {
    if (userLocation) {
      loadNews();
    }
  }, [userLocation]);

  const toggleLayout = () => {
    setLayout(prev => prev === 'row' ? 'box' : 'row');
  };

  const handleNewsPress = async (url: string) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        console.error("Cannot open URL: " + url);
      }
    } catch (error) {
      console.error("Error opening URL:", error);
    }
  };

  const getCurrentNews = () => {
    return activeTab === 'local' ? localNews : nationalNews;
  };

  const renderNewsItem = (item: NewsItem) => (
    <Pressable 
      key={item.id} 
      style={[
        styles.newsCard,
        layout === 'box' && styles.newsCardBox
      ]}
      onPress={() => handleNewsPress(item.url)}
    >
      <View style={styles.newsContent}>
        <Text style={styles.newsItemTitle}>{item.title}</Text>
        <Text 
          style={[
            styles.newsItemDescription,
            layout === 'box' && styles.newsItemDescriptionBox
          ]}
          numberOfLines={layout === 'box' ? 3 : undefined}
        >
          {item.description}
        </Text>
        <View style={styles.newsMeta}>
          <Text style={styles.newsSource}>{item.source}</Text>
          <Text style={styles.newsDate}>
            {new Date(item.date).toLocaleDateString()}
          </Text>
        </View>
      </View>
    </Pressable>
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.title}>Latest News</Text>
          <Pressable onPress={toggleLayout} style={styles.layoutToggle}>
            <Ionicons 
              name={layout === 'row' ? 'grid-outline' : 'list-outline'} 
              size={24} 
              color={colors.text.primary} 
            />
          </Pressable>
        </View>
        <Text style={styles.subtitle}>Stay informed about your rights and community</Text>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <Pressable 
          style={[styles.tab, activeTab === 'local' && styles.activeTab]}
          onPress={() => setActiveTab('local')}
        >
          <Text style={[styles.tabText, activeTab === 'local' && styles.activeTabText]}>
            Local News
          </Text>
        </Pressable>
        <Pressable 
          style={[styles.tab, activeTab === 'national' && styles.activeTab]}
          onPress={() => setActiveTab('national')}
        >
          <Text style={[styles.tabText, activeTab === 'national' && styles.activeTabText]}>
            National News
          </Text>
        </Pressable>
      </View>

      {/* News Content */}
      <View style={layout === 'box' ? styles.boxContainer : undefined}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.accent} />
            <Text style={styles.loadingText}>Loading {activeTab} news...</Text>
          </View>
        ) : getCurrentNews().length > 0 ? (
          getCurrentNews().map(renderNewsItem)
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              No {activeTab} news available at the moment
            </Text>
            {activeTab === 'local' && !userLocation && (
              <Text style={styles.emptySubtext}>
                Enable location access to see local news
              </Text>
            )}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primary,
  },
  header: {
    paddingTop: 40,
    paddingBottom: 20,
    paddingHorizontal: 20,
    backgroundColor: colors.secondary,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.text.primary,
    fontFamily: 'Inter-Bold',
  },
  subtitle: {
    fontSize: 16,
    color: colors.text.secondary,
    fontFamily: 'Inter-Regular',
  },
  layoutToggle: {
    padding: 8,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: colors.secondary,
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginHorizontal: 4,
    borderRadius: 8,
    backgroundColor: colors.primary,
  },
  activeTab: {
    backgroundColor: colors.accent,
  },
  tabText: {
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.secondary,
    fontFamily: 'Inter-Medium',
  },
  activeTabText: {
    color: colors.primary,
    fontFamily: 'Inter-Bold',
  },
  boxContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 8,
  },
  newsCard: {
    backgroundColor: colors.secondary,
    borderRadius: 12,
    margin: 16,
    marginTop: 8,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  newsCardBox: {
    width: '45%',
    margin: 8,
  },
  newsContent: {
    padding: 16,
  },
  newsItemTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 8,
    fontFamily: 'Inter-Bold',
  },
  newsItemDescription: {
    fontSize: 14,
    color: colors.text.secondary,
    marginBottom: 12,
    fontFamily: 'Inter-Regular',
    lineHeight: 20,
  },
  newsItemDescriptionBox: {
    fontSize: 12,
    lineHeight: 18,
  },
  newsMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  newsSource: {
    fontSize: 12,
    color: colors.accent,
    fontFamily: 'Inter-Medium',
  },
  newsDate: {
    fontSize: 12,
    color: colors.text.secondary,
    fontFamily: 'Inter-Regular',
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: colors.text.secondary,
    fontFamily: 'Inter-Regular',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    color: colors.text.secondary,
    textAlign: 'center',
    fontFamily: 'Inter-Medium',
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.text.muted,
    textAlign: 'center',
    marginTop: 8,
    fontFamily: 'Inter-Regular',
  },
});