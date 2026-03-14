import FirecrawlApp from '@mendable/firecrawl-js';
import { config } from '../config.js';
import type { ScrapedNews } from '../types.js';
import { NewsDeduplicator, NewsExtractor } from '../utils/index.js';

export class ScraperService {
  private firecrawl: FirecrawlApp;

  constructor() {
    this.firecrawl = new FirecrawlApp({ apiKey: config.FIRECRAWL_API_KEY });
  }

  async scrapeAllSources(): Promise<ScrapedNews[]> {
    const allNews: ScrapedNews[] = [];
    const seenHeadlines: string[] = [];

    for (const source of config.NEWS_SOURCES) {
      try {
        const news = await this.scrapeSource(source.name, source.url);

        let uniqueCount = 0;
        for (const item of news) {
          if (!NewsDeduplicator.isDuplicate(item.headline, seenHeadlines)) {
            allNews.push(item);
            seenHeadlines.push(item.headline);
            uniqueCount++;
          }
        }

        if (news.length > 0) {
          console.log(`- ${source.name}: Found ${uniqueCount} unique articles out of ${news.length}`);
        }
      } catch (error) {
        console.error(`Failed to scrape ${source.name}:`, error);
      }
    }
    return allNews;
  }

  private async scrapeSource(sourceName: string, url: string): Promise<ScrapedNews[]> {
    try {
      const result = await this.firecrawl.scrapeUrl(url, {
        formats: ['markdown'],
        onlyMainContent: true,
        waitFor: 3000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
      });

      if (!result.success || !result.markdown) return [];

      if (NewsExtractor.isErrorPage(result.markdown)) {
        console.warn(`Error page detected from ${sourceName}`);
        return [];
      }

      const news = NewsExtractor.extractLinks(result.markdown, url, sourceName);
      return news.slice(0, 12);
    } catch (error) {
      console.error(`Error scraping ${sourceName}:`, error);
      return [];
    }
  }

  async fetchLiveNepseIndex(): Promise<number> {
    const urls = ['https://nepsealpha.com', 'https://www.sharesansar.com'];

    for (const url of urls) {
      try {
        console.log(`Fetching live NEPSE index from ${url}...`);
        const result = await this.firecrawl.scrapeUrl(url, {
          formats: ['markdown'],
          onlyMainContent: true,
        });

        if (result.success && result.markdown) {
          const value = NewsExtractor.findNepseIndex(result.markdown);
          if (value > 0) return value;
        }
      } catch (error) {
        console.error(`Error fetching index from ${url}:`, error);
      }
    }
    return 0;
  }
}
