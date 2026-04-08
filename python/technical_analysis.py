#!/usr/bin/env python3
"""StockPulse Technical Analysis Engine - computes all indicators for a given ticker."""

import sys
import json
import numpy as np
import yfinance as yf
from datetime import datetime, timedelta


def compute_rsi(closes, period=14):
    deltas = np.diff(closes)
    gains = np.where(deltas > 0, deltas, 0)
    losses = np.where(deltas < 0, -deltas, 0)
    avg_gain = np.mean(gains[:period])
    avg_loss = np.mean(losses[:period])
    if avg_loss == 0:
        return 100.0
    rs = avg_gain / avg_loss
    for i in range(period, len(gains)):
        avg_gain = (avg_gain * (period - 1) + gains[i]) / period
        avg_loss = (avg_loss * (period - 1) + losses[i]) / period
    if avg_loss == 0:
        return 100.0
    rs = avg_gain / avg_loss
    return round(100 - (100 / (1 + rs)), 2)


def compute_ema(data, period):
    ema = [np.mean(data[:period])]
    multiplier = 2 / (period + 1)
    for price in data[period:]:
        ema.append((price - ema[-1]) * multiplier + ema[-1])
    return ema


def compute_macd(closes):
    ema12 = compute_ema(closes, 12)
    ema26 = compute_ema(closes, 26)
    min_len = min(len(ema12), len(ema26))
    ema12_aligned = ema12[-min_len:]
    ema26_aligned = ema26[-min_len:]
    macd_line = [a - b for a, b in zip(ema12_aligned, ema26_aligned)]
    if len(macd_line) >= 9:
        signal = compute_ema(macd_line, 9)
    else:
        signal = macd_line
    histogram = macd_line[-1] - signal[-1] if signal else 0
    return round(macd_line[-1], 4), round(signal[-1], 4), round(histogram, 4)


def compute_bollinger(closes, period=20):
    if len(closes) < period:
        return None, None, None
    sma = np.mean(closes[-period:])
    std = np.std(closes[-period:], ddof=1)
    upper = sma + 2 * std
    lower = sma - 2 * std
    current = closes[-1]
    pct = ((current - lower) / (upper - lower)) * 100 if upper != lower else 50
    return round(upper, 2), round(lower, 2), round(pct, 2)


def compute_stochastic(highs, lows, closes, k_period=14, d_period=3):
    if len(closes) < k_period:
        return 50, 50
    k_values = []
    for i in range(max(0, len(closes) - k_period - d_period + 1), len(closes)):
        start = max(0, i - k_period + 1)
        high = max(highs[start:i + 1])
        low = min(lows[start:i + 1])
        if high == low:
            k_values.append(50)
        else:
            k_values.append(((closes[i] - low) / (high - low)) * 100)
    k = k_values[-1] if k_values else 50
    d = np.mean(k_values[-d_period:]) if len(k_values) >= d_period else k
    return round(k, 2), round(d, 2)


def compute_adx(highs, lows, closes, period=14):
    if len(closes) < period + 1:
        return 25, 25, 25
    plus_dm = []
    minus_dm = []
    tr_list = []
    for i in range(1, len(closes)):
        high_diff = highs[i] - highs[i - 1]
        low_diff = lows[i - 1] - lows[i]
        plus_dm.append(max(high_diff, 0) if high_diff > low_diff else 0)
        minus_dm.append(max(low_diff, 0) if low_diff > high_diff else 0)
        tr = max(highs[i] - lows[i], abs(highs[i] - closes[i - 1]), abs(lows[i] - closes[i - 1]))
        tr_list.append(tr)

    smoothed_tr = sum(tr_list[:period])
    smoothed_plus = sum(plus_dm[:period])
    smoothed_minus = sum(minus_dm[:period])

    for i in range(period, len(tr_list)):
        smoothed_tr = smoothed_tr - smoothed_tr / period + tr_list[i]
        smoothed_plus = smoothed_plus - smoothed_plus / period + plus_dm[i]
        smoothed_minus = smoothed_minus - smoothed_minus / period + minus_dm[i]

    plus_di = (smoothed_plus / smoothed_tr) * 100 if smoothed_tr else 0
    minus_di = (smoothed_minus / smoothed_tr) * 100 if smoothed_tr else 0
    dx = abs(plus_di - minus_di) / (plus_di + minus_di) * 100 if (plus_di + minus_di) else 0
    return round(dx, 2), round(plus_di, 2), round(minus_di, 2)


def compute_atr(highs, lows, closes, period=14):
    if len(closes) < 2:
        return 0
    tr_list = []
    for i in range(1, len(closes)):
        tr = max(highs[i] - lows[i], abs(highs[i] - closes[i - 1]), abs(lows[i] - closes[i - 1]))
        tr_list.append(tr)
    if len(tr_list) < period:
        return round(np.mean(tr_list), 2) if tr_list else 0
    atr = np.mean(tr_list[:period])
    for i in range(period, len(tr_list)):
        atr = (atr * (period - 1) + tr_list[i]) / period
    return round(atr, 2)


def compute_obv(closes, volumes):
    obv = [0]
    for i in range(1, len(closes)):
        if closes[i] > closes[i - 1]:
            obv.append(obv[-1] + volumes[i])
        elif closes[i] < closes[i - 1]:
            obv.append(obv[-1] - volumes[i])
        else:
            obv.append(obv[-1])
    current = obv[-1]
    trend = "rising" if len(obv) > 5 and obv[-1] > obv[-5] else "falling" if len(obv) > 5 and obv[-1] < obv[-5] else "flat"
    return current, trend


