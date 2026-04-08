import { useMemo } from "react";
import { Link } from "react-router-dom";

export default function SectorHeatmap({ stocks }) {
  const sectors = useMemo(() => {
    if (!stocks?.length) return [];

    // Group by sector
    const grouped = {};
    stocks.forEach((s) => {
      const sector = s.sector || "Unknown";
      if (!grouped[sector]) grouped[sector] = [];
      grouped[sector].push(s);
    });

    // Sort sectors by total market cap
    return Object.entries(grouped)
      .map(([name, items]) => ({
        name,
        stocks: items.sort((a, b) => (b.market_cap || 0) - (a.market_cap || 0)),
        totalCap: items.reduce((sum, s) => sum + (s.market_cap || 0), 0),
        avgChange: items.reduce((sum, s) => sum + (s.daily_change_pct || 0), 0) / items.length,
      }))
      .sort((a, b) => b.totalCap - a.totalCap);
  }, [stocks]);

  if (!sectors.length) return null;

  const maxCap = Math.max(...stocks.map((s) => s.market_cap || 0));

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

  function getSize(cap) {
    if (!cap || !maxCap) return "min-w-[80px] min-h-[60px]";
    const ratio = cap / maxCap;
    if (ratio > 0.5) return "min-w-[120px] min-h-[80px]";
    if (ratio > 0.2) return "min-w-[100px] min-h-[70px]";
    return "min-w-[80px] min-h-[60px]";
  }

  return (
    <div className="bg-bg-card border border-border rounded-xl p-4 mb-6">
      <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-4">
        Sector Heatmap
      </h3>
      <div className="space-y-4">
        {sectors.map((sector) => (
          <div key={sector.name}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-text-secondary">{sector.name}</span>
              <span className={`text-xs font-mono ${sector.avgChange >= 0 ? "text-gain" : "text-loss"}`}>
                Avg: {sector.avgChange >= 0 ? "+" : ""}{sector.avgChange.toFixed(2)}%
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {sector.stocks.map((stock) => (
                <Link
                  key={stock.ticker}
                  to={`/stock/${stock.ticker}`}
                  className={`${getSize(stock.market_cap)} ${getColor(stock.daily_change_pct)} border rounded-lg p-2 flex flex-col items-center justify-center text-center no-underline transition-all hover:scale-105 hover:z-10 flex-1`}
                >
                  <span className="font-mono text-xs font-semibold text-text-primary">{stock.ticker}</span>
                  <span className={`font-mono text-[11px] font-medium ${stock.daily_change_pct >= 0 ? "text-gain" : "text-loss"}`}>
                    {stock.daily_change_pct >= 0 ? "+" : ""}{stock.daily_change_pct}%
                  </span>
                </Link>
              ))}
            </div>
          </div>
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
