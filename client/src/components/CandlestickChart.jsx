import { useEffect, useRef } from "react";
import { createChart, CandlestickSeries, HistogramSeries, LineSeries } from "lightweight-charts";

export default function CandlestickChart({ data, smaData, bollingerData, height = 400 }) {
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
        background: { color: "#1a1a28" },
        textColor: "#8888aa",
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 11,
      },
      grid: {
        vertLines: { color: "#2a2a3e40" },
        horzLines: { color: "#2a2a3e40" },
      },
      crosshair: {
        mode: 0,
        vertLine: { color: "#4488ff40", width: 1, style: 2 },
        horzLine: { color: "#4488ff40", width: 1, style: 2 },
      },
      rightPriceScale: {
        borderColor: "#2a2a3e",
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

    // Volume
    const volumeSeries = chart.addSeries(HistogramSeries, {
      priceFormat: { type: "volume" },
      priceScaleId: "volume",
    });

    chart.priceScale("volume").applyOptions({
      scaleMargins: { top: 0.8, bottom: 0 },
    });

    volumeSeries.setData(
      data.map((d) => ({
        time: d.time,
        value: d.volume,
        color: d.close >= d.open ? "#00ff8820" : "#ff444420",
      }))
    );

    // SMA overlays
    if (smaData) {
      const colors = { sma_20: "#4488ff", sma_50: "#ffaa00", sma_200: "#ff44ff" };
      Object.entries(smaData).forEach(([key, values]) => {
        if (values?.length) {
          const series = chart.addSeries(LineSeries, {
            color: colors[key] || "#888888",
            lineWidth: 1,
            priceLineVisible: false,
            lastValueVisible: false,
          });
          series.setData(values);
        }
      });
    }

    // Bollinger Bands
    if (bollingerData?.upper?.length) {
      const upperSeries = chart.addSeries(LineSeries, {
        color: "#4488ff40",
        lineWidth: 1,
        lineStyle: 2,
        priceLineVisible: false,
        lastValueVisible: false,
      });
      upperSeries.setData(bollingerData.upper);

      const lowerSeries = chart.addSeries(LineSeries, {
        color: "#4488ff40",
        lineWidth: 1,
        lineStyle: 2,
        priceLineVisible: false,
        lastValueVisible: false,
      });
      lowerSeries.setData(bollingerData.lower);
    }

    chart.timeScale().fitContent();
    chartRef.current = chart;

    const handleResize = () => {
      if (containerRef.current) {
        chart.applyOptions({ width: containerRef.current.clientWidth });
      }
    };
    window.addEventListener("resize", handleResize);
    handleResize();

    return () => {
      window.removeEventListener("resize", handleResize);
      chart.remove();
      chartRef.current = null;
    };
  }, [data, smaData, bollingerData, height]);

  return <div ref={containerRef} className="w-full rounded-xl overflow-hidden border border-border" />;
}
