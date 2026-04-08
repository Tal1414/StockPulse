import InfoTooltip from "./InfoTooltip";

export default function IndicatorRow({ label, value, subtext, color }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
      <span className="text-sm text-text-secondary flex items-center">
        {label}
        <InfoTooltip label={label} />
      </span>
      <div className="text-right">
        <span className={`font-mono text-sm font-medium ${color || "text-text-primary"}`}>{value}</span>
        {subtext && <div className="text-xs text-text-muted">{subtext}</div>}
      </div>
    </div>
  );
}
