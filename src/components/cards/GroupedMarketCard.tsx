'use client';

import Link from 'next/link';
import Image from 'next/image';
import type { PolymarketEvent } from '@/types';
import { formatVolume, parseOutcomePrices } from '@/lib/utils';

export interface GroupedMarketCardProps {
  event: PolymarketEvent;
}

export function GroupedMarketCard({ event }: GroupedMarketCardProps) {
  if (!event || !event.title || !event.markets || event.markets.length === 0) {
    return null;
  }

  // Use event volume if available, otherwise calculate from markets
  const totalVolume = event.volume || event.markets.reduce((sum, market) => {
    const vol = typeof market.volume === 'string' ? parseFloat(market.volume) : (market.volume || 0);
    return sum + vol;
  }, 0);

  // Sort markets by probability (highest first) using first outcome price
  const sortedMarkets = [...event.markets].sort((a, b) => {
    const pricesA = parseOutcomePrices(a.outcomePrices);
    const pricesB = parseOutcomePrices(b.outcomePrices);
    const probA = pricesA[0] || 0;
    const probB = pricesB[0] || 0;
    return probB - probA;
  });

  return (
    <Link href={`/event/${event.slug || event.id}`}>
      <div className="bg-[#1a1d26] rounded-xl p-4 h-full border border-gray-800 hover:bg-[#1f2330] hover:border-gray-700 transition-all cursor-pointer">
        {/* Header */}
        <div className="flex items-start gap-3 mb-3">
          {event.image && (
            <div className="relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
              <Image
                src={event.image}
                alt={event.title}
                fill
                className="object-cover"
                sizes="48px"
              />
            </div>
          )}

          {/* Title */}
          <h3 className="text-white text-base font-semibold leading-tight line-clamp-2">
            {event.title}
          </h3>
        </div>

        {/* Outcomes List - Scrollable when more than 2, shows 2 by default */}
        <div className={`mb-3 ${sortedMarkets.length > 2 ? 'max-h-[70px] overflow-y-scroll scrollbar-hide' : ''}`}>
          <div className="space-y-2">
            {sortedMarkets.map((market) => {
              const prices = parseOutcomePrices(market.outcomePrices);
              const yesPrice = prices[0] || 0;
              const noPrice = prices[1] || 1 - yesPrice;

              // Use groupItemTitle if available, otherwise extract from question
              const outcomeLabel = market.groupItemTitle || market.question;

              if (!outcomeLabel || yesPrice === 0) {
                return null;
              }

              return (
                <div key={market.id} className="flex items-center justify-between">
                  {/* Left: Outcome name */}
                  <span className="text-gray-300 text-base truncate">{outcomeLabel}</span>

                  {/* Right: Percentage and Yes/No Buttons */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-white text-lg font-semibold">{Math.round(yesPrice * 100)}%</span>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                      }}
                      className="h-7 px-3 bg-green-500/15 text-emerald-400 border border-green-500/30 rounded text-sm font-medium hover:bg-green-500/25 transition-colors"
                    >
                      Yes
                    </button>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                      }}
                      className="h-7 px-3 bg-red-500/15 text-red-400 border border-red-500/30 rounded text-sm font-medium hover:bg-red-500/25 transition-colors"
                    >
                      No
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-800">
          <span className="text-sm text-gray-500">{formatVolume(totalVolume)} Vol.</span>
          <div className="flex items-center gap-2">
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
