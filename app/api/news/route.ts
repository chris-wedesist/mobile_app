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

// Sample news data - in a real app, this would come from a database
const newsData: NewsItem[] = [
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

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '10');

  // Calculate pagination
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedNews = newsData.slice(startIndex, endIndex);
  
  const totalArticles = newsData.length;
  const totalPages = Math.ceil(totalArticles / limit);
  const hasMore = page < totalPages;

  const response: NewsResponse = {
    articles: paginatedNews,
    pagination: {
      currentPage: page,
      totalPages,
      totalArticles,
      articlesPerPage: limit,
      hasMore
    }
  };

  return Response.json(response);
} 