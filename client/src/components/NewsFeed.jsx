import { Newspaper, ExternalLink, Clock } from "lucide-react";
import { useApi } from "../hooks/useApi";
import { api } from "../lib/api";

function timeAgo(dateStr) {
  if (!dateStr) return "";
  const now = new Date();
  const then = new Date(dateStr);
  const diffMs = now - then;
  const mins = Math.floor(diffMs / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function NewsItem({ item }) {
  return (
    <a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex gap-3 p-3 rounded-lg hover:bg-bg-hover transition-colors no-underline group"
    >
      {item.thumbnail && (
        <img
          src={item.thumbnail}
          alt=""
          className="w-20 h-14 object-cover rounded-md shrink-0 bg-bg-hover"
          onError={(e) => { e.target.style.display = "none"; }}
        />
      )}
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-medium text-text-primary group-hover:text-info transition-colors line-clamp-2 leading-snug">
          {item.title}
        </h4>
        <div className="flex items-center gap-2 mt-1 text-xs text-text-muted">
          <span>{item.source}</span>
          <span className="flex items-center gap-0.5">
            <Clock className="w-3 h-3" />
            {timeAgo(item.published)}
          </span>
          <ExternalLink className="w-3 h-3 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </div>
    </a>
  );
}

export function MarketNewsFeed() {
  const { data, loading } = useApi(() => api.getMarketNews(), []);

  return (
    <div className="bg-bg-card border border-border rounded-xl p-4">
      <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-3 flex items-center gap-2">
        <Newspaper className="w-4 h-4" />
        Market News
      </h3>
      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex gap-3 animate-pulse">
              <div className="w-20 h-14 bg-bg-hover rounded-md shrink-0" />
              <div className="flex-1">
                <div className="h-4 bg-bg-hover rounded w-full mb-2" />
                <div className="h-3 bg-bg-hover rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : !data?.length ? (
        <p className="text-sm text-text-muted py-4 text-center">No news available</p>
      ) : (
        <div className="divide-y divide-border/30">
          {data.map((item, i) => (
            <NewsItem key={i} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}

export function StockNewsFeed({ ticker }) {
  const { data, loading } = useApi(() => api.getStockNews(ticker), [ticker]);

  return (
    <div className="bg-bg-card border border-border rounded-xl p-4">
      <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-3 flex items-center gap-2">
        <Newspaper className="w-4 h-4" />
        {ticker} News
      </h3>
      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex gap-3 animate-pulse">
              <div className="w-20 h-14 bg-bg-hover rounded-md shrink-0" />
              <div className="flex-1">
                <div className="h-4 bg-bg-hover rounded w-full mb-2" />
                <div className="h-3 bg-bg-hover rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : !data?.length ? (
        <p className="text-sm text-text-muted py-4 text-center">No recent news for {ticker}</p>
      ) : (
        <div className="divide-y divide-border/30">
          {data.map((item, i) => (
            <NewsItem key={i} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}
