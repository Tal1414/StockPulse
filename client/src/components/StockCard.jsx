import { Link } from "react-router-dom";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import Sparkline from "./Sparkline";

export default function StockCard({ stock }) {
  const isUp = stock.daily_change_pct >= 0;
  const isFlat = stock.daily_change_pct === 0;

  return (
    <Link
      to={`/stock/${stock.ticker}`}
      className="bg-bg-card border border-border rounded-xl p-4 hover:bg-bg-hover hover:border-info/30 transition-all duration-200 no-underline block group"
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="font-mono font-semibold text-base text-text-primary group-hover:text-info transition-colors">
            {stock.ticker}
          </div>
          <div className="text-xs text-text-secondary truncate max-w-[140px]">{stock.company_name}</div>
        </div>
        <div
          className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-mono ${
            isFlat ? "bg-text-muted/20 text-text-secondary" : isUp ? "bg-gain/10 text-gain" : "bg-loss/10 text-loss"
          }`}
        >
          {isFlat ? <Minus className="w-3 h-3" /> : isUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          {isUp ? "+" : ""}
          {stock.daily_change_pct}%
        </div>
      </div>
      <div className="flex items-end justify-between">
        <div className="font-mono text-xl font-semibold">${stock.price.toLocaleString()}</div>
        {stock.sparkline && stock.sparkline.length > 1 && (
          <Sparkline data={stock.sparkline} isUp={isUp} />
        )}
      </div>
      {/* Extended Hours - always show when data available */}
      {stock.extended_hours && (stock.extended_hours.pre_market || stock.extended_hours.post_market) && (
        <div className="mt-2 pt-2 border-t border-border/50 space-y-1">
          {stock.extended_hours.pre_market && (
            <div className="flex items-center justify-between text-xs">
              <span className={`${stock.market_state === "PRE" ? "text-info font-medium" : "text-text-muted"}`}>
                Pre-Mkt {stock.market_state === "PRE" && "(Live)"}
              </span>
              <div className="flex items-center gap-2 font-mono">
                <span className="text-text-primary">${stock.extended_hours.pre_market.price}</span>
                <span className={stock.extended_hours.pre_market.change_pct >= 0 ? "text-gain" : "text-loss"}>
                  {stock.extended_hours.pre_market.change_pct >= 0 ? "+" : ""}{stock.extended_hours.pre_market.change_pct}%
                </span>
              </div>
            </div>
          )}
          {stock.extended_hours.post_market && (
            <div className="flex items-center justify-between text-xs">
              <span className={`${stock.market_state === "POST" || stock.market_state === "POSTPOST" ? "text-warn font-medium" : "text-text-muted"}`}>
                After-Hrs {(stock.market_state === "POST" || stock.market_state === "POSTPOST") && "(Live)"}
              </span>
              <div className="flex items-center gap-2 font-mono">
                <span className="text-text-primary">${stock.extended_hours.post_market.price}</span>
                <span className={stock.extended_hours.post_market.change_pct >= 0 ? "text-gain" : "text-loss"}>
                  {stock.extended_hours.post_market.change_pct >= 0 ? "+" : ""}{stock.extended_hours.post_market.change_pct}%
                </span>
              </div>
            </div>
          )}
        </div>
      )}
      <div className="mt-2 flex items-center gap-2 text-xs text-text-muted">
        <span>Vol: {(stock.volume / 1e6).toFixed(1)}M</span>
        <span>RSI: {stock.rsi_14}</span>
        {stock.market_state && stock.market_state !== "REGULAR" && (
          <span className={`ml-auto px-1.5 py-0.5 rounded text-[10px] font-mono uppercase ${
            stock.market_state === "PRE" ? "bg-info/10 text-info" :
            stock.market_state === "POST" || stock.market_state === "POSTPOST" ? "bg-warn/10 text-warn" :
            "bg-text-muted/10 text-text-muted"
          }`}>
            {stock.market_state === "PRE" ? "Pre" : stock.market_state === "POST" || stock.market_state === "POSTPOST" ? "AH" : stock.market_state === "CLOSED" ? "Closed" : stock.market_state}
          </span>
        )}
      </div>
    </Link>
  );
}
