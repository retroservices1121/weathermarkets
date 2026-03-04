'use client';

import { useEffect, useRef, useState } from 'react';

export interface CandleData {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
}

export interface LineData {
  time: number;
  value: number;
}

interface PriceChartProps {
  priceHistory: CandleData[] | LineData[];
  chartType?: 'line' | 'candlestick';
  height?: number;
}

function isLineData(data: CandleData[] | LineData[]): data is LineData[] {
  if (data.length === 0) return true;
  return 'value' in data[0];
}

export function PriceChart({ priceHistory, chartType = 'line', height = 300 }: PriceChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<any>(null);
  const seriesRef = useRef<any>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !chartContainerRef.current) return;

    let isCancelled = false;

    const initChart = async () => {
      try {
        const { createChart, LineSeries, CandlestickSeries, CrosshairMode } = await import('lightweight-charts');

        if (isCancelled || !chartContainerRef.current) return;

        // Clean up previous chart
        if (chartRef.current) {
          chartRef.current.remove();
          chartRef.current = null;
          seriesRef.current = null;
        }

        const chart = createChart(chartContainerRef.current, {
          width: chartContainerRef.current.clientWidth,
          height,
          layout: {
            background: { color: '#0a0e1a' },
            textColor: '#9ca3af',
            fontSize: 11,
          },
          grid: {
            vertLines: { color: '#1a1f2e' },
            horzLines: { color: '#1a1f2e' },
          },
          crosshair: {
            mode: CrosshairMode.Normal,
            vertLine: {
              color: '#374151',
              width: 1,
              style: 2,
              labelBackgroundColor: '#1a1f2e',
            },
            horzLine: {
              color: '#374151',
              width: 1,
              style: 2,
              labelBackgroundColor: '#1a1f2e',
            },
          },
          timeScale: {
            borderColor: '#1a1f2e',
            timeVisible: true,
            secondsVisible: false,
          },
          rightPriceScale: {
            borderColor: '#1a1f2e',
          },
        });

        chartRef.current = chart;

        if (isLineData(priceHistory) || chartType === 'line') {
          const lineSeries = chart.addSeries(LineSeries, {
            color: '#00d4ff',
            lineWidth: 2,
            crosshairMarkerBackgroundColor: '#00d4ff',
            crosshairMarkerRadius: 4,
            crosshairMarkerBorderColor: '#ffffff',
            crosshairMarkerBorderWidth: 1,
            priceFormat: {
              type: 'price',
              precision: 2,
              minMove: 0.01,
            },
          });

          const data = isLineData(priceHistory)
            ? priceHistory.map((d) => ({
                time: d.time as any,
                value: d.value,
              }))
            : priceHistory.map((d) => ({
                time: d.time as any,
                value: d.close,
              }));

          if (data.length > 0) {
            lineSeries.setData(data);
          }
          seriesRef.current = lineSeries;
        } else {
          const candleSeries = chart.addSeries(CandlestickSeries, {
            upColor: '#10b981',
            downColor: '#ef4444',
            borderUpColor: '#10b981',
            borderDownColor: '#ef4444',
            wickUpColor: '#10b981',
            wickDownColor: '#ef4444',
          });

          const data = (priceHistory as CandleData[]).map((d) => ({
            time: d.time as any,
            open: d.open,
            high: d.high,
            low: d.low,
            close: d.close,
          }));

          if (data.length > 0) {
            candleSeries.setData(data);
          }
          seriesRef.current = candleSeries;
        }

        chart.timeScale().fitContent();

        // Handle resize
        const resizeObserver = new ResizeObserver((entries) => {
          for (const entry of entries) {
            const { width } = entry.contentRect;
            chart.applyOptions({ width });
          }
        });

        resizeObserver.observe(chartContainerRef.current);

        return () => {
          resizeObserver.disconnect();
          chart.remove();
        };
      } catch (err) {
        console.error('Failed to initialize chart:', err);
      }
    };

    const cleanup = initChart();

    return () => {
      isCancelled = true;
      cleanup?.then((fn) => fn?.());
      if (chartRef.current) {
        try {
          chartRef.current.remove();
        } catch {
          // Chart may already be removed
        }
        chartRef.current = null;
        seriesRef.current = null;
      }
    };
  }, [mounted, priceHistory, chartType, height]);

  if (!mounted) {
    return (
      <div
        className="w-full bg-[#0a0e1a] rounded-xl flex items-center justify-center"
        style={{ height }}
      >
        <div className="w-6 h-6 border-2 border-[#00d4ff] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (priceHistory.length === 0) {
    return (
      <div
        className="w-full bg-[#0a0e1a] rounded-xl flex items-center justify-center"
        style={{ height }}
      >
        <p className="text-gray-500 text-sm font-medium">No price data available</p>
      </div>
    );
  }

  return (
    <div className="w-full rounded-xl overflow-hidden border border-gray-800/30">
      <div ref={chartContainerRef} style={{ height }} />
    </div>
  );
}
