import FirecrawlApp from '@mendable/firecrawl-js';
import { config } from '../config.js';
import type { ScrapedNews } from '../types.js';

export class ScraperService {
  private firecrawl: FirecrawlApp;

  constructor() {
    this.firecrawl = new FirecrawlApp({ apiKey: config.FIRECRAWL_API_KEY });
  }

  async scrapeAllSources(): Promise<ScrapedNews[]> {
    const allNews: ScrapedNews[] = [];
    
    for (const source of config.NEWS_SOURCES) {
      try {
        console.log(`Scraping ${source.name}...`);
        const news = await this.scrapeSource(source.name, source.url);
        allNews.push(...news);
      } catch (error) {
        console.error(`Failed to scrape ${source.name}:`, error);
      }
    }
    
    return allNews;
  }

  private async scrapeSource(sourceName: string, baseUrl: string): Promise<ScrapedNews[]> {
    const scrapeUrl = sourceName === 'Merolagani' 
      ? `${baseUrl}/LatestNews.aspx`
      : sourceName === 'Bizmandu'
      ? `${baseUrl}/category/share-market`
      : `${baseUrl}/news`;

    try {
      const result = await this.firecrawl.scrapeUrl(scrapeUrl, {
        formats: ['markdown'],
        onlyMainContent: true,
      });

      if (!result.success || !result.markdown) {
        throw new Error(`Failed to scrape ${sourceName}: ${result.error}`);
      }

      return this.parseNewsContent(sourceName, result.markdown, baseUrl);
    } catch (error) {
      console.error(`Error scraping ${sourceName}:`, error);
      return [];
    }
  }

  private parseNewsContent(source: string, markdown: string, baseUrl: string): ScrapedNews[] {
    const news: ScrapedNews[] = [];
    const lines = markdown.split('\n').filter(line => line.trim());
    
    let currentHeadline = '';
    let currentContent = '';
    
    for (const line of lines) {
      const trimmed = line.trim();
      
      if (trimmed.startsWith('# ') || trimmed.startsWith('## ')) {
        if (currentHeadline && currentContent) {
          news.push({
            source,
            headline: currentHeadline.replace(/^#+\s*/, ''),
            url: baseUrl,
            content: currentContent.trim(),
          });
        }
        currentHeadline = trimmed;
        currentContent = '';
      } else if (trimmed.length > 20) {
        currentContent += trimmed + ' ';
      }
    }
    
    if (currentHeadline && currentContent) {
      news.push({
        source,
        headline: currentHeadline.replace(/^#+\s*/, ''),
        url: baseUrl,
        content: currentContent.trim(),
      });
    }
    
    return news.slice(0, 10);
  }
}
