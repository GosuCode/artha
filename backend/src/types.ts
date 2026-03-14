export type NewsCategory = 'Policy' | 'Dividend' | 'Macro' | 'General';

export type MarketSector =
  | 'Banking'
  | 'Development Bank'
  | 'Finance'
  | 'Hotels & Tourism'
  | 'Hydropower'
  | 'Investment'
  | 'Life Insurance'
  | 'Manufacturing & Processing'
  | 'Microfinance'
  | 'Mutual Fund'
  | 'Non Life Insurance'
  | 'Others'
  | 'Trading'
  | 'Market-wide';

export interface Article {
  headline: string;
  source: string;
  url: string;
  content: string;
  category: NewsCategory;
  sector: MarketSector;
  sentimentScore: number;
  impactWeight: number;
  modelUsed?: string;
  publishedAt?: Date;
}

export interface MarketSignal {
  _id?: string;
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
  sector: MarketSector;
  impactWeight: number;
  reasoning: string;
  modelUsed?: string;
}
