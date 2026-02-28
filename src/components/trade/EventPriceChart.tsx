'use client';

import { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Info } from 'lucide-react';
import type { PolymarketMarket } from '@/types';
import { parseOutcomePrices } from '@/lib/utils';

export interface EventPriceChartProps {
  markets: PolymarketMarket[];
  data: Record<string, Array<{ t: number; p: number }>>;
  timeInterval?: '1h' | '1d' | '1w' | 'max';
  onTimeIntervalChange?: (interval: '1h' | '1d' | '1w' | 'max') => void;
  onInfoClick?: () => void;
}

// Colors for different candidates (matching Polymarket style)
const CANDIDATE_COLORS = [
  '#3B82F6', // Blue - leading candidate
  '#4E9FFF', // Blue
  '#AEBECD', // Gray
  '#FFC700', // Yellow
  '#9B59B6', // Purple
  '#1ABC9C', // Teal
  '#E74C3C', // Red
  '#F39C12', // Dark yellow
];

export function EventPriceChart({ markets, data, timeInterval = '1d', onTimeIntervalChange, onInfoClick }: EventPriceChartProps) {
  const chartData = useMemo(() => {
    if (!markets || markets.length === 0 || Object.keys(data).length === 0) {
      return [];
    }

    // Get all unique timestamps across all markets
    const timestampSet = new Set<number>();
    Object.values(data).forEach(marketData => {
      marketData.forEach(point => timestampSet.add(point.t));
    });

    const timestamps = Array.from(timestampSet).sort((a, b) => a - b);

    // Downsample data if too many points (keep every Nth point for performance)
    const maxDataPoints = 200;
    const sampledTimestamps = timestamps.length > maxDataPoints
      ? timestamps.filter((_, idx) => idx % Math.ceil(timestamps.length / maxDataPoints) === 0)
      : timestamps;

    // Build combined data points
    return sampledTimestamps.map(timestamp => {
      const point: any = { time: timestamp };

      markets.forEach((market) => {
        const marketData = data[market.id];
        if (marketData) {
          // Find closest price point for this timestamp
          const pricePoint = marketData.find(p => p.t === timestamp);
          if (pricePoint) {
            point[market.id] = pricePoint.p * 100; // Convert to percentage
          } else {
            // Find closest previous price point
            const closestPoint = marketData
              .filter(p => p.t <= timestamp)
              .sort((a, b) => b.t - a.t)[0];
            if (closestPoint) {
              point[market.id] = closestPoint.p * 100;
            }
          }
        }
      });

      return point;
    });
  }, [markets, data]);

  const formatXAxis = (timestamp: number) => {
    const date = new Date(timestamp * 1000);

    if (timeInterval === '1h') {
      return date.toLocaleTimeString('en-US', { hour: 'numeric' });
    }
    if (timeInterval === '1d') {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
    return date.toLocaleDateString('en-US', { month: 'short' });
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null;

    const date = new Date(label * 1000);

    return (
      <div className="bg-[#1a1d26] border border-gray-800/50 rounded-lg p-3 shadow-xl">
        <p className="text-gray-400 text-xs mb-2">
          {date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit'
          })}
        </p>
        <div className="space-y-1">
          {payload.map((entry: any, index: number) => {
            const market = markets.find(m => m.id === entry.dataKey);
            return (
              <div key={index} className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: entry.color }}
                  />
                  <span className="text-white text-sm font-medium">
                    {market?.groupItemTitle || market?.question || 'Unknown'}
                  </span>
                </div>
                <span className="text-white font-semibold tabular-nums">
                  {entry.value.toFixed(1)}%
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const CustomLegend = () => {
    // Sort markets by current price (highest first)
    const sortedMarkets = [...markets].sort((a, b) => {
      const pricesA = parseOutcomePrices(a.outcomePrices);
      const pricesB = parseOutcomePrices(b.outcomePrices);
      return (pricesB[0] || 0) - (pricesA[0] || 0);
    });

    return (
      <div className="flex flex-wrap gap-x-6 gap-y-2 mb-4">
        {sortedMarkets.map((market, idx) => {
          const prices = parseOutcomePrices(market.outcomePrices);
          const probability = ((prices[0] || 0) * 100).toFixed(1);
          const color = CANDIDATE_COLORS[idx % CANDIDATE_COLORS.length];

          return (
            <div key={market.id} className="flex items-center gap-2">
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: color }}
              />
              <span className="text-gray-400 text-sm font-medium">
                {market.groupItemTitle || market.question}
              </span>
              <span className="text-white text-sm font-semibold tabular-nums">
                {probability}%
              </span>
            </div>
          );
        })}
      </div>
    );
  };

  if (chartData.length === 0) {
    return (
      <div className="h-96 flex items-center justify-center">
        <p className="text-gray-500 font-medium">Loading chart data...</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Header with legend, time interval buttons, and info icon */}
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex-1">
          <CustomLegend />
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {onTimeIntervalChange && (
            <div className="flex gap-1">
              {(['1h', '1d', '1w', 'max'] as const).map((interval) => (
                <button
                  key={interval}
                  onClick={() => onTimeIntervalChange(interval)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    timeInterval === interval
                      ? 'bg-[#2a3142] text-white'
                      : 'text-gray-400 hover:bg-[#1f2330] hover:text-white'
                  }`}
                >
                  {interval === 'max' ? 'ALL' : interval.toUpperCase()}
                </button>
              ))}
            </div>
          )}
          {onInfoClick && (
            <button
              onClick={onInfoClick}
              className="p-1.5 rounded-lg text-gray-400 hover:bg-[#1f2330] hover:text-white transition-all"
              title="About this event"
            >
              <Info className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={240}>
        <LineChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
          <CartesianGrid
            strokeDasharray="0"
            stroke="#1f2937"
            vertical={false}
          />
          <XAxis
            dataKey="time"
            tickFormatter={formatXAxis}
            stroke="#6b7280"
            style={{ fontSize: '12px' }}
            tick={{ fill: '#9ca3af' }}
            axisLine={{ stroke: '#374151' }}
            tickLine={false}
          />
          <YAxis
            stroke="#6b7280"
            style={{ fontSize: '12px' }}
            domain={[0, 100]}
            ticks={[0, 25, 50, 75, 100]}
            tickFormatter={(value) => `${value}%`}
            tick={{ fill: '#9ca3af' }}
            axisLine={{ stroke: '#374151' }}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} />

          {markets.map((market, idx) => (
            <Line
              key={market.id}
              type="monotone"
              dataKey={market.id}
              stroke={CANDIDATE_COLORS[idx % CANDIDATE_COLORS.length]}
              strokeWidth={2}
              dot={false}
              fill="none"
              isAnimationActive={false}
              activeDot={{ r: 4, strokeWidth: 0 }}
              connectNulls={true}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
