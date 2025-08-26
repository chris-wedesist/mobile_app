import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { colors, shadows, spacing } from '../../constants/theme';
import { getNews, NewsItem } from '../../lib/news';

type LayoutType = 'row' | 'box';

const ITEMS_PER_PAGE = 10;

export default function BlogsScreen() {
  const { category } = useLocalSearchParams<{ category?: string }>();
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [layout, setLayout] = useState<LayoutType>('row');
  const [selectedCategory, setSelectedCategory] = useState<
    'local' | 'national' | 'all'
  >((category as 'local' | 'national') || 'all');

  const loadNews = async () => {
    try {
      setLoading(true);
      const response = await getNews();
      const newsItems = response.data || [];
      if (newsItems.length === 0) {
        setHasMore(false);
      } else {
        if (page === 1) {
          setNews(newsItems);
        } else {
          setNews((prev) => [...prev, ...newsItems]);
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
    setPage(1);
    setNews([]);
    setHasMore(true);
    loadNews();
  }, [selectedCategory]);

  // Load more news when page changes
  useEffect(() => {
    if (page > 1) {
      loadNews();
    }
  }, [page]);

  const loadMore = () => {
    if (!loading && hasMore) {
      setPage((prev) => prev + 1);
    }
  };

  const toggleLayout = () => {
    setLayout((prev) => (prev === 'row' ? 'box' : 'row'));
  };

  const handleCategoryChange = (newCategory: 'local' | 'national' | 'all') => {
    setSelectedCategory(newCategory);
  };

  const handleNewsPress = async (url: string) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        console.error(`Cannot open URL: ${  url}`);
      }
    } catch (error) {
      console.error('Error opening URL:', error);
    }
  };

  const getCategoryTitle = () => {
    switch (selectedCategory) {
      case 'local':
        return 'Local News';
      case 'national':
        return 'National News';
      default:
        return 'All News';
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.title}>{getCategoryTitle()}</Text>
          <Pressable onPress={toggleLayout} style={styles.layoutToggle}>
            <Ionicons
              name={layout === 'row' ? 'grid-outline' : 'list-outline'}
              size={24}
              color={colors.text.primary}
            />
          </Pressable>
        </View>
        <Text style={styles.subtitle}>
          Stay informed about your rights and community
        </Text>
      </View>

      {/* Category Filter */}
      <View style={styles.categoryFilter}>
        <Pressable
          style={[
            styles.categoryButton,
            selectedCategory === 'all' && styles.selectedCategory,
          ]}
          onPress={() => handleCategoryChange('all')}
        >
          <Text
            style={[
              styles.categoryText,
              selectedCategory === 'all' && styles.selectedCategoryText,
            ]}
          >
            All
          </Text>
        </Pressable>
        <Pressable
          style={[
            styles.categoryButton,
            selectedCategory === 'local' && styles.selectedCategory,
          ]}
          onPress={() => handleCategoryChange('local')}
        >
          <Text
            style={[
              styles.categoryText,
              selectedCategory === 'local' && styles.selectedCategoryText,
            ]}
          >
            Local
          </Text>
        </Pressable>
        <Pressable
          style={[
            styles.categoryButton,
            selectedCategory === 'national' && styles.selectedCategory,
          ]}
          onPress={() => handleCategoryChange('national')}
        >
          <Text
            style={[
              styles.categoryText,
              selectedCategory === 'national' && styles.selectedCategoryText,
            ]}
          >
            National
          </Text>
        </Pressable>
      </View>

      <View style={layout === 'box' ? styles.boxContainer : undefined}>
        {news.map((item) => (
          <Pressable
            key={item.id}
            style={[styles.newsCard, layout === 'box' && styles.newsCardBox]}
            onPress={() => handleNewsPress(item.url)}
          >
            <View style={styles.newsContent}>
              <Text style={styles.newsItemTitle}>{item.title}</Text>
              <Text
                style={[
                  styles.newsItemDescription,
                  layout === 'box' && styles.newsItemDescriptionBox,
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
              {/* Show category badge */}
              <View style={styles.categoryBadge}>
                <Text style={styles.categoryBadgeText}>{item.category}</Text>
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
        <Pressable style={styles.loadMoreButton} onPress={loadMore}>
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
    paddingTop: spacing.xxl,
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.secondary,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
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
    padding: spacing.xs,
  },
  boxContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: spacing.xs,
  },
  newsCard: {
    backgroundColor: colors.secondary,
    borderRadius: 12,
    margin: spacing.md,
    marginTop: spacing.xs,
    overflow: 'hidden',
    elevation: 3,
    ...shadows.small,
  },
  newsCardBox: {
    width: '45%',
    margin: spacing.xs,
  },
  newsContent: {
    padding: spacing.md,
  },
  newsItemTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: spacing.xs,
    fontFamily: 'Inter-Bold',
  },
  newsItemDescription: {
    fontSize: 14,
    color: colors.text.secondary,
    marginBottom: spacing.sm,
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
    padding: spacing.lg,
    alignItems: 'center',
  },
  loadMoreButton: {
    backgroundColor: colors.accent,
    padding: spacing.md,
    margin: spacing.md,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadMoreText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'Inter-Bold',
    textAlign: 'center',
    textAlignVertical: 'center',
  },
  noMoreText: {
    textAlign: 'center',
    color: colors.text.secondary,
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    padding: spacing.lg,
  },
  categoryFilter: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: colors.secondary,
    borderRadius: 12,
    margin: spacing.md,
    padding: spacing.xs,
  },
  categoryButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedCategory: {
    backgroundColor: colors.accent,
    borderRadius: 20,
  },
  categoryText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text.primary,
    fontFamily: 'Inter-Bold',
    textAlign: 'center',
    textAlignVertical: 'center',
  },
  selectedCategoryText: {
    color: colors.primary,
    textAlign: 'center',
    textAlignVertical: 'center',
  },
  categoryBadge: {
    backgroundColor: colors.accent,
    borderRadius: 10,
    paddingVertical: 4,
    paddingHorizontal: spacing.sm,
    marginTop: spacing.sm,
    alignSelf: 'flex-start',
  },
  categoryBadgeText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: 'bold',
    fontFamily: 'Inter-Bold',
  },
});
