'use client';

import Link from 'next/link';
import Image from 'next/image';
import type { PolymarketMarket } from '@/types';
import { formatVolume, getYesNoProbabilities } from '@/lib/utils';
import { useRealTimePrice } from '@/hooks/useRealTimePrice';

export interface SingleMarketCardProps {
  market: PolymarketMarket;
}

export function SingleMarketCard({ market }: SingleMarketCardProps) {
  const { yes, no } = getYesNoProbabilities(market?.outcomePrices);
  const { currentPrice } = useRealTimePrice(market?.id);

  const displayYes = currentPrice !== null ? currentPrice : yes;
  const displayNo = 1 - displayYes;

  if (!market || !market.question || !displayYes || !displayNo) {
    return null;
  }

  const hasImage = market.image;

  return (
    <Link href={`/market/${market.slug || market.id}`}>
      <div className="bg-[#1a1d26] rounded-xl p-4 hover:bg-[#1f2330] transition-colors cursor-pointer h-full flex flex-col">
        {/* Header with Icon/Image */}
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
          <h3 className="text-white text-sm font-medium line-clamp-2 flex-grow">
            {market.question}
          </h3>
        </div>

        {/* Outcome Options - Date ranges or outcomes */}
        {market.outcomes && market.outcomes.length > 0 && (
          <div className="flex flex-col gap-2 mb-3">
            {market.outcomes.slice(0, 2).map((outcome: any, idx: number) => {
              const price = idx === 0 ? displayYes : displayNo;
              const outcomeText = typeof outcome === 'string' ? outcome : outcome?.toString();
              return (
                <div key={idx} className="flex items-center justify-between text-xs">
                  <span className="text-gray-400">{outcomeText}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-white font-semibold">{Math.round(price * 100)}%</span>
                    <button className="px-2.5 py-1 bg-[#4ade80]/10 text-[#4ade80] rounded text-xs font-medium hover:bg-[#4ade80]/20">
                      Yes
                    </button>
                    <button className="px-2.5 py-1 bg-[#ef4444]/10 text-[#ef4444] rounded text-xs font-medium hover:bg-[#ef4444]/20">
                      No
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between text-xs text-gray-500 mt-auto pt-3 border-t border-gray-800">
          {market.volume && (
            <div className="flex items-center gap-1">
              <span>{formatVolume(typeof market.volume === 'string' ? parseFloat(market.volume) : market.volume)} Vol.</span>
            </div>
          )}
          {market.endDate && (
            <span>{new Date(market.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
          )}
        </div>
      </div>
    </Link>
  );
}
