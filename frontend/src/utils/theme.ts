export const SENTIMENT_THRESHOLD = 0.2;

export const COLORS = {
    primary: '#98749e',
    secondary: '#c6aeae',
    accent: '#ac9689',
    background: '#f7f4f7',
    text: '#060406',
    bullish: '#98749e',
    bearish: '#ef4444',
    neutral: '#ac9689',
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
            return 'bg-[#98749e15] text-[#98749e] border-[#98749e44]';
        case 'Dividend':
            return 'bg-[#ac968915] text-[#ac9689] border-[#ac968944]';
        case 'Macro':
            return 'bg-[#c6aeae30] text-[#060406] border-[#c6aeae44]';
        default:
            return 'bg-gray-100 text-gray-400 border-gray-200';
    }
};
