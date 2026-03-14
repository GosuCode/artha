import {
  Newspaper,
  Scale,
  ArrowUpRight,
  Search,
  Filter,
  X,
  Clock,
} from "lucide-react";
import { useState, useMemo } from "react";
import type { Article } from "../types";
import { getCategoryTheme, getSentimentColor } from "../utils/theme";

interface ArticleListProps {
  articles: Article[];
}

export function ArticleList({ articles }: ArticleListProps) {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedSector, setSelectedSector] = useState("All");
  const [selectedTimeRange, setSelectedTimeRange] = useState("All");

  const categories = useMemo(
    () => ["All", ...new Set(articles.map((a) => a.category))],
    [articles],
  );
  const sectors = useMemo(
    () => ["All", ...new Set(articles.map((a) => a.sector))],
    [articles],
  );

  const filteredArticles = useMemo(() => {
    let result = articles.filter((article) => {
      const matchesSearch = article.headline
        .toLowerCase()
        .includes(search.toLowerCase());
      const matchesCategory =
        selectedCategory === "All" || article.category === selectedCategory;
      const matchesSector =
        selectedSector === "All" || article.sector === selectedSector;

      // Time filtering logic
      let matchesTime = true;
      if (article.publishedAt && selectedTimeRange !== "All") {
        const pubDate = new Date(article.publishedAt);
        const now = new Date();
        const diffMs = now.getTime() - pubDate.getTime();
        const diffHours = diffMs / (1000 * 60 * 60);

        if (selectedTimeRange === "Today") {
          matchesTime = pubDate.toDateString() === now.toDateString();
        } else if (selectedTimeRange === "24h") {
          matchesTime = diffHours <= 24;
        } else if (selectedTimeRange === "48h") {
          matchesTime = diffHours <= 48;
        }
      }

      return matchesSearch && matchesCategory && matchesSector && matchesTime;
    });

    // Order by date descending
    return result.sort((a, b) => {
      const dateA = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
      const dateB = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
      return dateB - dateA;
    });
  }, [articles, search, selectedCategory, selectedSector, selectedTimeRange]);

  const formatPubDate = (date?: string | Date) => {
    if (!date) return "N/A";
    const d = new Date(date);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return d.toLocaleDateString([], { month: "short", day: "numeric" });
  };

  return (
    <div className="flex flex-col h-full uppercase tracking-tighter">
      {/* Header & Stats */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 px-2">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-[var(--surface)] shadow-sm rounded-xl border border-[var(--border)] text-[var(--primary)]">
            <Newspaper className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xl font-black font-display tracking-tight leading-tight">
              Market Intelligence
            </h3>
            <p className="text-[10px] text-[var(--secondary)] font-bold opacity-70 italic uppercase tracking-widest">
              {filteredArticles.length} / {articles.length} signals in view
            </p>
          </div>
        </div>

        {/* Global Search Bar */}
        <div className="relative group flex-1 max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--secondary)] opacity-40 group-focus-within:text-[var(--primary)] group-focus-within:opacity-100 transition-all" />
          <input
            type="text"
            placeholder="Search signals..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-10 py-3 bg-[var(--surface)] border border-[var(--border)] rounded-2xl text-[11px] font-bold tracking-widest focus:ring-2 focus:ring-[var(--primary)]/10 focus:border-[var(--primary)] outline-none transition-all placeholder:text-[var(--secondary)] placeholder:opacity-30 text-[var(--text)]"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-4 top-1/2 -translate-y-1/2"
            >
              <X className="w-3.5 h-3.5 text-[var(--secondary)] hover:text-[var(--primary)]" />
            </button>
          )}
        </div>
      </div>

      {/* Filter Chips Layer */}
      <div className="flex flex-wrap items-center gap-3 mb-8 px-2">
        <div className="flex items-center gap-2 mr-2">
          <Filter className="w-3 h-3 text-[var(--secondary)]" />
          <span className="text-[9px] font-black tracking-widest text-[var(--secondary)] opacity-50">
            Filter Mode:
          </span>
        </div>

        {/* Category Dropdown */}
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="appearance-none bg-[var(--surface)] text-[var(--text)] border border-[var(--border)] px-4 py-2 rounded-xl text-[10px] font-black tracking-widest focus:border-[var(--primary)] outline-none cursor-pointer hover:bg-[var(--background)] transition-colors pr-8 relative"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236b7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E\")",
            backgroundRepeat: "no-repeat",
            backgroundPosition: "right 10px center",
            backgroundSize: "12px",
          }}
        >
          <option value="All" className="bg-[var(--surface)]">
            All Categories
          </option>
          {categories
            .filter((c) => c !== "All")
            .map((c) => (
              <option key={c} value={c} className="bg-[var(--surface)]">
                {c}
              </option>
            ))}
        </select>

        {/* Sector Dropdown */}
        <select
          value={selectedSector}
          onChange={(e) => setSelectedSector(e.target.value)}
          className="appearance-none bg-[var(--surface)] text-[var(--text)] border border-[var(--border)] px-4 py-2 rounded-xl text-[10px] font-black tracking-widest focus:border-[var(--primary)] outline-none cursor-pointer hover:bg-[var(--background)] transition-colors pr-8 relative"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236b7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E\")",
            backgroundRepeat: "no-repeat",
            backgroundPosition: "right 10px center",
            backgroundSize: "12px",
          }}
        >
          <option value="All" className="bg-[var(--surface)]">
            All Sectors
          </option>
          {sectors
            .filter((s) => s !== "All")
            .map((s) => (
              <option key={s} value={s} className="bg-[var(--surface)]">
                {s}
              </option>
            ))}
        </select>

        {/* Time Range Dropdown */}
        <select
          value={selectedTimeRange}
          onChange={(e) => setSelectedTimeRange(e.target.value)}
          className="appearance-none bg-[var(--surface)] text-[var(--text)] border border-[var(--border)] px-4 py-2 rounded-xl text-[10px] font-black tracking-widest focus:border-[var(--primary)] outline-none cursor-pointer hover:bg-[var(--background)] transition-colors pr-8 relative"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236b7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E\")",
            backgroundRepeat: "no-repeat",
            backgroundPosition: "right 10px center",
            backgroundSize: "12px",
          }}
        >
          <option value="All" className="bg-[var(--surface)]">
            All Time
          </option>
          <option value="Today" className="bg-[var(--surface)]">
            Today
          </option>
          <option value="24h" className="bg-[var(--surface)]">
            Last 24h
          </option>
          <option value="48h" className="bg-[var(--surface)]">
            Last 48h
          </option>
        </select>

        {(selectedCategory !== "All" ||
          selectedSector !== "All" ||
          selectedTimeRange !== "All" ||
          search !== "") && (
          <button
            onClick={() => {
              setSearch("");
              setSelectedCategory("All");
              setSelectedSector("All");
              setSelectedTimeRange("All");
            }}
            className="text-[9px] font-black text-[var(--primary)] hover:underline ml-auto"
          >
            Clear All
          </button>
        )}
      </div>

      {/* Feed Container */}
      <div
        className="space-y-4 custom-scrollbar pr-2 overflow-y-auto"
        style={{ maxHeight: "600px" }}
      >
        {filteredArticles.map((article, idx) => (
          <div
            key={idx}
            className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 transition-all duration-300 hover:shadow-lg animate-in fade-in slide-in-from-bottom-2 group"
          >
            <div className="flex items-start justify-between gap-6">
              <div className="flex-1">
                {/* Meta Header */}
                <div className="flex items-center flex-wrap gap-3 mb-3">
                  <span
                    className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-lg ${getCategoryTheme(article.category)} shadow-sm`}
                  >
                    {article.category}
                  </span>
                  <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-lg bg-[var(--background)] text-[var(--secondary)] border border-[var(--border)] shadow-sm">
                    {article.sector}
                  </span>
                  {article.publishedAt && (
                    <div className="flex items-center gap-1 text-[10px] text-[var(--secondary)] opacity-60 font-black uppercase tracking-widest ml-1">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{formatPubDate(article.publishedAt)}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1 text-[10px] text-[var(--secondary)] opacity-60 font-black uppercase tracking-widest ml-1">
                    <Scale className="w-3.5 h-3.5" />
                    <span>Impact: {article.impactWeight}x</span>
                  </div>
                </div>

                {/* Headline */}
                <h4 className="font-bold text-[var(--text)] text-sm leading-snug mb-4 group-hover:text-[var(--primary)] transition-colors">
                  {article.headline}
                </h4>

                {/* Analyst Reasoning */}
                {article.reasoning && (
                  <div className="mb-5 p-3.5 bg-[var(--background)] rounded-xl border-l-[3px] border-[var(--primary)]/30">
                    <p className="text-[11px] leading-relaxed text-[var(--text)] opacity-80 font-medium italic">
                      "{article.reasoning}"
                    </p>
                  </div>
                )}

                {/* Entity Tags */}
                {(article.tickers?.length || article.companies?.length) && (
                  <div className="flex flex-wrap gap-2 mb-6">
                    {article.tickers?.map((ticker) => (
                      <span
                        key={ticker}
                        className="px-2 py-0.5 bg-[var(--primary)]/10 text-[var(--primary)] text-[9px] font-black rounded-md border border-[var(--primary)]/20 shadow-sm"
                      >
                        ${ticker}
                      </span>
                    ))}
                    {article.companies?.map((company) => (
                      <span
                        key={company}
                        className="px-2 py-0.5 bg-[var(--secondary)]/10 text-[var(--secondary)] text-[9px] font-black rounded-md border border-[var(--border)] shadow-sm"
                      >
                        {company}
                      </span>
                    ))}
                  </div>
                )}

                {/* Footer */}
                <div className="flex items-center justify-between border-t border-[var(--border)] pt-4">
                  <span className="text-[10px] font-black text-[var(--secondary)] opacity-60 uppercase tracking-widest">
                    {article.source}
                  </span>

                  <a
                    href={article.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-[var(--secondary)] opacity-60 hover:text-[var(--primary)] hover:opacity-100 transition-all group/link"
                  >
                    View Report
                    <ArrowUpRight className="w-3 h-3 transition-transform group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5" />
                  </a>
                </div>
              </div>

              {/* Score Box */}
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-lg shadow-black/5"
                style={{
                  backgroundColor: getSentimentColor(article.sentimentScore),
                }}
              >
                <span className="text-white font-black text-xs">
                  {article.sentimentScore > 0 ? "+" : ""}
                  {article.sentimentScore.toFixed(1)}
                </span>
              </div>
            </div>
          </div>
        ))}

        {filteredArticles.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 opacity-20">
            <Search className="w-12 h-12 mb-4" />
            <p className="text-[10px] font-black uppercase tracking-widest">
              No matching signals found
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
