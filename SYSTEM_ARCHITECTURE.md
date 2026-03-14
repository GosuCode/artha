# Artha System Architecture

Artha is a real-time Market Sentiment Engine for the Nepal Stock Exchange (NEPSE). It leverages AI (Gemini), Web Scraping (Firecrawl), and MongoDB to provide high-fidelity market insights.

## 📊 High-Level Workflow

```mermaid
graph TD
    A[Trigger: Cron Job or Manual Refresh] --> B[Scraper Service]

    subgraph "Data Acquisition"
        B --> B1[Firecrawl: Scrape 7+ News Sources]
        B --> B2[Firecrawl: Fetch Live NEPSE Index]
    end

    B1 --> C[News Deduplicator]
    C -->|Fuzzy Jaccard Similarity| D[Unique Article Set]

    subgraph "AI Core"
        D --> E[Gemini 1.5 Analysis]
        E --> E1[Sentiment Score -1 to +1]
        E --> E2[Category Classification]
        E --> E3[Impact Weighting]
    end

    E1 & E2 & E3 & B2 --> F[Signal Calculator]
    F -->|Weighted Averaging| G[Market Signal Object]

    G --> H[(MongoDB Atlas)]

    subgraph "Frontend Dashboard"
        H --> I[React Application]
        I --> J[Score Gauge]
        I --> K[Momentum Area Chart]
        I --> L[Intelligence Feed]
    end

    style B1 fill:#f9f,stroke:#333,stroke-width:1px
    style E fill:#98749e,stroke:#fff,stroke-width:2px,color:#fff
    style H fill:#00ed64,stroke:#333
    style I fill:#61dbfb,stroke:#333
```

## 🧠 Core Components

### 1. The Scraper (Firecrawl)

The `ScraperService` acts as the sensory input. It dynamically converts complex Nepali news portals into clean Markdown. It features a **Multi-Source Failover** for the NEPSE index—if one financial portal is down, it automatically attempts to fetch the live index from another.

### 2. News Deduplicator

To ensure market signals aren't skewed by redundant reporting, we use a **Jaccard Similarity** algorithm. It normalizes headlines (removing stopwords and special characters) and performs fuzzy matching to ensure a single event reported by multiple outlets only gets analyzed **once**.

### 3. AI Analysis Engine (Gemini)

The system uses the `gemini-1.5-flash` model as a financial analyst. For every unique article, it determines:

- **Sentiment**: Bullish vs Bearish intensity.
- **Category**: Classifies news into _Policy, Dividend, Macro,_ or _General_.
- **Impact Weighting**: Assigns higher importance to regulatory news (NRB) or Blue-chip company announcements.

### 4. Signal Calculator

This service calculates the **Weighted Sentiment Score**. It doesn't treat all news as equal; an NRB interest rate hike carries 3x the weight of general market commentary. This produces the "Market Pulse" score seen on the gauge.

### 5. Frontend Dashboard

A modern, minimalist UI built with React and Tailwind CSS.

- **Score Gauge**: Visual representation of current market fear/greed.
- **Sentiment Chart**: Area chart showing the correlation between AI sentiment trends and the NEPSE index.
- **Intelligence Cards**: Real-time cards showing the specific reasoning behind the AI's classification for each story.

## 🛠️ Tech Stack

- **Frontend**: React, Tailwind CSS, Lucide Icons, Recharts.
- **Backend**: Node.js, Express, TypeScript, Node-cron.
- **AI**: Google Generative AI (Gemini).
- **Data Source**: Firecrawl API (Stealth Headless Scraping).
- **Database**: MongoDB (Mongoose).

---

_Artha v2.0 - Built for Nepali Market Intelligence._
