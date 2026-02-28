'use client';

import Link from 'next/link';
import Image from 'next/image';
import type { PolymarketMarket } from '@/types';
import { formatVolume, getYesNoProbabilities } from '@/lib/utils';
import { useRealTimePrice } from '@/hooks/useRealTimePrice';

export interface SingleQuestionCardProps {
  market: PolymarketMarket;
}

export function SingleQuestionCard({ market }: SingleQuestionCardProps) {
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
      <div className="bg-[#1a1d26] rounded-xl p-4 border border-gray-800 hover:bg-[#1f2330] hover:border-gray-700 transition-all cursor-pointer h-full flex flex-col">
        {/* Header with Image, Question, and Circular Progress */}
        <div className="flex items-start gap-3 mb-3">
          <div className="flex items-start gap-3 flex-1 min-w-0">
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
            <h3 className="text-white text-base font-semibold line-clamp-2 leading-tight flex-grow">
              {market.question}
            </h3>
          </div>

          {/* Circular Progress Indicator */}
          <div className="flex flex-col items-center flex-shrink-0">
            <div className="relative w-16 h-16">
              <svg className="w-16 h-16 -rotate-90" viewBox="0 0 80 80">
                {/* Background circle */}
                <circle
                  cx="40"
                  cy="40"
                  r="34"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="7"
                  className="text-gray-700"
                />
                {/* Progress circle with color based on probability */}
                <circle
                  cx="40"
                  cy="40"
                  r="34"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="7"
                  strokeDasharray={`${2 * Math.PI * 34}`}
                  strokeDashoffset={`${2 * Math.PI * 34 * (1 - displayYes)}`}
                  className={`transition-all duration-300 ${
                    displayYes >= 0.6 ? 'text-green-500' :
                    displayYes >= 0.35 ? 'text-yellow-500' :
                    'text-red-500'
                  }`}
                />
              </svg>
              {/* Percentage in center */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-white text-base font-bold tabular-nums leading-none">
                  {Math.round(displayYes * 100)}%
                </span>
                <span className="text-gray-500 text-[9px]">chance</span>
              </div>
            </div>
          </div>
        </div>

        {/* Yes/No Buttons */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            className="h-12 rounded-lg font-semibold text-lg transition-all bg-green-500/15 text-emerald-400 hover:bg-green-500/25 border border-green-500/30"
          >
            Yes
          </button>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            className="h-12 rounded-lg font-semibold text-lg transition-all bg-red-500/15 text-red-400 hover:bg-red-500/25 border border-red-500/30"
          >
            No
          </button>
        </div>

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
