'use client';

import { useState, useEffect, useCallback } from 'react';
import { SingleQuestionCard } from '@/components/cards/SingleQuestionCard';
import { MultiOutcomeMarketCard } from '@/components/cards/MultiOutcomeMarketCard';
import { GroupedMarketCard } from '@/components/cards/GroupedMarketCard';
import { MarketCardSkeleton } from '@/components/cards/MarketCardSkeleton';
import { apiClient } from '@/lib/api';
import type { PolymarketEvent } from '@/types';

type WeatherFilter = 'all' | 'temperature' | 'earthquakes' | 'climate';

const WEATHER_FILTERS: { value: WeatherFilter; label: string; icon: string }[] = [
  { value: 'all', label: 'All Weather', icon: '🌍' },
  { value: 'temperature', label: 'Temperature', icon: '🌡️' },
  { value: 'earthquakes', label: 'Earthquakes', icon: '🌋' },
  { value: 'climate', label: 'Climate', icon: '🌎' },
];

function matchesFilter(event: PolymarketEvent, filter: WeatherFilter): boolean {
  if (filter === 'all') return true;
  const text = `${event.title} ${event.description ?? ''}`.toLowerCase();
  switch (filter) {
    case 'temperature':
      return text.includes('temperature') || text.includes('°') || text.includes('highest temp') || text.includes('hottest') || text.includes('coldest');
    case 'earthquakes':
      return text.includes('earthquake') || text.includes('seismic') || text.includes('quake');
    case 'climate':
      return text.includes('climate') || text.includes('global warming') || text.includes('sea level') || text.includes('hottest year') || text.includes('rank among');
    default:
      return true;
  }
}

export default function ExplorePage() {
  const [activeFilter, setActiveFilter] = useState<WeatherFilter>('all');
  const [events, setEvents] = useState<PolymarketEvent[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredEvents = (() => {
    let result = events.filter(e => matchesFilter(e, activeFilter));

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(e =>
        e.title.toLowerCase().includes(q) ||
        (e.description && e.description.toLowerCase().includes(q))
      );
    }

    return result;
  })();

  const totalCount = filteredEvents.length;

  return (
    <div className="min-h-screen">
      {/* Weather Filter Bar */}
      <div className="sticky top-16 z-40 bg-[#1a1d26]/80 backdrop-blur-sm border-b border-gray-800">
        <div className="px-4 lg:px-6 py-3 flex flex-col sm:flex-row items-start sm:items-center gap-3">
          {/* Filter pills */}
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
            {WEATHER_FILTERS.map(f => (
              <button
                key={f.value}
                onClick={() => setActiveFilter(f.value)}
                className={`px-3.5 py-1.5 rounded-full text-sm font-medium transition-all whitespace-nowrap flex-shrink-0 ${
                  activeFilter === f.value
                    ? 'bg-blue-500/15 text-blue-400 border border-blue-500/30'
                    : 'bg-[#0f1117] text-gray-400 border border-gray-700 hover:text-gray-300 hover:bg-[#1f2330]'
                }`}
              >
                {f.icon} {f.label}
              </button>
            ))}
          </div>

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

          {/* Count */}
          {!loading && (
            <span className="text-xs text-gray-400 ml-auto whitespace-nowrap">
              {totalCount} event{totalCount !== 1 ? 's' : ''}
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

        {/* Events Grid */}
        {!loading && !error && (
          <>
            {totalCount === 0 ? (
              <div className="text-center py-20">
                <div className="text-5xl mb-4">🌤️</div>
                <p className="text-gray-400 text-lg font-medium">
                  No weather markets found
                </p>
                <p className="text-gray-500 text-sm mt-2">
                  {searchQuery
                    ? `No results matching "${searchQuery}". Try a different search.`
                    : 'No markets in this category right now.'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
                {filteredEvents.map(event => (
                  <GroupedMarketCard key={event.id} event={event} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
