import { Router } from 'express';
import { ScraperService } from '../services/scraper.js';
import { AnalysisEngine } from '../services/analyzer.js';
import { SignalCalculator } from '../services/calculator.js';
import type { MarketSignal } from '../types.js';

const router = Router();
const scraper = new ScraperService();
const analyzer = new AnalysisEngine();
const calculator = new SignalCalculator();

let latestSignal: MarketSignal | null = null;
const signalHistory: MarketSignal[] = [];

router.get('/current', (req, res) => {
  if (!latestSignal) {
    return res.status(404).json({ error: 'No sentiment data available. Run scrape first.' });
  }
  res.json(latestSignal);
});

router.get('/history', (req, res) => {
  const days = parseInt(req.query.days as string) || 7;
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  
  const filtered = signalHistory.filter(s => s.timestamp >= cutoffDate);
  res.json(filtered);
});

router.post('/scrape/trigger', async (req, res) => {
  try {
    console.log('Starting manual scrape...');
    
    const scrapedNews = await scraper.scrapeAllSources();
    console.log(`Scraped ${scrapedNews.length} articles`);
    
    if (scrapedNews.length === 0) {
      return res.status(500).json({ error: 'No articles scraped' });
    }
    
    const analyzedArticles = await analyzer.analyzeArticles(scrapedNews);
    console.log(`Analyzed ${analyzedArticles.length} articles`);
    
    const overallScore = calculator.calculateWeightedScore(analyzedArticles);
    const summary = analyzer.generateMarketSummary(analyzedArticles, overallScore);
    
    const signal = calculator.createMarketSignal(analyzedArticles, summary);
    
    latestSignal = signal;
    signalHistory.push(signal);
    
    res.json({
      success: true,
      articlesProcessed: analyzedArticles.length,
      signal,
    });
  } catch (error) {
    console.error('Scrape failed:', error);
    res.status(500).json({ error: 'Scrape operation failed' });
  }
});

export default router;
