export interface Article {
  headline: string;
  source: string;
  url: string;
  content: string;
  category: 'Policy' | 'Dividend' | 'Macro' | 'General' | 'Company-Specific';
  eventType: string;
  sector: string;
  sentimentScore: number;
  impactWeight: number;
  publishedAt?: string;
  sectorConfidence?: number;
  reasoning?: string;
  tickers?: string[];
  companies?: string[];
}

export interface MarketSignal {
  _id: string;
  timestamp: string;
  overallScore: number;
  nepseIndexAtTime: number;
  articles: Article[];
  summary: string;
  confidence?: number;
}
