import { useMemo } from "react";
import { Link } from "react-router-dom";

function getColor(changePct) {
  if (changePct >= 3) return "bg-gain/40 border-gain/50";
  if (changePct >= 1.5) return "bg-gain/25 border-gain/30";
  if (changePct >= 0.5) return "bg-gain/15 border-gain/20";
  if (changePct >= 0) return "bg-gain/8 border-gain/10";
  if (changePct >= -0.5) return "bg-loss/8 border-loss/10";
  if (changePct >= -1.5) return "bg-loss/15 border-loss/20";
  if (changePct >= -3) return "bg-loss/25 border-loss/30";
  return "bg-loss/40 border-loss/50";
}

function SectorBar({ sectors }) {
  if (!sectors.length) return null;
  return (
    <div className="flex flex-wrap gap-2 mb-4">
      {sectors.map((s) => (
        <div key={s.name} className="flex items-center gap-2 px-3 py-1.5 bg-bg-primary rounded-lg border border-border/50">
          <span className="text-xs text-text-secondary">{s.name}</span>
          <span className={`font-mono text-xs font-semibold ${s.avgChange >= 0 ? "text-gain" : "text-loss"}`}>
            {s.avgChange >= 0 ? "+" : ""}{s.avgChange.toFixed(2)}%
          </span>
        </div>
      ))}
    </div>
  );
}

export default function SectorHeatmap({ stocks }) {
  const sectors = useMemo(() => {
    if (!stocks?.length) return [];
    const grouped = {};
    stocks.forEach((s) => {
      const sector = s.sector || "Unknown";
      if (!grouped[sector]) grouped[sector] = { total: 0, count: 0 };
      grouped[sector].total += s.daily_change_pct || 0;
      grouped[sector].count++;
    });
    return Object.entries(grouped)
      .map(([name, d]) => ({ name, avgChange: d.total / d.count }))
      .sort((a, b) => b.avgChange - a.avgChange);
  }, [stocks]);

  const sortedStocks = useMemo(() => {
    if (!stocks?.length) return [];
    return [...stocks].sort((a, b) => (b.daily_change_pct || 0) - (a.daily_change_pct || 0));
  }, [stocks]);

  if (!stocks?.length) return null;

  return (
    <div className="bg-bg-card border border-border rounded-xl p-4 mb-6">
      <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-3">Heatmap</h3>

      <SectorBar sectors={sectors} />

      <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-1.5">
        {sortedStocks.map((stock) => (
          <Link
            key={stock.ticker}
            to={`/stock/${stock.ticker}`}
            className={`${getColor(stock.daily_change_pct)} border rounded-lg p-2.5 flex flex-col items-center justify-center text-center no-underline transition-all hover:scale-105 hover:z-10`}
          >
            <span className="font-mono text-xs font-semibold text-text-primary">{stock.ticker}</span>
            <span className={`font-mono text-[11px] font-medium ${stock.daily_change_pct >= 0 ? "text-gain" : "text-loss"}`}>
              {stock.daily_change_pct >= 0 ? "+" : ""}{stock.daily_change_pct}%
            </span>
          </Link>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-1 mt-4 pt-3 border-t border-border/50">
        <span className="text-[10px] text-text-muted mr-1">Loss</span>
        {["-3%+", "-1.5%", "-0.5%", "0%", "+0.5%", "+1.5%", "+3%+"].map((label, i) => {
          const colors = ["bg-loss/40", "bg-loss/25", "bg-loss/15", "bg-loss/8", "bg-gain/15", "bg-gain/25", "bg-gain/40"];
          return <div key={i} className={`w-6 h-3 rounded-sm ${colors[i]}`} title={label} />;
        })}
        <span className="text-[10px] text-text-muted ml-1">Gain</span>
      </div>
    </div>
  );
}
