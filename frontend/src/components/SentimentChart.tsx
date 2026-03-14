import {
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Area,
  AreaChart,
  CartesianGrid,
} from "recharts";
import type { MarketSignal } from "../types";
import { LineChart as ChartIcon } from "lucide-react";

interface ChartProps {
  data: MarketSignal[];
}

export function SentimentChart({ data }: ChartProps) {
  const chartData = data
    .map((signal) => ({
      timestamp: new Date(signal.timestamp).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      sentiment: signal.overallScore,
      nepse: signal.nepseIndexAtTime,
    }))
    .reverse();

  return (
    <div className="flex flex-col h-full uppercase tracking-tighter">
      <div className="flex items-center justify-between mb-8 px-2">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-[var(--surface)] shadow-sm rounded-xl border border-[var(--border)] text-[var(--primary)]">
            <ChartIcon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xl font-black font-display tracking-tight">
              Market Momentum
            </h3>
            <p className="text-[10px] text-[var(--secondary)] font-bold opacity-70 italic uppercase tracking-widest">
              Sentiment vs Price Correlation
            </p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-3 h-1 rounded-full bg-[var(--primary)]"></div>
            <span className="text-[10px] font-black text-[var(--text)]">
              Sentiment
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-1 rounded-full bg-[var(--accent)]"></div>
            <span className="text-[10px] font-black text-[var(--text)]">
              NEPSE
            </span>
          </div>
        </div>
      </div>

      <div className="flex-1 bg-[var(--surface)] border border-[var(--border)] rounded-3xl p-6 shadow-inner overflow-hidden">
        <ResponsiveContainer width="100%" height={340}>
          <AreaChart
            data={chartData}
            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
          >
            <defs>
              <linearGradient id="colorSentiment" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--primary)"
                  stopOpacity={0.2}
                />
                <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorNepse" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.1} />
                <stop offset="95%" stopColor="var(--accent)" stopOpacity={0} />
              </linearGradient>
            </defs>

            <CartesianGrid
              strokeDasharray="10 10"
              vertical={false}
              stroke="var(--border)"
              strokeOpacity={0.3}
            />

            <XAxis
              dataKey="timestamp"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "var(--secondary)", fontSize: 10, fontWeight: 800 }}
              dy={10}
            />

            <YAxis
              yAxisId="sentiment"
              domain={[-1, 1]}
              axisLine={false}
              tickLine={false}
              tick={{ fill: "var(--primary)", fontSize: 9, fontWeight: 800 }}
              tickCount={5}
            />

            <YAxis
              yAxisId="nepse"
              orientation="right"
              domain={["dataMin - 20", "dataMax + 20"]}
              hide={true}
            />

            <Tooltip
              cursor={{
                stroke: "var(--primary)",
                strokeWidth: 1,
                strokeDasharray: "4 4",
              }}
              contentStyle={{
                backgroundColor: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: "16px",
                boxShadow: "var(--shadow)",
                padding: "12px",
                color: "var(--text)",
              }}
              itemStyle={{ color: "var(--text)" }}
              labelStyle={{ display: "none" }}
            />

            <ReferenceLine
              yAxisId="sentiment"
              y={0}
              stroke="var(--border)"
              strokeWidth={1}
            />

            <Area
              yAxisId="sentiment"
              type="monotone"
              dataKey="sentiment"
              stroke="var(--primary)"
              strokeWidth={4}
              fillOpacity={1}
              fill="url(#colorSentiment)"
              dot={{
                r: 6,
                fill: "var(--surface)",
                stroke: "var(--primary)",
                strokeWidth: 3,
              }}
              activeDot={{
                r: 8,
                fill: "var(--primary)",
                stroke: "var(--surface)",
                strokeWidth: 2,
              }}
            />

            <Area
              yAxisId="nepse"
              type="monotone"
              dataKey="nepse"
              stroke="var(--accent)"
              strokeWidth={2}
              strokeDasharray="5 5"
              fillOpacity={1}
              fill="url(#colorNepse)"
              dot={{ r: 3, fill: "var(--accent)", stroke: "var(--surface)" }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 flex items-center justify-center gap-4 opacity-50">
        <div className="h-px bg-[var(--border)] flex-1"></div>
        <span className="text-[8px] font-black uppercase tracking-[0.3em]">
          Real-time Market Analytics
        </span>
        <div className="h-px bg-[var(--border)] flex-1"></div>
      </div>
    </div>
  );
}
