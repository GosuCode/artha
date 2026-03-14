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
    
    // If no articles scraped, return empty (no mock data)
    if (allNews.length === 0) {
      console.log('No articles scraped from any source');
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

      if (!result.success || !result.markdown) {
        console.error(`Firecrawl failed for ${sourceName}:`, result.error);
        return [];
      }

      console.log(`Firecrawl success for ${sourceName}, markdown length: ${result.markdown.length}`);
      return this.parseNewsContent(sourceName, result.markdown, url);
    } catch (error) {
      console.error(`Error scraping ${sourceName}:`, error);
      return [];
    }
  }

  private parseNewsContent(source: string, markdown: string, baseUrl: string): ScrapedNews[] {
    const news: ScrapedNews[] = [];
    
    // Detect 404/error pages - look for clear 404 indicators, not just keywords anywhere
    const lowerMarkdown = markdown.toLowerCase();
    const errorIndicators = [
      '404 not found',
      'this page can\'t be found',
      'error 404',
      'oops! that page can\'t be found',
    ];
    const isErrorPage = errorIndicators.some(pattern => lowerMarkdown.includes(pattern));
    
    if (isErrorPage) {
      console.warn(`Error page detected from ${source}`);
      return [];
    }

    // Find all markdown links with their context
    const linkRegex = /\[([^\]]{10,200})\]\(([^)]+)\)/g;
    
    // Extract all links from the markdown
    let match;
    while ((match = linkRegex.exec(markdown)) !== null) {
      const title = match[1].trim();
      let url = match[2].trim();
      
      // Skip images and navigation links
      if (title.startsWith('!') || 
          ['home', 'menu', 'login', 'register', 'about us', 'contact', 'privacy', 'terms'].some(w => 
            title.toLowerCase().includes(w))) {
        continue;
      }
      
      // Build full URL
      if (!url.startsWith('http')) {
        url = url.startsWith('/') ? `${baseUrl}${url}` : `${baseUrl}/${url}`;
      }
      
      // Find nearby content (next few non-empty lines after this link)
      const linkIndex = markdown.indexOf(match[0]);
      const afterLink = markdown.slice(linkIndex + match[0].length, linkIndex + 800);
      const contentLines = afterLink.split('\n')
        .map(l => l.trim())
        .filter(l => l.length > 30 && !l.startsWith('[') && !l.startsWith('!') && !l.startsWith('#'))
        .slice(0, 2);
      
      const content = contentLines.join(' ').slice(0, 300) || title;
      
      news.push({
        source,
        headline: title.slice(0, 200),
        url,
        content,
      });
    }
    
    console.log(`Extracted ${news.length} articles from ${source}`);
    return news.slice(0, 12);
  }
}
