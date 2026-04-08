import { useState, useEffect, useRef } from "react";
import { Plus, RefreshCw, Pause, Play } from "lucide-react";
import { api } from "../lib/api";
import { usePortfolioContext } from "../hooks/PortfolioContext";
import MarketBar from "../components/MarketBar";
import StockCard from "../components/StockCard";
import AddStockModal from "../components/AddStockModal";
import { CardSkeleton } from "../components/LoadingSkeleton";
import { MarketNewsFeed } from "../components/NewsFeed";
import SectorHeatmap from "../components/SectorHeatmap";
import SectorAllocation from "../components/SectorAllocation";
import MarketRegime from "../components/MarketRegime";
import TopSignals from "../components/TopSignals";

const AUTO_REFRESH_INTERVAL = 60000;

export default function Dashboard() {
  const { tickers, addTicker } = usePortfolioContext();
  const [showAdd, setShowAdd] = useState(false);
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(null);
  const intervalRef = useRef(null);
  const loadIdRef = useRef(0); // prevent race conditions

  const loadStockData = async (tickerList, silent = false) => {
    if (!tickerList.length) {
      setStocks([]);
      setLoading(false);
      return;
    }

    const loadId = ++loadIdRef.current;
    if (!silent) setLoading(true);

    const results = await Promise.allSettled(tickerList.map((t) => api.getStock(t)));

    // Only update if this is still the latest load request
    if (loadId !== loadIdRef.current) return;

    const loaded = results.filter((r) => r.status === "fulfilled" && !r.value.error).map((r) => r.value);
    setStocks(loaded);
    setLoading(false);
    setLastRefresh(new Date());
  };

  // Load when tickers change
  useEffect(() => {
    loadStockData(tickers);
  }, [tickers]);

  // Auto-refresh
  useEffect(() => {
    if (autoRefresh && tickers.length) {
      intervalRef.current = setInterval(() => {
        loadStockData(tickers, true);
      }, AUTO_REFRESH_INTERVAL);
    }
    return () => clearInterval(intervalRef.current);
  }, [autoRefresh, tickers]);

  const isEmpty = !loading && tickers.length === 0;

  return (
    <div>
      <MarketRegime />
      <MarketBar />

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <p className="text-sm text-text-secondary">
            {stocks.length > 0 ? `Tracking ${stocks.length} stocks` : "Your market intelligence hub"}
            {lastRefresh && (
              <span className="ml-2 text-text-muted">
                Updated {lastRefresh.toLocaleTimeString()}
              </span>
            )}
          </p>
        </div>
        <div className="flex gap-2 items-center">
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`p-2 rounded-lg border transition-colors ${
              autoRefresh
                ? "border-gain/30 text-gain bg-gain/5"
                : "border-border text-text-muted hover:bg-bg-hover"
            }`}
            title={autoRefresh ? "Auto-refresh ON (60s)" : "Auto-refresh OFF"}
          >
            {autoRefresh ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
          </button>
          <button
            onClick={() => loadStockData(tickers)}
            className="p-2 rounded-lg border border-border text-text-secondary hover:text-text-primary hover:bg-bg-hover transition-colors"
            title="Refresh now"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 bg-info hover:bg-info/80 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Stock
          </button>
        </div>
      </div>

      {loading ? (
        <CardSkeleton count={tickers.length || 4} />
      ) : isEmpty ? (
        <div className="text-center py-20">
          <div className="text-6xl mb-4 opacity-20">$</div>
          <h2 className="text-xl font-semibold mb-2">No stocks yet</h2>
          <p className="text-text-secondary mb-6">Add stocks to start tracking the market</p>
          <button
            onClick={() => setShowAdd(true)}
            className="inline-flex items-center gap-2 bg-info hover:bg-info/80 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            <Plus className="w-5 h-5" />
            Add Your First Stock
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {stocks.map((stock) => (
              <StockCard key={stock.ticker} stock={stock} />
            ))}
          </div>
          <div className="mt-6">
            <TopSignals />
          </div>
          <div className="mt-4 grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-4">
            <SectorHeatmap stocks={stocks} />
            <SectorAllocation stocks={stocks} />
          </div>
        </>
      )}

      <div className="mt-8">
        <MarketNewsFeed />
      </div>

      {showAdd && <AddStockModal onAdd={addTicker} onClose={() => setShowAdd(false)} />}
    </div>
  );
}
