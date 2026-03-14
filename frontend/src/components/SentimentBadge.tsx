import { TrendingUp, TrendingDown, Minus, Activity } from 'lucide-react';

interface SentimentBadgeProps {
  score: number;
}

export function SentimentBadge({ score }: SentimentBadgeProps) {
  if (score > 0.2) {
    return (
      <div className="flex items-center gap-2 px-4 py-2 bg-bullish/20 text-bullish rounded-full">
        <TrendingUp className="w-5 h-5" />
        <span className="font-semibold">Bullish</span>
      </div>
    );
  }
  
  if (score < -0.2) {
    return (
      <div className="flex items-center gap-2 px-4 py-2 bg-bearish/20 text-bearish rounded-full">
        <TrendingDown className="w-5 h-5" />
        <span className="font-semibold">Bearish</span>
      </div>
    );
  }
  
  return (
    <div className="flex items-center gap-2 px-4 py-2 bg-neutral/20 text-neutral rounded-full">
      <Minus className="w-5 h-5" />
      <span className="font-semibold">Wait & See</span>
    </div>
  );
}

interface ScoreGaugeProps {
  score: number;
}

export function ScoreGauge({ score }: ScoreGaugeProps) {
  const percentage = ((score + 1) / 2) * 100;
  
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative w-48 h-48">
        <svg viewBox="0 0 100 100" className="transform -rotate-90">
          <circle
            cx="50"
            cy="50"
            r="40"
            fill="none"
            stroke="#374151"
            strokeWidth="8"
          />
          <circle
            cx="50"
            cy="50"
            r="40"
            fill="none"
            stroke={score > 0 ? '#22c55e' : score < 0 ? '#ef4444' : '#eab308'}
            strokeWidth="8"
            strokeDasharray={`${percentage * 2.51} 251`}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-4xl font-bold">{score.toFixed(2)}</span>
          <Activity className="w-5 h-5 mt-1 text-gray-400" />
        </div>
      </div>
      <SentimentBadge score={score} />
    </div>
  );
}