def compute_vwap(closes, volumes, period=20):
    if len(closes) < period:
        period = len(closes)
    typical = closes[-period:]
    vol = volumes[-period:]
    total_vol = sum(vol)
    if total_vol == 0:
        return round(np.mean(typical), 2)
    return round(sum(t * v for t, v in zip(typical, vol)) / total_vol, 2)


def compute_pivot_points(high, low, close):
    pivot = (high + low + close) / 3
    r1 = 2 * pivot - low
    s1 = 2 * pivot - high
    r2 = pivot + (high - low)
    s2 = pivot - (high - low)
    r3 = high + 2 * (pivot - low)
    s3 = low - 2 * (high - pivot)
    return {
        "R3": round(r3, 2), "R2": round(r2, 2), "R1": round(r1, 2),
        "pivot": round(pivot, 2),
        "S1": round(s1, 2), "S2": round(s2, 2), "S3": round(s3, 2)
    }


def compute_fibonacci(high_52w, low_52w):
    diff = high_52w - low_52w
    return {
        "high": round(high_52w, 2),
        "low": round(low_52w, 2),
        "0.236": round(high_52w - 0.236 * diff, 2),
        "0.382": round(high_52w - 0.382 * diff, 2),
        "0.5": round(high_52w - 0.5 * diff, 2),
        "0.618": round(high_52w - 0.618 * diff, 2),
        "0.786": round(high_52w - 0.786 * diff, 2),
    }


def detect_candlestick_patterns(opens, highs, lows, closes, dates):
    patterns = []
    n = len(closes)
    if n < 3:
        return patterns

    for i in range(max(0, n - 5), n):
        o, h, l, c = opens[i], highs[i], lows[i], closes[i]
        body = abs(c - o)
        full_range = h - l
        if full_range == 0:
            continue
        date_str = dates[i].strftime("%m/%d") if hasattr(dates[i], 'strftime') else str(dates[i])[:5]

        upper_shadow = h - max(o, c)
        lower_shadow = min(o, c) - l

        # Doji
        if body / full_range < 0.1 and full_range > 0:
            patterns.append(f"Doji ({date_str})")

        # Hammer (bullish)
        elif lower_shadow > 2 * body and upper_shadow < body * 0.5 and body > 0:
            patterns.append(f"Hammer ({date_str})")

        # Inverted Hammer
        elif upper_shadow > 2 * body and lower_shadow < body * 0.5 and body > 0:
            patterns.append(f"Inverted Hammer ({date_str})")

        # Bullish Engulfing
        if i > 0:
            prev_o, prev_c = opens[i - 1], closes[i - 1]
            if prev_c < prev_o and c > o and c > prev_o and o < prev_c:
                patterns.append(f"Bullish Engulfing ({date_str})")
            elif prev_c > prev_o and c < o and c < prev_o and o > prev_c:
                patterns.append(f"Bearish Engulfing ({date_str})")

    return patterns[-5:]


def compute_support_resistance(closes, period=30):
    recent = closes[-period:] if len(closes) >= period else closes
    support = min(recent)
    resistance = max(recent)
    return round(support, 2), round(resistance, 2)


def determine_trend(sma_20, sma_50, sma_200, price, adx):
    score = 0
    if price > sma_20:
        score += 1
    if price > sma_50:
        score += 1
    if price > sma_200:
        score += 1
    if sma_20 > sma_50:
        score += 1
    if sma_50 > sma_200:
        score += 1

    if score >= 4:
        trend = "BULLISH"
    elif score >= 2:
        trend = "NEUTRAL"
    else:
        trend = "BEARISH"

    if adx > 40:
        strength = "STRONG"
    elif adx > 25:
        strength = "MODERATE"
    else:
        strength = "WEAK"

    return trend, strength


def generate_signals(rsi, macd, macd_signal, macd_hist, price, sma_20, sma_50, sma_200, stoch_k, stoch_d, bollinger_pct, adx):
    signals = []

    # RSI
    if rsi < 30:
        signals.append(f"RSI oversold ({rsi})")
    elif rsi > 70:
        signals.append(f"RSI overbought ({rsi})")
    else:
        signals.append(f"RSI neutral ({rsi})")

    # MACD
    if macd > macd_signal and macd_hist > 0:
        signals.append("MACD bullish crossover")
    elif macd < macd_signal and macd_hist < 0:
        signals.append("MACD bearish crossover")
    else:
        signals.append("MACD neutral")

    # Price vs SMAs
    if price > sma_20:
        signals.append("Above SMA 20")
    else:
        signals.append("Below SMA 20")

    if price > sma_50:
        signals.append("Above SMA 50")
    else:
        signals.append("Below SMA 50")

    if price > sma_200:
        signals.append("Above SMA 200")
    else:
        signals.append("Below SMA 200")

    # Stochastic
    if stoch_k < 20:
        signals.append(f"Stochastic oversold ({stoch_k})")
    elif stoch_k > 80:
        signals.append(f"Stochastic overbought ({stoch_k})")
    else:
        signals.append(f"Stochastic neutral ({stoch_k})")

    # Bollinger
    if bollinger_pct is not None:
        if bollinger_pct < 10:
            signals.append("Near lower Bollinger Band")
        elif bollinger_pct > 90:
            signals.append("Near upper Bollinger Band")

    # MA Crossovers
    if sma_20 > sma_50 and sma_50 > sma_200:
        signals.append("Golden alignment (20>50>200)")
    elif sma_20 < sma_50 and sma_50 < sma_200:
        signals.append("Death alignment (20<50<200)")

    # ADX
    if adx > 25:
        signals.append(f"Strong trend (ADX {adx})")
    else:
        signals.append(f"Weak trend (ADX {adx})")

    return signals


