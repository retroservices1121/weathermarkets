'use client';

import { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Info } from 'lucide-react';
import type { PricePoint } from '@/types';

export interface PriceChartProps {
  data: PricePoint[];
  outcome: 'YES' | 'NO';
  timeInterval?: '1h' | '1d' | '1w' | 'max';
  onTimeIntervalChange?: (interval: '1h' | '1d' | '1w' | 'max') => void;
  onHover?: (percentage: number) => void;
  onHoverEnd?: () => void;
  onInfoClick?: () => void;
}

export function PriceChart({ data, outcome, timeInterval = '1d', onTimeIntervalChange, onHover, onHoverEnd, onInfoClick }: PriceChartProps) {
  const chartData = useMemo(() => {
    return data.map((point) => ({
      time: point.t,
      price: point.p * 100, // Convert to percentage
    }));
  }, [data]);

  const color = outcome === 'YES' ? '#10B981' : '#EF4444';

  const formatXAxis = (timestamp: number) => {
    const date = new Date(timestamp * 1000);

    // For hourly view, show time only
    if (timeInterval === '1h') {
      return date.toLocaleTimeString('en-US', { hour: 'numeric' });
    }
    // For daily view, show short date
    if (timeInterval === '1d') {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
    // For weekly/all, show month
    return date.toLocaleDateString('en-US', { month: 'short' });
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) {
      if (onHoverEnd) onHoverEnd();
      return null;
    }

    const percentage = Math.round(payload[0].value);
    if (onHover) onHover(percentage);

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
        <div className="flex items-center gap-2">
          <div
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: color }}
          />
          <span className="text-white text-sm font-medium">{outcome}</span>
          <span className="text-white font-semibold tabular-nums ml-2">
            {payload[0].value.toFixed(1)}%
          </span>
        </div>
      </div>
    );
  };

  if (data.length === 0) {
    return (
      <div className="h-60 flex items-center justify-center">
        <p className="text-gray-500 font-medium">No price data available</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: color }}
          />
          <span className="text-gray-400 text-sm font-medium">{outcome}</span>
          <span className="text-white text-sm font-semibold tabular-nums">
            {chartData.length > 0 ? chartData[chartData.length - 1].price.toFixed(1) : '0'}%
          </span>
        </div>

        {/* Time Interval Buttons and Info Icon */}
        <div className="flex items-center gap-2">
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
              title="About this market"
            >
              <Info className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
      <div onMouseLeave={() => onHoverEnd && onHoverEnd()}>
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
            style={{ fontSize: '11px' }}
            tick={{ fill: '#9ca3af' }}
            axisLine={{ stroke: '#374151' }}
            tickLine={false}
            tickCount={6}
            minTickGap={40}
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
          <Line
            type="monotone"
            dataKey="price"
            stroke={color}
            strokeWidth={2.5}
            dot={false}
            activeDot={{ r: 4, strokeWidth: 0 }}
            animationDuration={300}
          />
        </LineChart>
      </ResponsiveContainer>
      </div>
    </div>
  );
}
