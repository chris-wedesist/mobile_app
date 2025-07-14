import { View, Text, StyleSheet, ScrollView, Pressable, Linking } from 'react-native';
import NoHandsIcon from '../../components/NoHandsIcon';
import { colors } from '@/constants/theme';
import { useEffect, useState } from 'react';
import { getNews, NewsItem } from '@/lib/news';
import { router } from 'expo-router';

export default function HomeScreen() {
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
        console.error("Cannot open URL: " + url);
      }
    } catch (error) {
      console.error("Error opening URL:", error);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.iconContainer}>
        <NoHandsIcon size={300} />
      </View>
      <View style={styles.content}>
        <Text style={styles.title}>Hands Off!</Text>
        <Text style={styles.subtitle}>Know your rights. Stay protected.</Text>
        <Text style={styles.description}>
          Document incidents, store important documents, and access critical resources to protect your rights and safety.
        </Text>
      </View>

      {/* Test Authentication Button */}
      <View style={styles.testSection}>
        <Pressable 
          style={styles.testButton}
          onPress={() => router.push('/auth/login')}
        >
          <Text style={styles.testButtonText}>Test Authentication</Text>
        </Pressable>
      </View>

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
          <Text style={styles.loadingText}>Loading news...</Text>
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
          <Text style={styles.loadingText}>No news available</Text>
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
  iconContainer: {
    flex: 1.2,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.secondary,
    paddingVertical: 40,
  },
  content: {
    padding: 30,
    backgroundColor: colors.primary,
  },
  title: {
    fontSize: 48,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 12,
    fontFamily: 'Inter-Bold',
  },
  subtitle: {
    fontSize: 26,
    color: colors.accent,
    marginBottom: 24,
    fontFamily: 'Inter-Medium',
  },
  description: {
    fontSize: 18,
    color: colors.text.secondary,
    lineHeight: 28,
    fontFamily: 'Inter-Regular',
  },
  newsSection: {
    padding: 20,
    backgroundColor: colors.primary,
  },
  newsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  newsTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text.primary,
    fontFamily: 'Inter-Bold',
  },
  viewAllButton: {
    backgroundColor: colors.accent,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  viewAllText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: 'bold',
    fontFamily: 'Inter-Bold',
  },
  newsCard: {
    backgroundColor: colors.secondary,
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
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
  loadingText: {
    textAlign: 'center',
    color: colors.text.secondary,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
  },
  testSection: {
    padding: 20,
    backgroundColor: colors.primary,
  },
  testButton: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  testButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
