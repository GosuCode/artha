import dotenv from 'dotenv';
dotenv.config();

export const config = {
  PORT: process.env.PORT || 3001,
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',
  FIRECRAWL_API_KEY: process.env.FIRECRAWL_API_KEY || '',
  SCRAPE_INTERVAL_HOURS: parseInt(process.env.SCRAPE_INTERVAL_HOURS || '4'),
  NEWS_SOURCES: [
    { name: 'Merolagani', url: 'https://merolagani.com' },
    { name: 'Bizmandu', url: 'https://bizmandu.com' },
    { name: 'Sharesansar', url: 'https://sharesansar.com' },
  ],
  BLUE_CHIP_COMPANIES: ['NABIL', 'NICA', 'SCB', 'HBL', 'NMB', 'EBL', 'ADBL', 'PCBL'],
};
