'use client';

import { useState, useEffect, useRef } from 'react';
import {
  X,
  ExternalLink,
  TrendingUp,
  TrendingDown,
  Clock,
  BarChart3,
  Droplets,
  Thermometer,
  Wind,
} from 'lucide-react';
import { formatVolume, formatCompactNumber, getTimeAgo } from '@/lib/utils';
import type { WeatherMarket } from '@/hooks/useWeatherMarkets';
import type { Trade } from '@/types';
import { useWeatherData } from '@/hooks/useWeatherData';
import { EdgeSignal } from './EdgeSignal';
import { ConsensusMeter } from './ConsensusMeter';

interface MarketCardProps {
  market: WeatherMarket;
  onClose: () => void;
  edgeSignal?: {
    strength: 'weak' | 'moderate' | 'strong' | null;
    explanation: string;
  } | null;
  recentTrades?: Trade[];
  orderBook?: {
    bids: { price: number; size: number }[];
    asks: { price: number; size: number }[];
  } | null;
}

export function MarketCard({
  market,
  onClose,
  edgeSignal,
  recentTrades = [],
  orderBook,
}: MarketCardProps) {
  const [isVisible, setIsVisible] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const lat = market.location?.lat ?? null;
  const lon = market.location?.lon ?? null;
  const { data: weatherData } = useWeatherData(lat, lon);

  // Slide-in animation
  useEffect(() => {
    requestAnimationFrame(() => setIsVisible(true));
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300);
  };

  // Click outside to close (desktop only)
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        handleClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const yesPrice = market.currentPrice ?? 0;
  const noPrice = 1 - yesPrice;
  const yesPercent = Math.round(yesPrice * 100);
  const noPercent = Math.round(noPrice * 100);

  // Compute best bid/ask from order book
  const bestBid = orderBook?.bids?.[0]?.price ?? null;
  const bestAsk = orderBook?.asks?.[0]?.price ?? null;
  const spread = bestBid !== null && bestAsk !== null ? bestAsk - bestBid : null;

  // Max depth for bar widths
  const maxBidSize = orderBook?.bids?.length
    ? Math.max(...orderBook.bids.map((b) => b.size))
    : 1;
  const maxAskSize = orderBook?.asks?.length
    ? Math.max(...orderBook.asks.map((a) => a.size))
    : 1;

  const resolutionDate = market.endDate
    ? new Date(market.endDate).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : 'TBD';

  return (
    <>
      {/* Backdrop for mobile */}
      <div
        className={`fixed inset-0 bg-black/50 z-40 md:hidden transition-opacity duration-300 ${
          isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={handleClose}
      />

      {/* Panel */}
      <div
        ref={panelRef}
        className={`fixed z-50 bg-[#0a0e1a] border-l border-gray-800/50 overflow-y-auto transition-transform duration-300 ease-out
          md:right-0 md:top-16 md:bottom-0 md:w-[420px]
          bottom-0 left-0 right-0 md:left-auto max-h-[85vh] md:max-h-none rounded-t-2xl md:rounded-none
          ${isVisible ? 'translate-x-0 translate-y-0' : 'md:translate-x-full translate-y-full md:translate-y-0'}
        `}
        style={{ scrollbarWidth: 'thin', scrollbarColor: '#374151 transparent' }}
      >
        {/* Mobile drag handle */}
        <div className="md:hidden flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-gray-600" />
        </div>

        {/* Header */}
        <div className="sticky top-0 bg-[#0a0e1a]/95 backdrop-blur-sm z-10 px-5 py-4 border-b border-gray-800/50">
          <div className="flex items-start justify-between gap-3">
            <h2 className="text-white font-bold text-base leading-snug flex-1">
              {market.question}
            </h2>
            <button
              onClick={handleClose}
              className="p-1.5 rounded-lg bg-gray-800/50 hover:bg-gray-700/50 text-gray-400 hover:text-white transition-colors flex-shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Edge signal */}
          {edgeSignal?.strength && (
            <div className="mt-3">
              <EdgeSignal
                strength={edgeSignal.strength}
                explanation={edgeSignal.explanation}
              />
            </div>
          )}
        </div>

        <div className="px-5 py-4 space-y-5">
          {/* Price badges */}
          <div className="flex gap-3">
            <div className="flex-1 bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 text-center">
              <p className="text-gray-400 text-xs font-medium mb-1">YES</p>
              <p className="text-emerald-400 text-2xl font-bold tabular-nums">
                {yesPercent}¢
              </p>
            </div>
            <div className="flex-1 bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-center">
              <p className="text-gray-400 text-xs font-medium mb-1">NO</p>
              <p className="text-red-400 text-2xl font-bold tabular-nums">
                {noPercent}¢
              </p>
            </div>
          </div>

          {/* Bid/Ask Spread */}
          {(bestBid !== null || bestAsk !== null) && (
            <div className="bg-[#12141a] rounded-xl border border-gray-800/30 p-4">
              <h3 className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-3">
                Bid / Ask
              </h3>
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-emerald-400 text-sm font-mono font-semibold">
                    {bestBid !== null ? (bestBid * 100).toFixed(1) + '¢' : '--'}
                  </span>
                  <span className="text-gray-500 text-xs ml-1.5">Bid</span>
                </div>
                <div className="text-gray-500 text-xs">
                  Spread:{' '}
                  <span className="text-gray-300 font-mono">
                    {spread !== null ? (spread * 100).toFixed(1) + '¢' : '--'}
                  </span>
                </div>
                <div>
                  <span className="text-red-400 text-sm font-mono font-semibold">
                    {bestAsk !== null ? (bestAsk * 100).toFixed(1) + '¢' : '--'}
                  </span>
                  <span className="text-gray-500 text-xs ml-1.5">Ask</span>
                </div>
              </div>
            </div>
          )}

          {/* Order Book Visualization */}
          {orderBook && (orderBook.bids.length > 0 || orderBook.asks.length > 0) && (
            <div className="bg-[#12141a] rounded-xl border border-gray-800/30 p-4">
              <h3 className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-3">
                Order Book Depth
              </h3>
              <div className="space-y-1">
                {/* Asks (reversed so lowest is closest to center) */}
                {orderBook.asks
                  .slice(0, 5)
                  .reverse()
                  .map((ask, idx) => (
                    <div key={`ask-${idx}`} className="flex items-center gap-2 h-6">
                      <span className="text-red-400 text-xs font-mono w-12 text-right tabular-nums">
                        {(ask.price * 100).toFixed(1)}¢
                      </span>
                      <div className="flex-1 flex justify-end">
                        <div
                          className="bg-red-500/30 h-4 rounded-sm"
                          style={{ width: `${(ask.size / maxAskSize) * 100}%`, minWidth: '4px' }}
                        />
                      </div>
                      <span className="text-gray-500 text-xs font-mono w-14 text-right tabular-nums">
                        {formatCompactNumber(ask.size)}
                      </span>
                    </div>
                  ))}

                <div className="border-t border-gray-700/50 my-1" />

                {/* Bids */}
                {orderBook.bids.slice(0, 5).map((bid, idx) => (
                  <div key={`bid-${idx}`} className="flex items-center gap-2 h-6">
                    <span className="text-emerald-400 text-xs font-mono w-12 text-right tabular-nums">
                      {(bid.price * 100).toFixed(1)}¢
                    </span>
                    <div className="flex-1 flex justify-start">
                      <div
                        className="bg-emerald-500/30 h-4 rounded-sm"
                        style={{ width: `${(bid.size / maxBidSize) * 100}%`, minWidth: '4px' }}
                      />
                    </div>
                    <span className="text-gray-500 text-xs font-mono w-14 text-right tabular-nums">
                      {formatCompactNumber(bid.size)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Market Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[#12141a] rounded-xl border border-gray-800/30 p-3">
              <div className="flex items-center gap-2 mb-1">
                <BarChart3 className="w-3.5 h-3.5 text-gray-500" />
                <span className="text-gray-500 text-xs font-medium">Volume</span>
              </div>
              <p className="text-white font-semibold text-sm tabular-nums">
                {formatVolume(typeof market.volume === 'string' ? parseFloat(market.volume) : market.volume || 0)}
              </p>
            </div>
            <div className="bg-[#12141a] rounded-xl border border-gray-800/30 p-3">
              <div className="flex items-center gap-2 mb-1">
                <Clock className="w-3.5 h-3.5 text-gray-500" />
                <span className="text-gray-500 text-xs font-medium">Resolves</span>
              </div>
              <p className="text-white font-semibold text-sm">{resolutionDate}</p>
            </div>
          </div>

          {/* Weather Data Section */}
          {weatherData && market.location && (
            <div className="bg-[#12141a] rounded-xl border border-gray-800/30 p-4">
              <h3 className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-3">
                Current Conditions - {market.location.city}
              </h3>
              <div className="grid grid-cols-3 gap-3">
                {(() => {
                  // Open-Meteo returns snake_case fields; hook type uses camelCase
                  const current = weatherData.current as any;
                  const temp = current?.temperature_2m ?? current?.temperature ?? '--';
                  const humidity = current?.relative_humidity_2m ?? current?.humidity ?? '--';
                  const wind = current?.wind_speed_10m ?? current?.windSpeed ?? '--';
                  return (
                    <>
                      <div className="text-center">
                        <Thermometer className="w-4 h-4 text-[#00d4ff] mx-auto mb-1" />
                        <p className="text-white text-sm font-semibold">{temp}°F</p>
                        <p className="text-gray-500 text-xs">Temp</p>
                      </div>
                      <div className="text-center">
                        <Droplets className="w-4 h-4 text-blue-400 mx-auto mb-1" />
                        <p className="text-white text-sm font-semibold">{humidity}%</p>
                        <p className="text-gray-500 text-xs">Humidity</p>
                      </div>
                      <div className="text-center">
                        <Wind className="w-4 h-4 text-gray-400 mx-auto mb-1" />
                        <p className="text-white text-sm font-semibold">{wind} mph</p>
                        <p className="text-gray-500 text-xs">Wind</p>
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>
          )}

          {/* Consensus Meter */}
          <ConsensusMeter
            marketId={market.id}
            marketPrice={yesPrice}
            onPredict={() => {}}
          />

          {/* Recent Trades */}
          {recentTrades.length > 0 && (
            <div className="bg-[#12141a] rounded-xl border border-gray-800/30 p-4">
              <h3 className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-3">
                Recent Trades
              </h3>
              <div className="space-y-1.5 max-h-52 overflow-y-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: '#374151 transparent' }}>
                {recentTrades.slice(0, 10).map((trade) => (
                  <div
                    key={trade.id}
                    className="flex items-center justify-between py-1.5 text-xs"
                  >
                    <div className="flex items-center gap-2">
                      {trade.side === 'BUY' ? (
                        <TrendingUp className="w-3 h-3 text-emerald-400" />
                      ) : (
                        <TrendingDown className="w-3 h-3 text-red-400" />
                      )}
                      <span
                        className={
                          trade.side === 'BUY'
                            ? 'text-emerald-400 font-medium'
                            : 'text-red-400 font-medium'
                        }
                      >
                        {trade.side}
                      </span>
                    </div>
                    <span className="text-white font-mono tabular-nums">
                      {(trade.price * 100).toFixed(1)}¢
                    </span>
                    <span className="text-gray-500 font-mono tabular-nums">
                      {formatCompactNumber(trade.size)}
                    </span>
                    <span className="text-gray-600 text-[10px]">
                      {getTimeAgo(trade.timestamp)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Trade on Polymarket Button */}
          <a
            href={`https://polymarket.com/event/${market.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-3 bg-[#00d4ff] hover:bg-[#00b8e0] text-[#0a0e1a] font-bold text-sm rounded-xl transition-colors"
          >
            Trade on Polymarket
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>
    </>
  );
}
