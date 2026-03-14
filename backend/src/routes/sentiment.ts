import { Router, type Request, type Response } from 'express';
import FirecrawlApp from '@mendable/firecrawl-js';
import { config } from '../config.js';
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

router.get('/current', (_req: Request, res: Response): void => {
  if (!latestSignal) {
    res.status(404).json({ error: 'No sentiment data available. Run scrape first.' });
    return;
  }
  res.json(latestSignal);
});

router.get('/history', (req: Request, res: Response) => {
  const days = parseInt(req.query.days as string) || 7;
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  
  const filtered = signalHistory.filter(s => s.timestamp >= cutoffDate);
  res.json(filtered);
});

router.post('/scrape/trigger', async (req: Request, res: Response) => {
  try {
    console.log('Starting manual scrape...');
    
    const scrapedNews = await scraper.scrapeAllSources();
    console.log(`Scraped ${scrapedNews.length} articles`);
    
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

// Debug endpoint to test Firecrawl directly
router.get('/debug/scrape/:source', async (req: Request, res: Response): Promise<void> => {
  const sourceName = req.params.source as string;
  const source = config.NEWS_SOURCES.find(s => s.name.toLowerCase() === sourceName.toLowerCase());
  
  if (!source) {
    res.status(404).json({ error: 'Source not found', available: config.NEWS_SOURCES.map(s => s.name) });
    return;
  }
  
  try {
    const firecrawl = new FirecrawlApp({ apiKey: config.FIRECRAWL_API_KEY });
    const result = await firecrawl.scrapeUrl(source.url, {
      formats: ['markdown'],
      onlyMainContent: true,
    });
    
    if (!result.success) {
      res.status(500).json({
        source: source.name,
        url: source.url,
        success: false,
        error: 'Scrape failed',
      });
      return;
    }
    
    res.json({
      source: source.name,
      url: source.url,
      success: result.success,
      markdownLength: result.markdown?.length || 0,
      markdownPreview: result.markdown?.slice(0, 2000) || 'No content',
    });
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

export default router;
