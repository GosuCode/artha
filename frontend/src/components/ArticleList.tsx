import { Newspaper, Scale, ArrowUpRight } from "lucide-react";
import type { Article } from "../types";

interface ArticleListProps {
  articles: Article[];
}

export function ArticleList({ articles }: ArticleListProps) {
  const getCategoryTheme = (category: string) => {
    switch (category) {
      case "Policy":
        return "bg-[#98749e15] text-[#98749e]";
      case "Dividend":
        return "bg-[#ac968915] text-[#ac9689]";
      case "Macro":
        return "bg-[#c6aeae30] text-[#060406]";
      default:
        return "bg-gray-100 text-gray-400";
    }
  };

  const getSentimentBg = (score: number) => {
    if (score > 0.2) return "bg-[#98749e]";
    if (score < -0.2) return "bg-[#ef4444]";
    return "bg-[#c6aeae]";
  };

  return (
    <div className="flex flex-col h-full uppercase tracking-tighter">
      <div className="flex items-center justify-between mb-8 px-2">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-white shadow-sm rounded-xl border border-[var(--border)] text-[var(--primary)]">
            <Newspaper className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xl font-black font-display tracking-tight">
              Market Intelligence
            </h3>
            <p className="text-[10px] text-[var(--secondary)] font-bold opacity-70 italic uppercase tracking-widest">
              {articles.length} signals detected today
            </p>
          </div>
        </div>
      </div>

      <div
        className="space-y-4 custom-scrollbar pr-2 overflow-y-auto"
        style={{ maxHeight: "600px" }}
      >
        {articles.map((article, idx) => (
          <div
            key={idx}
            className="bg-white border border-[var(--border)] rounded-2xl p-6 transition-all duration-300 hover:shadow-lg"
          >
            <div className="flex items-start justify-between gap-6">
              <div className="flex-1">
                {/* Meta Header */}
                <div className="flex items-center gap-4 mb-3">
                  <span
                    className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-lg ${getCategoryTheme(article.category)}`}
                  >
                    {article.category}
                  </span>
                  <div className="flex items-center gap-1 text-[10px] text-[#06040644] font-black uppercase tracking-widest">
                    <Scale className="w-3.5 h-3.5" />
                    <span>Impact: {article.impactWeight}x</span>
                  </div>
                </div>

                {/* Headline */}
                <h4 className="font-bold text-[var(--text)] text-sm leading-snug mb-4">
                  {article.headline}
                </h4>

                {/* Footer */}
                <div className="flex items-center justify-between border-t border-[var(--border)] pt-4">
                  <span className="text-[10px] font-black text-[#06040644] uppercase tracking-widest">
                    {article.source}
                  </span>

                  <a
                    href={article.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-[#06040644] hover:text-[var(--primary)] transition-colors group"
                  >
                    View Report
                    <ArrowUpRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </a>
                </div>
              </div>

              {/* Score Box */}
              <div
                className={`${getSentimentBg(article.sentimentScore)} w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-lg shadow-black/5`}
              >
                <span className="text-white font-black text-xs">
                  {article.sentimentScore > 0 ? "+" : ""}
                  {article.sentimentScore.toFixed(1)}
                </span>
              </div>
            </div>
          </div>
        ))}

        {articles.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 opacity-20">
            <Newspaper className="w-12 h-12 mb-4" />
            <p className="text-[10px] font-black uppercase tracking-widest">
              No Intelligence Gathered
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
