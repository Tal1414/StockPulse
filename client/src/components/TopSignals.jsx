import { useState } from "react";
import { Link } from "react-router-dom";
import { Zap, TrendingUp, TrendingDown, AlertTriangle, Loader2, ExternalLink } from "lucide-react";
import { api } from "../lib/api";
import { usePortfolioContext } from "../hooks/PortfolioContext";

function ConfluenceBar({ bullish, bearish }) {
  const total = bullish + bearish;
  if (!total) return null;
  const bullPct = (bullish / total) * 100;
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-bg-primary rounded-full overflow-hidden flex">
        <div className="bg-gain/60 h-full" style={{ width: `${bullPct}%` }} />
        <div className="bg-loss/60 h-full" style={{ width: `${100 - bullPct}%` }} />
      </div>
      <span className="text-[10px] text-text-muted font-mono">{bullish}B/{bearish}S</span>
    </div>
  );
}

export default function TopSignals() {
  const { tickers } = usePortfolioContext();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const scan = async () => {
    if (!tickers.length) return;
    setLoading(true);
    try {
      const result = await api.getTopSignals(tickers);
      setData(result);
    } catch {
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  if (!tickers.length) return null;

  return (
    <div className="bg-bg-card border border-border rounded-xl p-4 mb-6">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider flex items-center gap-2">
          <Zap className="w-4 h-4 text-warn" />
          Top Signals
        </h3>
        {!data && (
          <button
            onClick={scan}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1 bg-warn/10 hover:bg-warn/20 text-warn rounded-md text-xs font-medium transition-colors"
          >
            {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3" />}
            {loading ? "Scanning..." : "Scan Portfolio"}
          </button>
        )}
        {data && (
          <button
            onClick={scan}
            disabled={loading}
            className="text-xs text-text-muted hover:text-text-secondary"
          >
            {loading ? "Scanning..." : "Rescan"}
          </button>
        )}
      </div>

      {loading && !data && (
        <div className="text-center py-6">
          <Loader2 className="w-6 h-6 text-warn mx-auto animate-spin mb-2" />
          <p className="text-xs text-text-muted">Analyzing {tickers.length} stocks...</p>
        </div>
      )}

      {!data && !loading && (
        <p className="text-xs text-text-muted">Scans your portfolio for the strongest buy/sell signals based on technical confluence.</p>
      )}

      {data && data.length === 0 && (
        <p className="text-sm text-text-muted py-4 text-center">No strong signals right now. Market is quiet for your stocks.</p>
      )}

      {data && data.length > 0 && (
        <div className="space-y-2">
          {data.map((s) => {
            const isBuy = s.action === "BUY" || s.action === "STRONG BUY";
            return (
              <div key={s.ticker} className="bg-bg-primary rounded-lg p-3">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <Link to={`/stock/${s.ticker}`} className="font-mono text-sm font-semibold text-info no-underline hover:underline flex items-center gap-1">
                      {s.ticker}<ExternalLink className="w-2.5 h-2.5" />
                    </Link>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-semibold ${
                      isBuy ? "bg-gain/10 text-gain" : s.action === "SELL" ? "bg-loss/10 text-loss" : "bg-warn/10 text-warn"
                    }`}>
                      {s.action}
                    </span>
                    <span className="text-[10px] text-text-muted">{s.confidence}</span>
                    {s.earnings_soon && (
                      <span className="text-[10px] px-1.5 py-0.5 bg-warn/10 text-warn rounded flex items-center gap-0.5">
                        <AlertTriangle className="w-2.5 h-2.5" /> Earnings
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-text-primary">${s.price}</span>
                    <span className={`font-mono text-xs ${s.daily_change_pct >= 0 ? "text-gain" : "text-loss"}`}>
                      {s.daily_change_pct >= 0 ? "+" : ""}{s.daily_change_pct}%
                    </span>
                  </div>
                </div>

                <ConfluenceBar bullish={s.bullish_count} bearish={s.bearish_count} />

                <div className="flex items-center gap-3 mt-1.5 text-[10px] text-text-muted font-mono">
                  <span>Score: <span className={s.score > 0 ? "text-gain" : s.score < 0 ? "text-loss" : ""}>{s.score > 0 ? "+" : ""}{s.score}</span></span>
                  <span>RSI: {s.rsi}</span>
                  <span>Confluence: {s.confluence_pct}%</span>
                  <span>R/R: {s.risk_reward_ratio}</span>
                </div>

                {s.top_reasons?.length > 0 && (
                  <div className="mt-1.5 space-y-0.5">
                    {s.top_reasons.map((r, i) => (
                      <div key={i} className="flex items-start gap-1.5 text-[11px] text-text-secondary">
                        {isBuy ? <TrendingUp className="w-3 h-3 text-gain shrink-0 mt-px" /> : <TrendingDown className="w-3 h-3 text-loss shrink-0 mt-px" />}
                        {r}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
