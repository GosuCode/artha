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

  createMarketSignal(articles: Article[], summary: string, nepseIndex: number): Omit<MarketSignal, '_id'> {
    return {
      timestamp: new Date(),
      overallScore: this.calculateWeightedScore(articles),
      nepseIndexAtTime: nepseIndex,
      articles,
      summary,
    };
  }
}
