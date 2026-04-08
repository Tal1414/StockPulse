import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Search, Loader2, TrendingUp, TrendingDown, AlertTriangle, RefreshCw,
  ExternalLink, Target, Shield, BarChart3, Activity,
} from "lucide-react";
import { api } from "../lib/api";
import { usePortfolioContext } from "../hooks/PortfolioContext";
import Sparkline from "../components/Sparkline";

function ScoreBadge({ score }) {
  const color = score >= 5 ? "text-gain bg-gain/10" : score >= 3 ? "text-info bg-info/10" : "text-warn bg-warn/10";
  return (
    <span className={`font-mono text-xs font-semibold px-2 py-0.5 rounded-md ${color}`}>
      {score > 0 ? "+" : ""}{score}
    </span>
  );
}

function ActionBadge({ action, confidence }) {
  const color =
    action === "STRONG BUY" ? "bg-gain/20 text-gain border-gain/30" :
    action === "BUY" ? "bg-gain/10 text-gain border-gain/20" :
    "bg-warn/10 text-warn border-warn/20";
  return (
    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-mono font-semibold ${color}`}>
      {action}
      <span className="opacity-60 font-normal">{confidence}</span>
    </div>
  );
}

function SetupTag({ type }) {
  const colors = {
    "Oversold Bounce": "bg-gain/10 text-gain",
    "Momentum Shift": "bg-info/10 text-info",
    "Breakout": "bg-warn/10 text-warn",
    "Support Bounce": "bg-info/10 text-info",
    "Value": "bg-text-muted/10 text-text-secondary",
    "Technical": "bg-bg-hover text-text-secondary",
  };
  return (
    <span className={`text-[10px] px-1.5 py-0.5 rounded ${colors[type] || colors.Technical}`}>{type}</span>
  );
}

export default function Opportunities() {
  const { tickers } = usePortfolioContext();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const scan = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await api.getOpportunities(tickers);
      setData(result);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const formatCap = (cap) => {
    if (!cap) return "N/A";
    if (cap >= 1e12) return `$${(cap / 1e12).toFixed(1)}T`;
    if (cap >= 1e9) return `$${(cap / 1e9).toFixed(1)}B`;
    if (cap >= 1e6) return `$${(cap / 1e6).toFixed(0)}M`;
    return `$${cap}`;
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Opportunities</h1>
          <p className="text-sm text-text-secondary">Technical setups with full analysis across 40 major stocks</p>
        </div>
        <button
          onClick={scan}
          disabled={loading}
          className="flex items-center gap-2 bg-info hover:bg-info/80 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : data ? <RefreshCw className="w-4 h-4" /> : <Search className="w-4 h-4" />}
          {loading ? "Scanning..." : data ? "Rescan" : "Find Opportunities"}
        </button>
      </div>

      {error && (
        <div className="bg-loss/10 border border-loss/20 rounded-lg p-4 text-loss text-sm mb-6">
          <AlertTriangle className="w-4 h-4 inline mr-2" />{error}
        </div>
      )}

      {!data && !loading && (
        <div className="text-center py-20">
          <Search className="w-16 h-16 text-text-muted mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Discover Opportunities</h2>
          <p className="text-text-secondary mb-6 max-w-lg mx-auto">
            Scans 40 major stocks for oversold bounces, momentum shifts, breakouts, and value plays.
            Each opportunity includes full technical analysis, target prices, and risk assessment.
          </p>
          <button
            onClick={scan}
            className="inline-flex items-center gap-2 bg-info hover:bg-info/80 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            <Search className="w-5 h-5" />
            Start Scanning
          </button>
        </div>
      )}

      {loading && (
        <div className="text-center py-20">
          <Loader2 className="w-12 h-12 text-info mx-auto mb-4 animate-spin" />
          <p className="text-text-secondary">Analyzing 40 stocks with full technical indicators...</p>
          <p className="text-text-muted text-sm mt-1">This may take 1-2 minutes</p>
        </div>
      )}

      {data && !loading && (
        <div>
          {data.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-text-secondary">No strong setups found right now. Try again later.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {data.map((opp) => {
                const isUp = opp.daily_change_pct >= 0;
                return (
                  <div key={opp.ticker} className="bg-bg-card border border-border rounded-xl p-5 hover:border-info/30 transition-colors">
                    {/* Header row */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-start gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <Link
                              to={`/stock/${opp.ticker}`}
                              className="font-mono text-xl font-semibold text-info hover:underline no-underline flex items-center gap-1"
                            >
                              {opp.ticker}
                              <ExternalLink className="w-3.5 h-3.5" />
                            </Link>
                            <ActionBadge action={opp.action} confidence={opp.confidence} />
                            <ScoreBadge score={opp.score} />
                          </div>
                          <div className="text-sm text-text-secondary">{opp.company_name}</div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-text-muted">{opp.sector}</span>
                            {opp.setup_type?.map((t, i) => <SetupTag key={i} type={t} />)}
                          </div>
                        </div>
                      </div>
                      <div className="text-right flex items-center gap-3">
                        {opp.sparkline && <Sparkline data={opp.sparkline} isUp={isUp} width={90} height={36} />}
                        <div>
                          <div className="font-mono text-xl font-semibold">${opp.price}</div>
                          <div className={`font-mono text-sm ${isUp ? "text-gain" : "text-loss"}`}>
                            {isUp ? "+" : ""}{opp.daily_change_pct}%
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Metrics grid */}
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-3">
                      <div className="bg-bg-primary rounded-lg p-2 text-center">
                        <div className="text-[10px] text-text-muted">RSI</div>
                        <div className={`font-mono text-sm font-medium ${opp.rsi < 30 ? "text-gain" : opp.rsi > 70 ? "text-loss" : "text-text-primary"}`}>{opp.rsi}</div>
                      </div>
                      <div className="bg-bg-primary rounded-lg p-2 text-center">
                        <div className="text-[10px] text-text-muted">MACD</div>
                        <div className={`font-mono text-sm font-medium ${opp.macd_histogram > 0 ? "text-gain" : "text-loss"}`}>{opp.macd_histogram > 0 ? "+" : ""}{opp.macd_histogram}</div>
                      </div>
                      <div className="bg-bg-primary rounded-lg p-2 text-center">
                        <div className="text-[10px] text-text-muted">ADX</div>
                        <div className="font-mono text-sm font-medium">{opp.adx}</div>
                      </div>
                      <div className="bg-bg-primary rounded-lg p-2 text-center">
                        <div className="text-[10px] text-text-muted">Mkt Cap</div>
                        <div className="font-mono text-sm font-medium">{formatCap(opp.market_cap)}</div>
                      </div>
                      <div className="bg-bg-primary rounded-lg p-2 text-center">
                        <div className="text-[10px] text-text-muted">P/E</div>
                        <div className="font-mono text-sm font-medium">{opp.pe_ratio || "N/A"}</div>
                      </div>
                      <div className="bg-bg-primary rounded-lg p-2 text-center">
                        <div className="text-[10px] text-text-muted">52W</div>
                        <div className={`font-mono text-sm font-medium ${opp.pct_from_52w_high > -10 ? "text-gain" : "text-loss"}`}>{opp.pct_from_52w_high}%</div>
                      </div>
                    </div>

                    {/* Reasons */}
                    <div className="space-y-1.5 mb-3">
                      {opp.reasons.map((r, i) => (
                        <div key={i} className="flex items-start gap-2 text-sm">
                          <TrendingUp className="w-4 h-4 text-gain shrink-0 mt-0.5" />
                          <span className="text-text-secondary">{r}</span>
                        </div>
                      ))}
                    </div>

                    {/* Target / Stop / Risk */}
                    <div className="flex items-center gap-4 pt-3 border-t border-border/50 text-xs">
                      <div className="flex items-center gap-1 text-gain">
                        <Target className="w-3.5 h-3.5" />
                        <span className="text-text-muted">Target:</span>
                        <span className="font-mono font-medium">${opp.target_price}</span>
                      </div>
                      <div className="flex items-center gap-1 text-loss">
                        <Shield className="w-3.5 h-3.5" />
                        <span className="text-text-muted">Stop:</span>
                        <span className="font-mono font-medium">${opp.stop_loss}</span>
                      </div>
                      <div className="flex items-center gap-1 text-info">
                        <BarChart3 className="w-3.5 h-3.5" />
                        <span className="text-text-muted">R/R:</span>
                        <span className="font-mono font-medium">{opp.risk_reward}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Activity className="w-3.5 h-3.5" />
                        <span className="text-text-muted">Vol:</span>
                        <span className={`font-mono font-medium ${opp.volume_ratio > 1.5 ? "text-warn" : "text-text-primary"}`}>{opp.volume_ratio}x</span>
                      </div>
                      {opp.dividend_yield && (
                        <div className="flex items-center gap-1">
                          <span className="text-text-muted">Div:</span>
                          <span className="font-mono font-medium text-info">{opp.dividend_yield}%</span>
                        </div>
                      )}
                      <div className={`ml-auto font-mono font-medium ${
                        opp.risk === "LOW" ? "text-gain" : opp.risk === "HIGH" ? "text-loss" : "text-warn"
                      }`}>
                        Risk: {opp.risk}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
