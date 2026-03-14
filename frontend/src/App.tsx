import { RefreshCw, TrendingUp, BarChart3, Activity } from 'lucide-react';
import { useSentiment } from './hooks/useSentiment';
import { ScoreGauge } from './components/SentimentBadge';
import { SentimentChart } from './components/SentimentChart';
import { ArticleList } from './components/ArticleList';

function App() {
  const { signal, history, loading, error, triggerScrape } = useSentiment();

  return (
    <div className="min-h-screen bg-gray-900">
      <header className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-lg">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Artha</h1>
              <p className="text-xs text-gray-400">Nepali Market Sentiment Engine</p>
            </div>
          </div>
          
          <button
            onClick={triggerScrape}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 rounded-lg font-medium transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Scraping...' : 'Refresh Data'}
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {error && (
          <div className="bg-red-500/20 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {!signal && !loading && (
          <div className="bg-gray-800 rounded-xl p-12 text-center">
            <Activity className="w-12 h-12 text-gray-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">No Data Available</h2>
            <p className="text-gray-400 mb-4">Run your first scrape to get market sentiment analysis</p>
            <button
              onClick={triggerScrape}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium"
            >
              Start Scraping
            </button>
          </div>
        )}

        {signal && (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
              <div className="lg:col-span-1 bg-gray-800 rounded-xl p-6 flex flex-col items-center justify-center">
                <h2 className="text-lg font-semibold mb-4">Current Market Pulse</h2>
                <ScoreGauge score={signal.overallScore} />
                <p className="text-sm text-gray-400 mt-4 text-center">
                  NEPSE Index: {signal.nepseIndexAtTime.toFixed(2)}
                </p>
              </div>

              <div className="lg:col-span-2 bg-gray-800 rounded-xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <BarChart3 className="w-5 h-5 text-gray-400" />
                  <h3 className="text-lg font-semibold">Market Summary</h3>
                </div>
                <p className="text-gray-300 leading-relaxed">{signal.summary}</p>
                <div className="mt-4 flex gap-4 text-sm text-gray-400">
                  <span>Articles: {signal.articles.length}</span>
                  <span>Last Updated: {new Date(signal.timestamp).toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <SentimentChart data={history.length > 0 ? history : [signal]} />
              <ArticleList articles={signal.articles} />
            </div>
          </>
        )}
      </main>
    </div>
  );
}

export default App;
