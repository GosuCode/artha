// Core utility functions for Artha

export const SOURCE_CREDIBILITY: Record<string, number> = {
  'NEPSE': 1.5,
  'NRB': 1.5,
  'SEBON': 1.5,
  'Sharesansar': 1.1,
  'NepseAlpha': 1.1,
  'Bizmandu': 1.0,
  'Merolagani': 1.0,
  'Bizshala': 0.9,
  'Investopaper': 0.9,
  'NewBizAge': 0.9,
};

export class ResponseParser {
  static cleanJsonResponse(response: string): string {
    if (!response) return "";

    // 1. Remove markdown code blocks
    let cleaned = response.replace(/```(?:json)?\s*([\s\S]*?)\s*```/g, '$1');

    // 2. Find the start of the first object or array
    const startIdx = cleaned.search(/[\{\[]/);
    if (startIdx === -1) return cleaned.trim();

    cleaned = cleaned.substring(startIdx);

    // 3. Find the last matching bracket/brace to handle trailing garbage
    const endChar = cleaned[0] === '{' ? '}' : ']';
    const lastEndIdx = cleaned.lastIndexOf(endChar);

    if (lastEndIdx !== -1) {
      cleaned = cleaned.substring(0, lastEndIdx + 1);
    }

    // 4. Robust Fix for literal newlines in strings
    cleaned = cleaned.replace(/"((?:\\.|[^"\\])*)"/g, (_, p1) => {
      return '"' + p1.replace(/\n/g, '\\n').replace(/\r/g, '\\r') + '"';
    });

    // 5. Remove trailing commas before closing braces/brackets
    cleaned = cleaned.replace(/,\s*([\}\]])/g, '$1');

    return cleaned.trim();
  }

  static fixTruncatedJson(json: string): string {
    let cleaned = json.trim();
    if (!cleaned) return "";

    // 1. If it ends with a comma, remove it
    cleaned = cleaned.replace(/,\s*$/, '');

    // 2. Fix unterminated strings
    const quoteMatches = cleaned.match(/"/g) || [];
    const escapedQuoteMatches = cleaned.match(/\\"/g) || [];
    const realQuoteCount = quoteMatches.length - escapedQuoteMatches.length;

    if (realQuoteCount % 2 !== 0) {
      cleaned += '"';
    }

    // 3. Remove trailing colons or partial keys/values
    // Handle cases like: "key": , "key": "val... , "key"
    cleaned = cleaned.replace(/,\s*"[^"]*"\s*:\s*$/, '');
    cleaned = cleaned.replace(/\{\s*"[^"]*"\s*:\s*$/, '{');
    cleaned = cleaned.replace(/\[\s*"[^"]*"\s*:\s*$/, '[');
    cleaned = cleaned.replace(/,\s*"[^"]*"\s*$/, '');
    cleaned = cleaned.replace(/\{\s*"[^"]*"\s*$/, '{');
    cleaned = cleaned.replace(/\[\s*"[^"]*"\s*$/, '[');

    // 4. Close open braces and brackets
    const openBraces = (cleaned.match(/\{/g) || []).length;
    const closeBraces = (cleaned.match(/\}/g) || []).length;
    const openBrackets = (cleaned.match(/\[/g) || []).length;
    const closeBrackets = (cleaned.match(/\]/g) || []).length;

    const neededBrackets = Math.max(0, openBrackets - closeBrackets);
    const neededBraces = Math.max(0, openBraces - closeBraces);

    for (let i = 0; i < neededBrackets; i++) cleaned += ']';
    for (let i = 0; i < neededBraces; i++) cleaned += '}';

    return cleaned;
  }

  static safeJsonParse<T>(response: string, fallback: T): T {
    if (!response) return fallback;

    try {
      // First attempt: direct parse
      return JSON.parse(response) as T;
    } catch (e) {
      try {
        // Second attempt: clean markdown and whitespace
        const cleaned = this.cleanJsonResponse(response);
        try {
          return JSON.parse(cleaned) as T;
        } catch {
          // Third attempt: fix truncation (unclosed braces, strings etc)
          const fixed = this.fixTruncatedJson(cleaned);
          const parsed = JSON.parse(fixed);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed[0] as T;
          return parsed as T;
        }
      } catch (error) {
        console.error(`[JSON Parser] Critical Failure: ${error instanceof Error ? error.message : String(error)}`);
        console.error(`[JSON Parser] Problematic response: ${response && response.length > 200 ? response.substring(0, 200) + '...' : response}`);
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

export const VALID_SECTORS = [
  'Banking', 'Development Bank', 'Finance', 'Hotels & Tourism',
  'Hydropower', 'Investment', 'Life Insurance', 'Manufacturing & Processing',
  'Microfinance', 'Mutual Fund', 'Non Life Insurance', 'Others', 'Trading', 'Market-wide'
] as const;

export type Sector = typeof VALID_SECTORS[number];

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

  static inferEventType(text: string): string {
    const t = text.toLowerCase();
    if (/rights issue|right share/.test(t)) return 'Rights Issue';
    if (/merger|acquisition|unite/.test(t)) return 'Merger';
    if (/lock-in|lockin|release/.test(t)) return 'Lock-in Release';
    if (/promoter|sell-off|auction/.test(t)) return 'Promoter Selloff';
    if (/quarterly report|q1|q2|q3|q4|financial report/.test(t)) return 'Quarterly Report';
    if (/auction/.test(t)) return 'Auction';
    if (/sanction|fine|penalty/.test(t)) return 'Sanction';
    if (/rating|crisil|icra/.test(t)) return 'Rating Change';
    if (/dividend|bonus/.test(t)) return 'Dividend Declaration';
    if (/monetary policy/.test(t)) return 'Monetary Policy';
    return 'None';
  }

  static inferSector(text: string): string {
    const t = text.toLowerCase();
    if (/microfinance/.test(t)) return 'Microfinance';
    if (/bank|banking|commercial bank/.test(t)) return 'Banking';
    if (/development bank/.test(t)) return 'Development Bank';
    if (/hydro|hydropower|electricity|energy/.test(t)) return 'Hydropower';
    if (/finance|merchant bank|lending/.test(t)) return 'Finance';
    if (/life insurance/.test(t)) return 'Life Insurance';
    if (/non-life insurance|non life insurance/.test(t)) return 'Non Life Insurance';
    if (/hotel|tourism|aviation/.test(t)) return 'Hotels & Tourism';
    if (/manufacturing|cement|industry|distillery/.test(t)) return 'Manufacturing & Processing';
    if (/mutual fund/.test(t)) return 'Mutual Fund';
    if (/investment/.test(t)) return 'Investment';
    if (/trading/.test(t)) return 'Trading';
    return 'Market-wide';
  }

  static normalizeSector(sector: string): Sector {
    if (!sector) return 'Market-wide';

    // Exact match check
    const found = VALID_SECTORS.find(s => s.toLowerCase() === sector.toLowerCase());
    if (found) return found as Sector;

    // Fuzzy/Mapping check
    const s = sector.toLowerCase();
    if (s.includes('general') || s.includes('none') || s.includes('overall') || s.includes('all')) return 'Market-wide';
    if (s.includes('bank')) {
      if (s.includes('development')) return 'Development Bank';
      return 'Banking';
    }
    if (s.includes('microfinance')) return 'Microfinance';
    if (s.includes('hydro')) return 'Hydropower';
    if (s.includes('insurance')) {
      if (s.includes('non')) return 'Non Life Insurance';
      return 'Life Insurance';
    }
    if (s.includes('hotel') || s.includes('tourism')) return 'Hotels & Tourism';
    if (s.includes('manufact') || s.includes('processing')) return 'Manufacturing & Processing';
    if (s.includes('finance')) return 'Finance';
    if (s.includes('mutual fund')) return 'Mutual Fund';
    if (s.includes('investment')) return 'Investment';
    if (s.includes('trading')) return 'Trading';

    return 'Others';
  }

  static policySectorOverride(text: string, currentSector: string): string {
    const t = text.toLowerCase();
    if (/bank|banking|commercial bank/.test(t)) return 'Banking';
    if (/microfinance/.test(t)) return 'Microfinance';
    if (/insurance/.test(t)) return 'Life Insurance';
    return currentSector || 'Market-wide';
  }

  static normalizeCategory(category: string): string {
    const c = String(category || 'General');
    const valid = ['Policy', 'Dividend', 'Macro', 'General', 'Company-Specific'];
    const found = valid.find(v => v.toLowerCase() === c.toLowerCase());
    return found || 'General';
  }

  static normalizeEventType(eventType: string): string {
    const e = String(eventType || 'None');
    const valid = [
      'Rights Issue', 'Merger', 'Lock-in Release', 'Promoter Selloff',
      'Quarterly Report', 'Auction', 'Sanction', 'Rating Change',
      'Dividend Declaration', 'Monetary Policy', 'None'
    ];
    const found = valid.find(v => v.toLowerCase() === e.toLowerCase());
    if (found) return found;

    // Mapping
    if (e.includes('right')) return 'Rights Issue';
    if (e.includes('merger') || e.includes('acquisition')) return 'Merger';
    if (e.includes('quarter') || e.includes('report')) return 'Quarterly Report';
    if (e.includes('dividend')) return 'Dividend Declaration';
    if (e.includes('lock')) return 'Lock-in Release';
    if (e.includes('policy')) return 'Monetary Policy';

    return 'None';
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