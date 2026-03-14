import { TrendingUp, TrendingDown, Minus, Activity } from "lucide-react";
import { getSentimentType, getSentimentColor } from "../utils/theme";

interface SentimentBadgeProps {
  score: number;
}

export function SentimentBadge({ score }: SentimentBadgeProps) {
  const type = getSentimentType(score);

  const getStyles = () => {
    if (type === "bullish")
      return "bg-[var(--sentiment-bullish)] bg-opacity-10 text-[var(--sentiment-bullish)] border-[var(--sentiment-bullish)] border-opacity-30";
    if (type === "bearish")
      return "bg-[var(--sentiment-bearish)] bg-opacity-10 text-[var(--sentiment-bearish)] border-[var(--sentiment-bearish)] border-opacity-30";
    return "bg-[var(--sentiment-neutral)] bg-opacity-10 text-[var(--text)] border-[var(--sentiment-neutral)] border-opacity-30";
  };

  const getLabel = () => {
    switch (type) {
      case "bullish":
        return {
          text: "Bullish Intensity",
          icon: <TrendingUp className="w-4 h-4" />,
        };
      case "bearish":
        return {
          text: "Bearish Caution",
          icon: <TrendingDown className="w-4 h-4" />,
        };
      default:
        return { text: "Market Neutral", icon: <Minus className="w-4 h-4" /> };
    }
  };

  const label = getLabel();

  return (
    <div
      className={`flex items-center gap-2 px-4 py-1.5 border rounded-full transition-all duration-300 ${getStyles()}`}
    >
      {label.icon}
      <span className="text-xs font-bold tracking-wide uppercase">
        {label.text}
      </span>
    </div>
  );
}

interface ScoreGaugeProps {
  score: number;
  confidence?: number;
}

export function ScoreGauge({ score, confidence }: ScoreGaugeProps) {
  const percentage = ((score + 1) / 2) * 100;
  const strokeColor = getSentimentColor(score);

  return (
    <div className="flex flex-col items-center gap-6 p-8 glass-card">
      <div className="relative w-56 h-56 flex items-center justify-center">
        {/* ... existing SVG code ... */}
        <svg
          viewBox="0 0 100 100"
          className="transform -rotate-90 w-full h-full"
        >
          <circle
            cx="50"
            cy="50"
            r="42"
            fill="none"
            stroke="var(--background)"
            strokeWidth="12"
          />
          <circle
            cx="50"
            cy="50"
            r="42"
            fill="none"
            stroke="var(--border)"
            strokeWidth="8"
            strokeLinecap="round"
          />
          <circle
            cx="50"
            cy="50"
            r="42"
            fill="none"
            stroke={strokeColor}
            strokeWidth="8"
            strokeDasharray={`${percentage * 2.64} 264`}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
          />
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="bg-[var(--surface)] bg-opacity-40 backdrop-blur-md p-6 rounded-full shadow-inner flex flex-col items-center border border-[var(--border)]">
            <span className="text-5xl font-black font-display text-[var(--text)] tracking-tighter">
              {score > 0 ? "+" : ""}
              {score.toFixed(2)}
            </span>
            <div className="flex items-center gap-1.5 mt-1 opacity-50">
              <Activity className="w-3.5 h-3.5" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text)]">
                Index Signal
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col items-center gap-2">
        <SentimentBadge score={score} />
        <div className="flex flex-col items-center">
          <p className="text-[11px] text-[var(--secondary)] font-medium italic">
            Based on weighted NLP analysis
          </p>
          {confidence !== undefined && (
            <div className="mt-2 text-[9px] font-black uppercase tracking-[0.2em] px-3 py-1 bg-[var(--background)] rounded-full border border-[var(--border)] opacity-60">
              System Confidence: {(confidence * 100).toFixed(0)}%
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
