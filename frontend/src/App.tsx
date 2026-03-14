import {
  RefreshCw,
  TrendingUp,
  BarChart3,
  Activity,
  Command,
  Zap,
  Layers,
} from "lucide-react";
import { useSentiment } from "./hooks/useSentiment";
import { ScoreGauge } from "./components/SentimentBadge";
import { SentimentChart } from "./components/SentimentChart";
import { ArticleList } from "./components/ArticleList";

function App() {
  const { signal, history, loading, error, triggerScrape } = useSentiment();

  return (
    <div className="min-h-screen">
      {/* Dynamic Background */}
      <div className="fixed inset-0 z-[-1] overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[var(--primary)] opacity-[0.03] blur-[120px] rounded-full"></div>
        <div className="absolute bottom-[-5%] right-[-5%] w-[30%] h-[30%] bg-[var(--accent)] opacity-[0.05] blur-[100px] rounded-full"></div>
      </div>

      <header className="sticky top-0 z-50 bg-[var(--background)]/80 backdrop-blur-md border-b border-[var(--border)]">
        <div className="max-w-[1400px] mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="bg-[var(--primary)] p-2.5 rounded-2xl shadow-lg shadow-[#98749e33] transform hover:rotate-6 transition-transform">
              <Command className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-black font-display tracking-tight leading-none mb-1">
                ARTHA
              </h1>
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--secondary)]">
                  Market Insight Engine
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={triggerScrape}
            disabled={loading}
            className="btn-primary flex items-center gap-2.5 group"
          >
            <RefreshCw
              className={`w-4 h-4 transition-transform duration-500 ${loading ? "animate-spin" : "group-hover:rotate-180"}`}
            />
            <span className="text-sm tracking-tight">
              {loading ? "Synthesizing..." : "Refresh Intelligence"}
            </span>
          </button>
        </div>
      </header>

      <main className="max-w-[1400px] mx-auto px-6 py-10">
        {error && (
          <div className="bg-red-50 border border-red-100 text-red-600 px-6 py-4 rounded-3xl mb-10 flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-500">
            <Zap className="w-5 h-5" />
            <span className="text-sm font-semibold">{error}</span>
          </div>
        )}

        {!signal && !loading && (
          <div className="glass-card py-24 text-center max-w-2xl mx-auto flex flex-col items-center">
            <div className="p-6 bg-[var(--background)] rounded-full mb-6">
              <Layers className="w-12 h-12 text-[var(--secondary)]" />
            </div>
            <h2 className="text-3xl font-black font-display tracking-tight mb-4">
              No Market Signal Found
            </h2>
            <p className="text-[var(--secondary)] font-medium mb-8 max-w-sm">
              Our neural engine is ready. Initialize your first collection to
              start generating sentiment signals for NEPSE.
            </p>
            <button onClick={triggerScrape} className="btn-primary">
              Initialize Engine
            </button>
          </div>
        )}

        {signal && (
          <div className="space-y-10">
            {/* Top Insight Row */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
              <div className="lg:col-span-4 h-full">
                <ScoreGauge score={signal.overallScore} />
              </div>

              <div className="lg:col-span-8 flex flex-col h-full">
                <div className="glass-card p-10 flex-1 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity duration-700">
                    <BarChart3 className="w-48 h-48" />
                  </div>

                  <div className="relative z-10 flex flex-col h-full">
                    <div className="flex items-center gap-2 mb-6">
                      <div className="w-2 h-6 bg-[var(--primary)] rounded-full"></div>
                      <h3 className="text-sm font-black uppercase tracking-[0.2em] text-[var(--secondary)]">
                        Executive Summary
                      </h3>
                    </div>

                    <p className="text-xl font-medium leading-relaxed text-[var(--text)] mb-8 flex-1">
                      {signal.summary}
                    </p>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 pt-8 border-t border-[var(--border)]">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-[var(--secondary)] mb-1">
                          Nepse Index
                        </p>
                        <p className="text-lg font-bold font-display">
                          {signal.nepseIndexAtTime.toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-[var(--secondary)] mb-1">
                          NLP Sources
                        </p>
                        <p className="text-lg font-bold font-display">
                          {new Set(signal.articles.map((a) => a.source)).size}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-[var(--secondary)] mb-1">
                          Signal Density
                        </p>
                        <p className="text-lg font-bold font-display">
                          {signal.articles.length} Art.
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-[var(--secondary)] mb-1">
                          Capture Time
                        </p>
                        <p className="text-lg font-bold font-display">
                          {new Date(signal.timestamp).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Charts & Articles Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
              <div className="glass-card p-8">
                <SentimentChart
                  data={history.length > 0 ? history : [signal]}
                />
              </div>
              <div className="glass-card p-8">
                <ArticleList articles={signal.articles} />
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="max-w-[1400px] mx-auto px-6 py-12 border-t border-[var(--border)] flex flex-col md:flex-row items-center justify-between gap-6 opacity-40 grayscale">
        <div className="flex items-center gap-2">
          <Command className="w-4 h-4" />
          <span className="text-[10px] font-black uppercase tracking-widest">
            Artha Intelligence v2.0
          </span>
        </div>
        <p className="text-[10px] font-bold uppercase tracking-widest">
          © 2026 Artha Engine • Nepali Market Sentiment
        </p>
      </footer>
    </div>
  );
}

export default App;
