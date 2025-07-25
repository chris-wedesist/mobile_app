import axios from 'axios';
import { errorHandler, AppError } from '@/utils/errorHandler';

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
    // Simulate API call since the external API is not available
    console.log('Using fallback news data');
    return fallbackNews;
  } catch (error) {
    errorHandler(error); // Integrated errorHandler for monitoring
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
    errorHandler(error); // Integrated errorHandler for monitoring
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
    // Since the external API is not available, use fallback data
    // Simulate pagination by slicing the array
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedNews = fallbackNews.slice(startIndex, endIndex);
    
    console.log('Using fallback news data:', paginatedNews);
    return paginatedNews;
  } catch (error) {
    errorHandler(error); // Integrated errorHandler for monitoring
    console.error('Error fetching news:', error);
    // Return fallback data if API fails
    return fallbackNews;
  }
} 