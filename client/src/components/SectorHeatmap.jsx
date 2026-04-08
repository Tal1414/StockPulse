import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { BarChart3, Grid3X3 } from "lucide-react";

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

function Legend() {
  return (
    <div className="flex items-center justify-center gap-1 mt-4 pt-3 border-t border-border/50">
      <span className="text-[10px] text-text-muted mr-1">Loss</span>
      {["-3%+", "-1.5%", "-0.5%", "0%", "+0.5%", "+1.5%", "+3%+"].map((label, i) => {
        const colors = ["bg-loss/40", "bg-loss/25", "bg-loss/15", "bg-loss/8", "bg-gain/15", "bg-gain/25", "bg-gain/40"];
        return <div key={i} className={`w-6 h-3 rounded-sm ${colors[i]}`} title={label} />;
      })}
      <span className="text-[10px] text-text-muted ml-1">Gain</span>
    </div>
  );
}

function SectorOverview({ sectors }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
      {sectors.map((sector) => (
        <div
          key={sector.name}
          className={`${getColor(sector.avgChange)} border rounded-xl p-4 flex flex-col items-center justify-center text-center`}
        >
          <span className="text-xs font-medium text-text-primary mb-1">{sector.name}</span>
          <span className={`font-mono text-lg font-bold ${sector.avgChange >= 0 ? "text-gain" : "text-loss"}`}>
            {sector.avgChange >= 0 ? "+" : ""}{sector.avgChange.toFixed(2)}%
          </span>
          <span className="text-[10px] text-text-muted mt-1">{sector.count} stock{sector.count !== 1 ? "s" : ""}</span>
        </div>
      ))}
    </div>
  );
}

function StockHeatmap({ stocks }) {
  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-1.5">
      {stocks.map((stock) => (
        <Link
          key={stock.ticker}
          to={`/stock/${stock.ticker}`}
          className={`${getColor(stock.daily_change_pct)} border rounded-lg p-2.5 flex flex-col items-center justify-center text-center no-underline transition-all hover:scale-105 hover:z-10`}
        >
          <span className="font-mono text-xs font-semibold text-text-primary">{stock.ticker}</span>
          <span className={`font-mono text-[11px] font-medium ${stock.daily_change_pct >= 0 ? "text-gain" : "text-loss"}`}>
            {stock.daily_change_pct >= 0 ? "+" : ""}{stock.daily_change_pct}%
          </span>
          <span className="text-[9px] text-text-muted mt-0.5 truncate w-full">{stock.sector || ""}</span>
        </Link>
      ))}
    </div>
  );
}

export default function SectorHeatmap({ stocks }) {
  const [view, setView] = useState("sectors");

  const sectors = useMemo(() => {
    if (!stocks?.length) return [];
    const grouped = {};
    stocks.forEach((s) => {
      const sector = s.sector || "Unknown";
      if (!grouped[sector]) grouped[sector] = { stocks: [], totalChange: 0 };
      grouped[sector].stocks.push(s);
      grouped[sector].totalChange += s.daily_change_pct || 0;
    });

    return Object.entries(grouped)
      .map(([name, data]) => ({
        name,
        count: data.stocks.length,
        avgChange: data.totalChange / data.stocks.length,
      }))
      .sort((a, b) => b.avgChange - a.avgChange);
  }, [stocks]);

  const sortedStocks = useMemo(() => {
    if (!stocks?.length) return [];
    return [...stocks].sort((a, b) => (b.daily_change_pct || 0) - (a.daily_change_pct || 0));
  }, [stocks]);

  if (!stocks?.length) return null;

  return (
    <div className="bg-bg-card border border-border rounded-xl p-4 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider">Heatmap</h3>
        <div className="flex gap-1">
          <button
            onClick={() => setView("sectors")}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs transition-colors ${
              view === "sectors" ? "bg-info/10 text-info" : "text-text-muted hover:text-text-secondary"
            }`}
          >
            <BarChart3 className="w-3 h-3" />
            Sectors
          </button>
          <button
            onClick={() => setView("stocks")}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs transition-colors ${
              view === "stocks" ? "bg-info/10 text-info" : "text-text-muted hover:text-text-secondary"
            }`}
          >
            <Grid3X3 className="w-3 h-3" />
            Stocks
          </button>
        </div>
      </div>

      {view === "sectors" ? (
        <SectorOverview sectors={sectors} />
      ) : (
        <StockHeatmap stocks={sortedStocks} />
      )}

      <Legend />
    </div>
  );
}