def get_chart_data(ticker_symbol, period="1mo"):
    """Get OHLCV data formatted for charting."""
    try:
        ticker = yf.Ticker(ticker_symbol)
        hist = ticker.history(period=period)
        if hist.empty:
            return []
        data = []
        for date, row in hist.iterrows():
            data.append({
                "time": date.strftime("%Y-%m-%d"),
                "open": round(float(row["Open"]), 2),
                "high": round(float(row["High"]), 2),
                "low": round(float(row["Low"]), 2),
                "close": round(float(row["Close"]), 2),
                "volume": int(row["Volume"]),
            })
        return data
    except Exception:
        return []


def analyze(ticker_symbol):
    """Main analysis function - returns full technical analysis for a ticker."""
    try:
        ticker = yf.Ticker(ticker_symbol)
        hist = ticker.history(period="1y")

        if hist.empty or len(hist) < 20:
            return {"error": f"Insufficient data for {ticker_symbol}"}

        closes = hist["Close"].values.astype(float)
        opens = hist["Open"].values.astype(float)
        highs = hist["High"].values.astype(float)
        lows = hist["Low"].values.astype(float)
        volumes = hist["Volume"].values.astype(float)
        dates = hist.index.tolist()

        price = round(float(closes[-1]), 2)
        prev_close = round(float(closes[-2]), 2) if len(closes) > 1 else price

        # SMAs
        sma_10 = round(float(np.mean(closes[-10:])), 2) if len(closes) >= 10 else price
        sma_20 = round(float(np.mean(closes[-20:])), 2) if len(closes) >= 20 else price
        sma_50 = round(float(np.mean(closes[-50:])), 2) if len(closes) >= 50 else price
        sma_200 = round(float(np.mean(closes[-200:])), 2) if len(closes) >= 200 else price

        # EMAs
        ema_12 = round(compute_ema(closes.tolist(), 12)[-1], 2) if len(closes) >= 12 else price
        ema_26 = round(compute_ema(closes.tolist(), 26)[-1], 2) if len(closes) >= 26 else price

        # RSI
        rsi = compute_rsi(closes.tolist())

        # MACD
        macd, macd_signal, macd_histogram = compute_macd(closes.tolist())

        # Bollinger
        bb_upper, bb_lower, bb_pct = compute_bollinger(closes.tolist())

        # Stochastic
        stoch_k, stoch_d = compute_stochastic(highs.tolist(), lows.tolist(), closes.tolist())

        # ADX
        adx, plus_di, minus_di = compute_adx(highs.tolist(), lows.tolist(), closes.tolist())

        # ATR
        atr = compute_atr(highs.tolist(), lows.tolist(), closes.tolist())
        atr_pct = round((atr / price) * 100, 2) if price else 0

        # OBV
        obv_current, obv_trend = compute_obv(closes.tolist(), volumes.tolist())

        # VWAP
        vwap = compute_vwap(closes.tolist(), volumes.tolist())
        price_vs_vwap = round(((price - vwap) / vwap) * 100, 2) if vwap else 0

        # Pivot Points
        pivot_points = compute_pivot_points(float(highs[-1]), float(lows[-1]), float(closes[-1]))

        # 52-week high/low
        high_52w = round(float(np.max(highs)), 2)
        low_52w = round(float(np.min(lows)), 2)

        # Fibonacci
        fibonacci = compute_fibonacci(high_52w, low_52w)

        # Support/Resistance
        support, resistance = compute_support_resistance(closes.tolist())

        # Volume
        vol_current = int(volumes[-1])
        avg_vol_20 = int(np.mean(volumes[-20:])) if len(volumes) >= 20 else int(np.mean(volumes))
        vol_vs_avg = round(vol_current / avg_vol_20, 2) if avg_vol_20 else 1
        vol_trend = "high" if vol_vs_avg > 1.5 else "low" if vol_vs_avg < 0.5 else "normal"

        # Trend
        trend, trend_strength = determine_trend(sma_20, sma_50, sma_200, price, adx)

        # Signals
        signals = generate_signals(rsi, macd, macd_signal, macd_histogram, price, sma_20, sma_50, sma_200, stoch_k, stoch_d, bb_pct, adx)

        # Candlestick patterns
        patterns = detect_candlestick_patterns(opens.tolist(), highs.tolist(), lows.tolist(), closes.tolist(), dates)

        # MA crossovers
        ma_crossovers = []
        if len(closes) >= 50:
            sma20_prev = float(np.mean(closes[-21:-1]))
            sma50_prev = float(np.mean(closes[-51:-1]))
            if sma20_prev < sma50_prev and sma_20 > sma_50:
                ma_crossovers.append("SMA 20/50 golden cross")
            elif sma20_prev > sma50_prev and sma_20 < sma_50:
                ma_crossovers.append("SMA 20/50 death cross")
        if not ma_crossovers:
            ma_crossovers.append("none")

        # Daily change
        daily_change = round(price - prev_close, 2)
        daily_change_pct = round((daily_change / prev_close) * 100, 2) if prev_close else 0

        # Chart data (last 30 days)
        chart_data = []
        chart_period = min(30, len(closes))
        for i in range(-chart_period, 0):
            chart_data.append({
                "time": dates[i].strftime("%Y-%m-%d") if hasattr(dates[i], 'strftime') else str(dates[i])[:10],
                "open": round(float(opens[i]), 2),
                "high": round(float(highs[i]), 2),
                "low": round(float(lows[i]), 2),
                "close": round(float(closes[i]), 2),
                "volume": int(volumes[i]),
            })

        # Sparkline (last 5 days)
        sparkline = [round(float(c), 2) for c in closes[-5:]]

        # Company info
        info = ticker.info
        company_name = info.get("shortName", info.get("longName", ticker_symbol))
        sector = info.get("sector", "Unknown")
        market_cap = info.get("marketCap", 0)

        # Pre/Post market data
        market_state = info.get("marketState", "REGULAR")  # PRE, REGULAR, POST, PREPRE, POSTPOST, CLOSED
        extended_hours = {}

        if info.get("preMarketPrice"):
            extended_hours["pre_market"] = {
                "price": round(float(info["preMarketPrice"]), 2),
                "change": round(float(info.get("preMarketChange", 0)), 2),
                "change_pct": round(float(info.get("preMarketChangePercent", 0)), 2),
                "time": info.get("preMarketTime", 0),
            }

        if info.get("postMarketPrice"):
            extended_hours["post_market"] = {
                "price": round(float(info["postMarketPrice"]), 2),
                "change": round(float(info.get("postMarketChange", 0)), 2),
                "change_pct": round(float(info.get("postMarketChangePercent", 0)), 2),
                "time": info.get("postMarketTime", 0),
            }

        regular_market = {
            "open": round(float(info.get("regularMarketOpen", opens[-1])), 2),
            "high": round(float(info.get("regularMarketDayHigh", highs[-1])), 2),
            "low": round(float(info.get("regularMarketDayLow", lows[-1])), 2),
            "price": round(float(info.get("regularMarketPrice", price)), 2),
            "prev_close": round(float(info.get("regularMarketPreviousClose", prev_close)), 2),
            "volume": int(info.get("regularMarketVolume", vol_current)),
        }

        return {
            "ticker": ticker_symbol.upper(),
            "company_name": company_name,
            "sector": sector,
            "market_cap": market_cap,
            "market_state": market_state,
            "extended_hours": extended_hours,
            "regular_market": regular_market,
            "price": price,
            "prev_close": prev_close,
            "daily_change": daily_change,
            "daily_change_pct": daily_change_pct,
            "volume": vol_current,
            "avg_volume_20d": avg_vol_20,
            "rsi_14": rsi,
            "macd": macd,
            "macd_signal": macd_signal,
            "macd_histogram": macd_histogram,
            "sma_10": sma_10,
            "sma_20": sma_20,
            "sma_50": sma_50,
            "sma_200": sma_200,
            "ema_12": ema_12,
            "ema_26": ema_26,
            "bollinger_upper": bb_upper,
            "bollinger_lower": bb_lower,
            "bollinger_pct": bb_pct,
            "atr_14": atr,
            "atr_pct": atr_pct,
            "stochastic_k": stoch_k,
            "stochastic_d": stoch_d,
            "adx": adx,
            "plus_di": plus_di,
            "minus_di": minus_di,
            "obv_current": obv_current,
            "obv_trend": obv_trend,
            "vwap_20d": vwap,
            "price_vs_vwap": price_vs_vwap,
            "pivot_points": pivot_points,
            "fibonacci": fibonacci,
            "support_30d": support,
            "resistance_30d": resistance,
            "high_52w": high_52w,
            "low_52w": low_52w,
            "pct_from_52w_high": round(((price - high_52w) / high_52w) * 100, 2),
            "ma_crossovers": ma_crossovers,
            "candlestick_patterns": patterns,
            "trend": trend,
            "trend_strength": trend_strength,
            "volume_vs_avg": vol_vs_avg,
            "volume_trend": vol_trend,
            "signals": signals,
            "chart_data": chart_data,
            "sparkline": sparkline,
        }

    except Exception as e:
        return {"error": str(e)}


