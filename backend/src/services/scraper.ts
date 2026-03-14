import FirecrawlApp from '@mendable/firecrawl-js';
import { config } from '../config.js';
import type { ScrapedNews } from '../types.js';

import { NewsDeduplicator } from '../utils/index.js';

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
        console.log(`Scraping ${source.name}...`);
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
  async fetchLiveNepseIndex(): Promise<number> {
    const outlets = [
      { url: 'https://nepsealpha.com', pattern: /(?:NEPSE Index|Index Value|NEPSE)\s*[:\s]*([\d,.]+)/i },
      { url: 'https://www.sharesansar.com', pattern: /(?:NEPSE Index|NEPSE)\s*[:\s]*([\d,.]+)/i }
    ];

    for (const outlet of outlets) {
      try {
        console.log(`Fetching live NEPSE index from ${outlet.url}...`);
        const result = await this.firecrawl.scrapeUrl(outlet.url, {
          formats: ['markdown'],
          onlyMainContent: true,
        });

        if (result.success && result.markdown) {
          // Try specific patterns first
          const matches = result.markdown.match(outlet.pattern);
          if (matches && matches[1]) {
            const value = parseFloat(matches[1].replace(/,/g, ''));
            if (value > 500 && value < 5000) { // Sanity check for NEPSE range
              console.log(`Live NEPSE Index fetched from ${outlet.url}: ${value}`);
              return value;
            }
          }

          // Fallback: Look for any number after "NEPSE" 
          const genericMatch = result.markdown.match(/NEPSE.*?(\d{1,2},\d{3}\.\d{2}|\d{4}\.\d{2})/);
          if (genericMatch && genericMatch[1]) {
            const value = parseFloat(genericMatch[1].replace(/,/g, ''));
            if (value > 500 && value < 5000) {
              console.log(`Live NEPSE Index (generic match) fetched from ${outlet.url}: ${value}`);
              return value;
            }
          }
        }
      } catch (error) {
        console.error(`Error fetching index from ${outlet.url}:`, error);
      }
    }

    console.warn('Could not find live NEPSE index from any source.');
    return 0;
  }
}
