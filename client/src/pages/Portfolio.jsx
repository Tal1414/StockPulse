import { useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Trash2, ExternalLink } from "lucide-react";
import { usePortfolioContext } from "../hooks/PortfolioContext";
import AddStockModal from "../components/AddStockModal";

export default function Portfolio() {
  const { tickers, addTicker, removeTicker } = usePortfolioContext();
  const [showAdd, setShowAdd] = useState(false);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Portfolio</h1>
          <p className="text-sm text-text-secondary">
            {tickers.length} stock{tickers.length !== 1 ? "s" : ""} tracked
            <span className="text-text-muted ml-2">(saved in browser)</span>
          </p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 bg-info hover:bg-info/80 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Stock
        </button>
      </div>

      {tickers.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-6xl mb-4 opacity-20">$</div>
          <h2 className="text-xl font-semibold mb-2">Empty Portfolio</h2>
          <p className="text-text-secondary mb-6">Add stocks to start tracking</p>
          <button
            onClick={() => setShowAdd(true)}
            className="inline-flex items-center gap-2 bg-info hover:bg-info/80 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            <Plus className="w-5 h-5" />
            Add Stock
          </button>
        </div>
      ) : (
        <div className="bg-bg-card border border-border rounded-xl divide-y divide-border/50">
          {tickers.map((ticker) => (
            <div key={ticker} className="flex items-center justify-between px-4 py-3 hover:bg-bg-hover transition-colors">
              <Link
                to={`/stock/${ticker}`}
                className="font-mono font-semibold text-info hover:underline no-underline flex items-center gap-1.5"
              >
                {ticker}
                <ExternalLink className="w-3 h-3" />
              </Link>
              <button
                onClick={() => removeTicker(ticker)}
                className="p-1.5 rounded-lg text-text-muted hover:text-loss hover:bg-loss/10 transition-colors"
                title="Remove from portfolio"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {showAdd && <AddStockModal onAdd={addTicker} onClose={() => setShowAdd(false)} />}
    </div>
  );
}
