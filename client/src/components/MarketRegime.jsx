import { useState } from "react";
import { Activity, TrendingUp, TrendingDown, AlertTriangle, Shield, ChevronDown, ChevronUp } from "lucide-react";
import { useApi } from "../hooks/useApi";
import { api } from "../lib/api";

const regimeIcons = {
  "STRONG BULL": TrendingUp,
  "BULL": TrendingUp,
  "NEUTRAL": Activity,
  "BEAR": TrendingDown,
  "STRONG BEAR": TrendingDown,
};

const regimeColors = {
  "STRONG BULL": "text-gain bg-gain/10 border-gain/20",
  "BULL": "text-gain bg-gain/5 border-gain/15",
  "NEUTRAL": "text-warn bg-warn/5 border-warn/15",
  "BEAR": "text-loss bg-loss/5 border-loss/15",
  "STRONG BEAR": "text-loss bg-loss/10 border-loss/20",
};

export default function MarketRegime() {
  const { data, loading } = useApi(() => api.getMarketRegime(), []);
  const [expanded, setExpanded] = useState(false);

  if (loading) {
    return (
      <div className="bg-bg-card border border-border rounded-xl p-4 mb-6 animate-pulse">
        <div className="h-6 w-48 bg-bg-hover rounded mb-2" />
        <div className="h-4 w-72 bg-bg-hover rounded" />
      </div>
    );
  }

  if (!data || data.error) return null;

  const Icon = regimeIcons[data.regime] || Activity;
  const colorClass = regimeColors[data.regime] || regimeColors.NEUTRAL;

  return (
    <div className="bg-bg-card border border-border rounded-xl p-4 mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm font-semibold ${colorClass}`}>
            <Icon className="w-4 h-4" />
            {data.regime}
          </div>
          <p className="text-sm text-text-secondary hidden sm:block">{data.description}</p>
        </div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-text-muted hover:text-text-secondary p-1"
        >
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      <p className="text-sm text-text-secondary sm:hidden mt-2">{data.description}</p>

      {expanded && (
        <div className="mt-4 pt-4 border-t border-border/50">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* S&P 500 */}
            <div className="bg-bg-primary rounded-lg p-3">
              <div className="text-[10px] text-text-muted uppercase tracking-wider">S&P 500</div>
              <div className="font-mono text-sm font-semibold">{data.sp500.price.toLocaleString()}</div>
              <div className="text-xs text-text-muted mt-1">
                <span className={data.sp500.return_1m >= 0 ? "text-gain" : "text-loss"}>
                  1M: {data.sp500.return_1m >= 0 ? "+" : ""}{data.sp500.return_1m}%
                </span>
                {" · "}
                <span className={data.sp500.return_3m >= 0 ? "text-gain" : "text-loss"}>
                  3M: {data.sp500.return_3m >= 0 ? "+" : ""}{data.sp500.return_3m}%
                </span>
              </div>
              <div className="text-[10px] text-text-muted mt-0.5">
                RSI: {data.sp500.rsi} · {data.sp500.pct_from_high}% from high
              </div>
            </div>

            {/* VIX */}
            <div className="bg-bg-primary rounded-lg p-3">
              <div className="text-[10px] text-text-muted uppercase tracking-wider">VIX (Fear)</div>
              <div className={`font-mono text-sm font-semibold ${
                data.vix.level === "LOW" ? "text-gain" :
                data.vix.level === "ELEVATED" ? "text-warn" : "text-loss"
              }`}>
                {data.vix.price}
              </div>
              <div className={`text-xs mt-1 ${
                data.vix.level === "LOW" ? "text-gain" :
                data.vix.level === "ELEVATED" ? "text-warn" : "text-loss"
              }`}>
                {data.vix.level}
              </div>
              <div className="text-[10px] text-text-muted mt-0.5">Avg: {data.vix.sma_10}</div>
            </div>

            {/* Breadth */}
            <div className="bg-bg-primary rounded-lg p-3">
              <div className="text-[10px] text-text-muted uppercase tracking-wider">Breadth</div>
              <div className={`font-mono text-sm font-semibold ${
                data.breadth.above_sma50_pct > 60 ? "text-gain" :
                data.breadth.above_sma50_pct > 40 ? "text-warn" : "text-loss"
              }`}>
                {data.breadth.above_sma50_pct}%
              </div>
              <div className="text-xs text-text-muted mt-1">{data.breadth.interpretation}</div>
              <div className="text-[10px] text-text-muted mt-0.5">Stocks above SMA 50</div>
            </div>

            {/* Regime Score */}
            <div className="bg-bg-primary rounded-lg p-3">
              <div className="text-[10px] text-text-muted uppercase tracking-wider">Regime Score</div>
              <div className={`font-mono text-sm font-semibold ${
                data.regime_score > 2 ? "text-gain" :
                data.regime_score > 0 ? "text-warn" : "text-loss"
              }`}>
                {data.regime_score > 0 ? "+" : ""}{data.regime_score}
              </div>
              <div className="text-xs text-text-muted mt-1">
                {data.regime_score > 0 ? "Favorable" : data.regime_score === 0 ? "Neutral" : "Unfavorable"}
              </div>
              <div className="text-[10px] text-text-muted mt-0.5">Range: -8 to +8</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
