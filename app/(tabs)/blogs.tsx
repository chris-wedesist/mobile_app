import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator, Linking, Image } from 'react-native';
import { colors } from '@/constants/theme';
import { useEffect, useState } from 'react';
import { getNews, NewsItem } from '@/lib/news';
import { Ionicons } from '@expo/vector-icons';

type LayoutType = 'row' | 'box';

const ITEMS_PER_PAGE = 10;

export default function BlogsScreen() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [layout, setLayout] = useState<LayoutType>('row');

  const loadNews = async () => {
    try {
      setLoading(true);
      const newsItems = await getNews(page, ITEMS_PER_PAGE);
      if (newsItems.length === 0) {
        setHasMore(false);
      } else {
        if (page === 1) {
          setNews(newsItems);
        } else {
          setNews(prev => [...prev, ...newsItems]);
        }
        setHasMore(newsItems.length === ITEMS_PER_PAGE);
      }
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

  // Load more news when page changes
  useEffect(() => {
    if (page > 1) {
      loadNews();
    }
  }, [page]);

  const loadMore = () => {
    if (!loading && hasMore) {
      setPage(prev => prev + 1);
    }
  };

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

      <View style={layout === 'box' ? styles.boxContainer : undefined}>
        {news.map((item) => (
          <Pressable 
            key={item.id} 
            style={[
              styles.newsCard,
              layout === 'box' && styles.newsCardBox
            ]}
            onPress={() => handleNewsPress(item.url)}
          >
            <View style={styles.newsContent}>
              {item.imageUrl && <Image source={{ uri: item.imageUrl }} style={styles.newsItemImage} />}
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
        ))}
      </View>

      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      )}

      {!loading && hasMore && (
        <Pressable 
          style={styles.loadMoreButton}
          onPress={loadMore}
        >
          <Text style={styles.loadMoreText}>Load More</Text>
        </Pressable>
      )}

      {!hasMore && !loading && (
        <Text style={styles.noMoreText}>No more news to load</Text>
      )}
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
  newsItemImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginBottom: 12,
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
  loadMoreButton: {
    backgroundColor: colors.accent,
    padding: 16,
    margin: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  loadMoreText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'Inter-Bold',
  },
  noMoreText: {
    textAlign: 'center',
    color: colors.text.secondary,
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    padding: 20,
  },
}); 