def get_market_summary():
    """Get major market indices and commodities."""
    symbols = {
        "S&P 500": "^GSPC",
        "NASDAQ": "^IXIC",
        "DOW": "^DJI",
        "VIX": "^VIX",
        "Gold": "GC=F",
        "Oil": "CL=F",
    }
    results = []
    for name, sym in symbols.items():
        try:
            ticker = yf.Ticker(sym)
            hist = ticker.history(period="2d")
            if len(hist) >= 2:
                price = round(float(hist["Close"].iloc[-1]), 2)
                prev = round(float(hist["Close"].iloc[-2]), 2)
                change = round(price - prev, 2)
                change_pct = round((change / prev) * 100, 2) if prev else 0
            elif len(hist) == 1:
                price = round(float(hist["Close"].iloc[-1]), 2)
                change = 0
                change_pct = 0
            else:
                continue
            results.append({
                "name": name,
                "symbol": sym,
                "price": price,
                "change": change,
                "change_pct": change_pct,
            })
        except Exception:
            continue
    return results


def generate_recommendation(data):
    """Rule-based recommendation engine - scores all indicators to produce a BUY/SELL/HOLD."""
    score = 0  # positive = bullish, negative = bearish
    catalysts = []
    risks = []

    price = data["price"]
    rsi = data["rsi_14"]
    macd = data["macd"]
    macd_signal = data["macd_signal"]
    macd_hist = data["macd_histogram"]
    stoch_k = data["stochastic_k"]
    adx = data["adx"]
    plus_di = data["plus_di"]
    minus_di = data["minus_di"]
    bb_pct = data["bollinger_pct"]
    obv_trend = data["obv_trend"]
    vol_vs_avg = data["volume_vs_avg"]
    trend = data["trend"]
    sma_20 = data["sma_20"]
    sma_50 = data["sma_50"]
    sma_200 = data["sma_200"]
    atr = data["atr_14"]
    support = data["support_30d"]
    resistance = data["resistance_30d"]
    fib = data["fibonacci"]

    # --- RSI ---
    if rsi < 30:
        score += 2
        catalysts.append(f"RSI oversold at {rsi} — potential bounce")
    elif rsi < 40:
        score += 1
        catalysts.append(f"RSI approaching oversold ({rsi})")
    elif rsi > 70:
        score -= 2
        risks.append(f"RSI overbought at {rsi} — potential pullback")
    elif rsi > 60:
        score -= 0.5
        risks.append(f"RSI elevated ({rsi})")

    # --- MACD ---
    if macd > macd_signal and macd_hist > 0:
        score += 1.5
        catalysts.append("MACD bullish crossover with positive momentum")
    elif macd < macd_signal and macd_hist < 0:
        score -= 1.5
        risks.append("MACD bearish crossover with negative momentum")

    # --- Stochastic ---
    if stoch_k < 20:
        score += 1
        catalysts.append(f"Stochastic oversold ({stoch_k})")
    elif stoch_k > 80:
        score -= 1
        risks.append(f"Stochastic overbought ({stoch_k})")

    # --- ADX / Trend ---
    if adx > 25:
        if plus_di > minus_di:
            score += 1.5
            catalysts.append(f"Strong bullish trend (ADX {adx}, +DI > -DI)")
        else:
            score -= 1.5
            risks.append(f"Strong bearish trend (ADX {adx}, -DI > +DI)")
    else:
        risks.append(f"Weak trend (ADX {adx}) — choppy conditions")

    # --- Moving Averages ---
    if price > sma_20 and price > sma_50 and price > sma_200:
        score += 2
        catalysts.append("Price above all major moving averages (20/50/200)")
    elif price > sma_20 and price > sma_50:
        score += 1
        catalysts.append("Price above SMA 20 and 50")
    elif price < sma_20 and price < sma_50 and price < sma_200:
        score -= 2
        risks.append("Price below all major moving averages (20/50/200)")
    elif price < sma_20 and price < sma_50:
        score -= 1
        risks.append("Price below SMA 20 and 50")

    if sma_20 > sma_50 > sma_200:
        score += 1
        catalysts.append("Golden alignment — SMA 20 > 50 > 200")
    elif sma_20 < sma_50 < sma_200:
        score -= 1
        risks.append("Death alignment — SMA 20 < 50 < 200")

    # --- Bollinger Bands ---
    if bb_pct is not None:
        if bb_pct < 10:
            score += 1
            catalysts.append("Near lower Bollinger Band — potential reversal")
        elif bb_pct > 90:
            score -= 1
            risks.append("Near upper Bollinger Band — potential resistance")

    # --- Volume ---
    if obv_trend == "rising":
        score += 0.5
        catalysts.append("On-Balance Volume trending up — accumulation")
    elif obv_trend == "falling":
        score -= 0.5
        risks.append("On-Balance Volume trending down — distribution")

    if vol_vs_avg > 1.5 and trend == "BULLISH":
        score += 0.5
        catalysts.append(f"Above-average volume ({vol_vs_avg}x) confirming bullish move")
    elif vol_vs_avg > 1.5 and trend == "BEARISH":
        score -= 0.5
        risks.append(f"Above-average volume ({vol_vs_avg}x) confirming bearish move")

    # --- Candlestick Patterns ---
    for p in data.get("candlestick_patterns", []):
        pl = p.lower()
        if "bullish" in pl or "hammer" in pl:
            score += 0.5
            catalysts.append(f"Bullish candlestick pattern: {p}")
        elif "bearish" in pl:
            score -= 0.5
            risks.append(f"Bearish candlestick pattern: {p}")

    # --- Determine Action ---
    if score >= 3:
        action = "BUY"
    elif score <= -3:
        action = "SELL"
    else:
        action = "HOLD"

    abs_score = abs(score)
    if abs_score >= 5:
        confidence = "HIGH"
    elif abs_score >= 2.5:
        confidence = "MEDIUM"
    else:
        confidence = "LOW"

    # --- Target Price & Stop Loss ---
    if action == "BUY":
        target = round(min(resistance, fib.get("0.236", resistance)), 2)
        if target <= price:
            target = round(price * 1.05, 2)
        stop = round(max(support, price - 2 * atr), 2)
    elif action == "SELL":
        target = round(max(support, fib.get("0.618", support)), 2)
        if target >= price:
            target = round(price * 0.95, 2)
        stop = round(min(resistance, price + 2 * atr), 2)
    else:
        target = round(resistance, 2)
        stop = round(support, 2)

    # --- Risk/Reward ---
    reward = abs(target - price)
    risk_amt = abs(price - stop)
    if risk_amt > 0:
        rr = round(reward / risk_amt, 1)
        rr_str = f"1:{rr}"
    else:
        rr_str = "N/A"

    # --- Overall Assessment ---
    trend_word = trend.lower()
    if action == "BUY":
        assessment = f"{data['ticker']} shows a {trend_word} setup with {len(catalysts)} bullish signals. Technical indicators suggest upside potential toward ${target} with a favorable risk/reward profile."
    elif action == "SELL":
        assessment = f"{data['ticker']} is showing {trend_word} pressure with {len(risks)} bearish signals. Technical indicators suggest downside risk toward ${target}. Consider reducing exposure."
    else:
        assessment = f"{data['ticker']} is in a {trend_word} consolidation phase with mixed signals. Wait for a clearer setup before taking a directional position."

    return {
        "ticker": data["ticker"],
        "overall_assessment": assessment,
        "action": action,
        "confidence": confidence,
        "target_price": target,
        "stop_loss": stop,
        "risk_reward_ratio": rr_str,
        "catalysts": catalysts[:6],
        "risks": risks[:6],
        "score": round(score, 1),
        "source": "rule-based",
        "disclaimer": "This is an automated technical analysis based on historical data and indicators. It is not financial advice. Always do your own research before making investment decisions.",
        "generated_at": datetime.now().isoformat(),
    }


