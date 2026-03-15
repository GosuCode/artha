import { GoogleGenerativeAI, type GenerativeModel } from '@google/generative-ai';
import pLimit from 'p-limit';
import { config } from '../config.js';
import type { Article, ScrapedNews } from '../types.js';
import {
  ResponseParser,
  ErrorHandler,
  MathUtils,
  SentimentReporter,
  MarketClassifier,
  NewsDeduplicator,
  SOURCE_CREDIBILITY,
  VALID_SECTORS
} from '../utils/index.js';
import { findCompanyByText } from '../utils/tickers.js';

type RawAnalysisResponse = {
  sentimentScore?: unknown;
  category?: unknown;
  eventType?: unknown;
  sector?: unknown;
  sectorConfidence?: unknown;
  impactWeight?: unknown;
  reasoning?: unknown;
  tickers?: unknown;
  companies?: unknown;
};

export type MarketSummaryResult = {
  weightedScore: number;
  sentimentLabel: 'Bullish' | 'Neutral' | 'Bearish';
  confidence: number;
  totalArticles: number;
  sectorBreakdown: Array<{
    sector: string;
    articleCount: number;
    averageScore: number;
    weightedScore: number;
  }>;
  topPositive: Article[];
  topNegative: Article[];
  narrative: string;
};



const ANALYSIS_SCHEMA = {
  type: 'object',
  properties: {
    sentimentScore: { type: 'number' },
    category: { type: 'string', enum: ['Policy', 'Dividend', 'Macro', 'General', 'Company-Specific'] },
    eventType: { type: 'string' },
    sector: { type: 'string', enum: [...VALID_SECTORS] },
    sectorConfidence: { type: 'number' },
    impactWeight: { type: 'number' },
    reasoning: { type: 'string' },
    tickers: { type: 'array', items: { type: 'string' } },
    companies: { type: 'array', items: { type: 'string' } },
  },
  required: ['sentimentScore', 'category', 'eventType', 'sector', 'sectorConfidence', 'impactWeight', 'reasoning', 'tickers', 'companies'],
} as const;

export class AnalysisEngine {
  private readonly genAI: GoogleGenerativeAI;
  private readonly models: GenerativeModel[];
  private readonly modelNames: string[];

  private readonly concurrency = 2;
  private readonly requestTimeoutMs = 20_000;
  private readonly maxRetriesPerModel = 2;

  constructor() {
    this.genAI = new GoogleGenerativeAI(config.GEMINI_API_KEY);
    this.modelNames = [config.GEMINI_MODEL].filter(Boolean);

    this.models = this.modelNames.map((name) =>
      this.genAI.getGenerativeModel({
        model: name,
        generationConfig: {
          responseMimeType: 'application/json',
          responseSchema: ANALYSIS_SCHEMA as any,
          temperature: 0.1,
          maxOutputTokens: 1000,
        },
      })
    );
  }

  async analyzeArticles(newsItems: ScrapedNews[]): Promise<Article[]> {
    const limit = pLimit(this.concurrency);

    const tasks = newsItems.map((news) =>
      limit(async () => {
        try {
          const analysis = await this.analyzeSingleArticle(news);
          return { ...news, ...analysis } as Article;
        } catch (error) {
          ErrorHandler.logWarning('Analyzer', `AI Refusal/Failure: ${news.headline.slice(0, 50)}`, error);
          return this.buildHeuristicFallback(news);
        }
      })
    );

    const analyzed = await Promise.all(tasks);
    return NewsDeduplicator.deduplicateArticles(analyzed);
  }

  private async analyzeSingleArticle(news: ScrapedNews): Promise<Article & { modelUsed: string }> {
    const prompt = this.buildAnalysisPrompt(news);
    let lastError: unknown;

    for (let i = 0; i < this.models.length; i++) {
      const model = this.models[i];
      const name = this.modelNames[i];

      for (let attempt = 1; attempt <= this.maxRetriesPerModel; attempt++) {
        try {
          const rawText = await this.generateWithTimeout(model, prompt, this.requestTimeoutMs);
          let parsed = this.parseResponse(rawText, name, news);
          parsed = this.applyManualRules(news, parsed);
          parsed.clusterKey = NewsDeduplicator.generateClusterKey(parsed);
          return parsed;
        } catch (error) {
          lastError = error;
          if (attempt === this.maxRetriesPerModel) break;
          await new Promise(r => setTimeout(r, 400 * attempt));
        }
      }
    }
    throw lastError;
  }

