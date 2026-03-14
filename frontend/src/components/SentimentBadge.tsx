import {
  TrendingUp,
  TrendingDown,
  Minus,
  Activity,
  ShieldAlert,
} from "lucide-react";

interface SentimentBadgeProps {
  score: number;
}

export function SentimentBadge({ score }: SentimentBadgeProps) {
  const getStyles = () => {
    if (score > 0.2) return "bg-[#98749e15] text-[#98749e] border-[#98749e44]";
    if (score < -0.2) return "bg-[#ef444415] text-[#ef4444] border-[#ef444444]";
    return "bg-[#c6aeae15] text-[#060406] border-[#c6aeae44]";
  };

  const getLabel = () => {
    if (score > 0.2)
      return {
        text: "Bullish Intensity",
        icon: <TrendingUp className="w-4 h-4" />,
      };
    if (score < -0.2)
      return {
        text: "Bearish Caution",
        icon: <TrendingDown className="w-4 h-4" />,
      };
    return { text: "Market Neutral", icon: <Minus className="w-4 h-4" /> };
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
}

export function ScoreGauge({ score }: ScoreGaugeProps) {
  const percentage = ((score + 1) / 2) * 100;
  const strokeColor =
    score > 0.2 ? "#98749e" : score < -0.2 ? "#ef4444" : "#ac9689";

  return (
    <div className="flex flex-col items-center gap-6 p-8 glass-card">
      <div className="relative w-56 h-56 flex items-center justify-center">
        <svg
          viewBox="0 0 100 100"
          className="transform -rotate-90 w-full h-full"
        >
          {/* Inner Shadow Circle */}
          <circle
            cx="50"
            cy="50"
            r="42"
            fill="none"
            stroke="var(--background)"
            strokeWidth="12"
          />
          {/* Background Path */}
          <circle
            cx="50"
            cy="50"
            r="42"
            fill="none"
            stroke="rgba(152, 116, 158, 0.05)"
            strokeWidth="8"
            strokeLinecap="round"
          />
          {/* Progress Path */}
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
          <div className="bg-white/40 backdrop-blur-md p-6 rounded-full shadow-inner flex flex-col items-center border border-white/50">
            <span className="text-5xl font-black font-display text-[var(--text)] tracking-tighter">
              {score > 0 ? "+" : ""}
              {score.toFixed(2)}
            </span>
            <div className="flex items-center gap-1.5 mt-1 opacity-50">
              <Activity className="w-3.5 h-3.5" />
              <span className="text-[10px] font-bold uppercase tracking-widest">
                Index Signal
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col items-center gap-2">
        <SentimentBadge score={score} />
        <p className="text-[11px] text-[var(--secondary)] font-medium italic">
          Based on weighted NLP analysis
        </p>
      </div>
    </div>
  );
}