def scan_opportunities(existing_tickers=None):
    """Scan for investment opportunities with full technical analysis."""
    if existing_tickers is None:
        existing_tickers = []
    existing_upper = [t.upper() for t in existing_tickers]

    scan_list = [
        "AAPL", "MSFT", "GOOGL", "AMZN", "META", "NVDA", "TSLA", "JPM", "V", "JNJ",
        "WMT", "PG", "MA", "UNH", "HD", "DIS", "NFLX", "ADBE", "CRM", "PYPL",
        "AMD", "INTC", "BA", "GS", "CAT", "NKE", "COST", "ABBV", "PFE", "MRK",
        "XOM", "CVX", "LLY", "AVGO", "ORCL", "CSCO", "ACN", "TXN", "QCOM", "LOW",
    ]

    opportunities = []
    for sym in scan_list:
        if sym in existing_upper:
            continue
        try:
            ticker = yf.Ticker(sym)
            hist = ticker.history(period="6mo")
            if hist.empty or len(hist) < 50:
                continue

            closes = hist["Close"].values.astype(float)
            highs = hist["High"].values.astype(float)
            lows = hist["Low"].values.astype(float)
            volumes = hist["Volume"].values.astype(float)
            price = float(closes[-1])
            prev_close = float(closes[-2]) if len(closes) > 1 else price

            # Compute indicators
            rsi = compute_rsi(closes.tolist())
            macd_val, macd_sig, macd_hist = compute_macd(closes.tolist())
            stoch_k, stoch_d = compute_stochastic(highs.tolist(), lows.tolist(), closes.tolist())
            adx, plus_di, minus_di = compute_adx(highs.tolist(), lows.tolist(), closes.tolist())
            bb_upper, bb_lower, bb_pct = compute_bollinger(closes.tolist())
            sma_20 = float(np.mean(closes[-20:]))
            sma_50 = float(np.mean(closes[-50:]))
            sma_200 = float(np.mean(closes[-200:])) if len(closes) >= 200 else float(np.mean(closes))
            atr = compute_atr(highs.tolist(), lows.tolist(), closes.tolist())
            avg_vol = float(np.mean(volumes[-20:]))
            vol_ratio = float(volumes[-1] / avg_vol) if avg_vol else 1
            obv_current, obv_trend = compute_obv(closes.tolist(), volumes.tolist())
            support, resistance = compute_support_resistance(closes.tolist())
            daily_change_pct = round((price - prev_close) / prev_close * 100, 2) if prev_close else 0

            info = ticker.info
            name = info.get("shortName", sym)
            sector = info.get("sector", "Unknown")
            market_cap = info.get("marketCap", 0)
            pe_ratio = info.get("trailingPE")
            forward_pe = info.get("forwardPE")
            dividend_yield = info.get("dividendYield")
            high_52w = round(float(np.max(highs)), 2)
            low_52w = round(float(np.min(lows)), 2)
            pct_from_high = round((price - high_52w) / high_52w * 100, 2)

            # Score the opportunity
            score = 0
            reasons = []
            setup_type = []

            # Oversold bounce
            if rsi < 30:
                score += 3
                reasons.append(f"RSI deeply oversold at {rsi} — high bounce probability")
                setup_type.append("Oversold Bounce")
            elif rsi < 40:
                score += 1
                reasons.append(f"RSI pulling back ({rsi}) — potential entry zone")

            # MACD momentum shift
            if macd_val > macd_sig and macd_hist > 0:
                score += 2
                reasons.append("MACD bullish crossover — momentum turning positive")
                setup_type.append("Momentum Shift")

            # Breakout above SMA 20
            if price > sma_20 and closes[-2] < float(np.mean(closes[-21:-1])):
                score += 2
                reasons.append(f"Breaking above SMA 20 (${round(sma_20, 2)}) — trend reversal signal")
                setup_type.append("Breakout")

            # Volume surge
            if vol_ratio > 2:
                score += 1.5
                reasons.append(f"Volume surge at {round(vol_ratio, 1)}x average — institutional interest")

            # Stochastic oversold with crossover
            if stoch_k < 20 and stoch_k > stoch_d:
                score += 1.5
                reasons.append(f"Stochastic bullish crossover from oversold ({round(stoch_k, 1)})")
                setup_type.append("Oversold Bounce")

            # Near support
            if price <= support * 1.02:
                score += 1
                reasons.append(f"Trading near 30-day support (${round(support, 2)})")
                setup_type.append("Support Bounce")

            # Bollinger squeeze / lower band
            if bb_pct is not None and bb_pct < 15:
                score += 1
                reasons.append("Near lower Bollinger Band — statistically likely to revert")

            # Golden cross potential
            if sma_20 > sma_50 and price > sma_50:
                score += 1
                reasons.append("Price above rising SMA 20 and SMA 50 — bullish structure")

            # OBV accumulation
            if obv_trend == "rising" and rsi < 50:
                score += 0.5
                reasons.append("OBV rising despite price weakness — smart money accumulating")

            # Significantly off 52W high (value territory)
            if pct_from_high < -20:
                score += 1
                reasons.append(f"Down {abs(pct_from_high)}% from 52-week high — potential value play")
                setup_type.append("Value")

            # Determine risk
            if atr / price > 0.03:
                risk = "HIGH"
            elif score >= 5:
                risk = "LOW"
            elif score >= 3:
                risk = "MODERATE"
            else:
                risk = "MODERATE"

            # Need minimum score to qualify
            if score < 2 or not reasons:
                continue

            # Action and target
            if score >= 5:
                action = "STRONG BUY"
                confidence = "HIGH"
            elif score >= 3:
                action = "BUY"
                confidence = "MEDIUM"
            else:
                action = "WATCH"
                confidence = "LOW"

            target_price = round(min(resistance, price * 1.08), 2)
            stop_loss = round(max(support * 0.98, price - 2 * atr), 2)
            reward = abs(target_price - price)
            risk_amt = abs(price - stop_loss)
            rr = round(reward / risk_amt, 1) if risk_amt > 0 else 0

            # Sparkline
            sparkline = [round(float(c), 2) for c in closes[-10:]]

            opportunities.append({
                "ticker": sym,
                "company_name": name,
                "sector": sector,
                "market_cap": market_cap,
                "price": round(price, 2),
                "daily_change_pct": daily_change_pct,
                "pe_ratio": round(pe_ratio, 2) if pe_ratio else None,
                "forward_pe": round(forward_pe, 2) if forward_pe else None,
                "dividend_yield": round(dividend_yield * 100, 2) if dividend_yield else None,
                "high_52w": high_52w,
                "low_52w": low_52w,
                "pct_from_52w_high": pct_from_high,
                "rsi": rsi,
                "macd": round(macd_val, 4),
                "macd_signal": round(macd_sig, 4),
                "macd_histogram": round(macd_hist, 4),
                "stochastic_k": stoch_k,
                "adx": adx,
                "bollinger_pct": bb_pct,
                "sma_20": round(sma_20, 2),
                "sma_50": round(sma_50, 2),
                "support": round(support, 2),
                "resistance": round(resistance, 2),
                "volume_ratio": round(vol_ratio, 2),
                "obv_trend": obv_trend,
                "action": action,
                "confidence": confidence,
                "risk": risk,
                "score": round(score, 1),
                "setup_type": list(set(setup_type)) or ["Technical"],
                "reasons": reasons[:6],
                "target_price": target_price,
                "stop_loss": stop_loss,
                "risk_reward": f"1:{rr}" if rr > 0 else "N/A",
                "sparkline": sparkline,
            })
        except Exception:
            continue

        if len(opportunities) >= 15:
            break

    # Sort by score descending
    opportunities.sort(key=lambda x: x["score"], reverse=True)
    return opportunities


