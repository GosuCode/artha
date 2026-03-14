// Core utility functions for Artha

export class ResponseParser {
  static cleanJsonResponse(response: string): string {
    if (!response) return "";

    // 1. Try to find markdown code block
    const markdownMatch = response.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    let cleaned = markdownMatch ? markdownMatch[1] : response;

    // 2. Find the boundary of the first valid-looking object or array
    const firstBrace = cleaned.indexOf('{');
    const firstBracket = cleaned.indexOf('[');

    let startIdx = -1;
    let endChar = '';

    if (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
      startIdx = firstBrace;
      endChar = '}';
    } else if (firstBracket !== -1) {
      startIdx = firstBracket;
      endChar = ']';
    }

    if (startIdx === -1) return cleaned;

    const lastEndChar = cleaned.lastIndexOf(endChar);
    if (lastEndChar === -1) return cleaned.substring(startIdx);

    cleaned = cleaned.substring(startIdx, lastEndChar + 1);

    // 3. Robust Fix: Replace literal newlines inside strings with \n
    cleaned = cleaned.replace(/"([^"]*)"/g, (_, p1) => {
      return '"' + p1.replace(/\n/g, '\\n').replace(/\r/g, '\\r') + '"';
    });

    // 4. Remove potential trailing commas
    cleaned = cleaned.replace(/,\s*([}\]])/g, '$1');

    return cleaned;
  }

  static safeJsonParse<T>(response: string, fallback: T): T {
    if (!response) return fallback;

    try {
      return JSON.parse(response) as T;
    } catch (e) {
      try {
        const cleaned = this.cleanJsonResponse(response);
        const parsed = JSON.parse(cleaned);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed[0] as T;
        return parsed as T;
      } catch (error) {
        console.error('[JSON Parser] Critical Failure.');
        return fallback;
      }
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
}

export class MarketClassifier {
  static isPolicyNews(text: string): boolean {
    return /nrb|nepal rastra bank|monetary policy|interest rate|banking regulation|government policy|budget|tax|sebon|directive|circular|repo rate|crr|slr/.test(text.toLowerCase());
  }

  static isDividendNews(text: string): boolean {
    return /dividend|bonus share|cash dividend|book closure|agm|shareholder payout/.test(text.toLowerCase());
  }

  static isMacroNews(text: string): boolean {
    return /inflation|gdp|remittance|foreign exchange|forex|liquidity|economic growth|recession|macro|cpi|trade deficit/.test(text.toLowerCase());
  }

  static inferSector(text: string): string {
    const t = text.toLowerCase();
    if (/microfinance/.test(t)) return 'Microfinance';
    if (/bank|banking|commercial bank|development bank/.test(t)) return 'Banking';
    if (/hydro|hydropower|electricity|energy/.test(t)) return 'Hydropower';
    if (/finance|merchant bank|lending/.test(t)) return 'Finance';
    if (/insurance|life insurance|non-life insurance/.test(t)) return 'Insurance';
    if (/hotel|tourism|aviation/.test(t)) return 'Hotels & Tourism';
    if (/manufacturing|cement|industry/.test(t)) return 'Manufacturing';
    if (/investment|mutual fund/.test(t)) return 'Investment';
    return 'Market-wide';
  }

  static policySectorOverride(text: string, currentSector: string): string {
    const t = text.toLowerCase();
    if (/bank|banking|development bank|commercial bank/.test(t)) return 'Banking';
    if (/microfinance/.test(t)) return 'Microfinance';
    if (/insurance/.test(t)) return 'Insurance';
    return currentSector || 'Market-wide';
  }
}

export class NewsDeduplicator {
  static generateClusterKey(article: { headline: string, category: string, sector: string, companies?: string[] }): string {
    const normalizedHeadline = article.headline
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    const topCompany = article.companies?.[0]?.toLowerCase() ?? 'no-company';
    const topSector = article.sector.toLowerCase();
    const category = article.category.toLowerCase();

    return `${category}|${topSector}|${topCompany}|${normalizedHeadline.slice(0, 60)}`;
  }

  static getSimilarityScore(h1: string, h2: string): number {
    const normalize = (t: string) => t.toLowerCase().replace(/[^\w\s\u0900-\u097F]/gi, '').replace(/\s+/g, ' ').trim();
    const n1 = normalize(h1);
    const n2 = normalize(h2);
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
    return existingHeadlines.some(existing => this.getSimilarityScore(headline, existing) >= threshold);
  }

  static deduplicateArticles<T extends { clusterKey?: string; sentimentScore: number; impactWeight: number }>(articles: T[]): T[] {
    const map = new Map<string, T>();
    for (const a of articles) {
      const key = a.clusterKey || this.generateClusterKey(a as any);
      const existing = map.get(key);
      const strength = Math.abs(a.sentimentScore) * a.impactWeight;
      const existingStrength = existing ? Math.abs(existing.sentimentScore) * existing.impactWeight : -1;
      if (!existing || strength > existingStrength) {
        map.set(key, a);
      }
    }
    return [...map.values()];
  }
}

export class NewsExtractor {
  static isErrorPage(markdown: string): boolean {
    const lower = markdown.toLowerCase();
    return ['404 not found', 'page not found', 'error 404', 'oops!'].some(p => lower.includes(p));
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
      const contextRange = markdown.slice(Math.max(0, linkIndex - 200), Math.min(markdown.length, linkIndex + 400));

      const publishedAt = this.extractDate(contextRange) || this.extractDateFromUrl(url);

      const afterLink = markdown.slice(linkIndex + match[0].length, linkIndex + 800);
      const contentLines = afterLink.split('\n')
        .map(l => l.trim())
        .filter(l => l.length > 30 && !l.startsWith('[') && !l.startsWith('!') && !l.startsWith('#'))
        .slice(0, 2);

      const content = contentLines.join(' ').slice(0, 300) || title;
      const cleanHeadline = title.replace(/!\[.*?\]\(.*?\)/g, '').replace(/\[.*?\]\(.*?\)/g, '').slice(0, 200);

      news.push({ source, headline: cleanHeadline, url, content, publishedAt });
    }
    return news;
  }

  private static extractDate(text: string): Date | undefined {
    const patterns = [
      /(\d{4})\/(\d{1,2})\/(\d{1,2})/,
      /(\d{1,2})\s+(hours?|mins?|minutes?|days?|hr?|d)\s+ago/i,
      /([A-Z][a-z]{2,})\s+(\d{1,2}),?\s+(\d{4})/,
      /(\d{1,2})\s+([A-Z][a-z]{2,})\s+(\d{4})/,
      /(\d{4})-(\d{2})-(\d{2})/,
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        if (match[2] && /hour|min|day|hr|d/i.test(match[2])) {
          const amount = parseInt(match[1]);
          const unit = match[2].toLowerCase();
          const now = new Date();
          if (unit.startsWith('h')) now.setHours(now.getHours() - amount);
          else if (unit.startsWith('m')) now.setMinutes(now.getMinutes() - amount);
          else if (unit.startsWith('d')) now.setDate(now.getDate() - amount);
          return now;
        }
        const d = new Date(match[0]);
        if (!isNaN(d.getTime())) return d;
      }
    }
    return undefined;
  }

  private static extractDateFromUrl(url: string): Date | undefined {
    const match = url.match(/\/(\d{4})\/(\d{2})\/(\d{2})\//);
    if (match) return new Date(`${match[1]}-${match[2]}-${match[3]}`);
    return undefined;
  }

  static findNepseIndex(markdown: string): number {
    const match = markdown.match(/(?:NEPSE Index|Index Value|NEPSE)\s*[:\s]*([\d,.]+)/i) ||
      markdown.match(/NEPSE.*?(\d{1,2},\d{3}\.\d{2}|\d{4}\.\d{2})/);
    if (match && match[1]) {
      const value = parseFloat(match[1].replace(/,/g, ''));
      if (value > 500 && value < 6000) return value;
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