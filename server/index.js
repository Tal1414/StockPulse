import express from "express";
import cors from "cors";
import { execFile } from "child_process";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import dotenv from "dotenv";
import Anthropic from "@anthropic-ai/sdk";
import db from "./db.js";

dotenv.config();

const __dirname = dirname(fileURLToPath(import.meta.url));
const PYTHON_SCRIPT = join(__dirname, "..", "python", "technical_analysis.py");

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3001;

// --- Cache for yfinance data (5 min) ---
const dataCache = new Map();
const DATA_CACHE_TTL = 5 * 60 * 1000;

function getCached(key) {
  const entry = dataCache.get(key);
  if (entry && Date.now() - entry.time < DATA_CACHE_TTL) return entry.data;
  return null;
}

function setCache(key, data) {
  dataCache.set(key, { data, time: Date.now() });
}

// --- Python runner ---
function runPython(args, timeout = 30000) {
  return new Promise((resolve, reject) => {
    execFile("python3", [PYTHON_SCRIPT, ...args], { timeout }, (err, stdout, stderr) => {
      if (err) return reject(new Error(stderr || err.message));
      try {
        resolve(JSON.parse(stdout));
      } catch {
        reject(new Error("Failed to parse Python output"));
      }
    });
  });
}

// --- Portfolio ---
app.get("/api/portfolio", (req, res) => {
  const stocks = db.prepare("SELECT * FROM portfolio ORDER BY group_name, ticker").all();
  res.json(stocks);
});

