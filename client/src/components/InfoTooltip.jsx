import { useState } from "react";
import { HelpCircle, X } from "lucide-react";

const explanations = {
  // Momentum
  "RSI (14)": {
    name: "Relative Strength Index",
    what: "Measures how fast and how much a stock's price has been moving up vs. down over the last 14 trading days.",
    how: "Ranges from 0 to 100. Below 30 = oversold (stock may be undervalued, potential bounce). Above 70 = overbought (stock may be overvalued, potential pullback). Between 30-70 = neutral.",
    example: "RSI of 25 means the stock has been selling off heavily — it might be a buying opportunity. RSI of 80 means it's been surging — could be due for a correction.",
  },
  "MACD": {
    name: "Moving Average Convergence Divergence",
    what: "Tracks the relationship between two moving averages (12-day and 26-day) to spot trend changes and momentum shifts.",
    how: "When MACD crosses above its signal line = bullish (upward momentum building). When it crosses below = bearish. The histogram shows the gap between them — growing bars mean strengthening momentum.",
    example: "MACD just crossed above the signal line with a growing histogram → momentum is shifting bullish, possible entry point.",
  },
  "MACD Histogram": {
    name: "MACD Histogram",
    what: "The difference between the MACD line and its signal line, shown as bars.",
    how: "Positive bars (above zero) = bullish momentum. Negative bars = bearish. Growing bars = strengthening trend. Shrinking bars = trend may be weakening.",
    example: "Histogram bars getting taller and positive → bullish momentum is accelerating.",
  },
  "Stochastic %K": {
    name: "Stochastic Oscillator",
    what: "Compares a stock's closing price to its price range over the last 14 days. Shows where the price sits within its recent range.",
    how: "Ranges 0-100. Below 20 = oversold (near the bottom of its range). Above 80 = overbought (near the top). %K is the fast line, %D is the smoothed signal.",
    example: "Stochastic at 15 means the stock is trading near its 14-day low — potential reversal if other signals agree.",
  },
  "ADX": {
    name: "Average Directional Index",
    what: "Measures how strong the current trend is — regardless of whether it's up or down.",
    how: "Above 25 = strong trend (good for trend-following strategies). Below 25 = weak/no trend (choppy, range-bound market). Does NOT tell direction — just strength.",
    example: "ADX of 40 means there's a strong trend. Check +DI vs -DI to see if it's bullish or bearish.",
  },
  "+DI / -DI": {
    name: "Directional Indicators",
    what: "+DI measures upward price movement strength. -DI measures downward. Together they show trend direction.",
    how: "+DI > -DI = bullish pressure dominates. -DI > +DI = bearish pressure dominates. The gap between them shows how decisively one side is winning.",
    example: "+DI at 30, -DI at 15 → bulls are in control, uptrend likely to continue.",
  },
  "ATR (14)": {
    name: "Average True Range",
    what: "Measures how much a stock's price typically moves in a day (volatility). Calculated over 14 days.",
    how: "Higher ATR = more volatile (bigger daily swings). Lower ATR = calmer. Use it to set stop-losses — a stop too tight for the ATR will get hit by normal movement.",
    example: "ATR of $5 on a $100 stock means it typically moves $5/day. Setting a $2 stop-loss would likely trigger on noise alone.",
  },
  "OBV Trend": {
    name: "On-Balance Volume",
    what: "Tracks whether volume is flowing into (buying) or out of (selling) a stock. It's a running total: up days add volume, down days subtract it.",
    how: "Rising OBV = accumulation (smart money buying). Falling OBV = distribution (selling). If price rises but OBV falls, the rally may not be sustainable.",
    example: "Price is flat but OBV is steadily rising → institutions may be quietly accumulating before a breakout.",
  },
  "VWAP (20d)": {
    name: "Volume-Weighted Average Price",
    what: "The average price a stock has traded at, weighted by volume. Gives more importance to prices where lots of shares changed hands.",
    how: "Price above VWAP = stock is trading above its 'fair value' for the period (bullish). Below = trading below fair value (bearish). Institutional traders often use VWAP as a benchmark.",
    example: "Stock at $105 with VWAP at $100 → trading at a 5% premium to its volume-weighted average.",
  },
  "Vol vs Avg": {
    name: "Volume vs 20-Day Average",
    what: "Compares today's trading volume to the average daily volume over the last 20 days.",
    how: "Above 1.5x = unusually high volume (something is happening — news, earnings, breakout). Below 0.5x = unusually quiet. High volume confirms price moves; low volume makes them suspect.",
    example: "Volume at 3x average on an up day → strong conviction behind the move, more likely to sustain.",
  },
  // Moving Averages
  "SMA 10": {
    name: "Simple Moving Average (10-day)",
    what: "The average closing price over the last 10 trading days. A short-term trend indicator.",
    how: "Price above SMA 10 = short-term uptrend. Below = short-term downtrend. Fast-moving — reacts quickly to price changes.",
    example: "Stock just crossed above its SMA 10 after being below for two weeks → short-term trend may be turning bullish.",
  },
  "SMA 20": {
    name: "Simple Moving Average (20-day)",
    what: "The average closing price over the last 20 trading days (~1 month). Widely watched for short-to-medium term trends.",
    how: "Price above SMA 20 = bullish momentum. Price crossing below = potential weakness. Often acts as support in uptrends and resistance in downtrends.",
    example: "Stock bouncing off its SMA 20 for the third time → strong support level, likely to hold.",
  },
  "SMA 50": {
    name: "Simple Moving Average (50-day)",
    what: "The average closing price over the last 50 trading days (~2.5 months). A key medium-term trend indicator.",
    how: "Widely followed by institutional traders. Price above SMA 50 = healthy medium-term uptrend. SMA 20 crossing above SMA 50 = bullish 'golden cross'. Crossing below = bearish 'death cross'.",
    example: "SMA 20 just crossed above SMA 50 → golden cross signal, historically bullish.",
  },
  "SMA 200": {
    name: "Simple Moving Average (200-day)",
    what: "The average closing price over the last 200 trading days (~10 months). THE major long-term trend indicator.",
    how: "The most important moving average. Price above SMA 200 = long-term uptrend (bull market). Below = long-term downtrend (bear market). Many funds won't buy stocks below their 200-day MA.",
    example: "Stock trading 15% above its SMA 200 → firmly in a long-term uptrend, bulls in control.",
  },
  "EMA 12": {
    name: "Exponential Moving Average (12-day)",
    what: "Like SMA but gives more weight to recent prices, making it more responsive to new information.",
    how: "Reacts faster than SMA. Used as the fast line in MACD calculation. Good for spotting trend changes early, but more prone to false signals.",
    example: "EMA 12 turning up while SMA 20 is still flat → early sign of momentum shift.",
  },
  "EMA 26": {
    name: "Exponential Moving Average (26-day)",
    what: "A 26-day exponential moving average. The slow line used in MACD calculation.",
    how: "When EMA 12 crosses above EMA 26 = MACD goes positive (bullish). When it crosses below = MACD goes negative (bearish).",
    example: "EMA 12 at $105, EMA 26 at $102 → MACD is positive ($3), upward momentum.",
  },
  // Bollinger
  "Bollinger Bands": {
    name: "Bollinger Bands",
    what: "A channel around the 20-day moving average that expands and contracts based on volatility. Upper and lower bands are 2 standard deviations away.",
    how: "Price near upper band = potentially overbought. Price near lower band = potentially oversold. Bands squeezing tight = low volatility, often precedes a big move. Price tends to stay within the bands ~95% of the time.",
    example: "Bands are extremely tight after weeks of compression → expect a big breakout move soon (direction TBD).",
  },
  "Upper": {
    name: "Upper Bollinger Band",
    what: "The top of the Bollinger channel — 20-day SMA plus 2 standard deviations.",
    how: "Acts as dynamic resistance. Price touching or exceeding it = extended/overbought. Consistent rides along the upper band = very strong uptrend.",
  },
  "Lower": {
    name: "Lower Bollinger Band",
    what: "The bottom of the Bollinger channel — 20-day SMA minus 2 standard deviations.",
    how: "Acts as dynamic support. Price touching or falling below it = extended/oversold. Could be a buying opportunity if other indicators confirm.",
  },
  "Position": {
    name: "Bollinger Band Position (%B)",
    what: "Shows where the current price sits within the Bollinger Bands as a percentage.",
    how: "0% = at the lower band. 50% = at the middle (SMA 20). 100% = at the upper band. Below 10% = near oversold. Above 90% = near overbought.",
  },
  // Levels
  "52W High": {
    name: "52-Week High",
    what: "The highest price the stock has reached in the last year.",
    how: "Stocks near their 52-week high often have strong momentum. Breaking above can trigger further buying. Being far below (>20%) may signal weakness or a buying opportunity.",
  },
  "52W Low": {
    name: "52-Week Low",
    what: "The lowest price the stock has reached in the last year.",
    how: "Stocks near their 52-week low may be oversold or in trouble. Can be a value opportunity if fundamentals are solid, or a warning sign if the business is deteriorating.",
  },
  "Support (30d)": {
    name: "30-Day Support Level",
    what: "The lowest price the stock reached in the last 30 trading days. A floor where buying pressure has historically stepped in.",
    how: "If price approaches support and holds = bullish (buyers defending the level). If it breaks below = bearish (new leg down likely).",
  },
  "Resistance (30d)": {
    name: "30-Day Resistance Level",
    what: "The highest price the stock reached in the last 30 trading days. A ceiling where selling pressure has historically increased.",
    how: "If price approaches resistance and fails = sellers still in control. If it breaks above = bullish breakout, could run higher.",
  },
  // Pivot Points
  "Pivot Points": {
    name: "Pivot Points",
    what: "Key price levels calculated from yesterday's high, low, and close. Used by day traders and short-term traders to identify potential support and resistance.",
    how: "R1/R2/R3 = resistance levels (potential selling zones). S1/S2/S3 = support levels (potential buying zones). Pivot = the central balance point.",
  },
  // Fibonacci
  "Fibonacci Retracement": {
    name: "Fibonacci Retracement",
    what: "Price levels based on the Fibonacci sequence (23.6%, 38.2%, 50%, 61.8%, 78.6%) drawn between the 52-week high and low.",
    how: "After a big move, stocks tend to retrace to these levels before continuing. The 61.8% level ('golden ratio') is the most important — a hold here often means the trend will resume. Breaking below 78.6% usually means the previous trend is over.",
    example: "Stock pulled back exactly to the 61.8% Fibonacci level and bounced → classic setup for trend continuation.",
  },
};

