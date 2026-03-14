// Common utility functions for the Artha project

export class ResponseParser {
  static cleanJsonResponse(response: string): string {
    // Find the first '{' and the last '}'
    const firstBrace = response.indexOf('{');
    const lastBrace = response.lastIndexOf('}');

    if (firstBrace === -1 || lastBrace === -1) return response;

    let cleaned = response.substring(firstBrace, lastBrace + 1);

    // Remove potential trailing commas before closing braces/brackets
    cleaned = cleaned.replace(/,\s*([}\]])/g, '$1');

    return cleaned;
  }

  static safeJsonParse<T>(response: string, fallback: T): T {
    try {
      const cleaned = this.cleanJsonResponse(response);
      return JSON.parse(cleaned);
    } catch (error) {
      console.error('Failed to parse JSON response. Raw:', response.slice(0, 100));
      return fallback;
    }
  }
}

export class ErrorHandler {
  static logError(context: string, error: unknown, details?: any): void {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[${context}] ${message}`, details || '');
  }

  static logWarning(context: string, message: string, details?: any): void {
    console.warn(`[${context}] ${message}`, details || '');
  }
}

export class MathUtils {
  static clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max);
  }

  static isValidCategory(category: string, validCategories: string[]): boolean {
    return validCategories.includes(category);
  }
}

export class KeywordDetector {
  private static readonly KEYWORD_PATTERNS: Array<[string[], number, string]> = [
    [['nepal rastra bank', 'nrb', 'monetary policy', 'policy rate', 'cash reserve ratio', 'crr', 'bank rate'], 3.0, 'NRB/Policy mention'],
    [['dividend', 'bonus share', 'cash dividend', 'distribution'], 2.5, 'Dividend announcement'],
    [['interest rate', 'liquidity', 'credit flow', 'deposit'], 2.5, 'Interest/Liquidity mention'],
    [['ipo', 'fpo', 'initial public offering', 'follow on offering'], 2.0, 'IPO/FPO news'],
    [['inflation', 'gdp', 'economic growth', 'trade deficit', 'forex reserve', 'remittance'], 2.0, 'Macro indicator mention']
  ];

  static calculateBoost(text: string, blueChipCompanies: string[]): { boost: number; reason: string } {
    const lowerText = text.toLowerCase();
    let boost = 1.0;
    const reasons: string[] = [];

    // Check keyword patterns
    for (const pattern of this.KEYWORD_PATTERNS) {
      const [keywords, weight, reason] = pattern;
      if (keywords.some(k => lowerText.includes(k))) {
        boost = Math.max(boost, weight);
        reasons.push(reason);
      }
    }

    // Check for blue chip company mentions
    const blueChipMentioned = blueChipCompanies.some(ticker =>
      lowerText.includes(ticker.toLowerCase())
    );
    if (blueChipMentioned) {
      boost = Math.min(boost + 0.5, 3.5);
      reasons.push('Blue chip company mention');
    }

    return {
      boost,
      reason: reasons.length > 0 ? reasons.join(', ') : 'Standard weight'
    };
  }
}

export class NewsDeduplicator {
  static normalize(text: string): string {
    return text.toLowerCase()
      .replace(/[^\w\s\u0900-\u097F]/gi, '') // Keep alphanumeric and Nepali chars
      .replace(/\s+/g, ' ')
      .trim();
  }

  static getSimilarityScore(h1: string, h2: string): number {
    const n1 = this.normalize(h1);
    const n2 = this.normalize(h2);

    if (n1 === n2) return 1.0;

    const words1 = n1.split(' ');
    const words2 = n2.split(' ');

    const set1 = new Set(words1);
    const set2 = new Set(words2);

    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);

    return intersection.size / union.size;
  }

  static isDuplicate(headline: string, existingHeadlines: string[], threshold = 0.75): boolean {
    return existingHeadlines.some(existing =>
      this.getSimilarityScore(headline, existing) >= threshold
    );
  }
}

export class NewsExtractor {
  static isErrorPage(markdown: string): boolean {
    const lowerMarkdown = markdown.toLowerCase();
    const errorIndicators = [
      '404 not found',
      'this page can\'t be found',
      'error 404',
      'oops! that page can\'t be found',
    ];
    return errorIndicators.some(pattern => lowerMarkdown.includes(pattern));
  }

  static extractLinks(markdown: string, baseUrl: string, source: string): any[] {
    const news: any[] = [];
    const linkRegex = /\[([^\]]{10,200})\]\(([^)]+)\)/g;

    let match;
    while ((match = linkRegex.exec(markdown)) !== null) {
      const title = match[1].trim();
      let url = match[2].trim();

      if (title.startsWith('!') ||
        ['home', 'menu', 'login', 'register', 'about us', 'contact', 'privacy', 'terms', 'video', 'tutorial', 'account', 'subscribe', 'newsletter', 'forgot password'].some(w =>
          title.toLowerCase().includes(w))) {
        continue;
      }

      if (!url.startsWith('http')) {
        url = url.startsWith('/') ? `${baseUrl}${url}` : `${baseUrl}/${url}`;
      }

      const linkIndex = markdown.indexOf(match[0]);
      const afterLink = markdown.slice(linkIndex + match[0].length, linkIndex + 800);
      const contentLines = afterLink.split('\n')
        .map(l => l.trim())
        .filter(l => l.length > 30 && !l.startsWith('[') && !l.startsWith('!') && !l.startsWith('#'))
        .slice(0, 2);

      const content = contentLines.join(' ').slice(0, 300) || title;

      // Clean headline of residual markdown/images
      const cleanHeadline = title.replace(/!\[.*?\]\(.*?\)/g, '').replace(/\[.*?\]\(.*?\)/g, '').slice(0, 200);

      news.push({ source, headline: cleanHeadline, url, content });
    }
    return news;
  }

  static findNepseIndex(markdown: string): number {
    const patterns = [
      /(?:NEPSE Index|Index Value|NEPSE)\s*[:\s]*([\d,.]+)/i,
      /NEPSE.*?(\d{1,2},\d{3}\.\d{2}|\d{4}\.\d{2})/
    ];

    for (const pattern of patterns) {
      const match = markdown.match(pattern);
      if (match && match[1]) {
        const value = parseFloat(match[1].replace(/,/g, ''));
        if (value > 500 && value < 5000) return value;
      }
    }
    return 0;
  }
}

export class SentimentReporter {
  static generateSummary(articles: any[], overallScore: number): string {
    const bullishCount = articles.filter(a => a.sentimentScore > 0.2).length;
    const bearishCount = articles.filter(a => a.sentimentScore < -0.2).length;

    const sectors = [...new Set(articles.map(a => a.sector))];
    const topSector = sectors
      .map(s => ({
        name: s,
        count: articles.filter(a => a.sector === s).length,
        sentiment: articles.filter(a => a.sector === s).reduce((acc, curr) => acc + curr.sentimentScore, 0) / Math.max(1, articles.filter(a => a.sector === s).length)
      }))
      .sort((a, b) => b.count - a.count)[0];

    let summary = `Market sentiment is ${overallScore > 0.1 ? 'positive' : overallScore < -0.1 ? 'negative' : 'neutral'}. `;
    summary += `${bullishCount} bullish and ${bearishCount} bearish signals detected. `;

    if (topSector) {
      summary += `Primary activity seen in ${topSector.name} sector with ${topSector.sentiment > 0.1 ? 'bullish' : topSector.sentiment < -0.1 ? 'bearish' : 'mixed'} undertones. `;
    }

    return summary;
  }
}