def search_tickers(query):
    """Search for tickers by name or symbol."""
    try:
        import urllib.request
        import urllib.parse
        url = f"https://query2.finance.yahoo.com/v1/finance/search?q={urllib.parse.quote(query)}&quotesCount=10&newsCount=0"
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=5) as resp:
            data = json.loads(resp.read().decode())
        results = []
        for q in data.get("quotes", []):
            if q.get("quoteType") in ("EQUITY", "ETF", "INDEX"):
                results.append({
                    "symbol": q.get("symbol", ""),
                    "name": q.get("shortname") or q.get("longname", ""),
                    "exchange": q.get("exchange", ""),
                    "type": q.get("quoteType", ""),
                })
        return results
    except Exception:
        return []


def get_dividends(ticker_symbol):
    """Get dividend data for a stock."""
    try:
        ticker = yf.Ticker(ticker_symbol)
        info = ticker.info

        dividend_rate = info.get("dividendRate", 0)
        dividend_yield = info.get("dividendYield", 0)
        ex_date = info.get("exDividendDate")
        payout_ratio = info.get("payoutRatio")

        # Get dividend history
        divs = ticker.dividends
        history = []
        if divs is not None and len(divs) > 0:
            for date, amount in list(divs.items())[-12:]:  # Last 12 dividends
                history.append({
                    "date": date.strftime("%Y-%m-%d"),
                    "amount": round(float(amount), 4),
                })

        # Annual dividend income per share
        annual_dividend = round(float(dividend_rate), 4) if dividend_rate else 0

        return {
            "ticker": ticker_symbol.upper(),
            "dividend_rate": annual_dividend,
            "dividend_yield": round(float(dividend_yield), 2) if dividend_yield else 0,
            "ex_dividend_date": datetime.fromtimestamp(ex_date).strftime("%Y-%m-%d") if ex_date else None,
            "payout_ratio": round(float(payout_ratio * 100), 1) if payout_ratio else None,
            "history": history,
            "frequency": len([h for h in history if h["date"][:4] == str(datetime.now().year - 1)]) or (4 if annual_dividend > 0 else 0),
        }
    except Exception as e:
        return {"ticker": ticker_symbol.upper(), "error": str(e)}


