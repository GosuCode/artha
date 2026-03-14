export const SENTIMENT_THRESHOLD = 0.2;

export const COLORS = {
    primary: 'var(--primary)',
    secondary: 'var(--secondary)',
    accent: 'var(--accent)',
    background: 'var(--background)',
    text: 'var(--text)',
    bullish: 'var(--sentiment-bullish)',
    bearish: 'var(--sentiment-bearish)',
    neutral: 'var(--sentiment-neutral)',
};

export const getSentimentType = (score: number) => {
    if (score > SENTIMENT_THRESHOLD) return 'bullish';
    if (score < -SENTIMENT_THRESHOLD) return 'bearish';
    return 'neutral';
};

export const getSentimentColor = (score: number) => {
    const type = getSentimentType(score);
    return COLORS[type];
};

export const getCategoryTheme = (category: string) => {
    switch (category) {
        case 'Policy':
            return 'bg-[var(--primary)] bg-opacity-10 text-[var(--primary)] border-[var(--primary)] border-opacity-30';
        case 'Dividend':
            return 'bg-[var(--accent)] bg-opacity-10 text-[var(--accent)] border-[var(--accent)] border-opacity-30';
        case 'Macro':
            return 'bg-[var(--secondary)] bg-opacity-20 text-[var(--text)] border-[var(--secondary)] border-opacity-30';
        default:
            return 'bg-gray-100 text-gray-400 border-gray-200';
    }
};

export const THEMES = [
    { id: 'classic', name: 'Artha Classic', color: '#98749e' },
    { id: 'berry', name: 'Berry Bloom', color: '#c6438a' },
    { id: 'midnight', name: 'Midnight', color: '#38bdf8' },
    { id: 'growth', name: 'Growth', color: '#059669' },
    { id: 'royal', name: 'Royal Indigo', color: '#4f46e5' },
];