  private buildAnalysisPrompt(news: ScrapedNews): string {
    return `
You are a senior NEPSE analyst. Analyze this news for immediate market impact.
Headline: ${news.headline}
Content: ${news.content.slice(0, 4000)}

Return ONLY valid JSON:
{
  "sentimentScore": -1 to 1,
  "category": "Policy" | "Dividend" | "Macro" | "General" | "Company-Specific",
  "eventType": "Rights Issue" | "Merger" | "Lock-in Release" | "Promoter Selloff" | "Quarterly Report" | "Auction" | "Sanction" | "Rating Change" | "Dividend Declaration" | "Monetary Policy" | "None",
  "sector": ${VALID_SECTORS.map(s => `"${s}"`).join(' | ')},
  "sectorConfidence": 0 to 1,
  "impactWeight": 1 to 3.5,
  "reasoning": string (concise),
  "tickers": string[],
  "companies": string[]
}
`.trim();
  }

  private parseResponse(response: string, model: string, news: ScrapedNews): Article & { modelUsed: string } {
    const parsed = ResponseParser.safeJsonParse<RawAnalysisResponse>(response, {});

    if (!parsed || Object.keys(parsed).length === 0) {
      throw new Error('Failed to parse analysis response');
    }

    // Apply source credibility weighting
    const sourceCred = SOURCE_CREDIBILITY[news.source] || 1.0;
    const rawImpact = MathUtils.clamp(Number(parsed.impactWeight) || 1.0, 1, 3.5);
    const impactWeight = rawImpact * sourceCred;

    const result: Article & { modelUsed: string } = {
      ...news,
      sentimentScore: MathUtils.clamp(Number(parsed.sentimentScore) || 0, -1, 1),
      category: MarketClassifier.normalizeCategory(String(parsed.category || 'General')) as any,
      eventType: MarketClassifier.normalizeEventType(String(parsed.eventType || 'None')) as any,
      sector: MarketClassifier.normalizeSector(String(parsed.sector || 'Market-wide')),
      sectorConfidence: MathUtils.clamp(Number(parsed.sectorConfidence) || 0.3, 0, 1),
      impactWeight,
      reasoning: String(parsed.reasoning || '').slice(0, 200),
      tickers: Array.isArray(parsed.tickers) ? parsed.tickers.map(String) : this.extractTickers(news),
      companies: Array.isArray(parsed.companies) ? parsed.companies.map(String) : this.extractCompanies(news),
      modelUsed: model,
      clusterKey: ''
    };

    return result;
  }

  private applyManualRules(news: ScrapedNews, analysis: Article & { modelUsed: string }): Article & { modelUsed: string } {
    const text = `${news.headline} ${news.content}`.toLowerCase();
    const updated = { ...analysis };

    // Trigger Rule: NRB rate cut + banking liquidity
    if (/rate cut|interest rate reduction|policy rate lowered/.test(text) && /liquidity|easing/.test(text)) {
      if (updated.sector === 'Banking' || updated.sector === 'Finance') {
        updated.sentimentScore = Math.min(updated.sentimentScore + 0.3, 1.0);
        updated.impactWeight *= 1.2;
        updated.reasoning = `[Trigger: Policy Easing] ${updated.reasoning}`;
      }
    }

    if (MarketClassifier.isPolicyNews(text)) {
      updated.category = 'Policy';
      updated.impactWeight = Math.max(updated.impactWeight, 3.0);
      updated.sector = MarketClassifier.policySectorOverride(text, updated.sector) as any;
    } else if (MarketClassifier.isDividendNews(text)) {
      updated.category = 'Dividend';
      updated.impactWeight = Math.max(updated.impactWeight, 2.0);
      if (updated.sentimentScore > 0) updated.sentimentScore = Math.max(updated.sentimentScore, 0.4);
    } else if (MarketClassifier.isMacroNews(text)) {
      updated.category = 'Macro';
      updated.impactWeight = Math.max(updated.impactWeight, 2.5);
    }

    // Ticker enrichment from dictionary
    const foundCompany = findCompanyByText(text);
    if (foundCompany && !updated.tickers?.includes(foundCompany.ticker)) {
      updated.tickers = [...(updated.tickers || []), foundCompany.ticker];
      updated.companies = [...(updated.companies || []), foundCompany.name];
      if (updated.sector === 'Market-wide') updated.sector = foundCompany.sector as any;
    }

    return updated;
  }

