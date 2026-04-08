import { useApi } from "../hooks/useApi";
import { api } from "../lib/api";

export default function MarketBar() {
  const { data, loading } = useApi(() => api.getMarketSummary(), []);

  if (loading) {
    return (
      <div className="flex gap-4 overflow-x-auto pb-2 mb-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-14 w-36 bg-bg-card rounded-lg animate-pulse shrink-0" />
        ))}
      </div>
    );
  }

  if (!data || !data.length) return null;

  return (
    <div className="flex gap-3 overflow-x-auto pb-2 mb-6 scrollbar-hide">
      {data.map((item) => (
        <div
          key={item.symbol}
          className="bg-bg-card border border-border rounded-lg px-4 py-2 shrink-0 min-w-[130px]"
        >
          <div className="text-xs text-text-secondary mb-1">{item.name}</div>
          <div className="font-mono text-sm font-medium">{item.price.toLocaleString()}</div>
          <div className={`font-mono text-xs ${item.change >= 0 ? "text-gain" : "text-loss"}`}>
            {item.change >= 0 ? "+" : ""}
            {item.change_pct}%
          </div>
        </div>
      ))}
    </div>
  );
}
