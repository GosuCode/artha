import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '../config.js';
import type { Article, ScrapedNews, SentimentAnalysisResult, NewsCategory } from '../types.js';

export class AnalysisEngine {
  private genAI: GoogleGenerativeAI;
  private models: any[];
  private modelNames: string[];

  constructor() {
    this.genAI = new GoogleGenerativeAI(config.GEMINI_API_KEY);
    this.modelNames = [config.GEMINI_MODEL];
    this.models = this.modelNames.map(name => 
      this.genAI.getGenerativeModel({ model: name })
    );
  }

  async analyzeArticles(newsItems: ScrapedNews[]): Promise<Article[]> {
    const analyzedArticles: Article[] = [];

    for (const news of newsItems) {
      try {
        const analysis = await this.analyzeSingleArticle(news);
        analyzedArticles.push({
          ...news,
          category: analysis.category,
          sentimentScore: analysis.sentimentScore,
          impactWeight: analysis.impactWeight,
        });
      } catch (error) {
        console.error(`Failed to analyze article: ${news.headline}`, error);
      }
    }

    return analyzedArticles;
  }

  private async analyzeSingleArticle(news: ScrapedNews): Promise<SentimentAnalysisResult> {
    const prompt = this.buildAnalysisPrompt(news);

    // Try each model in order
    for (let i = 0; i < this.models.length; i++) {
      try {
        const result = await this.models[i].generateContent(prompt);
        const response = result.response.text();
        return this.parseAnalysisResponse(response);
      } catch (error) {
        console.warn(`Model ${this.modelNames[i]} failed for "${news.headline.slice(0, 30)}..."`, error instanceof Error ? error.message.slice(0, 100) : 'Unknown error');
        // Continue to next model
      }
    }
    
    // All models failed
    console.error('All Gemini models failed for article');
    return this.getDefaultAnalysis();
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
  "sentimentScore": number between -1.0 (extremely bearish/panic) and +1.0 (extremely bullish/euphoria),
  "category": one of ["Policy", "Dividend", "Macro", "General"],
  "impactWeight": number (1.0 default, 3.0 for NRB/Monetary Policy, 2.0 for blue-chip dividends, 0.5 for general commentary),
  "reasoning": "brief explanation"
}

Rules:
1. "Policy": NRB announcements, monetary policy, interest rate changes, regulations
2. "Dividend": Bonus/dividend announcements from companies
3. "Macro": Economic indicators, inflation, GDP, trade data
4. "General": Market commentary, daily trading summaries
5. Blue chip companies: ${config.BLUE_CHIP_COMPANIES.join(', ')}
6. "Profit Taking" should be Neutral-Positive (not Bearish)
7. Weight 3x for NRB/Government policy news
8. Weight 2x for major company (blue chip) dividend news
9. Weight 0.5x for vague commentary without data points

Return ONLY valid JSON, no markdown formatting.
`;
  }

  private parseAnalysisResponse(response: string): SentimentAnalysisResult {
    try {
      const cleanResponse = response
        .replace(/```json/g, '')
        .replace(/```/g, '')
        .trim();
      
      const parsed = JSON.parse(cleanResponse);
      
      return {
        sentimentScore: this.clamp(parsed.sentimentScore, -1, 1),
        category: this.validateCategory(parsed.category),
        impactWeight: parsed.impactWeight || 1.0,
        reasoning: parsed.reasoning || 'No reasoning provided',
      };
    } catch (error) {
      console.error('Failed to parse Gemini response:', error);
      return this.getDefaultAnalysis();
    }
  }

  private validateCategory(category: string): NewsCategory {
    const validCategories: NewsCategory[] = ['Policy', 'Dividend', 'Macro', 'General'];
    return validCategories.includes(category as NewsCategory) 
      ? (category as NewsCategory) 
      : 'General';
  }

  private clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max);
  }

  private getDefaultAnalysis(): SentimentAnalysisResult {
    return {
      sentimentScore: 0,
      category: 'General',
      impactWeight: 1.0,
      reasoning: 'Default analysis due to processing error',
    };
  }

  generateMarketSummary(articles: Article[], overallScore: number): string {
    const bullishCount = articles.filter(a => a.sentimentScore > 0.2).length;
    const bearishCount = articles.filter(a => a.sentimentScore < -0.2).length;
    const policyNews = articles.filter(a => a.category === 'Policy');
    
    let summary = `Market sentiment is ${overallScore > 0.1 ? 'positive' : overallScore < -0.1 ? 'negative' : 'neutral'}. `;
    summary += `${bullishCount} bullish articles, ${bearishCount} bearish. `;
    
    if (policyNews.length > 0) {
      summary += `Key policy developments from ${policyNews.map(p => p.source).join(', ')}. `;
    }
    
    return summary;
  }
}
