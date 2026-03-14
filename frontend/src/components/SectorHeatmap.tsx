import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import type { Article } from "../types";
import { Layers } from "lucide-react";
import { getSentimentColor } from "../utils/theme";

interface SectorHeatmapProps {
  articles: Article[];
}

export function SectorHeatmap({ articles }: SectorHeatmapProps) {
  // Aggregate articles by sector
  const sectorDataMap = articles.reduce(
    (acc, article) => {
      const sector = article.sector || "Unassigned";
      if (!acc[sector]) {
        acc[sector] = { name: sector, count: 0, score: 0 };
      }
      acc[sector].count += 1;
      acc[sector].score += article.sentimentScore;
      return acc;
    },
    {} as Record<string, { name: string; count: number; score: number }>,
  );

  const data = Object.values(sectorDataMap)
    .map((s) => ({
      name: s.name,
      value: s.count,
      avgScore: s.score / s.count,
    }))
    .sort((a, b) => b.value - a.value);

  return (
    <div className="flex flex-col h-full uppercase tracking-tighter">
      <div className="flex items-center gap-3 mb-8 px-2">
        <div className="p-2.5 bg-[var(--surface)] shadow-sm rounded-xl border border-[var(--border)] text-[var(--primary)]">
          <Layers className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-xl font-black font-display tracking-tight">
            Sector Activity
          </h3>
          <p className="text-[10px] text-[var(--secondary)] font-bold opacity-70 italic uppercase tracking-widest">
            News distribution by industry
          </p>
        </div>
      </div>

      <div className="flex-1 min-h-[300px] flex flex-col justify-center">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div className="h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {data.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={getSentimentColor(entry.avgScore)}
                      fillOpacity={0.8}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--surface)",
                    borderRadius: "12px",
                    border: "1px solid var(--border)",
                    boxShadow: "var(--shadow)",
                    fontSize: "10px",
                    fontWeight: "bold",
                    color: "var(--text)",
                  }}
                  itemStyle={{ color: "var(--text)" }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-3">
            {data.slice(0, 5).map((sector, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-2 rounded-xl bg-[var(--background)] border border-[var(--border)]"
              >
                <div className="flex items-center gap-2">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{
                      backgroundColor: getSentimentColor(sector.avgScore),
                    }}
                  ></div>
                  <span className="text-[10px] font-black">{sector.name}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-bold text-[var(--secondary)]">
                    {sector.value} Art.
                  </span>
                  <span
                    className="text-[10px] font-black"
                    style={{ color: getSentimentColor(sector.avgScore) }}
                  >
                    {sector.avgScore > 0 ? "+" : ""}
                    {sector.avgScore.toFixed(1)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
