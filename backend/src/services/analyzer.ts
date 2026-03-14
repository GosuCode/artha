import { GoogleGenerativeAI } from '@google/generative-ai';
import pLimit from 'p-limit';
import { config } from '../config.js';
import type { Article, ScrapedNews, SentimentAnalysisResult, NewsCategory } from '../types.js';
import { ResponseParser, ErrorHandler, MathUtils, KeywordDetector, SentimentReporter } from '../utils/index.js';

export class AnalysisEngine {
  private genAI: GoogleGenerativeAI;
  private models: any[];
  private modelNames: string[];

  constructor() {
    this.genAI = new GoogleGenerativeAI(config.GEMINI_API_KEY);
    this.modelNames = [config.GEMINI_MODEL];
    this.models = this.modelNames.map(name =>
      this.genAI.getGenerativeModel({
        model: name,
        generationConfig: { responseMimeType: "application/json" }
      })
    );
  }

  async analyzeArticles(newsItems: ScrapedNews[]): Promise<Article[]> {
    // Process articles in parallel with a limit (e.g., 5 concurrent requests)
    const limit = pLimit(2);

    const tasks = newsItems.map(news => limit(async () => {
      try {
        const analysis = await this.analyzeSingleArticle(news);
        return {
          ...news,
          category: analysis.category,
          sector: analysis.sector,
          sentimentScore: analysis.sentimentScore,
          impactWeight: analysis.impactWeight,
        } as Article;
      } catch (error) {
        console.error(`Failed to analyze article: ${news.headline}`, error);
        return null;
      }
    }));

    const results = await Promise.all(tasks);
    return results.filter((article): article is Article => article !== null);
  }

  private async analyzeSingleArticle(news: ScrapedNews): Promise<SentimentAnalysisResult> {
    const prompt = this.buildAnalysisPrompt(news);

    // Try each model in order
    for (let i = 0; i < this.models.length; i++) {
      try {
        const result = await this.models[i].generateContent(prompt);
        const response = result.response.text();
        const baseAnalysis = this.parseAnalysisResponse(response);

        // Apply keyword-based weight boost
        const fullText = `${news.headline} ${news.content}`;
        const { boost, reason } = KeywordDetector.calculateBoost(fullText, config.BLUE_CHIP_COMPANIES);
        const adjustedWeight = Math.max(baseAnalysis.impactWeight, boost);

        return {
          ...baseAnalysis,
          impactWeight: adjustedWeight,
          reasoning: `${baseAnalysis.reasoning} | Keywords: ${reason}`,
        };
      } catch (error) {
        ErrorHandler.logWarning('Analyzer', `Model ${this.modelNames[i]} failed for "${news.headline.slice(0, 30)}..."`, error instanceof Error ? error.message.slice(0, 100) : 'Unknown error');
        // Continue to next model
      }
    }

    // All models failed
    throw new Error(`All Gemini models failed for article: ${news.headline}`);
  }

  private buildAnalysisPrompt(news: ScrapedNews): string {
    return `
You are a Nepali financial market expert analyzing news for the NEPSE stock exchange.

Analyze this news article:
Source: ${news.source}
Headline: ${news.headline}
Content: ${news.content}

Provide analysis in this exact JSON format:
{
  "sentimentScore": number between -1.0 (extremely bearish) and +1.0 (extremely bullish),
  "category": one of ["Policy", "Dividend", "Macro", "General"],
  "sector": one of ["Banking", "Development Bank", "Finance", "Hotels & Tourism", "Hydropower", "Investment", "Life Insurance", "Manufacturing & Processing", "Microfinance", "Mutual Fund", "Non Life Insurance", "Others", "Trading", "Market-wide"],
  "impactWeight": number (1.0 default, up to 3.5),
  "reasoning": "brief explanation"
}

Rules for Sector:
1. "Market-wide": Use for general index news, NRB policy, or macro data affecting everything.
2. Specific Sector: If news is about a specific company or industry (e.g., a Hydro project or a Bank's profit), use that exact category.
3. Be precise. If it's about a commercial bank, use "Banking". If it's about NTC or Shivam Cement, use "Others" or "Manufacturing & Processing" respectively.

Return ONLY valid JSON.
`;
  }

  private parseAnalysisResponse(response: string): SentimentAnalysisResult {
    const parsed = ResponseParser.safeJsonParse(response, {
      sentimentScore: 0,
      category: 'General' as NewsCategory,
      sector: 'Market-wide' as any,
      impactWeight: 1.0,
      reasoning: 'Default analysis',
    });

    return {
      sentimentScore: MathUtils.clamp(parsed.sentimentScore, -1, 1),
      category: MathUtils.isValidCategory(parsed.category, ['Policy', 'Dividend', 'Macro', 'General'])
        ? (parsed.category as NewsCategory)
        : 'General',
      sector: parsed.sector || 'Market-wide',
      impactWeight: parsed.impactWeight || 1.0,
      reasoning: parsed.reasoning || 'No reasoning provided',
    };
  }

  generateMarketSummary(articles: Article[], overallScore: number): string {
    return SentimentReporter.generateSummary(articles, overallScore);
  }
}
