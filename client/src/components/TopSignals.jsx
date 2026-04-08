import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Zap, TrendingUp, TrendingDown, Minus, AlertTriangle, Loader2, ExternalLink, Target, Shield } from "lucide-react";
import { api } from "../lib/api";
import { usePortfolioContext } from "../hooks/PortfolioContext";

const ACTION_ORDER = { "STRONG BUY": 0, "BUY": 1, "HOLD": 2, "SELL": 3, "STRONG SELL": 4 };

function ConfluenceBar({ bullish, bearish }) {
  const total = bullish + bearish;
  if (!total) return null;
  const bullPct = (bullish / total) * 100;
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-bg-primary rounded-full overflow-hidden flex">
        <div className="bg-gain/60 h-full rounded-l-full" style={{ width: `${bullPct}%` }} />
        <div className="bg-loss/60 h-full rounded-r-full" style={{ width: `${100 - bullPct}%` }} />
      </div>
      <span className="text-[10px] text-text-muted font-mono shrink-0">{bullish}B / {bearish}S</span>
    </div>
  );
}

function SignalCard({ s, rank }) {
  const isBuy = s.action === "BUY" || s.action === "STRONG BUY";
  const isSell = s.action === "SELL" || s.action === "STRONG SELL";
  const borderColor = isBuy ? "border-l-gain" : isSell ? "border-l-loss" : "border-l-text-muted";

  return (
    <div className={`bg-bg-primary rounded-lg p-3 border-l-[3px] ${borderColor}`}>
      {/* Row 1: Ticker, Action, Price */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-text-muted w-5">#{rank}</span>
          <Link to={`/stock/${s.ticker}`} className="font-mono text-sm font-bold text-info no-underline hover:underline flex items-center gap-1">
            {s.ticker}<ExternalLink className="w-2.5 h-2.5" />
          </Link>
          <span className={`text-[11px] px-2 py-0.5 rounded-md font-mono font-bold ${
            isBuy ? "bg-gain/15 text-gain" : isSell ? "bg-loss/15 text-loss" : "bg-text-muted/10 text-text-secondary"
          }`}>
            {s.action}
          </span>
          <span className={`text-[10px] px-1.5 py-0.5 rounded ${
            s.confidence === "HIGH" ? "bg-gain/10 text-gain" :
            s.confidence === "MEDIUM" ? "bg-info/10 text-info" : "bg-bg-hover text-text-muted"
          }`}>
            {s.confidence}
          </span>
          {s.earnings_soon && (
            <span className="text-[10px] px-1.5 py-0.5 bg-warn/15 text-warn rounded-md flex items-center gap-0.5 font-medium">
              <AlertTriangle className="w-2.5 h-2.5" /> Earnings Soon
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span className="font-mono text-sm font-semibold text-text-primary">${s.price}</span>
          <span className={`font-mono text-xs font-medium ${s.daily_change_pct >= 0 ? "text-gain" : "text-loss"}`}>
            {s.daily_change_pct >= 0 ? "+" : ""}{s.daily_change_pct}%
          </span>
        </div>
      </div>

      {/* Row 2: Confluence + Key Metrics */}
      <div className="grid grid-cols-[1fr_auto] gap-4 mb-2">
        <ConfluenceBar bullish={s.bullish_count} bearish={s.bearish_count} />
        <div className="flex items-center gap-3 text-[10px] font-mono">
          <span className="flex items-center gap-0.5 text-gain"><Target className="w-3 h-3" />${s.target_price}</span>
          <span className="flex items-center gap-0.5 text-loss"><Shield className="w-3 h-3" />${s.stop_loss}</span>
          <span className="text-info">{s.risk_reward_ratio}</span>
        </div>
      </div>

      {/* Row 3: Score bar + metrics */}
      <div className="flex items-center gap-3 mb-2">
        <div className="flex-1 h-1.5 bg-bg-card rounded-full overflow-hidden relative">
          <div
            className={`h-full rounded-full ${s.score > 0 ? "bg-gain/50" : s.score < 0 ? "bg-loss/50" : "bg-text-muted/30"}`}
            style={{ width: `${Math.min(100, (Math.abs(s.score) / 10) * 100)}%` }}
          />
        </div>
        <span className={`text-[10px] font-mono font-semibold shrink-0 ${s.score > 0 ? "text-gain" : s.score < 0 ? "text-loss" : "text-text-muted"}`}>
          {s.score > 0 ? "+" : ""}{s.score}
        </span>
        <span className="text-[10px] text-text-muted font-mono shrink-0">RSI {s.rsi}</span>
      </div>

      {/* Row 4: Top reasons */}
      {s.top_reasons?.length > 0 && (
        <div className="space-y-0.5">
          {s.top_reasons.map((r, i) => (
            <div key={i} className="flex items-start gap-1.5 text-[11px] text-text-secondary">
              {isBuy ? <TrendingUp className="w-3 h-3 text-gain shrink-0 mt-px" /> :
               isSell ? <TrendingDown className="w-3 h-3 text-loss shrink-0 mt-px" /> :
               <Minus className="w-3 h-3 text-text-muted shrink-0 mt-px" />}
              {r}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SummaryBar({ data }) {
  const counts = useMemo(() => {
    const c = { buy: 0, hold: 0, sell: 0 };
    data.forEach((s) => {
      if (s.action === "BUY" || s.action === "STRONG BUY") c.buy++;
      else if (s.action === "SELL" || s.action === "STRONG SELL") c.sell++;
      else c.hold++;
    });
    return c;
  }, [data]);

  return (
    <div className="flex items-center gap-3 mb-4 pb-3 border-b border-border/50">
      <div className="flex items-center gap-4 text-xs">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-sm bg-gain/50" />
          <span className="text-text-secondary">Buy</span>
          <span className="font-mono font-bold text-gain">{counts.buy}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-sm bg-text-muted/30" />
          <span className="text-text-secondary">Hold</span>
          <span className="font-mono font-bold text-text-secondary">{counts.hold}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-sm bg-loss/50" />
          <span className="text-text-secondary">Sell</span>
          <span className="font-mono font-bold text-loss">{counts.sell}</span>
        </div>
      </div>
      <div className="flex-1 h-2 rounded-full overflow-hidden flex bg-bg-card">
        {counts.buy > 0 && <div className="bg-gain/50 h-full" style={{ width: `${(counts.buy / data.length) * 100}%` }} />}
        {counts.hold > 0 && <div className="bg-text-muted/20 h-full" style={{ width: `${(counts.hold / data.length) * 100}%` }} />}
        {counts.sell > 0 && <div className="bg-loss/50 h-full" style={{ width: `${(counts.sell / data.length) * 100}%` }} />}
      </div>
    </div>
  );
}

export default function TopSignals() {
  const { tickers } = usePortfolioContext();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const sorted = useMemo(() => {
    if (!data) return [];
    return [...data].sort((a, b) => {
      // First by action priority (BUY first, then HOLD, then SELL)
      const orderA = ACTION_ORDER[a.action] ?? 2;
      const orderB = ACTION_ORDER[b.action] ?? 2;
      if (orderA !== orderB) return orderA - orderB;
      // Then by absolute score (strongest first)
      return Math.abs(b.score) - Math.abs(a.score);
    });
  }, [data]);

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
        <button
          onClick={scan}
          disabled={loading}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-colors ${
            data ? "text-text-muted hover:text-text-secondary" : "bg-warn/10 hover:bg-warn/20 text-warn"
          }`}
        >
          {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3" />}
          {loading ? "Scanning..." : data ? "Rescan" : "Scan Portfolio"}
        </button>
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
        <p className="text-sm text-text-muted py-4 text-center">No signals detected. Market is quiet for your stocks.</p>
      )}

      {sorted.length > 0 && (
        <>
          <SummaryBar data={sorted} />
          <div className="space-y-2">
            {sorted.map((s, i) => (
              <SignalCard key={s.ticker} s={s} rank={i + 1} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
