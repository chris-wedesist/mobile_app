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
  // LOCAL NEWS (Community-focused)
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
    title: "ICE Activity Reported in Downtown Area",
    description: "Local community organizations are monitoring the situation and providing support.",
    url: "#",
    source: "Local Alerts",
    date: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(), // 3 hours ago
    imageUrl: null,
    category: 'local',
    tags: ['ice', 'immigration', 'alerts']
  },
  {
    id: "5",
    title: "Local Police Accountability Meeting",
    description: "Community leaders meet with local police department to discuss transparency and accountability measures.",
    url: "#",
    source: "Local Government",
    date: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), // 6 hours ago
    imageUrl: null,
    category: 'local',
    tags: ['police-accountability', 'local-government', 'transparency']
  },
  {
    id: "6",
    title: "Immigration Legal Clinic Opens",
    description: "New free legal clinic provides immigration assistance and deportation defense services.",
    url: "#",
    source: "Community Services",
    date: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(), // 12 hours ago
    imageUrl: null,
    category: 'local',
    tags: ['immigration', 'legal-aid', 'deportation-defense']
  },

  // NATIONAL NEWS (Nationally relevant content with broad reach)
  {
    id: "7",
    title: "Supreme Court Rules on Immigration Rights",
    description: "Landmark decision expands protections for immigrant communities across the United States.",
    url: "#",
    source: "Supreme Court",
    date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
    imageUrl: null,
    category: 'national',
    tags: ['supreme-court', 'immigration', 'legal-rights']
  },
  {
    id: "8",
    title: "Police Reform Bill Introduced in Congress",
    description: "New legislation aims to address police brutality and improve accountability measures.",
    url: "#",
    source: "U.S. Congress",
    date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
    imageUrl: null,
    category: 'national',
    tags: ['police-reform', 'congress', 'accountability']
  },
  {
    id: "9",
    title: "Major City Police Department Faces Civil Rights Lawsuit",
    description: "Class action lawsuit alleges systematic racial profiling and excessive force by police department.",
    url: "#",
    source: "National Civil Rights Organization",
    date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
    imageUrl: null,
    category: 'national',
    tags: ['police-brutality', 'civil-rights', 'racial-profiling', 'lawsuit']
  },
  {
    id: "10",
    title: "National Immigration Rights Coalition Forms",
    description: "Major organizations unite to coordinate nationwide immigration advocacy and legal support.",
    url: "#",
    source: "Immigration Rights Network",
    date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(), // 4 days ago
    imageUrl: null,
    category: 'national',
    tags: ['immigration', 'advocacy', 'coalition', 'legal-support']
  },
  {
    id: "11",
    title: "Supreme Court Hears Voting Rights Case",
    description: "Court considers challenge to voting restrictions that could impact minority communities.",
    url: "#",
    source: "Supreme Court",
    date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
    imageUrl: null,
    category: 'national',
    tags: ['supreme-court', 'voting-rights', 'civil-rights']
  },
  {
    id: "12",
    title: "National Police Accountability Database Launches",
    description: "New nationwide database tracks police misconduct and accountability measures across all states.",
    url: "#",
    source: "Police Accountability Project",
    date: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(), // 6 days ago
    imageUrl: null,
    category: 'national',
    tags: ['police-accountability', 'database', 'transparency', 'misconduct']
  },
  {
    id: "13",
    title: "Federal Judge Blocks Immigration Policy",
    description: "Federal court issues injunction against controversial immigration enforcement policy.",
    url: "#",
    source: "Federal Court",
    date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
    imageUrl: null,
    category: 'national',
    tags: ['federal-court', 'immigration', 'legal-challenge']
  },
  {
    id: "14",
    title: "DOJ Announces Civil Rights Investigation",
    description: "Department of Justice launches investigation into police department practices.",
    url: "#",
    source: "Department of Justice",
    date: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(), // 8 days ago
    imageUrl: null,
    category: 'national',
    tags: ['doj', 'civil-rights', 'police-investigation']
  },
  {
    id: "15",
    title: "National Civil Rights Organization Releases Police Violence Report",
    description: "Comprehensive study reveals patterns of police violence and recommendations for reform.",
    url: "#",
    source: "Civil Rights Research Institute",
    date: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString(), // 9 days ago
    imageUrl: null,
    category: 'national',
    tags: ['police-violence', 'research', 'civil-rights', 'reform']
  },
  {
    id: "16",
    title: "Supreme Court Decision on Search and Seizure",
    description: "Court rules on Fourth Amendment rights in case involving police search procedures.",
    url: "#",
    source: "Supreme Court",
    date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 days ago
    imageUrl: null,
    category: 'national',
    tags: ['supreme-court', 'fourth-amendment', 'search-seizure']
  },
  {
    id: "17",
    title: "National Immigration Legal Network Expands",
    description: "Major expansion of pro bono legal services for immigrants across multiple states.",
    url: "#",
    source: "Immigration Legal Network",
    date: new Date(Date.now() - 11 * 24 * 60 * 60 * 1000).toISOString(), // 11 days ago
    imageUrl: null,
    category: 'national',
    tags: ['immigration', 'legal-aid', 'pro-bono', 'expansion']
  },
  {
    id: "18",
    title: "Congressional Hearing on Police Accountability",
    description: "House Judiciary Committee holds hearing on federal police reform legislation.",
    url: "#",
    source: "U.S. Congress",
    date: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(), // 12 days ago
    imageUrl: null,
    category: 'national',
    tags: ['congress', 'police-accountability', 'judiciary-committee']
  },
  {
    id: "19",
    title: "National Coalition Against Racial Profiling Forms",
    description: "Multi-state coalition launches campaign to end racial profiling in law enforcement.",
    url: "#",
    source: "Anti-Racial Profiling Coalition",
    date: new Date(Date.now() - 13 * 24 * 60 * 60 * 1000).toISOString(), // 13 days ago
    imageUrl: null,
    category: 'national',
    tags: ['racial-profiling', 'coalition', 'law-enforcement', 'campaign']
  },
  {
    id: "20",
    title: "Federal Appeals Court Rules on Asylum Rights",
    description: "Court decision affects asylum seekers' rights and deportation procedures.",
    url: "#",
    source: "Federal Appeals Court",
    date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 days ago
    imageUrl: null,
    category: 'national',
    tags: ['federal-court', 'asylum', 'immigration-rights']
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