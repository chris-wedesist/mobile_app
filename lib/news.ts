import axios from 'axios';
import { errorHandler, AppError } from '@/utils/errorHandler';
import { performanceOptimizer } from '@/utils/performanceOptimizer';
import LiveDataService, { LiveNewsItem } from '@/utils/liveDataAPI';

export interface NewsItem {
  id: string;
  title: string;
  description: string;
  url: string;
  source: string;
  date: string;
  imageUrl?: string | null;
}

// Extended interface for news with location information
export interface NewsWithLocation extends NewsItem {
  location?: {
    type: 'local' | 'national';
    latitude?: number;
    longitude?: number;
    city?: string;
    state?: string;
  };
  category?: string;
  importance?: string;
}

interface NewsResponse {
  articles: NewsItem[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalArticles: number;
    articlesPerPage: number;
    hasMore: boolean;
  };
}

// Convert LiveNewsItem to NewsItem for backward compatibility
function convertLiveNewsToNewsItem(liveNews: LiveNewsItem): NewsItem {
  return {
    id: liveNews.id,
    title: liveNews.title,
    description: liveNews.description,
    url: liveNews.url,
    source: liveNews.source,
    date: liveNews.published_at,
    imageUrl: liveNews.image_url || null,
  };
}

// Convert LiveNewsItem to NewsWithLocation for enhanced functionality
function convertLiveNewsToNewsWithLocation(liveNews: LiveNewsItem): NewsWithLocation {
  return {
    id: liveNews.id,
    title: liveNews.title,
    description: liveNews.description,
    url: liveNews.url,
    source: liveNews.source,
    date: liveNews.published_at,
    imageUrl: liveNews.image_url || null,
    location: liveNews.location,
    category: liveNews.category,
    importance: liveNews.importance,
  };
}

async function fetchFromAPI(): Promise<NewsItem[]> {
  try {
    console.log('Fetching news from LiveDataService...');
    
    // Get user location (you may need to implement this based on your app's location handling)
    const userLocation = await getUserLocation();
    
    if (userLocation) {
      // Fetch both local and national news
      const combinedNews = await LiveDataService.getCombinedNews(userLocation, {
        localRadiusKm: 50,
        categories: ['civil_rights', 'immigration', 'policing', 'police_brutality', 'community_safety'],
        importance: ['urgent', 'high', 'normal'],
        localLimit: 10,
        nationalLimit: 10,
      });

      // Combine and convert to NewsItem format
      const allNews = [
        ...combinedNews.local.map(convertLiveNewsToNewsItem),
        ...combinedNews.national.map(convertLiveNewsToNewsItem),
      ];

      console.log(`Fetched ${allNews.length} news items (${combinedNews.local.length} local, ${combinedNews.national.length} national)`);
      return allNews;
    } else {
      // Fallback to national news only if location is not available
      const nationalNews = await LiveDataService.getNewsByLocation('national', undefined, undefined, {
        categories: ['civil_rights', 'immigration', 'policing', 'police_brutality', 'community_safety'],
        importance: ['urgent', 'high', 'normal'],
        limit: 20,
      });

      const convertedNews = nationalNews.map(convertLiveNewsToNewsItem);
      console.log(`Fetched ${convertedNews.length} national news items`);
      return convertedNews;
    }
  } catch (error) {
    errorHandler(error);
    console.error('Error fetching news from LiveDataService:', error);
    console.log('Using fallback news data');
    return fallbackNews;
  }
}

// Helper function to get user location (placeholder - implement based on your app's location handling)
async function getUserLocation(): Promise<{ latitude: number; longitude: number } | undefined> {
  try {
    // This is a placeholder - you should implement this based on your app's location handling
    // For example, you might get this from a location context, store, or location service
    // For now, we'll return undefined to fall back to national news only
    return undefined;
  } catch (error) {
    console.error('Error getting user location:', error);
    return undefined;
  }
}

// Fallback data for when the API is not available
const fallbackNews: NewsItem[] = [
  {
    id: "1",
    title: "Community Safety Meeting",
    description: "Join us for our monthly community safety meeting to discuss local concerns and solutions.",
    url: "#",
    source: "Community News",
    date: new Date().toISOString(),
    imageUrl: null
  },
  {
    id: "2",
    title: "Know Your Rights Workshop",
    description: "Free workshop on understanding your rights and how to protect them in various situations.",
    url: "#",
    source: "Community Updates",
    date: new Date().toISOString(),
    imageUrl: null
  },
  {
    id: "3",
    title: "New Support Network Launches",
    description: "Local organizations come together to create a stronger support network for our community.",
    url: "#",
    source: "Community Updates",
    date: new Date().toISOString(),
    imageUrl: null
  }
];

