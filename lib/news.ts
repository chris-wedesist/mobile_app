export interface NewsItem {
  id: string;
  title: string;
  description: string;
  url: string;
  source: string;
  date: string;
  imageUrl?: string | null;
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

async function fetchFromAPI(): Promise<NewsItem[]> {
  try {
    console.log('Fetching news from API...');
    const response = await fetch('https://desistv2.vercel.app/api/news?page=1&limit=20');
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data: NewsResponse = await response.json();
    console.log('API response received:', data);
    
    if (data.articles && data.articles.length > 0) {
      return data.articles;
    }
    
    console.log('No articles in API response, using fallback');
    return fallbackNews;
  } catch (error) {
    console.error('Error fetching news from API:', error);
    return [];
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
    console.error('Error in fetchNews:', error);
    return fallbackNews;
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
    console.log(`Fetching news page ${page} with limit ${limit}...`);
    
    const apiUrl = `https://desistv2.vercel.app/api/news?page=${page}&limit=${limit}`;
    console.log('Fetching from:', apiUrl);
    
    const response = await fetch(apiUrl);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data: NewsResponse = await response.json();
    console.log('API response received:', data);
    
    if (data.articles && data.articles.length > 0) {
      return data.articles;
    }
    
    console.log('No articles in API response, using fallback');
    // Return fallback data if API returns empty
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    return fallbackNews.slice(startIndex, endIndex);
  } catch (error) {
    console.error('Error fetching news:', error);
    // Return fallback data if API fails
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    return fallbackNews.slice(startIndex, endIndex);
  }
} 