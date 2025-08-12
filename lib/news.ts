export const NewsStatus = {
  DISABLED: 'DISABLED',
  ERROR: 'ERROR',
  SUCCESS: 'SUCCESS'
};

export interface NewsItem {
  id: string;
  title: string;
  description: string;
  url: string;
  publishedAt: string;
  source: string;
  // Missing fields found in TypeScript errors
  date?: string;
  category?: string;
}

export const getNews = async () => {
  // Feature currently disabled
  return {
    status: NewsStatus.DISABLED,
    data: [],
    message: 'News feature is currently unavailable'
  };
};

export const getNewsItems = async () => {
  // Feature currently disabled
  return {
    status: NewsStatus.DISABLED,
    data: [],
    message: 'News feature is currently unavailable'
  };
};

export const fetchNewsWithOptimization = async () => {
  // Feature currently disabled - return empty arrays to prevent slice errors
  return {
    status: NewsStatus.DISABLED,
    local: [],
    national: [],
    message: 'News feature is currently unavailable'
  };
};

export const getArticleDetails = async (id: string) => {
  // Feature currently disabled
  return {
    status: NewsStatus.DISABLED,
    data: null,
    message: 'News feature is currently unavailable'
  };
}; 