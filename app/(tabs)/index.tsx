import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Linking,
} from 'react-native';
import NoHandsIcon from '../../components/NoHandsIcon';
import AppHeader from '../../components/AppHeader';
import { colors } from '@/constants/theme';
import { useEffect, useState } from 'react';
import { getNews, NewsItem } from '@/lib/news';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';

export default function HomeScreen() {
  const { userProfile } = useAuth();
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNews();
  }, []);

  const loadNews = async () => {
    try {
      console.log('Loading news...');
      setLoading(true);
      const newsItems = await getNews(1, 3); // Only fetch 3 items for preview
      console.log('Loaded news items:', newsItems);
      setNews(newsItems);
    } catch (error) {
      console.error('Error loading news:', error);
      setNews([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const handleNewsPress = async (url: string) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        console.error('Cannot open URL: ' + url);
      }
    } catch (error) {
      console.error('Error opening URL:', error);
    }
  };

  return (
    <View style={styles.container}>
      <AppHeader />
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <View style={styles.iconContainer}>
            <NoHandsIcon size={250} />
          </View>
          <View style={styles.heroContent}>
            <Text style={styles.title}>Hands Off!</Text>
            <View style={styles.subtitlePill}>
              <Text style={styles.subtitleText}>
                Know your rights. Stay protected
              </Text>
            </View>
            <Text style={styles.description}>
              Document incidents, store important documents, and access critical
              resources to protect your rights and safety.
            </Text>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActionsSection}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActionsGrid}>
            <Pressable
              style={styles.quickActionCard}
              onPress={() => router.push('/report-incident')}
            >
              <View>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    width: '100%',
                    justifyContent: 'space-between',
                    gap: 4,
                  }}
                >
                  <Text style={styles.quickActionTitle}>Report Incident</Text>
                  <View style={styles.quickActionIcon}>
                    <Text style={styles.quickActionEmoji}>📝</Text>
                  </View>
                </View>
                <Text style={styles.quickActionSubtitle}>
                  Document encounters
                </Text>
              </View>
            </Pressable>

            <Pressable
              style={styles.quickActionCard}
              onPress={() => router.push('/(tabs)/legal-help')}
            >
              <View>
                <View
                  style={{
                    flexDirection: 'row',
                    width: '100%',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 4,
                  }}
                >
                  <Text style={styles.quickActionTitle}>Legal Help</Text>
                  <View style={styles.quickActionIcon}>
                    <Text style={styles.quickActionEmoji}>⚖️</Text>
                  </View>
                </View>
                <Text style={styles.quickActionSubtitle}>Know your rights</Text>
              </View>
            </Pressable>
          </View>
        </View>

        {/* News Section */}
        <View style={styles.newsSection}>
          <View style={styles.newsHeader}>
            <Text style={styles.newsTitle}>Latest Updates</Text>
            <Pressable
              style={styles.viewAllButton}
              onPress={() => router.push('/blogs')}
            >
              <Text style={styles.viewAllText}>View All</Text>
            </Pressable>
          </View>
          {loading ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Loading news...</Text>
            </View>
          ) : news.length > 0 ? (
            news.map((item) => (
              <Pressable
                key={item.id}
                style={styles.newsCard}
                onPress={() => handleNewsPress(item.url)}
              >
                <View style={styles.newsContent}>
                  <Text style={styles.newsItemTitle}>{item.title}</Text>
                  <Text style={styles.newsItemDescription} numberOfLines={2}>
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
            ))
          ) : (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>No news available</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primary,
  },
  scrollView: {
    flex: 1,
  },

  // Hero Section
  heroSection: {
    backgroundColor: colors.secondary,
    paddingBottom: 32,
    marginBottom: 24,
  },
  iconContainer: {
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 12,
  },
  heroContent: {
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 42,
    fontWeight: '800',
    color: colors.text.primary,
    marginBottom: 16,
    fontFamily: 'Inter-ExtraBold',
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  subtitlePill: {
    backgroundColor: colors.accent,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
    marginBottom: 16,
    elevation: 3,
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    borderWidth: 2,
    borderColor: `${colors.text.primary}20`,
  },
  subtitleText: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: '700',
    fontFamily: 'Inter-Bold',
    textAlign: 'center',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  description: {
    fontSize: 15,
    color: colors.text.secondary,
    lineHeight: 20,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
    maxWidth: 300,
  },

  // Quick Actions Section
  quickActionsSection: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 12,
    fontFamily: 'Inter-Bold',
  },
  quickActionsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  quickActionCard: {
    flex: 1,
    backgroundColor: colors.secondary,
    borderRadius: 16,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: `${colors.text.muted}15`,
  },
  quickActionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${colors.accent}15`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickActionEmoji: {
    fontSize: 18,
  },
  quickActionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
    fontFamily: 'Inter-SemiBold',
  },
  quickActionSubtitle: {
    fontSize: 13,
    color: colors.text.muted,
    fontFamily: 'Inter-Regular',
  },

  // News Section
  newsSection: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  newsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  newsTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text.primary,
    fontFamily: 'Inter-Bold',
  },
  viewAllButton: {
    backgroundColor: colors.accent,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    elevation: 1,
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  viewAllText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    letterSpacing: 0.3,
  },
  newsCard: {
    backgroundColor: colors.secondary,
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: `${colors.text.muted}15`,
  },
  newsContent: {
    padding: 20,
  },
  newsItemTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 8,
    fontFamily: 'Inter-SemiBold',
    lineHeight: 24,
    letterSpacing: -0.2,
  },
  newsItemDescription: {
    fontSize: 14,
    color: colors.text.secondary,
    marginBottom: 12,
    fontFamily: 'Inter-Regular',
    lineHeight: 20,
    opacity: 0.9,
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
    fontWeight: '500',
    letterSpacing: 0.2,
  },
  newsDate: {
    fontSize: 12,
    color: colors.text.muted,
    fontFamily: 'Inter-Regular',
    opacity: 0.8,
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  loadingText: {
    textAlign: 'center',
    color: colors.text.muted,
    fontSize: 15,
    fontFamily: 'Inter-Regular',
    opacity: 0.8,
  },
});
