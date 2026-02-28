'use client';

import Link from 'next/link';
import Image from 'next/image';
import type { PolymarketEvent } from '@/types';
import { formatVolume, parseOutcomePrices } from '@/lib/utils';

export interface SportsMatchCardProps {
  event: PolymarketEvent;
}

export function SportsMatchCard({ event }: SportsMatchCardProps) {
  if (!event || !event.title || !event.markets || event.markets.length === 0) {
    return null;
  }

  // Get top 2-4 outcomes (typically Team A, Draw, Team B or just Team A vs Team B)
  const topOutcomes = event.markets.slice(0, 4).map((market) => {
    const prices = parseOutcomePrices(market.outcomePrices);
    const probability = prices[0] || 0;
    const name = market.groupItemTitle || market.question;

    return {
      id: market.id,
      name,
      probability,
      image: market.image,
    };
  });

  // Sort by probability descending
  topOutcomes.sort((a, b) => b.probability - a.probability);

  const totalVolume = event.volume || event.markets.reduce((sum, market) => {
    const vol = typeof market.volume === 'string' ? parseFloat(market.volume) : (market.volume || 0);
    return sum + vol;
  }, 0);

  // Check if event is live
  const isLive = event.markets.some(m => m.active && !m.closed);

  return (
    <Link href={`/event/${event.slug || event.id}`}>
      <div className="bg-[#1a1d26] rounded-xl p-4 h-full hover:bg-[#1f2330] transition-colors cursor-pointer">
        {/* Outcomes List - Scrollable when more than 3 */}
        <div className={`mb-3 ${topOutcomes.length > 3 ? 'max-h-[140px] overflow-y-scroll scrollbar-hide' : ''}`}>
          <div className="space-y-2">
            {topOutcomes.map((outcome, idx) => (
            <div key={outcome.id || idx} className="flex items-center justify-between">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                {/* Team Icon/Logo */}
                {outcome.image && (
                  <div className="relative w-6 h-6 rounded-full overflow-hidden flex-shrink-0">
                    <Image
                      src={outcome.image}
                      alt={outcome.name}
                      fill
                      className="object-cover"
                      sizes="24px"
                    />
                  </div>
                )}
                {!outcome.image && (
                  <div className="w-6 h-6 rounded-full bg-gray-700 flex-shrink-0" />
                )}
                <span className="text-white text-base truncate">{outcome.name}</span>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-white text-lg font-semibold tabular-nums">
                  {Math.round(outcome.probability * 100)}%
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
            ))}
          </div>
        </div>

        {/* Outcome Buttons (for 2-outcome matches) */}
        {topOutcomes.length === 2 && (
          <div className="grid grid-cols-2 gap-2 mb-3">
            {topOutcomes.map((outcome, idx) => (
              <button
                key={outcome.id || idx}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                className={`h-8 rounded-lg font-medium text-xs transition-all ${
                  idx === 0
                    ? 'bg-blue-500/15 text-blue-400 hover:bg-blue-500/25'
                    : 'bg-gray-500/15 text-gray-400 hover:bg-gray-500/25'
                }`}
              >
                {outcome.name}
              </button>
            ))}
          </div>
        )}

        {/* Outcome Buttons (for 3+ outcome matches - show top 3) */}
        {topOutcomes.length >= 3 && (
          <div className="grid grid-cols-3 gap-2 mb-3">
            {topOutcomes.slice(0, 3).map((outcome, idx) => (
              <button
                key={outcome.id || idx}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                className={`h-8 rounded-lg font-medium text-xs transition-all truncate ${
                  idx === 0
                    ? 'bg-red-500/15 text-red-400 hover:bg-red-500/25'
                    : idx === 1
                    ? 'bg-gray-500/15 text-gray-400 hover:bg-gray-500/25'
                    : 'bg-blue-500/15 text-blue-400 hover:bg-blue-500/25'
                }`}
              >
                {outcome.name}
              </button>
            ))}
          </div>
        )}

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
