'use client';

import Link from 'next/link';
import Image from 'next/image';
import type { PolymarketMarket } from '@/types';
import { formatVolume, parseOutcomePrices } from '@/lib/utils';

export interface MultiOutcomeMarketCardProps {
  market: PolymarketMarket;
}

export function MultiOutcomeMarketCard({ market }: MultiOutcomeMarketCardProps) {
  if (!market || !market.question) {
    return null;
  }

  const hasImage = market.image;
  const prices = parseOutcomePrices(market.outcomePrices);

  const outcomes = Array.isArray(market.outcomes)
    ? market.outcomes
    : typeof market.outcomes === 'string'
    ? JSON.parse(market.outcomes)
    : [];

  if (!outcomes || outcomes.length === 0 || !prices || prices.length === 0) {
    return null;
  }

  // Sort outcomes by probability (highest first)
  const outcomesWithPrices = outcomes.map((outcome: any, idx: number) => ({
    text: typeof outcome === 'string' ? outcome : outcome?.toString(),
    price: prices[idx] || 0,
    idx,
  })).sort((a: any, b: any) => b.price - a.price);

  const isLargeMultiOutcome = outcomes.length >= 10;

  return (
    <Link href={`/market/${market.slug || market.id}`}>
      <div className="bg-[#1a1d26] rounded-xl p-4 border border-gray-800 hover:bg-[#1f2330] hover:border-gray-700 transition-all cursor-pointer h-full flex flex-col">
        {/* Header with Icon and Question */}
        <div className="flex items-start gap-3 mb-3">
          {hasImage && market.image && (
            <div className="relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
              <Image
                src={market.image}
                alt={market.question}
                fill
                className="object-cover"
                sizes="48px"
              />
            </div>
          )}

          {/* Question */}
          <h3 className="text-white text-base font-semibold line-clamp-2 leading-tight flex-grow">
            {market.question}
          </h3>
        </div>

        {/* Outcomes List - Compact for large lists */}
        {isLargeMultiOutcome ? (
          <div className="mb-3 max-h-[140px] overflow-y-scroll scrollbar-hide">
            <div className="flex flex-col gap-2">
              {outcomesWithPrices.map((outcome: any) => (
                <div key={outcome.idx} className="flex items-center justify-between gap-2">
                  <span className="text-gray-300 text-base truncate flex-1">{outcome.text}</span>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-white text-lg font-semibold tabular-nums">
                      {Math.round(outcome.price * 100)}%
                    </span>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                      }}
                      className="h-7 px-3 bg-green-500/15 text-emerald-400 border border-green-500/30 rounded text-sm font-medium hover:bg-green-500/25 transition-colors"
                    >
                      Yes
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          // Standard layout for smaller lists
          <div className="flex flex-col gap-2 mb-3">
            {outcomesWithPrices.map((outcome: any) => (
              <div key={outcome.idx} className="flex items-center justify-between gap-2">
                <span className="text-gray-300 text-base truncate flex-1">{outcome.text}</span>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-white text-lg font-semibold tabular-nums">
                    {Math.round(outcome.price * 100)}%
                  </span>
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
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-800 mt-auto">
          {market.volume && (
            <span className="text-sm text-gray-500">
              {formatVolume(typeof market.volume === 'string' ? parseFloat(market.volume) : market.volume)} Vol.
            </span>
          )}
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
