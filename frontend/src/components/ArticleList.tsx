import { Newspaper, ExternalLink, Tag, Scale } from 'lucide-react';
import type { Article } from '../types';

interface ArticleListProps {
  articles: Article[];
}

export function ArticleList({ articles }: ArticleListProps) {
  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Policy': return 'bg-purple-500/20 text-purple-400';
      case 'Dividend': return 'bg-blue-500/20 text-blue-400';
      case 'Macro': return 'bg-orange-500/20 text-orange-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  const getSentimentColor = (score: number) => {
    if (score > 0.2) return 'text-bullish';
    if (score < -0.2) return 'text-bearish';
    return 'text-neutral';
  };

  return (
    <div className="bg-gray-800 rounded-xl p-6">
      <div className="flex items-center gap-2 mb-4">
        <Newspaper className="w-5 h-5 text-gray-400" />
        <h3 className="text-lg font-semibold">Latest Articles ({articles.length})</h3>
      </div>
      
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {articles.map((article, idx) => (
          <div key={idx} className="bg-gray-700/50 rounded-lg p-4 hover:bg-gray-700 transition-colors">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <h4 className="font-medium text-sm mb-1">{article.headline}</h4>
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <span>{article.source}</span>
                  <span>•</span>
                  <span className={getCategoryColor(article.category)}>
                    <Tag className="w-3 h-3 inline mr-1" />
                    {article.category}
                  </span>
                </div>
              </div>
              
              <div className="flex flex-col items-end gap-1">
                <span className={`font-bold ${getSentimentColor(article.sentimentScore)}`}>
                  {article.sentimentScore > 0 ? '+' : ''}{article.sentimentScore.toFixed(2)}
                </span>
                <span className="text-xs text-gray-400 flex items-center gap-1">
                  <Scale className="w-3 h-3" />
                  {article.impactWeight}x
                </span>
              </div>
            </div>
            
            <a 
              href={article.url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 mt-2"
            >
              Read more <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}
