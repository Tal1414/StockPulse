import { useState } from "react";
import { X, Check } from "lucide-react";
import StockSearch from "./StockSearch";

export default function AddStockModal({ onAdd, onClose }) {
  const [added, setAdded] = useState([]);

  const handleSelect = (item) => {
    const ticker = item.symbol.toUpperCase();
    if (added.includes(ticker)) return;
    onAdd(ticker);
    setAdded((prev) => [...prev, ticker]);
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onMouseDown={(e) => {
        // Only close if clicking the backdrop itself, not children
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-bg-card border border-border rounded-xl p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Add Stocks</h3>
          <button onClick={onClose} className="text-text-secondary hover:text-text-primary p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mb-4">
          <label className="block text-sm text-text-secondary mb-1">Search & click to add</label>
          <StockSearch
            mode="add"
            onSelect={handleSelect}
            placeholder="Search by ticker or company name..."
          />
        </div>

        {added.length > 0 && (
          <div className="space-y-2 mb-4">
            <div className="text-xs text-text-muted">Added ({added.length})</div>
            <div className="flex flex-wrap gap-1.5">
              {added.map((t) => (
                <span key={t} className="inline-flex items-center gap-1 px-2 py-1 bg-gain/10 text-gain border border-gain/20 rounded-md text-xs font-mono">
                  <Check className="w-3 h-3" />
                  {t}
                </span>
              ))}
            </div>
          </div>
        )}

        <button
          onClick={onClose}
          className="w-full bg-bg-hover hover:bg-border text-text-primary font-medium py-2 px-4 rounded-lg transition-colors text-sm"
        >
          Done
        </button>
      </div>
    </div>
  );
}
