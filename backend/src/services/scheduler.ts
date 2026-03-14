import cron from 'node-cron';
import { ScraperService } from './scraper.js';
import { AnalysisEngine } from './analyzer.js';
import { SignalCalculator } from './calculator.js';
import { MarketSignalModel } from '../models/MarketSignal.js';
import { config } from '../config.js';

export class SchedulerService {
    private scraper = new ScraperService();
    private analyzer = new AnalysisEngine();
    private calculator = new SignalCalculator();

    start(): void {
        // Run every X hours based on config
        const interval = config.SCRAPE_INTERVAL_HOURS;
        const cronExpression = `0 */${interval} * * *`;

        console.log(`⏰ Scheduler initialized: Running every ${interval} hours (${cronExpression})`);

        cron.schedule(cronExpression, async () => {
            console.log('🔄 Scheduled task: Starting market sentiment update...');
            await this.runUpdate();
        });

        // Optional: Run once on startup if no data exists
        this.initialRun();
    }

    private async initialRun(): Promise<void> {
        const count = await MarketSignalModel.countDocuments();
        if (count === 0) {
            console.log('ℹ️ No market data found. Running initial scrape...');
            await this.runUpdate();
        }
    }

    async runUpdate(): Promise<void> {
        try {
            const scrapedNews = await this.scraper.scrapeAllSources();
            if (scrapedNews.length === 0) {
                console.warn('⚠️ No news articles scraped. Skipping update.');
                return;
            }

            console.log(`📦 Processing ${scrapedNews.length} news items...`);
            const analyzedArticles = await this.analyzer.analyzeArticles(scrapedNews);

            const overallScore = this.calculator.calculateWeightedScore(analyzedArticles);
            const summary = this.analyzer.generateMarketSummary(analyzedArticles, overallScore);

            const signalData = this.calculator.createMarketSignal(analyzedArticles, summary);

            const signal = new MarketSignalModel(signalData);
            await signal.save();

            console.log(`✅ Market signal updated at ${new Date().toISOString()}. Score: ${overallScore.toFixed(2)}`);
        } catch (error) {
            console.error('❌ Scheduled update failed:', error);
        }
    }
}
