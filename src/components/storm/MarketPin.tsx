'use client';

import { useMemo } from 'react';
import { Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import type { WeatherMarket } from '@/hooks/useWeatherMarkets';

interface MarketPinProps {
  market: WeatherMarket;
  isSelected: boolean;
  onSelect: () => void;
  hasEdgeSignal?: boolean;
}

function truncateQuestion(question: string, maxLen: number = 40): string {
  if (question.length <= maxLen) return question;
  return question.slice(0, maxLen).trimEnd() + '...';
}

function getPriceColor(price: number | null): string {
  if (price === null) return '#6b7280'; // gray
  if (price > 0.55) return '#10b981'; // green
  if (price < 0.45) return '#ef4444'; // red
  return '#6b7280'; // gray for ~0.5
}

function getPriceBgClass(price: number | null): string {
  if (price === null) return 'bg-gray-600/30';
  if (price > 0.55) return 'bg-emerald-500/20';
  if (price < 0.45) return 'bg-red-500/20';
  return 'bg-gray-600/20';
}

export function MarketPin({ market, isSelected, onSelect, hasEdgeSignal }: MarketPinProps) {
  const pricePercent = market.currentPrice !== null
    ? Math.round(market.currentPrice * 100)
    : null;
  const priceColor = getPriceColor(market.currentPrice);

  const icon = useMemo(() => {
    const selectedBorder = isSelected ? 'border-[#00d4ff]' : 'border-gray-700/50';
    const selectedShadow = isSelected ? 'shadow-[0_0_12px_rgba(0,212,255,0.3)]' : 'shadow-lg';

    const html = `
      <div
        class="relative cursor-pointer transition-transform hover:scale-105"
        style="transform-origin: bottom center;"
      >
        <div
          class="px-2.5 py-1.5 rounded-lg border ${selectedBorder} ${selectedShadow}"
          style="background: rgba(0,0,0,0.75); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); min-width: 80px; max-width: 200px;"
        >
          <div style="font-size: 10px; color: #d1d5db; line-height: 1.3; margin-bottom: 3px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 180px;">
            ${truncateQuestion(market.question)}
          </div>
          <div style="display: flex; align-items: center; gap: 6px;">
            <span
              style="font-size: 13px; font-weight: 700; color: ${priceColor}; font-variant-numeric: tabular-nums;"
            >
              ${pricePercent !== null ? pricePercent + '%' : '--'}
            </span>
            <span style="font-size: 9px; color: #9ca3af; font-weight: 500;">YES</span>
            ${hasEdgeSignal ? `
              <span style="width: 6px; height: 6px; border-radius: 50%; background: #ef4444; display: inline-block; animation: pulse 2s infinite;"></span>
            ` : ''}
          </div>
        </div>
        <div
          style="width: 8px; height: 8px; background: ${priceColor}; border-radius: 50%; margin: -2px auto 0; box-shadow: 0 0 6px ${priceColor};"
        ></div>
      </div>
    `;

    return L.divIcon({
      html,
      className: 'market-pin-icon',
      iconSize: [0, 0],
      iconAnchor: [90, 50],
    });
  }, [market.question, pricePercent, priceColor, isSelected, hasEdgeSignal]);

  if (!market.location) return null;

  return (
    <Marker
      position={[market.location.lat, market.location.lon]}
      icon={icon}
      eventHandlers={{
        click: () => {
          onSelect();
        },
      }}
    />
  );
}
