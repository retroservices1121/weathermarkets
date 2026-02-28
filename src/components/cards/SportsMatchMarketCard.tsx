'use client';

import Link from 'next/link';
import Image from 'next/image';
import type { PolymarketMarket } from '@/types';
import { formatVolume, parseOutcomePrices } from '@/lib/utils';

export interface SportsMatchMarketCardProps {
  market: PolymarketMarket;
}

export function SportsMatchMarketCard({ market }: SportsMatchMarketCardProps) {
  if (!market || !market.question || !market.outcomes || market.outcomes.length !== 2) {
    return null;
  }

  const prices = parseOutcomePrices(market.outcomePrices);
  const [outcome1, outcome2] = market.outcomes;
  const [prob1, prob2] = prices;

  const totalVolume = typeof market.volume === 'string' ? parseFloat(market.volume) : (market.volume || 0);

  // Check if market is live
  const isLive = market.active && !market.closed;

  return (
    <Link href={`/market/${market.slug || market.id}`}>
      <div className="bg-[#1a1d26] rounded-xl p-4 h-full hover:bg-[#1f2330] transition-colors cursor-pointer">
        {/* Match Title */}
        <h3 className="text-white font-semibold text-base mb-4 line-clamp-2">
          {market.question}
        </h3>

        {/* Outcomes List */}
        <div className="mb-3 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              {/* Team Icon/Logo */}
              {market.image && (
                <div className="relative w-6 h-6 rounded-full overflow-hidden flex-shrink-0">
                  <Image
                    src={market.image}
                    alt={outcome1}
                    fill
                    className="object-cover"
                    sizes="24px"
                  />
                </div>
              )}
              {!market.image && (
                <div className="w-6 h-6 rounded-full bg-gray-700 flex-shrink-0" />
              )}
              <span className="text-white text-base truncate">{outcome1}</span>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="text-white text-lg font-semibold tabular-nums">
                {Math.round((prob1 || 0) * 100)}%
              </span>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                className="h-7 px-3 bg-green-500/15 text-green-400 rounded text-sm font-medium hover:bg-green-500/25 transition-colors"
              >
                Yes
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              {/* Team Icon/Logo */}
              {market.image && (
                <div className="relative w-6 h-6 rounded-full overflow-hidden flex-shrink-0">
                  <Image
                    src={market.image}
                    alt={outcome2}
                    fill
                    className="object-cover"
                    sizes="24px"
                  />
                </div>
              )}
              {!market.image && (
                <div className="w-6 h-6 rounded-full bg-gray-700 flex-shrink-0" />
              )}
              <span className="text-white text-base truncate">{outcome2}</span>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="text-white text-lg font-semibold tabular-nums">
                {Math.round((prob2 || 0) * 100)}%
              </span>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                className="h-7 px-3 bg-red-500/15 text-red-400 rounded text-sm font-medium hover:bg-red-500/25 transition-colors"
              >
                No
              </button>
            </div>
          </div>
        </div>

        {/* Outcome Buttons (for 2-outcome matches) */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            className="h-8 rounded-lg font-medium text-xs transition-all bg-blue-500/15 text-blue-400 hover:bg-blue-500/25"
          >
            {outcome1}
          </button>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            className="h-8 rounded-lg font-medium text-xs transition-all bg-gray-500/15 text-gray-400 hover:bg-gray-500/25"
          >
            {outcome2}
          </button>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-800">
          <div className="flex items-center gap-2">
            {isLive && (
              <span className="flex items-center gap-1 text-red-500 text-sm font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
                LIVE
              </span>
            )}
            <span className="text-sm text-gray-500">
              {formatVolume(totalVolume)} Vol.
            </span>
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <button onClick={(e) => e.preventDefault()} className="text-gray-500 hover:text-gray-400 transition-colors">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="7" height="7" rx="1"></rect>
                <rect x="14" y="3" width="7" height="7" rx="1"></rect>
                <rect x="14" y="14" width="7" height="7" rx="1"></rect>
                <rect x="3" y="14" width="7" height="7" rx="1"></rect>
              </svg>
            </button>
            <button onClick={(e) => e.preventDefault()} className="text-gray-500 hover:text-gray-400 transition-colors">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </Link>
  );
}
