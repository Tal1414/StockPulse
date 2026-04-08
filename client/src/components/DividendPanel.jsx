import { DollarSign, Calendar, TrendingUp } from "lucide-react";
import { useApi } from "../hooks/useApi";
import { api } from "../lib/api";

function MiniBarChart({ data }) {
  if (!data?.length) return null;
  const max = Math.max(...data.map((d) => d.amount));
  return (
    <div className="flex items-end gap-0.5 h-12">
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-0.5" title={`${d.date}: $${d.amount}`}>
          <div
            className="w-full bg-info/40 rounded-t-sm min-h-[2px]"
            style={{ height: `${(d.amount / max) * 100}%` }}
          />
          {i % 3 === 0 && <span className="text-[8px] text-text-muted">{d.date.slice(5, 7)}/{d.date.slice(2, 4)}</span>}
        </div>
      ))}
    </div>
  );
}

export default function DividendPanel({ ticker }) {
  const { data, loading } = useApi(() => api.getDividends(ticker), [ticker]);

  if (loading) {
    return (
      <div className="bg-bg-card border border-border rounded-xl p-4 animate-pulse">
        <div className="h-4 w-32 bg-bg-hover rounded mb-3" />
        <div className="h-20 bg-bg-hover rounded" />
      </div>
    );
  }

  if (!data || data.error || (!data.dividend_rate && !data.history?.length)) {
    return null; // No dividend data — don't show the panel
  }

  return (
    <div className="bg-bg-card border border-border rounded-xl p-4">
      <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-3 flex items-center gap-2">
        <DollarSign className="w-4 h-4" />
        Dividends
      </h3>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        <div className="bg-bg-primary rounded-lg p-2.5">
          <div className="text-xs text-text-muted">Annual Rate</div>
          <div className="font-mono text-sm font-semibold text-gain">${data.dividend_rate}</div>
        </div>
        <div className="bg-bg-primary rounded-lg p-2.5">
          <div className="text-xs text-text-muted">Yield</div>
          <div className="font-mono text-sm font-semibold text-info">{data.dividend_yield}%</div>
        </div>
        <div className="bg-bg-primary rounded-lg p-2.5">
          <div className="text-xs text-text-muted">Payout Ratio</div>
          <div className="font-mono text-sm font-semibold">{data.payout_ratio ? `${data.payout_ratio}%` : "N/A"}</div>
        </div>
        <div className="bg-bg-primary rounded-lg p-2.5">
          <div className="text-xs text-text-muted">Frequency</div>
          <div className="font-mono text-sm font-semibold">
            {data.frequency === 4 ? "Quarterly" : data.frequency === 12 ? "Monthly" : data.frequency === 2 ? "Semi-Annual" : data.frequency === 1 ? "Annual" : `${data.frequency}x/yr`}
          </div>
        </div>
      </div>

      {data.ex_dividend_date && (
        <div className="flex items-center gap-2 text-xs text-text-secondary mb-3 bg-bg-primary rounded-lg p-2.5">
          <Calendar className="w-3.5 h-3.5 text-warn" />
          <span>Ex-Dividend Date: <span className="font-mono text-text-primary">{data.ex_dividend_date}</span></span>
        </div>
      )}

      {data.history?.length > 0 && (
        <div>
          <div className="text-xs text-text-muted mb-2 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" /> Payment History
          </div>
          <MiniBarChart data={data.history} />
        </div>
      )}
    </div>
  );
}
