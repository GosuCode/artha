// Common utility functions for the Artha project

export class ResponseParser {
  static cleanJsonResponse(response: string): string {
    return response
      .replace(/```json/g, '')
      .replace(/```/g, '')
      .trim();
  }

  static safeJsonParse<T>(response: string, fallback: T): T {
    try {
      return JSON.parse(this.cleanJsonResponse(response));
    } catch (error) {
      console.error('Failed to parse JSON response:', error);
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
