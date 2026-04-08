import { useState, useEffect, useRef } from "react";
import { Search, X, Plus, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";

export default function StockSearch({ onSelect, mode = "navigate", placeholder = "Search stocks..." }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const inputRef = useRef(null);
  const containerRef = useRef(null);
  const debounceRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!query.trim() || query.length < 1) {
      setResults([]);
      return;
    }

    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await api.searchTickers(query);
        setResults(data);
        setOpen(true);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(debounceRef.current);
  }, [query]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (item) => {
    setQuery("");
    setResults([]);
    setOpen(false);
    if (mode === "navigate") {
      navigate(`/stock/${item.symbol}`);
    } else if (onSelect) {
      onSelect(item);
    }
  };

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder={placeholder}
          className="w-full bg-bg-primary border border-border rounded-lg pl-9 pr-8 py-2 text-sm text-text-primary placeholder-text-muted focus:border-info focus:outline-none"
        />
        {loading && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted animate-spin" />}
        {!loading && query && (
          <button
            onClick={() => { setQuery(""); setResults([]); setOpen(false); }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {open && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-bg-card border border-border rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto">
          {results.map((item) => (
            <button
              key={item.symbol}
              onClick={() => handleSelect(item)}
              className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-bg-hover transition-colors text-left border-b border-border/30 last:border-0"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="font-mono text-sm font-semibold text-info shrink-0">{item.symbol}</span>
                <span className="text-sm text-text-secondary truncate">{item.name}</span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[10px] text-text-muted px-1.5 py-0.5 bg-bg-primary rounded">{item.exchange}</span>
                <span className="text-[10px] text-text-muted">{item.type}</span>
                {mode === "add" && <Plus className="w-3.5 h-3.5 text-gain" />}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
