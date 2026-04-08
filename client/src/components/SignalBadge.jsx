export default function SignalBadge({ signal }) {
  const isBullish =
    signal.includes("oversold") ||
    signal.includes("bullish") ||
    signal.includes("Above") ||
    signal.includes("Golden") ||
    signal.includes("lower Bollinger");

  const isBearish =
    signal.includes("overbought") ||
    signal.includes("bearish") ||
    signal.includes("Below") ||
    signal.includes("Death") ||
    signal.includes("upper Bollinger");

  const color = isBullish ? "text-gain bg-gain/10 border-gain/20" : isBearish ? "text-loss bg-loss/10 border-loss/20" : "text-text-secondary bg-bg-hover border-border";

  return (
    <span className={`inline-block px-2 py-1 rounded-md text-xs font-mono border ${color}`}>
      {signal}
    </span>
  );
}
