import type { Article, MarketSignal } from '../types.js';

export class SignalCalculator {
  calculateWeightedScore(articles: Article[]): number {
    if (articles.length === 0) return 0;

    let totalWeightedScore = 0;
    let totalWeight = 0;

    for (const article of articles) {
      const weightedScore = article.sentimentScore * article.impactWeight;
      totalWeightedScore += weightedScore;
      totalWeight += article.impactWeight;
    }

    return totalWeight > 0 ? totalWeightedScore / totalWeight : 0;
  }

  generateSignalId(): string {
    return `signal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  getMockNepseIndex(): number {
    return 2800 + Math.random() * 200;
  }

  createMarketSignal(articles: Article[], summary: string): MarketSignal {
    return {
      _id: this.generateSignalId(),
      timestamp: new Date(),
      overallScore: this.calculateWeightedScore(articles),
      nepseIndexAtTime: this.getMockNepseIndex(),
      articles,
      summary,
    };
  }
}
