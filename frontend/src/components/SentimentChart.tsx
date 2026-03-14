import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend,
  ReferenceLine
} from 'recharts';
import type { MarketSignal } from '../types';

interface ChartProps {
  data: MarketSignal[];
}

export function SentimentChart({ data }: ChartProps) {
  const chartData = data.map(signal => ({
    timestamp: new Date(signal.timestamp).toLocaleDateString(),
    sentiment: signal.overallScore,
    nepse: signal.nepseIndexAtTime,
  })).reverse();

  return (
    <div className="bg-gray-800 rounded-xl p-6">
      <h3 className="text-lg font-semibold mb-4">Sentiment vs NEPSE Index</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis 
            dataKey="timestamp" 
            stroke="#9ca3af"
            tick={{ fill: '#9ca3af' }}
          />
          <YAxis 
            yAxisId="sentiment" 
            domain={[-1, 1]} 
            stroke="#22c55e"
            tick={{ fill: '#22c55e' }}
          />
          <YAxis 
            yAxisId="nepse" 
            orientation="right" 
            domain={['dataMin - 100', 'dataMax + 100']}
            stroke="#3b82f6"
            tick={{ fill: '#3b82f6' }}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: '#1f2937', 
              border: 'none',
              borderRadius: '8px'
            }}
          />
          <Legend />
          <ReferenceLine yAxisId="sentiment" y={0} stroke="#6b7280" strokeDasharray="3 3" />
          <Line 
            yAxisId="sentiment"
            type="monotone" 
            dataKey="sentiment" 
            stroke="#22c55e" 
            strokeWidth={2}
            dot={{ fill: '#22c55e' }}
            name="Sentiment Score"
          />
          <Line 
            yAxisId="nepse"
            type="monotone" 
            dataKey="nepse" 
            stroke="#3b82f6" 
            strokeWidth={2}
            dot={{ fill: '#3b82f6' }}
            name="NEPSE Index"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