def get_calendar(ticker_symbol):
    """Get upcoming events for a stock - earnings, ex-div, etc."""
    try:
        ticker = yf.Ticker(ticker_symbol)
        info = ticker.info
        events = []

        # Earnings dates
        try:
            cal = ticker.calendar
            if cal is not None:
                if isinstance(cal, dict):
                    if "Earnings Date" in cal:
                        edates = cal["Earnings Date"]
                        if isinstance(edates, list):
                            for ed in edates:
                                events.append({
                                    "type": "earnings",
                                    "date": ed.strftime("%Y-%m-%d") if hasattr(ed, 'strftime') else str(ed)[:10],
                                    "label": "Earnings Report",
                                    "importance": "high",
                                })
                        elif hasattr(edates, 'strftime'):
                            events.append({
                                "type": "earnings",
                                "date": edates.strftime("%Y-%m-%d"),
                                "label": "Earnings Report",
                                "importance": "high",
                            })
                    if "Ex-Dividend Date" in cal:
                        exd = cal["Ex-Dividend Date"]
                        date_str = exd.strftime("%Y-%m-%d") if hasattr(exd, 'strftime') else str(exd)[:10]
                        events.append({
                            "type": "ex_dividend",
                            "date": date_str,
                            "label": "Ex-Dividend Date",
                            "importance": "medium",
                        })
                    if "Dividend Date" in cal:
                        dd = cal["Dividend Date"]
                        date_str = dd.strftime("%Y-%m-%d") if hasattr(dd, 'strftime') else str(dd)[:10]
                        events.append({
                            "type": "dividend_payment",
                            "date": date_str,
                            "label": "Dividend Payment",
                            "importance": "medium",
                        })
        except Exception:
            pass

        # Ex-dividend from info
        ex_date = info.get("exDividendDate")
        if ex_date and not any(e["type"] == "ex_dividend" for e in events):
            events.append({
                "type": "ex_dividend",
                "date": datetime.fromtimestamp(ex_date).strftime("%Y-%m-%d"),
                "label": "Ex-Dividend Date",
                "importance": "medium",
            })

        # Sort by date
        events.sort(key=lambda x: x.get("date", ""))

        return {
            "ticker": ticker_symbol.upper(),
            "events": events,
        }
    except Exception as e:
        return {"ticker": ticker_symbol.upper(), "events": [], "error": str(e)}


