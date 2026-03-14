export interface Article {
  headline: string;
  source: string;
  url: string;
  content: string;
  category: 'Policy' | 'Dividend' | 'Macro' | 'General';
  sentimentScore: number;
  impactWeight: number;
  publishedAt?: string;
}

export interface MarketSignal {
  _id: string;
  timestamp: string;
  overallScore: number;
  nepseIndexAtTime: number;
  articles: Article[];
  summary: string;
}
