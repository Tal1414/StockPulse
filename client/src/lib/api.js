const API = "/api";

async function fetchJSON(url) {
  const res = await fetch(url);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || res.statusText);
  }
  return res.json();
}

export const api = {
  // Portfolio
  getPortfolio: () => fetchJSON(`${API}/portfolio`),
  addStock: (ticker, group_name) =>
    fetch(`${API}/portfolio`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ticker, group_name }),
    }).then((r) => r.json()),
  removeStock: (ticker) => fetch(`${API}/portfolio/${ticker}`, { method: "DELETE" }).then((r) => r.json()),
  updateStockGroup: (ticker, group_name) =>
    fetch(`${API}/portfolio/${ticker}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ group_name }),
    }).then((r) => r.json()),

  // Stock data
  getStock: (ticker) => fetchJSON(`${API}/stock/${ticker}`),
  getAnalysis: (ticker) => fetchJSON(`${API}/stock/${ticker}/analysis`),
  getChart: (ticker, period) => fetchJSON(`${API}/stock/${ticker}/chart?period=${period}`),
  getAI: (ticker) => fetchJSON(`${API}/stock/${ticker}/ai`),
  getDividends: (ticker) => fetchJSON(`${API}/stock/${ticker}/dividends`),
  getCalendar: (ticker) => fetchJSON(`${API}/stock/${ticker}/calendar`),

  // Market
  getMarketSummary: () => fetchJSON(`${API}/market/summary`),
  getMarketRegime: () => fetchJSON(`${API}/market/regime`),
  getTopSignals: (tickers = []) => fetchJSON(`${API}/signals?tickers=${tickers.join(",")}`),
  getMarketNews: () => fetchJSON(`${API}/market/news`),
  getStockNews: (ticker) => fetchJSON(`${API}/stock/${ticker}/news`),

  // Search
  searchTickers: (q) => fetchJSON(`${API}/search?q=${encodeURIComponent(q)}`),

  // Opportunities
  getOpportunities: (excludeTickers = []) =>
    fetchJSON(`${API}/opportunities?exclude=${excludeTickers.join(",")}`),

  // Alerts
  getAlerts: () => fetchJSON(`${API}/alerts`),
  createAlert: (alert) =>
    fetch(`${API}/alerts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(alert),
    }).then((r) => r.json()),
  deleteAlert: (id) => fetch(`${API}/alerts/${id}`, { method: "DELETE" }).then((r) => r.json()),
};