app.post("/api/portfolio", (req, res) => {
  const { ticker, group_name } = req.body;
  if (!ticker) return res.status(400).json({ error: "Ticker required" });
  try {
    db.prepare("INSERT OR IGNORE INTO portfolio (ticker, group_name) VALUES (?, ?)").run(
      ticker.toUpperCase(),
      group_name || "Default"
    );
    res.json({ success: true, ticker: ticker.toUpperCase() });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

app.delete("/api/portfolio/:ticker", (req, res) => {
  db.prepare("DELETE FROM portfolio WHERE ticker = ?").run(req.params.ticker.toUpperCase());
  res.json({ success: true });
});

app.patch("/api/portfolio/:ticker", (req, res) => {
  const { group_name } = req.body;
  db.prepare("UPDATE portfolio SET group_name = ? WHERE ticker = ?").run(
    group_name,
    req.params.ticker.toUpperCase()
  );
  res.json({ success: true });
});

// --- Stock data ---
app.get("/api/stock/:ticker", async (req, res) => {
  const ticker = req.params.ticker.toUpperCase();
  const cacheKey = `stock:${ticker}`;
  const cached = getCached(cacheKey);
  if (cached) return res.json(cached);

  try {
    const data = await runPython(["analyze", ticker]);
    if (data.error) return res.status(404).json(data);
    setCache(cacheKey, data);
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get("/api/stock/:ticker/analysis", async (req, res) => {
  const ticker = req.params.ticker.toUpperCase();
  const cacheKey = `analysis:${ticker}`;
  const cached = getCached(cacheKey);
  if (cached) return res.json(cached);

  try {
    const data = await runPython(["analyze", ticker], 60000);
    if (data.error) return res.status(404).json(data);
    setCache(cacheKey, data);
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get("/api/stock/:ticker/chart", async (req, res) => {
  const ticker = req.params.ticker.toUpperCase();
  const period = req.query.period || "1mo";
  const cacheKey = `chart:${ticker}:${period}`;
  const cached = getCached(cacheKey);
  if (cached) return res.json(cached);

  try {
    const data = await runPython(["chart", ticker, period]);
    setCache(cacheKey, data);
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// --- AI Analysis ---
app.get("/api/stock/:ticker/ai", async (req, res) => {
  const ticker = req.params.ticker.toUpperCase();

  // Check 4-hour cache
  const cached = db
    .prepare("SELECT analysis, cached_at FROM ai_cache WHERE ticker = ? AND cached_at > datetime('now', '-4 hours')")
    .get(ticker);
  if (cached) {
    return res.json(JSON.parse(cached.analysis));
  }

  // If no API key, use rule-based recommendation engine
  if (!process.env.ANTHROPIC_API_KEY) {
    try {
      const result = await runPython(["recommend", ticker], 60000);
      if (result.error) return res.status(404).json(result);

      db.prepare("INSERT OR REPLACE INTO ai_cache (ticker, analysis, cached_at) VALUES (?, ?, datetime('now'))").run(
        ticker,
        JSON.stringify(result)
      );
      return res.json(result);
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  try {
    // Get technical data first
    const techData = await runPython(["analyze", ticker], 60000);
    if (techData.error) return res.status(404).json(techData);

    // Remove chart_data to save tokens
    const { chart_data, sparkline, ...analysisData } = techData;

    const client = new Anthropic();
    const message = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      system:
        "You are a professional stock market analyst. Given technical analysis data, provide a clear recommendation. Respond in JSON format with these fields: overall_assessment (1-2 sentences), action (BUY/SELL/HOLD), confidence (LOW/MEDIUM/HIGH), target_price (number), stop_loss (number), risk_reward_ratio (string like '1:2.5'), catalysts (array of bullish factors), risks (array of bearish factors), disclaimer (short legal disclaimer). Be specific with numbers.",
      messages: [
        {
          role: "user",
          content: `Analyze this stock based on the technical data:\n${JSON.stringify(analysisData, null, 2)}`,
        },
      ],
    });

    let aiResult;
    const text = message.content[0].text;
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      aiResult = jsonMatch ? JSON.parse(jsonMatch[0]) : { raw: text };
    } catch {
      aiResult = { raw: text };
    }

    aiResult.ticker = ticker;
    aiResult.source = "ai";
    aiResult.generated_at = new Date().toISOString();

    db.prepare("INSERT OR REPLACE INTO ai_cache (ticker, analysis, cached_at) VALUES (?, ?, datetime('now'))").run(
      ticker,
      JSON.stringify(aiResult)
    );

    res.json(aiResult);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// --- Market Summary ---
app.get("/api/market/summary", async (req, res) => {
  const cached = getCached("market:summary");
  if (cached) return res.json(cached);

  try {
    const data = await runPython(["market"], 30000);
    setCache("market:summary", data);
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// --- News ---
app.get("/api/market/news", async (req, res) => {
  const cached = getCached("market:news");
  if (cached) return res.json(cached);

  try {
    const data = await runPython(["news"], 30000);
    setCache("market:news", data);
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get("/api/stock/:ticker/news", async (req, res) => {
  const ticker = req.params.ticker.toUpperCase();
  const cacheKey = `news:${ticker}`;
  const cached = getCached(cacheKey);
  if (cached) return res.json(cached);

  try {
    const data = await runPython(["news", ticker], 30000);
    setCache(cacheKey, data);
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// --- Opportunities ---
app.get("/api/opportunities", async (req, res) => {
  const cached = getCached("opportunities");
  if (cached) return res.json(cached);

  try {
    const tickers = req.query.exclude || "";
    const data = await runPython(["opportunities", tickers], 120000);
    setCache("opportunities", data);
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// --- Search ---
app.get("/api/search", async (req, res) => {
  const q = req.query.q;
  if (!q || q.length < 1) return res.json([]);
  const cacheKey = `search:${q.toLowerCase()}`;
  const cached = getCached(cacheKey);
  if (cached) return res.json(cached);

  try {
    const url = `https://query2.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(q)}&quotesCount=8&newsCount=0`;
    const response = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0" },
      signal: AbortSignal.timeout(5000),
    });
    const json = await response.json();
    const results = (json.quotes || [])
      .filter((q) => ["EQUITY", "ETF", "INDEX"].includes(q.quoteType))
      .map((q) => ({
        symbol: q.symbol,
        name: q.shortname || q.longname || "",
        exchange: q.exchange || "",
        type: q.quoteType || "",
      }));
    setCache(cacheKey, results);
    res.json(results);
  } catch {
    res.json([]);
  }
});

// --- Dividends ---
app.get("/api/stock/:ticker/dividends", async (req, res) => {
  const ticker = req.params.ticker.toUpperCase();
  const cacheKey = `dividends:${ticker}`;
  const cached = getCached(cacheKey);
  if (cached) return res.json(cached);

  try {
    const data = await runPython(["dividends", ticker], 30000);
    setCache(cacheKey, data);
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// --- Calendar ---
app.get("/api/stock/:ticker/calendar", async (req, res) => {
  const ticker = req.params.ticker.toUpperCase();
  const cacheKey = `calendar:${ticker}`;
  const cached = getCached(cacheKey);
  if (cached) return res.json(cached);

  try {
    const data = await runPython(["calendar", ticker], 30000);
    setCache(cacheKey, data);
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// --- Alerts ---
app.get("/api/alerts", (req, res) => {
  const alerts = db.prepare("SELECT * FROM alerts WHERE active = 1 ORDER BY created_at DESC").all();
  res.json(alerts);
});

app.post("/api/alerts", (req, res) => {
  const { ticker, indicator, condition, value } = req.body;
  if (!ticker || !indicator || !condition || value === undefined) {
    return res.status(400).json({ error: "Missing fields" });
  }
  const result = db
    .prepare("INSERT INTO alerts (ticker, indicator, condition, value) VALUES (?, ?, ?, ?)")
    .run(ticker.toUpperCase(), indicator, condition, value);
  res.json({ success: true, id: result.lastInsertRowid });
});

app.delete("/api/alerts/:id", (req, res) => {
  db.prepare("DELETE FROM alerts WHERE id = ?").run(req.params.id);
  res.json({ success: true });
});

// --- Serve frontend in production ---
const clientDist = join(__dirname, "..", "client", "dist");
app.use(express.static(clientDist));
app.get("*", (req, res) => {
  res.sendFile(join(clientDist, "index.html"));
});

app.listen(PORT, () => {
  console.log(`StockPulse running on http://localhost:${PORT}`);
});