  private buildHeuristicFallback(news: ScrapedNews): Article {
    const text = `${news.headline} ${news.content}`;
    const result: Article = {
      ...news,
      sentimentScore: 0,
      category: 'General',
      eventType: MarketClassifier.inferEventType(text) as any,
      sector: MarketClassifier.inferSector(text) as any,
      impactWeight: 1.0 * (SOURCE_CREDIBILITY[news.source] || 1.0),
      reasoning: 'Heuristic fallback applied.',
      modelUsed: 'heuristic',
      tickers: this.extractTickers(news),
      companies: this.extractCompanies(news)
    };

    if (MarketClassifier.isPolicyNews(text)) {
      result.category = 'Policy';
      result.impactWeight = 3.0;
    } else if (MarketClassifier.isDividendNews(text)) {
      result.category = 'Dividend';
      result.impactWeight = 2.2;
      result.sentimentScore = 0.3;
    }

    result.clusterKey = NewsDeduplicator.generateClusterKey(result);
    return result;
  }

  generateMarketSummary(articles: Article[]): MarketSummaryResult {
    if (articles.length === 0) return this.emptySummary();

    const weightedArticles = articles.map(a => ({
      a,
      weight: a.impactWeight * (0.7 + (a.sectorConfidence ?? 0.3) * 0.3),
      score: a.sentimentScore * a.impactWeight
    }));

    const totalWeight = weightedArticles.reduce((sum, item) => sum + item.weight, 0);
    const weightedScore = totalWeight > 0 ? weightedArticles.reduce((sum, item) => sum + item.score * item.weight, 0) / (totalWeight * 3.5) : 0;

    const confidence = articles.reduce((sum, a) => sum + (a.sectorConfidence ?? 0.3), 0) / articles.length;

    // Build sector breakdown
    const sectors = [...new Set(articles.map(a => a.sector))];
    const sectorBreakdown = sectors.map(s => {
      const sArticles = articles.filter(a => a.sector === s);
      return {
        sector: s,
        articleCount: sArticles.length,
        averageScore: sArticles.reduce((sum, a) => sum + a.sentimentScore, 0) / sArticles.length,
        weightedScore: sArticles.reduce((sum, a) => sum + a.sentimentScore * a.impactWeight, 0)
      };
    }).sort((a, b) => b.articleCount - a.articleCount);

    const narrative = `Market is ${weightedScore > 0.1 ? 'Bullish' : weightedScore < -0.1 ? 'Bearish' : 'Neutral'} (${weightedScore.toFixed(2)}) based on ${articles.length} signals. Confidence: ${(confidence * 100).toFixed(0)}%.`;

    return {
      weightedScore: MathUtils.clamp(weightedScore, -1, 1),
      sentimentLabel: weightedScore > 0.15 ? 'Bullish' : weightedScore < -0.15 ? 'Bearish' : 'Neutral',
      confidence,
      totalArticles: articles.length,
      sectorBreakdown,
      topPositive: [...articles].sort((a, b) => b.sentimentScore - a.sentimentScore).slice(0, 3),
      topNegative: [...articles].sort((a, b) => a.sentimentScore - b.sentimentScore).slice(0, 3),
      narrative
    };
  }

  generateHumanReadableSummary(articles: Article[]): string {
    const market = this.generateMarketSummary(articles);
    return SentimentReporter.generateSummary(articles, market.weightedScore);
  }

  private emptySummary(): MarketSummaryResult {
    return { weightedScore: 0, sentimentLabel: 'Neutral', confidence: 0, totalArticles: 0, sectorBreakdown: [], topPositive: [], topNegative: [], narrative: 'No data.' };
  }

  private extractTickers(news: ScrapedNews): string[] {
    const matches = (news.headline + ' ' + news.content).match(/\b[A-Z]{2,5}\b/g) ?? [];
    const blacklist = new Set(['NEPSE', 'NRB', 'SEBON', 'IPO', 'FPO', 'AGM', 'GDP', 'NPR']);
    return [...new Set(matches.filter(m => !blacklist.has(m)))].slice(0, 5);
  }

  private extractCompanies(news: ScrapedNews): string[] {
    const patterns = [/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,3}\s+(?:Bank|Hydropower|Finance|Limited|Ltd)\b/g];
    const text = news.headline + '. ' + news.content;
    const results = new Set<string>();
    for (const p of patterns) (text.match(p) ?? []).forEach(m => results.add(m.trim()));
    return [...results].slice(0, 5);
  }

  private async generateWithTimeout(model: GenerativeModel, prompt: string, timeout: number): Promise<any> {
    const result = await Promise.race([
      model.generateContent(prompt),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), timeout))
    ]) as any;
    return result.response.text();
  }
}