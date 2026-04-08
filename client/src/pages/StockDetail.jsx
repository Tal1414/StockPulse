import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Activity,
  Brain,
  Loader2,
  AlertTriangle,
  Target,
  Shield,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { api } from "../lib/api";
import { useApi } from "../hooks/useApi";
import CandlestickChart from "../components/CandlestickChart";
import SignalBadge from "../components/SignalBadge";
import IndicatorRow from "../components/IndicatorRow";
import { ChartSkeleton, PanelSkeleton } from "../components/LoadingSkeleton";
import InfoTooltip from "../components/InfoTooltip";
import { StockNewsFeed } from "../components/NewsFeed";
import DividendPanel from "../components/DividendPanel";
import { StockCalendarPanel, StockEventBadges } from "../components/EventCalendar";
import MultiTimeframeChart from "../components/MultiTimeframeChart";

function GaugeBar({ value, min = 0, max = 100, lowLabel, highLabel, zones }) {
  const pct = Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100));
  return (
    <div className="w-full">
      <div className="relative h-2 bg-bg-primary rounded-full overflow-hidden">
        {zones && (
          <>
            <div className="absolute inset-y-0 left-0 w-[30%] bg-gain/20" />
            <div className="absolute inset-y-0 left-[30%] w-[40%] bg-text-muted/20" />
            <div className="absolute inset-y-0 right-0 w-[30%] bg-loss/20" />
          </>
        )}
        <div
          className="absolute top-0 h-full w-1.5 bg-info rounded-full -translate-x-1/2"
          style={{ left: `${pct}%` }}
        />
      </div>
      {lowLabel && (
        <div className="flex justify-between mt-1 text-xs text-text-muted">
          <span>{lowLabel}</span>
          <span>{highLabel}</span>
        </div>
      )}
    </div>
  );
}

