# Artha - Nepali Market Sentiment Engine

Automated news-scraping and sentiment-analysis platform for the NEPSE stock exchange.

## Architecture

```
Artha/
├── backend/          # Node.js + TypeScript API
│   ├── src/
│   │   ├── services/
│   │   │   ├── scraper.ts      # Firecrawl integration
│   │   │   ├── analyzer.ts     # Gemini AI analysis
│   │   │   └── calculator.ts   # Weighted scoring
│   │   ├── routes/
│   │   │   └── sentiment.ts    # API endpoints
│   │   ├── config.ts
│   │   ├── types.ts
│   │   └── index.ts
│   ├── .env.example
│   ├── package.json
│   └── tsconfig.json
│
└── frontend/         # Vite + React + TypeScript
    ├── src/
    │   ├── components/
    │   │   ├── SentimentBadge.tsx
    │   │   ├── SentimentChart.tsx
    │   │   └── ArticleList.tsx
    │   ├── hooks/
    │   │   └── useSentiment.ts
    │   ├── types.ts
    │   ├── App.tsx
    │   └── main.tsx
    ├── package.json
    ├── tsconfig.json
    └── vite.config.ts
```

## Quick Start

### 1. Environment Setup

```bash
cd backend
cp .env.example .env
# Edit .env with your API keys:
# - GEMINI_API_KEY (from Google AI Studio)
# - FIRECRAWL_API_KEY (from firecrawl.dev)
```

### 2. Run Backend

```bash
cd backend
npm run dev
# API runs on http://localhost:3001
```

### 3. Run Frontend

```bash
cd frontend
npm run dev
# Dashboard runs on http://localhost:3000
```

## API Endpoints

- `GET /api/sentiment/current` - Latest market sentiment
- `GET /api/sentiment/history?days=7` - Historical data
- `POST /api/scrape/trigger` - Manual scrape trigger

## Features

- **Weighted Analysis**: NRB/Policy news (3x), Blue-chip dividends (2x), General (0.5x)
- **Sentiment Scoring**: Normalized -1.0 (panic) to +1.0 (euphoria)
- **Smart Categorization**: Policy, Dividend, Macro, General
- **Dual-Axis Chart**: Sentiment vs NEPSE Index
- **Real-time Dashboard**: Signal badges, article breakdown

## Tech Stack

- **Backend**: Node.js, TypeScript, Express, Firecrawl, Gemini 1.5 Flash
- **Frontend**: Vite, React, TypeScript, Recharts, Tailwind CSS, Lucide Icons
