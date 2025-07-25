import axios from 'axios';
import { errorHandler, AppError } from '@/utils/errorHandler';
import { performanceOptimizer } from '@/utils/performanceOptimizer';

export interface NewsItem {
  id: string;
  title: string;
  description: string;
  url: string;
  source: string;
  date: string;
  imageUrl?: string | null;
  category: 'local' | 'national';
  tags: string[];
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

// Civil rights and immigration focused news data
const civilRightsNews: NewsItem[] = [
  {
    id: "1",
    title: "Community Safety Meeting",
    description: "Join us for our monthly community safety meeting to discuss local concerns and solutions.",
    url: "#",
    source: "Community News",
    date: new Date().toISOString(),
    imageUrl: null,
    category: 'local',
    tags: ['community', 'safety', 'civil-rights']
  },
  {
    id: "2",
    title: "Know Your Rights Workshop",
    description: "Free workshop on understanding your rights and how to protect them in various situations.",
    url: "#",
    source: "Community Updates",
    date: new Date().toISOString(),
    imageUrl: null,
    category: 'local',
    tags: ['rights', 'workshop', 'education']
  },
  {
    id: "3",
    title: "New Support Network Launches",
    description: "Local organizations come together to create a stronger support network for our community.",
    url: "#",
    source: "Community Updates",
    date: new Date().toISOString(),
    imageUrl: null,
    category: 'local',
    tags: ['support', 'community', 'network']
  },
  {
    id: "4",
    title: "Supreme Court Rules on Immigration Rights",
    description: "Landmark decision expands protections for immigrant communities across the United States.",
    url: "#",
    source: "National Legal News",
    date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
    imageUrl: null,
    category: 'national',
    tags: ['supreme-court', 'immigration', 'legal-rights']
  },
  {
    id: "5",
    title: "Police Reform Bill Introduced in Congress",
    description: "New legislation aims to address police brutality and improve accountability measures.",
    url: "#",
    source: "Federal News",
    date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
    imageUrl: null,
    category: 'national',
    tags: ['police-reform', 'congress', 'accountability']
  },
  {
    id: "6",
    title: "ICE Activity Reported in Downtown Area",
    description: "Local community organizations are monitoring the situation and providing support.",
    url: "#",
    source: "Local Alerts",
    date: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(), // 3 hours ago
    imageUrl: null,
    category: 'local',
    tags: ['ice', 'immigration', 'alerts']
  }
];

// Safe API fetching function - no recursive calls
async function fetchFromAPI(category?: 'local' | 'national'): Promise<NewsItem[]> {
  try {
    console.log(`Fetching ${category || 'all'} news from API...`);
    
    // Filter news by category if specified
    if (category) {
      const filteredNews = civilRightsNews.filter(item => item.category === category);
      console.log(`Using ${category} news data:`, filteredNews.length, 'items');
      return filteredNews;
    }
    
    console.log('Using all news data:', civilRightsNews.length, 'items');
    return civilRightsNews;
  } catch (error) {
    errorHandler(error);
    console.error('Error fetching news from API:', error);
    return [];
  }
}

// Safe news fetching - no infinite loops
export async function fetchNews(category?: 'local' | 'national'): Promise<NewsItem[]> {
  try {
    console.log(`Starting fetchNews for ${category || 'all'}...`);
    const apiResults = await fetchFromAPI(category);
    console.log('API results:', apiResults.length, 'items');

    if (apiResults.length > 0) {
      const uniqueNews = removeDuplicates(apiResults);
      const sortedNews = uniqueNews.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      console.log('Returning sorted news:', sortedNews.length, 'items');
      return sortedNews;
    }

    console.warn('No results from API, using fallback data');
    return category ? civilRightsNews.filter(item => item.category === category) : civilRightsNews;
  } catch (error: unknown) {
    errorHandler(error);
    console.error('Error in fetchNews:', error);
    return category ? civilRightsNews.filter(item => item.category === category) : civilRightsNews;
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

// Safe pagination function
export async function getNews(page: number = 1, limit: number = 10, category?: 'local' | 'national'): Promise<NewsItem[]> {
  try {
    const cacheKey = `news_${category || 'all'}_page_${page}_${limit}`;
    return await performanceOptimizer.fetchWithCache(cacheKey, async () => {
      console.log(`Fetching ${category || 'all'} news page ${page} with limit ${limit}...`);
      
      const allNews = category ? civilRightsNews.filter(item => item.category === category) : civilRightsNews;
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedNews = allNews.slice(startIndex, endIndex);
      
      console.log(`Using ${category || 'all'} news data:`, paginatedNews.length, 'items');
      return paginatedNews;
    }, {
      key: cacheKey,
      duration: 5 * 60 * 1000 // 5 minutes cache
    });
  } catch (error) {
    errorHandler(error);
    return category ? civilRightsNews.filter(item => item.category === category) : civilRightsNews;
  }
}

// Safe optimization function - no recursive calls
export async function fetchNewsWithOptimization(): Promise<{
  local: NewsItem[];
  national: NewsItem[];
  featured: NewsItem[];
}> {
  try {
    console.log('Starting fetchNewsWithOptimization...');
    
    // Fetch local and national news separately to avoid loops
    const [localNews, nationalNews] = await Promise.all([
      performanceOptimizer.fetchWithCache('news_local', () => fetchNews('local'), {
        key: 'news_local',
        duration: 10 * 60 * 1000 // 10 minutes cache
      }),
      performanceOptimizer.fetchWithCache('news_national', () => fetchNews('national'), {
        key: 'news_national',
        duration: 10 * 60 * 1000 // 10 minutes cache
      })
    ]);

    // Get featured news (mix of local and national)
    const featuredNews = await performanceOptimizer.fetchWithCache('news_featured', async () => {
      const allNews = [...civilRightsNews];
      return allNews.filter(item => 
        item.tags.includes('supreme-court') || 
        item.tags.includes('police-reform') ||
        item.tags.includes('ice')
      ).slice(0, 3);
    }, {
      key: 'news_featured',
      duration: 15 * 60 * 1000 // 15 minutes cache
    });

    console.log('News optimization completed:', {
      local: localNews.length,
      national: nationalNews.length,
      featured: featuredNews.length
    });

    return {
      local: localNews as NewsItem[],
      national: nationalNews as NewsItem[],
      featured: featuredNews as NewsItem[]
    };
  } catch (error) {
    errorHandler(error);
    console.error('Error in fetchNewsWithOptimization:', error);
    
    // Return fallback data on error
    return {
      local: civilRightsNews.filter(item => item.category === 'local'),
      national: civilRightsNews.filter(item => item.category === 'national'),
      featured: civilRightsNews.slice(0, 3)
    };
  }
}

// Export the news data for testing
export { civilRightsNews }; 