def get_stock_news(ticker_symbol, count=10):
    """Get news for a specific stock."""
    try:
        ticker = yf.Ticker(ticker_symbol)
        news = ticker.news
        if not news:
            return []
        results = []
        for item in news[:count]:
            content = item.get("content", {})
            thumbnail = None
            if content.get("thumbnail") and content["thumbnail"].get("resolutions"):
                resolutions = content["thumbnail"]["resolutions"]
                thumbnail = resolutions[0].get("url") if resolutions else None
            provider = content.get("provider", {})
            results.append({
                "title": content.get("title", ""),
                "summary": content.get("summary", ""),
                "url": content.get("canonicalUrl", {}).get("url", "") if isinstance(content.get("canonicalUrl"), dict) else content.get("canonicalUrl", ""),
                "published": content.get("pubDate", ""),
                "source": provider.get("displayName", "Unknown"),
                "thumbnail": thumbnail,
                "type": content.get("contentType", "STORY"),
            })
        return results
    except Exception as e:
        return []


def get_market_news(count=15):
    """Get general market news using major index tickers."""
    all_news = []
    seen_titles = set()
    for sym in ["^GSPC", "^IXIC", "^DJI"]:
        try:
            ticker = yf.Ticker(sym)
            news = ticker.news
            if not news:
                continue
            for item in news:
                content = item.get("content", {})
                title = content.get("title", "")
                if title and title not in seen_titles:
                    seen_titles.add(title)
                    thumbnail = None
                    if content.get("thumbnail") and content["thumbnail"].get("resolutions"):
                        resolutions = content["thumbnail"]["resolutions"]
                        thumbnail = resolutions[0].get("url") if resolutions else None
                    provider = content.get("provider", {})
                    all_news.append({
                        "title": title,
                        "summary": content.get("summary", ""),
                        "url": content.get("canonicalUrl", {}).get("url", "") if isinstance(content.get("canonicalUrl"), dict) else content.get("canonicalUrl", ""),
                        "published": content.get("pubDate", ""),
                        "source": provider.get("displayName", "Unknown"),
                        "thumbnail": thumbnail,
                        "type": content.get("contentType", "STORY"),
                    })
        except Exception:
            continue
    # Sort by date descending
    all_news.sort(key=lambda x: x.get("published", ""), reverse=True)
    return all_news[:count]


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"error": "Usage: python technical_analysis.py <command> [args]"}))
        sys.exit(1)

    command = sys.argv[1]

    if command == "analyze":
        ticker = sys.argv[2] if len(sys.argv) > 2 else "AAPL"
        result = analyze(ticker)
        print(json.dumps(result))

    elif command == "market":
        result = get_market_summary()
        print(json.dumps(result))

    elif command == "chart":
        ticker = sys.argv[2] if len(sys.argv) > 2 else "AAPL"
        period = sys.argv[3] if len(sys.argv) > 3 else "1mo"
        result = get_chart_data(ticker, period)
        print(json.dumps(result))

    elif command == "recommend":
        ticker = sys.argv[2] if len(sys.argv) > 2 else "AAPL"
        data = analyze(ticker)
        if "error" in data:
            print(json.dumps(data))
        else:
            result = generate_recommendation(data)
            print(json.dumps(result))

    elif command == "news":
        ticker = sys.argv[2] if len(sys.argv) > 2 else None
        if ticker:
            result = get_stock_news(ticker)
        else:
            result = get_market_news()
        print(json.dumps(result))

    elif command == "search":
        query = sys.argv[2] if len(sys.argv) > 2 else ""
        result = search_tickers(query)
        print(json.dumps(result))

    elif command == "dividends":
        ticker = sys.argv[2] if len(sys.argv) > 2 else "AAPL"
        result = get_dividends(ticker)
        print(json.dumps(result))

    elif command == "calendar":
        ticker = sys.argv[2] if len(sys.argv) > 2 else "AAPL"
        result = get_calendar(ticker)
        print(json.dumps(result))

    elif command == "opportunities":
        existing = sys.argv[2].split(",") if len(sys.argv) > 2 else []
        result = scan_opportunities(existing)
        print(json.dumps(result))

    else:
        print(json.dumps({"error": f"Unknown command: {command}"}))
