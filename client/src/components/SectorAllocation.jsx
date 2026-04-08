import { useMemo } from "react";

const SECTOR_COLORS = [
  "#4488ff", "#00ff88", "#ffaa00", "#ff4444", "#aa44ff",
  "#ff44aa", "#44ddff", "#88ff44", "#ff8844", "#44ffaa",
  "#8888ff", "#ffdd44",
];

export default function SectorAllocation({ stocks }) {
  const sectors = useMemo(() => {
    if (!stocks?.length) return [];
    const counts = {};
    stocks.forEach((s) => {
      const sector = s.sector || "Other";
      counts[sector] = (counts[sector] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, count], i) => ({
        name,
        count,
        pct: Math.round((count / stocks.length) * 100),
        color: SECTOR_COLORS[i % SECTOR_COLORS.length],
      }))
      .sort((a, b) => b.count - a.count);
  }, [stocks]);

  if (!sectors.length) return null;

  // Build donut segments
  const total = stocks.length;
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;
  const segments = sectors.map((s) => {
    const length = (s.count / total) * circumference;
    const segment = { ...s, dashArray: `${length} ${circumference - length}`, dashOffset: -offset };
    offset += length;
    return segment;
  });

  return (
    <div className="bg-bg-card border border-border rounded-xl p-4">
      <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-3">
        Sector Allocation
      </h3>
      <div className="flex items-center gap-6">
        {/* Donut */}
        <div className="relative shrink-0">
          <svg width="100" height="100" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r={radius} fill="none" stroke="#2a2a3e" strokeWidth="12" />
            {segments.map((s, i) => (
              <circle
                key={i}
                cx="50"
                cy="50"
                r={radius}
                fill="none"
                stroke={s.color}
                strokeWidth="12"
                strokeDasharray={s.dashArray}
                strokeDashoffset={s.dashOffset}
                strokeLinecap="butt"
                transform="rotate(-90 50 50)"
              />
            ))}
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="font-mono text-sm font-semibold text-text-primary">{total}</span>
          </div>
        </div>

        {/* Legend */}
        <div className="flex-1 space-y-1.5">
          {sectors.map((s) => (
            <div key={s.name} className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: s.color }} />
                <span className="text-text-secondary truncate">{s.name}</span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="font-mono text-text-primary">{s.count}</span>
                <span className="font-mono text-text-muted w-8 text-right">{s.pct}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
