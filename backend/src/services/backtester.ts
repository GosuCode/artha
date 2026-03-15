import type { MarketSignal } from '../types.js';

export interface BacktestResult {
    articleId: string;
    headline: string;
    sentimentScore: number;
    priceChange1D: number;
    priceChange3D: number;
    priceChange7D: number;
    correlation: 'High' | 'Medium' | 'Low' | 'Inverse';
}

export class BacktestService {
    /**
     * Compares article sentiment against subsequent market moves.
     * This is a skeleton implementation that would require historical price data.
     */
    async backtestSignal(signal: MarketSignal): Promise<BacktestResult[]> {
        const results: BacktestResult[] = [];

        for (const article of signal.articles) {
            // Logic would go here:
            // 1. Get ticker for article
            // 2. Fetch price at article.publishedAt
            // 3. Fetch price at T+1, T+3, T+7
            // 4. Calculate % change
            // 5. Compare with sentimentScore

            results.push({
                articleId: article.url, // Using URL as ID for now
                headline: article.headline,
                sentimentScore: article.sentimentScore,
                priceChange1D: 0, // Placeholder
                priceChange3D: 0,
                priceChange7D: 0,
                correlation: 'Low'
            });
        }

        return results;
    }

    calculateCorrelation(sentiment: number, move: number): number {
        // Simple sign matching
        if ((sentiment > 0 && move > 0) || (sentiment < 0 && move < 0)) {
            return Math.abs(sentiment * move);
        }
        return -Math.abs(sentiment * move);
    }
}
