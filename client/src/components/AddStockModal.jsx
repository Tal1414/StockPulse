import { useState } from "react";
import { X, Plus } from "lucide-react";
import StockSearch from "./StockSearch";

export default function AddStockModal({ onAdd, onClose }) {
  const [ticker, setTicker] = useState("");
  const [selectedName, setSelectedName] = useState("");

  const handleSelect = (item) => {
    setTicker(item.symbol);
    setSelectedName(item.name);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!ticker.trim()) return;
    onAdd(ticker.trim().toUpperCase());
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-bg-card border border-border rounded-xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Add Stock</h3>
          <button onClick={onClose} className="text-text-secondary hover:text-text-primary p-1">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-text-secondary mb-1">Search Stock</label>
            <StockSearch
              mode="add"
              onSelect={handleSelect}
              placeholder="Search by ticker or company name..."
            />
          </div>

          {ticker && (
            <div className="bg-bg-primary border border-info/20 rounded-lg p-3 flex items-center justify-between">
              <div>
                <span className="font-mono font-semibold text-info">{ticker}</span>
                {selectedName && <span className="text-sm text-text-secondary ml-2">{selectedName}</span>}
              </div>
              <button
                type="button"
                onClick={() => { setTicker(""); setSelectedName(""); }}
                className="text-text-muted hover:text-loss"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          <button
            type="submit"
            disabled={!ticker.trim()}
            className="w-full bg-info hover:bg-info/80 disabled:opacity-50 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add to Portfolio
          </button>
        </form>
      </div>
    </div>
  );
}
