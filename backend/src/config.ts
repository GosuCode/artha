import dotenv from 'dotenv';
dotenv.config();

export const config = {
  PORT: process.env.PORT || 3001,
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',
  GEMINI_MODEL: process.env.GEMINI_MODEL || 'gemini-1.5-flash-latest',
  FIRECRAWL_API_KEY: process.env.FIRECRAWL_API_KEY || '',
  SCRAPE_INTERVAL_HOURS: parseInt(process.env.SCRAPE_INTERVAL_HOURS || '4'),
  NEWS_SOURCES: [
    { name: 'Merolagani', url: 'https://merolagani.com' },
    { name: 'Bizmandu', url: 'https://bizmandu.com' },
    { name: 'Sharesansar', url: 'https://www.sharesansar.com' },
    { name: 'NepseAlpha', url: 'https://nepsealpha.com' },
    { name: 'Bizshala', url: 'https://bizshala.com' },
    { name: 'Investopaper', url: 'https://investopaper.com' },
    { name: 'NewBizAge', url: 'https://www.newbusinessage.com' },
  ],
  BLUE_CHIP_COMPANIES: [
    'NABIL', 'NICA', 'SCB', 'HBL', 'EBL',
    'SHIVM', 'SONA', 'HDL',
    'CIT', 'NTC', 'NRIC',
  ],
};
