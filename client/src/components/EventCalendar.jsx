import { Calendar, AlertCircle, DollarSign, TrendingUp } from "lucide-react";
import { useApi } from "../hooks/useApi";
import { api } from "../lib/api";

const eventIcons = {
  earnings: AlertCircle,
  ex_dividend: DollarSign,
  dividend_payment: DollarSign,
};

const eventColors = {
  earnings: "text-warn bg-warn/10 border-warn/20",
  ex_dividend: "text-info bg-info/10 border-info/20",
  dividend_payment: "text-gain bg-gain/10 border-gain/20",
};

function daysUntil(dateStr) {
  const now = new Date();
  const target = new Date(dateStr + "T00:00:00");
  const diff = Math.ceil((target - now) / (1000 * 60 * 60 * 24));
  if (diff < 0) return `${Math.abs(diff)}d ago`;
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  return `In ${diff}d`;
}

export function StockEventBadges({ ticker }) {
  const { data } = useApi(() => api.getCalendar(ticker), [ticker]);

  if (!data?.events?.length) return null;

  // Only show upcoming or very recent events
  const now = new Date().toISOString().slice(0, 10);
  const relevant = data.events.filter((e) => {
    const diff = (new Date(e.date) - new Date(now)) / (1000 * 60 * 60 * 24);
    return diff >= -7 && diff <= 60;
  });

  if (!relevant.length) return null;

  return (
    <div className="flex flex-wrap gap-1.5">
      {relevant.map((event, i) => {
        const Icon = eventIcons[event.type] || Calendar;
        const color = eventColors[event.type] || "text-text-secondary bg-bg-hover border-border";
        return (
          <div key={i} className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs border ${color}`}>
            <Icon className="w-3 h-3" />
            <span className="font-medium">{event.label}</span>
            <span className="opacity-70">{daysUntil(event.date)}</span>
          </div>
        );
      })}
    </div>
  );
}

export function StockCalendarPanel({ ticker }) {
  const { data, loading } = useApi(() => api.getCalendar(ticker), [ticker]);

  if (loading) {
    return (
      <div className="bg-bg-card border border-border rounded-xl p-4 animate-pulse">
        <div className="h-4 w-32 bg-bg-hover rounded mb-3" />
        <div className="space-y-2">
          {[1, 2, 3].map((i) => <div key={i} className="h-8 bg-bg-hover rounded" />)}
        </div>
      </div>
    );
  }

  if (!data?.events?.length) return null;

  return (
    <div className="bg-bg-card border border-border rounded-xl p-4">
      <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-3 flex items-center gap-2">
        <Calendar className="w-4 h-4" />
        Upcoming Events
      </h3>
      <div className="space-y-2">
        {data.events.map((event, i) => {
          const Icon = eventIcons[event.type] || Calendar;
          const color = eventColors[event.type] || "text-text-secondary bg-bg-hover border-border";
          const days = daysUntil(event.date);
          const isUrgent = days === "Today" || days === "Tomorrow";

          return (
            <div key={i} className={`flex items-center justify-between p-3 rounded-lg border ${color} ${isUrgent ? "ring-1 ring-warn/30" : ""}`}>
              <div className="flex items-center gap-2.5">
                <Icon className="w-4 h-4" />
                <div>
                  <div className="text-sm font-medium">{event.label}</div>
                  <div className="text-xs opacity-70 font-mono">{event.date}</div>
                </div>
              </div>
              <div className={`text-xs font-mono font-medium ${isUrgent ? "text-warn" : ""}`}>
                {days}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