function TrendBadge({ trend, strength }) {
  const color =
    trend === "BULLISH"
      ? "bg-gain/10 text-gain border-gain/20"
      : trend === "BEARISH"
        ? "bg-loss/10 text-loss border-loss/20"
        : "bg-text-muted/10 text-text-secondary border-border";
  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border ${color}`}>
      {trend === "BULLISH" ? <TrendingUp className="w-4 h-4" /> : trend === "BEARISH" ? <TrendingDown className="w-4 h-4" /> : <Activity className="w-4 h-4" />}
      <span className="font-mono text-sm font-medium">{trend}</span>
      <span className="text-xs opacity-60">{strength}</span>
    </div>
  );
}

export default function StockDetail() {
  const { ticker } = useParams();
  const [chartPeriod, setChartPeriod] = useState("1mo");
  const [showAllIndicators, setShowAllIndicators] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiData, setAiData] = useState(null);
  const [aiError, setAiError] = useState(null);

  const { data, loading, error } = useApi(() => api.getAnalysis(ticker), [ticker]);
  const { data: chartData } = useApi(() => api.getChart(ticker, chartPeriod), [ticker, chartPeriod]);

  const loadAI = async () => {
    setAiLoading(true);
    setAiError(null);
    try {
      const result = await api.getAI(ticker);
      setAiData(result);
    } catch (e) {
      setAiError(e.message);
    } finally {
      setAiLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-bg-card rounded animate-pulse" />
        <ChartSkeleton />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <PanelSkeleton rows={8} />
          <PanelSkeleton rows={6} />
          <PanelSkeleton rows={5} />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="text-center py-20">
        <AlertTriangle className="w-12 h-12 text-loss mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2">Failed to load {ticker}</h2>
        <p className="text-text-secondary mb-4">{error}</p>
        <Link to="/" className="text-info hover:underline">Back to Dashboard</Link>
      </div>
    );
  }

  const isUp = data.daily_change >= 0;

  // Compute SMA overlay data from chart data
  const computeSMA = (chartPoints, period) => {
    if (!chartPoints || chartPoints.length < period) return [];
    const result = [];
    for (let i = period - 1; i < chartPoints.length; i++) {
      const slice = chartPoints.slice(i - period + 1, i + 1);
      const avg = slice.reduce((sum, p) => sum + p.close, 0) / period;
      result.push({ time: chartPoints[i].time, value: parseFloat(avg.toFixed(2)) });
    }
    return result;
  };

  const smaOverlays = chartData
    ? {
        sma_20: computeSMA(chartData, 20),
        sma_50: computeSMA(chartData, 50),
      }
    : null;

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <Link to="/" className="inline-flex items-center gap-1 text-text-secondary hover:text-text-primary text-sm mb-2 no-underline">
            <ArrowLeft className="w-4 h-4" /> Dashboard
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-semibold font-mono">{data.ticker}</h1>
            <TrendBadge trend={data.trend} strength={data.trend_strength} />
          </div>
          <p className="text-text-secondary">{data.company_name} &middot; {data.sector}</p>
          <div className="mt-2">
            <StockEventBadges ticker={ticker} />
          </div>
        </div>
        <div className="text-right">
          <div className="font-mono text-3xl font-semibold">${data.price}</div>
          <div className={`font-mono text-lg ${isUp ? "text-gain" : "text-loss"}`}>
            {isUp ? "+" : ""}{data.daily_change} ({isUp ? "+" : ""}{data.daily_change_pct}%)
          </div>
          <div className="text-xs text-text-muted mt-0.5">
            {data.market_state === "REGULAR" ? "Regular Market" : data.market_state === "CLOSED" ? "Market Closed" : ""}
          </div>

          {/* Extended Hours */}
          {data.extended_hours?.pre_market && (
            <div className={`mt-2 pt-2 border-t ${data.market_state === "PRE" ? "border-info/30" : "border-border/50"}`}>
              <div className={`text-xs mb-0.5 flex items-center gap-1 ${data.market_state === "PRE" ? "text-info font-medium" : "text-text-muted"}`}>
                {data.market_state === "PRE" && <span className="w-1.5 h-1.5 bg-info rounded-full animate-pulse" />}
                Pre-Market {data.market_state === "PRE" && "(Live)"}
              </div>
              <div className="font-mono text-lg font-medium">${data.extended_hours.pre_market.price}</div>
              <div className={`font-mono text-sm ${data.extended_hours.pre_market.change_pct >= 0 ? "text-gain" : "text-loss"}`}>
                {data.extended_hours.pre_market.change_pct >= 0 ? "+" : ""}{data.extended_hours.pre_market.change}
                {" "}({data.extended_hours.pre_market.change_pct >= 0 ? "+" : ""}{data.extended_hours.pre_market.change_pct}%)
              </div>
            </div>
          )}

          {data.extended_hours?.post_market && (
            <div className={`mt-2 pt-2 border-t ${data.market_state === "POST" || data.market_state === "POSTPOST" ? "border-warn/30" : "border-border/50"}`}>
              <div className={`text-xs mb-0.5 flex items-center gap-1 ${data.market_state === "POST" || data.market_state === "POSTPOST" ? "text-warn font-medium" : "text-text-muted"}`}>
                {(data.market_state === "POST" || data.market_state === "POSTPOST") && <span className="w-1.5 h-1.5 bg-warn rounded-full animate-pulse" />}
                After-Hours {(data.market_state === "POST" || data.market_state === "POSTPOST") && "(Live)"}
              </div>
              <div className="font-mono text-lg font-medium">${data.extended_hours.post_market.price}</div>
              <div className={`font-mono text-sm ${data.extended_hours.post_market.change_pct >= 0 ? "text-gain" : "text-loss"}`}>
                {data.extended_hours.post_market.change_pct >= 0 ? "+" : ""}{data.extended_hours.post_market.change}
                {" "}({data.extended_hours.post_market.change_pct >= 0 ? "+" : ""}{data.extended_hours.post_market.change_pct}%)
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Chart */}
      <div className="mb-6">
        <div className="flex gap-2 mb-3">
          {["5d", "1mo", "3mo", "6mo", "1y"].map((p) => (
            <button
              key={p}
              onClick={() => setChartPeriod(p)}
              className={`px-3 py-1 rounded-md text-xs font-mono transition-colors ${
                chartPeriod === p ? "bg-info text-white" : "bg-bg-card text-text-secondary hover:bg-bg-hover"
              }`}
            >
              {p.toUpperCase()}
            </button>
          ))}
        </div>
        <CandlestickChart data={chartData || data.chart_data} smaData={smaOverlays} height={400} />
      </div>

      {/* Multi-Timeframe View */}
      <MultiTimeframeChart ticker={ticker} />

      {/* Regular Market Summary */}
      {data.regular_market && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <div className="bg-bg-card border border-border rounded-lg p-3">
            <div className="text-xs text-text-muted">Open</div>
            <div className="font-mono text-sm font-medium">${data.regular_market.open}</div>
          </div>
          <div className="bg-bg-card border border-border rounded-lg p-3">
            <div className="text-xs text-text-muted">Day High</div>
            <div className="font-mono text-sm font-medium text-gain">${data.regular_market.high}</div>
          </div>
          <div className="bg-bg-card border border-border rounded-lg p-3">
            <div className="text-xs text-text-muted">Day Low</div>
            <div className="font-mono text-sm font-medium text-loss">${data.regular_market.low}</div>
          </div>
          <div className="bg-bg-card border border-border rounded-lg p-3">
            <div className="text-xs text-text-muted">Volume</div>
            <div className="font-mono text-sm font-medium">{(data.regular_market.volume / 1e6).toFixed(1)}M</div>
          </div>
        </div>
      )}

      {/* Signals */}
      <div className="bg-bg-card border border-border rounded-xl p-4 mb-6">
        <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-3">Active Signals</h3>
        <div className="flex flex-wrap gap-2">
          {data.signals?.map((s, i) => (
            <SignalBadge key={i} signal={s} />
          ))}
        </div>
      </div>

      {/* Indicators Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        {/* Technical Indicators */}
        <div className="bg-bg-card border border-border rounded-xl p-4">
          <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-3">Technical Indicators</h3>
          <IndicatorRow label="RSI (14)" value={data.rsi_14} color={data.rsi_14 < 30 ? "text-gain" : data.rsi_14 > 70 ? "text-loss" : ""} />
          <GaugeBar value={data.rsi_14} zones lowLabel="Oversold" highLabel="Overbought" />
          <div className="mt-3" />
          <IndicatorRow label="MACD" value={data.macd} subtext={`Signal: ${data.macd_signal}`} color={data.macd > data.macd_signal ? "text-gain" : "text-loss"} />
          <IndicatorRow label="MACD Histogram" value={data.macd_histogram} color={data.macd_histogram > 0 ? "text-gain" : "text-loss"} />
          <IndicatorRow label="Stochastic %K" value={data.stochastic_k} subtext={`%D: ${data.stochastic_d}`} />
          <IndicatorRow label="ADX" value={data.adx} subtext={data.adx > 25 ? "Trending" : "Ranging"} color={data.adx > 25 ? "text-info" : ""} />
          <IndicatorRow label="+DI / -DI" value={`${data.plus_di} / ${data.minus_di}`} color={data.plus_di > data.minus_di ? "text-gain" : "text-loss"} />
          {showAllIndicators && (
            <>
              <IndicatorRow label="ATR (14)" value={data.atr_14} subtext={`${data.atr_pct}% of price`} />
              <IndicatorRow label="OBV Trend" value={data.obv_trend} color={data.obv_trend === "rising" ? "text-gain" : data.obv_trend === "falling" ? "text-loss" : ""} />
              <IndicatorRow label="VWAP (20d)" value={`$${data.vwap_20d}`} subtext={`${data.price_vs_vwap > 0 ? "+" : ""}${data.price_vs_vwap}% vs price`} />
              <IndicatorRow label="Vol vs Avg" value={`${data.volume_vs_avg}x`} subtext={data.volume_trend} color={data.volume_vs_avg > 1.5 ? "text-warn" : ""} />
            </>
          )}
          <button
            onClick={() => setShowAllIndicators(!showAllIndicators)}
            className="w-full flex items-center justify-center gap-1 text-xs text-text-secondary hover:text-text-primary mt-2 py-1"
          >
            {showAllIndicators ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            {showAllIndicators ? "Show Less" : "Show More"}
          </button>
        </div>

        {/* Moving Averages & Bollinger */}
        <div className="bg-bg-card border border-border rounded-xl p-4">
          <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-3">Moving Averages</h3>
          <IndicatorRow label="SMA 10" value={`$${data.sma_10}`} color={data.price > data.sma_10 ? "text-gain" : "text-loss"} />
          <IndicatorRow label="SMA 20" value={`$${data.sma_20}`} color={data.price > data.sma_20 ? "text-gain" : "text-loss"} />
          <IndicatorRow label="SMA 50" value={`$${data.sma_50}`} color={data.price > data.sma_50 ? "text-gain" : "text-loss"} />
          <IndicatorRow label="SMA 200" value={`$${data.sma_200}`} color={data.price > data.sma_200 ? "text-gain" : "text-loss"} />
          <IndicatorRow label="EMA 12" value={`$${data.ema_12}`} />
          <IndicatorRow label="EMA 26" value={`$${data.ema_26}`} />
          <div className="border-t border-border mt-3 pt-3">
            <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-3 flex items-center">Bollinger Bands<InfoTooltip label="Bollinger Bands" /></h3>
            <IndicatorRow label="Upper" value={`$${data.bollinger_upper}`} />
            <IndicatorRow label="Lower" value={`$${data.bollinger_lower}`} />
            <IndicatorRow label="Position" value={`${data.bollinger_pct}%`} />
            <GaugeBar value={data.bollinger_pct} zones lowLabel="Lower Band" highLabel="Upper Band" />
          </div>
          {data.ma_crossovers?.[0] !== "none" && (
            <div className="mt-3 pt-3 border-t border-border">
              <h4 className="text-xs text-text-secondary mb-2">MA Crossovers</h4>
              {data.ma_crossovers.map((c, i) => (
                <div key={i} className="text-sm text-warn font-mono">{c}</div>
              ))}
            </div>
          )}
        </div>

        {/* Levels & Fibonacci */}
        <div className="bg-bg-card border border-border rounded-xl p-4">
          <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-3">Key Levels</h3>
          <IndicatorRow label="52W High" value={`$${data.high_52w}`} subtext={`${data.pct_from_52w_high}%`} />
          <IndicatorRow label="52W Low" value={`$${data.low_52w}`} />
          <IndicatorRow label="Support (30d)" value={`$${data.support_30d}`} color="text-gain" />
          <IndicatorRow label="Resistance (30d)" value={`$${data.resistance_30d}`} color="text-loss" />

          <div className="border-t border-border mt-3 pt-3">
            <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-3 flex items-center">Pivot Points<InfoTooltip label="Pivot Points" /></h3>
            {data.pivot_points && Object.entries(data.pivot_points).map(([k, v]) => (
              <IndicatorRow key={k} label={k} value={`$${v}`} color={k.startsWith("R") ? "text-loss" : k.startsWith("S") ? "text-gain" : "text-info"} />
            ))}
          </div>

          <div className="border-t border-border mt-3 pt-3">
            <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-3 flex items-center">Fibonacci Retracement<InfoTooltip label="Fibonacci Retracement" /></h3>
            {data.fibonacci && Object.entries(data.fibonacci).filter(([k]) => !["high", "low"].includes(k)).map(([k, v]) => (
              <IndicatorRow key={k} label={k} value={`$${v}`} color="text-info" />
            ))}
          </div>
        </div>
      </div>

      {/* Candlestick Patterns */}
      {data.candlestick_patterns?.length > 0 && (
        <div className="bg-bg-card border border-border rounded-xl p-4 mb-6">
          <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-3">Candlestick Patterns</h3>
          <div className="flex flex-wrap gap-2">
            {data.candlestick_patterns.map((p, i) => (
              <span key={i} className="px-3 py-1 bg-warn/10 text-warn border border-warn/20 rounded-md text-xs font-mono">{p}</span>
            ))}
          </div>
        </div>
      )}

      {/* AI Analysis */}
      <div className="bg-bg-card border border-border rounded-xl p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Brain className="w-5 h-5 text-info" />
            {aiData?.source === "rule-based" ? "Technical Analysis" : "AI Analysis"}
            {aiData?.source && (
              <span className="text-xs font-normal text-text-muted px-2 py-0.5 bg-bg-primary rounded-md">
                {aiData.source === "rule-based" ? "Rule-Based Engine" : "Claude AI"}
              </span>
            )}
          </h3>
          {!aiData && (
            <button
              onClick={loadAI}
              disabled={aiLoading}
              className="flex items-center gap-2 bg-info hover:bg-info/80 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              {aiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Brain className="w-4 h-4" />}
              {aiLoading ? "Analyzing..." : "Get AI Analysis"}
            </button>
          )}
        </div>

        {aiError && (
          <div className="bg-loss/10 border border-loss/20 rounded-lg p-4 text-loss text-sm">{aiError}</div>
        )}

        {aiData && (
          <div className="space-y-4">
            {/* Action Badge */}
            <div className="flex items-center gap-3">
              <span
                className={`text-2xl font-bold font-mono px-4 py-2 rounded-lg ${
                  aiData.action === "BUY"
                    ? "bg-gain/10 text-gain border border-gain/20"
                    : aiData.action === "SELL"
                      ? "bg-loss/10 text-loss border border-loss/20"
                      : "bg-warn/10 text-warn border border-warn/20"
                }`}
              >
                {aiData.action}
              </span>
              {aiData.confidence && (
                <span className="text-sm text-text-secondary">Confidence: {aiData.confidence}</span>
              )}
            </div>

            {/* Assessment */}
            <p className="text-text-primary leading-relaxed">{aiData.overall_assessment}</p>

            {/* Targets */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {aiData.target_price && (
                <div className="bg-bg-primary rounded-lg p-3">
                  <div className="text-xs text-text-secondary flex items-center gap-1"><Target className="w-3 h-3" /> Target</div>
                  <div className="font-mono text-lg font-semibold text-gain">${aiData.target_price}</div>
                </div>
              )}
              {aiData.stop_loss && (
                <div className="bg-bg-primary rounded-lg p-3">
                  <div className="text-xs text-text-secondary flex items-center gap-1"><Shield className="w-3 h-3" /> Stop Loss</div>
                  <div className="font-mono text-lg font-semibold text-loss">${aiData.stop_loss}</div>
                </div>
              )}
              {aiData.risk_reward_ratio && (
                <div className="bg-bg-primary rounded-lg p-3">
                  <div className="text-xs text-text-secondary">Risk/Reward</div>
                  <div className="font-mono text-lg font-semibold text-info">{aiData.risk_reward_ratio}</div>
                </div>
              )}
            </div>

            {/* Catalysts & Risks */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {aiData.catalysts?.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-gain mb-2">Bullish Catalysts</h4>
                  <ul className="space-y-1">
                    {aiData.catalysts.map((c, i) => (
                      <li key={i} className="text-sm text-text-secondary flex items-start gap-2">
                        <TrendingUp className="w-3 h-3 text-gain mt-1 shrink-0" />
                        {c}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {aiData.risks?.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-loss mb-2">Key Risks</h4>
                  <ul className="space-y-1">
                    {aiData.risks.map((r, i) => (
                      <li key={i} className="text-sm text-text-secondary flex items-start gap-2">
                        <AlertTriangle className="w-3 h-3 text-loss mt-1 shrink-0" />
                        {r}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {aiData.score !== undefined && (
              <div className="text-xs text-text-muted border-t border-border pt-3">
                Signal Score: <span className={`font-mono font-medium ${aiData.score > 0 ? "text-gain" : aiData.score < 0 ? "text-loss" : "text-text-secondary"}`}>{aiData.score > 0 ? "+" : ""}{aiData.score}</span>
                <span className="ml-1">(range: strong sell -10 to strong buy +10)</span>
              </div>
            )}

            {aiData.disclaimer && (
              <p className="text-xs text-text-muted italic border-t border-border pt-3">{aiData.disclaimer}</p>
            )}
          </div>
        )}

        {!aiData && !aiLoading && !aiError && (
          <p className="text-sm text-text-muted">
            Click "Get AI Analysis" for a comprehensive AI-powered assessment including target price, stop loss, and risk analysis.
          </p>
        )}
      </div>

      {/* Dividends & Calendar */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <DividendPanel ticker={ticker} />
        <StockCalendarPanel ticker={ticker} />
      </div>

      {/* Stock News */}
      <StockNewsFeed ticker={ticker} />
    </div>
  );
}