export default function InfoTooltip({ label }) {
  const [open, setOpen] = useState(false);
  const info = explanations[label];

  if (!info) return null;

  return (
    <>
      <button
        onClick={(e) => { e.stopPropagation(); setOpen(true); }}
        className="inline-flex items-center text-text-muted hover:text-info transition-colors ml-1"
        title={`What is ${label}?`}
      >
        <HelpCircle className="w-3 h-3" />
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setOpen(false)}>
          <div className="bg-bg-card border border-border rounded-xl p-5 w-full max-w-lg max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="text-base font-semibold text-text-primary">{info.name}</h3>
                <span className="text-xs text-text-muted font-mono">{label}</span>
              </div>
              <button onClick={() => setOpen(false)} className="text-text-secondary hover:text-text-primary p-1">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <h4 className="text-xs font-semibold text-info uppercase tracking-wider mb-1">What is it?</h4>
                <p className="text-sm text-text-secondary leading-relaxed">{info.what}</p>
              </div>
              <div>
                <h4 className="text-xs font-semibold text-info uppercase tracking-wider mb-1">How to read it</h4>
                <p className="text-sm text-text-secondary leading-relaxed">{info.how}</p>
              </div>
              {info.example && (
                <div className="bg-bg-primary rounded-lg p-3 border border-border/50">
                  <h4 className="text-xs font-semibold text-warn uppercase tracking-wider mb-1">Example</h4>
                  <p className="text-sm text-text-secondary leading-relaxed italic">{info.example}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
