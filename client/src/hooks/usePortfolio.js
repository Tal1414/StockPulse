import { useState, useCallback } from "react";

const STORAGE_KEY = "stockpulse_portfolio";

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function save(tickers) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tickers));
}

export function usePortfolio() {
  const [tickers, setTickers] = useState(load);

  const addTicker = useCallback((ticker) => {
    const upper = ticker.toUpperCase();
    setTickers((prev) => {
      if (prev.includes(upper)) return prev;
      const next = [...prev, upper];
      save(next);
      return next;
    });
  }, []);

  const removeTicker = useCallback((ticker) => {
    const upper = ticker.toUpperCase();
    setTickers((prev) => {
      const next = prev.filter((t) => t !== upper);
      save(next);
      return next;
    });
  }, []);

  const hasTicker = useCallback((ticker) => {
    return tickers.includes(ticker.toUpperCase());
  }, [tickers]);

  return { tickers, addTicker, removeTicker, hasTicker };
}
