export type NewsCategory = 'Policy' | 'Dividend' | 'Macro' | 'General';

export interface Article {
  headline: string;
  source: string;
  url: string;
  content: string;
  category: NewsCategory;
  sentimentScore: number;
  impactWeight: number;
  modelUsed?: string;
  publishedAt?: Date;
}

export interface MarketSignal {
  _id: string;
  timestamp: Date;
  overallScore: number;
  nepseIndexAtTime: number;
  articles: Article[];
  summary: string;
}

export interface ScrapedNews {
  source: string;
  headline: string;
  url: string;
  content: string;
  publishedAt?: Date;
}

export interface SentimentAnalysisResult {
  sentimentScore: number;
  category: NewsCategory;
  impactWeight: number;
  reasoning: string;
  modelUsed?: string;
}
