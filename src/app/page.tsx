'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { GroupedMarketCard } from '@/components/cards/GroupedMarketCard';
import { MarketCardSkeleton } from '@/components/cards/MarketCardSkeleton';
import { apiClient } from '@/lib/api';
import type { PolymarketEvent } from '@/types';

type SortOption = 'volume' | 'newest' | 'ending';

function SearchParamsHandler({ setSearchQuery }: { setSearchQuery: (query: string) => void }) {
  const searchParams = useSearchParams();
  const urlQuery = searchParams.get('q');

  useEffect(() => {
    if (urlQuery && urlQuery.trim()) {
      setSearchQuery(urlQuery);
    }
  }, [urlQuery, setSearchQuery]);

  return null;
}

function HomePageContent() {
  const [searchQuery, setSearchQuery] = useState('');
  const [sort, setSort] = useState<SortOption>('volume');
  const [events, setEvents] = useState<PolymarketEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Fetch weather events from Polymarket's weather tag
  useEffect(() => {
    async function fetchWeatherData() {
      try {
        setLoading(true);
        setError(null);
        const weatherEvents = await apiClient.getWeatherEvents();
        setEvents(weatherEvents);
      } catch (err) {
        console.error('Failed to fetch weather data:', err);
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    }

    fetchWeatherData();
  }, []);

  // Filter and sort
  const filteredEvents = (() => {
    let result = [...events];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(e =>
        e.title.toLowerCase().includes(q) ||
        (e.description && e.description.toLowerCase().includes(q))
      );
    }

    switch (sort) {
      case 'newest':
        result.sort((a, b) => {
          const dateA = a.startDate ? new Date(a.startDate).getTime() : 0;
          const dateB = b.startDate ? new Date(b.startDate).getTime() : 0;
          return dateB - dateA;
        });
        break;
      case 'ending':
        result.sort((a, b) => {
          const dateA = a.endDate ? new Date(a.endDate).getTime() : Infinity;
          const dateB = b.endDate ? new Date(b.endDate).getTime() : Infinity;
          return dateA - dateB;
        });
        break;
      default: // volume
        result.sort((a, b) => {
          const va = typeof a.volume24hr === 'number' ? a.volume24hr : 0;
          const vb = typeof b.volume24hr === 'number' ? b.volume24hr : 0;
          return vb - va;
        });
    }

    return result;
  })();

  const totalCount = filteredEvents.length;

  return (
    <div className="min-h-screen">
      <Suspense fallback={null}>
        <SearchParamsHandler setSearchQuery={setSearchQuery} />
      </Suspense>

      {/* Header Bar */}
      <div className="sticky top-16 z-40 bg-[#1a1d26]/80 backdrop-blur-sm border-b border-gray-800">
        <div className="px-4 lg:px-6 py-3 flex flex-col sm:flex-row items-start sm:items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search weather markets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#0f1117] border border-gray-700 rounded-lg pl-10 pr-4 py-2 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
            />
          </div>

          {/* Sort tabs */}
          <div className="flex items-center gap-1">
            {([
              { value: 'volume', label: 'Top Volume' },
              { value: 'newest', label: 'Newest' },
              { value: 'ending', label: 'Ending Soon' },
            ] as { value: SortOption; label: string }[]).map(opt => (
              <button
                key={opt.value}
                onClick={() => setSort(opt.value)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  sort === opt.value
                    ? 'bg-blue-500/15 text-blue-400 border border-blue-500/30'
                    : 'text-gray-400 hover:text-gray-300 hover:bg-[#1f2330]'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Count */}
          {!loading && (
            <span className="text-xs text-gray-400 ml-auto">
              {totalCount} weather market{totalCount !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="px-4 lg:px-6 py-4 lg:py-6">
        {/* Error State */}
        {error && (
          <div className="mb-8 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
            <p className="text-red-400 text-center">
              Failed to load weather markets. Please try again later.
            </p>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <MarketCardSkeleton key={i} />
            ))}
          </div>
        )}

        {/* Markets Grid */}
        {!loading && !error && (
          <>
            {totalCount > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
                {filteredEvents.map(event => (
                  <GroupedMarketCard key={event.id} event={event} />
                ))}
              </div>
            ) : (
              <div className="text-center py-20">
                <div className="text-5xl mb-4">🌤️</div>
                <p className="text-gray-400 text-lg font-medium">
                  No weather markets found
                </p>
                <p className="text-gray-500 text-sm mt-2">
                  {searchQuery
                    ? `No results matching "${searchQuery}". Try a different search.`
                    : 'Check back later for new weather prediction markets.'}
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function HomePage() {
  return <HomePageContent />;
}
