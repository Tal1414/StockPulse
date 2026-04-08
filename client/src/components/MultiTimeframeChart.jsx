import { useEffect, useRef } from "react";
import { createChart, CandlestickSeries, HistogramSeries } from "lightweight-charts";
import { useApi } from "../hooks/useApi";
import { api } from "../lib/api";

function MiniChart({ data, label, height = 200 }) {
  const containerRef = useRef(null);
  const chartRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current || !data?.length) return;

    if (chartRef.current) {
      chartRef.current.remove();
      chartRef.current = null;
    }

    const chart = createChart(containerRef.current, {
      height,
      layout: {
        background: { color: "#12121a" },
        textColor: "#8888aa",
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 10,
      },
      grid: {
        vertLines: { color: "#2a2a3e30" },
        horzLines: { color: "#2a2a3e30" },
      },
      crosshair: {
        mode: 0,
        vertLine: { color: "#4488ff30", width: 1, style: 2 },
        horzLine: { color: "#4488ff30", width: 1, style: 2 },
      },
      rightPriceScale: {
        borderColor: "#2a2a3e",
        scaleMargins: { top: 0.1, bottom: 0.2 },
      },
      timeScale: {
        borderColor: "#2a2a3e",
        timeVisible: false,
      },
    });

    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: "#00ff88",
      downColor: "#ff4444",
      borderUpColor: "#00ff88",
      borderDownColor: "#ff4444",
      wickUpColor: "#00ff8880",
      wickDownColor: "#ff444480",
    });
    candleSeries.setData(data);

    const volumeSeries = chart.addSeries(HistogramSeries, {
      priceFormat: { type: "volume" },
      priceScaleId: "vol",
    });
    chart.priceScale("vol").applyOptions({ scaleMargins: { top: 0.85, bottom: 0 } });
    volumeSeries.setData(
      data.map((d) => ({
        time: d.time,
        value: d.volume,
        color: d.close >= d.open ? "#00ff8815" : "#ff444415",
      }))
    );

    chart.timeScale().fitContent();
    chartRef.current = chart;

    const handleResize = () => {
      if (containerRef.current) chart.applyOptions({ width: containerRef.current.clientWidth });
    };
    window.addEventListener("resize", handleResize);
    handleResize();

    return () => {
      window.removeEventListener("resize", handleResize);
      chart.remove();
      chartRef.current = null;
    };
  }, [data, height]);

  return (
    <div className="bg-bg-secondary border border-border rounded-lg overflow-hidden">
      <div className="px-3 py-1.5 border-b border-border/50 bg-bg-card">
        <span className="text-xs font-mono font-medium text-text-secondary">{label}</span>
      </div>
      {data?.length ? (
        <div ref={containerRef} className="w-full" />
      ) : (
        <div className="h-[200px] flex items-center justify-center text-xs text-text-muted">Loading...</div>
      )}
    </div>
  );
}

export default function MultiTimeframeChart({ ticker }) {
  const { data: data5d } = useApi(() => api.getChart(ticker, "5d"), [ticker]);
  const { data: data1mo } = useApi(() => api.getChart(ticker, "1mo"), [ticker]);
  const { data: data6mo } = useApi(() => api.getChart(ticker, "6mo"), [ticker]);

  return (
    <div className="mb-6">
      <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-3">
        Multi-Timeframe View
      </h3>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <MiniChart data={data5d} label="5 Days" height={220} />
        <MiniChart data={data1mo} label="1 Month" height={220} />
        <MiniChart data={data6mo} label="6 Months" height={220} />
      </div>
    </div>
  );
}
