'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { MARKET_CATEGORIES, type MarketCategory } from '@/types';

export interface TrendingBarProps {
  activeCategory: MarketCategory;
  onCategoryChange: (category: MarketCategory) => void;
}

const CATEGORY_ICONS: Record<MarketCategory, string> = {
  'All Weather': '🌍',
  'Temperature': '🌡️',
  'Storms': '🌪️',
  'Earthquakes': '🌋',
  'Climate': '🌎',
};

export function TrendingBar({
  activeCategory,
  onCategoryChange,
}: TrendingBarProps) {
  return (
    <div className="sticky top-16 z-40 bg-[#1a1d26]/80 backdrop-blur-sm border-b border-gray-800">
      <div className="overflow-x-auto scrollbar-hide">
        <div className="flex items-center gap-2 px-4 lg:px-6 py-2.5">
          {MARKET_CATEGORIES.map((category) => {
            const isActive = activeCategory === category;
            return (
              <button
                key={category}
                onClick={() => onCategoryChange(category)}
                className={cn(
                  'px-4 py-1.5 rounded-full text-sm font-medium transition-all whitespace-nowrap flex-shrink-0 flex items-center gap-1.5',
                  isActive
                    ? 'bg-blue-500 text-white'
                    : 'bg-[#1a1d26] text-gray-400 border border-gray-800 hover:bg-[#1f2330] hover:text-white'
                )}
              >
                <span>{CATEGORY_ICONS[category]}</span>
                {category}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