const PAGE_SIZE = 5;

export async function fetchNews(): Promise<NewsItem[]> {
  try {
    console.log('Starting fetchNews...');
    const apiResults = await fetchFromAPI();
    console.log('API results:', apiResults);

    // If we have results from the API, return them
    if (apiResults.length > 0) {
      const uniqueNews = removeDuplicates(apiResults);
      const sortedNews = uniqueNews.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      console.log('Returning sorted news:', sortedNews);
      return sortedNews;
    }

    // If no results from API, return fallback data
    console.warn('No results from API, using fallback data');
    return fallbackNews;
  } catch (error: unknown) {
    errorHandler(error); // Integrated errorHandler for monitoring
    console.error('Error in fetchNews:', error);
    return fallbackNews;
  }
}

// New function to fetch news with location separation
export async function fetchNewsWithLocation(userLocation?: { latitude: number; longitude: number }): Promise<{
  local: NewsWithLocation[];
  national: NewsWithLocation[];
}> {
  try {
    console.log('Fetching news with location separation...');
    
    const combinedNews = await LiveDataService.getCombinedNews(userLocation, {
      localRadiusKm: 50,
      categories: ['civil_rights', 'immigration', 'policing', 'police_brutality', 'community_safety'],
      importance: ['urgent', 'high', 'normal'],
      localLimit: 10,
      nationalLimit: 10,
    });

    return {
      local: combinedNews.local.map(convertLiveNewsToNewsWithLocation),
      national: combinedNews.national.map(convertLiveNewsToNewsWithLocation),
    };
  } catch (error) {
    errorHandler(error);
    console.error('Error fetching news with location:', error);
    
    // Return fallback data with location info
    const fallbackWithLocation: NewsWithLocation[] = fallbackNews.map(item => ({
      ...item,
      location: { type: 'national' },
      category: 'community_safety',
      importance: 'normal',
    }));

    return {
      local: [],
      national: fallbackWithLocation,
    };
  }
}

function removeDuplicates(news: NewsItem[]): NewsItem[] {
  const seen = new Set();
  return news.filter(item => {
    const duplicate = seen.has(item.title);
    seen.add(item.title);
    return !duplicate;
  });
}

const CACHE_DURATION = 60 * 60 * 1000; // 1 hour in milliseconds
let cachedNews: NewsItem[] | null = null;
let lastFetchTime: number | null = null;

export async function getNews(page: number = 1, limit: number = 10): Promise<NewsItem[]> {
  try {
    const cacheKey = `news_page_${page}_${limit}`;
    return await performanceOptimizer.fetchWithCache(cacheKey, async () => {
      console.log(`Fetching news page ${page} with limit ${limit}...`);
      
      const allNews = await fetchNews();
      
      // Simulate pagination by slicing the array
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedNews = allNews.slice(startIndex, endIndex);
      
      console.log('Returning paginated news:', paginatedNews);
      return paginatedNews;
    }, {
      key: cacheKey,
      duration: 5 * 60 * 1000 // 5 minutes cache
    });
  } catch (error) {
    errorHandler(error);
    return fallbackNews;
  }
}

// Enhanced parallel data fetching for news and related content
export async function fetchNewsWithOptimization(): Promise<{
  news: NewsItem[];
  featured: NewsItem[];
  trending: NewsItem[];
}> {
  try {
    const result = await performanceOptimizer.fetchParallel({
      news: async () => {
        return await performanceOptimizer.fetchWithCache('news_main', fetchNews, {
          key: 'news_main',
          duration: 10 * 60 * 1000 // 10 minutes cache
        });
      },
      featured: async () => {
        return await performanceOptimizer.fetchWithCache('news_featured', async () => {
          const allNews = await fetchNews();
          return allNews.filter(item => item.id === '1' || item.id === '2').slice(0, 2);
        }, {
          key: 'news_featured',
          duration: 15 * 60 * 1000 // 15 minutes cache
        });
      },
      trending: async () => {
        return await performanceOptimizer.fetchWithCache('news_trending', async () => {
          const allNews = await fetchNews();
          return allNews.slice(0, 3);
        }, {
          key: 'news_trending',
          duration: 5 * 60 * 1000 // 5 minutes cache
        });
      }
    });

    return {
      news: result.news as NewsItem[],
      featured: result.featured as NewsItem[],
      trending: result.trending as NewsItem[]
    };
  } catch (error) {
    errorHandler(error);
    // Return fallback data on error
    return {
      news: fallbackNews,
      featured: fallbackNews.slice(0, 2),
      trending: fallbackNews.slice(0, 3)
    };
  }
} 