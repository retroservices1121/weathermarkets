'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { GroupedMarketCard } from '@/components/cards/GroupedMarketCard';
import { MarketCardSkeleton } from '@/components/cards/MarketCardSkeleton';
import { apiClient } from '@/lib/api';
import type { PolymarketEvent } from '@/types';

type SortOption = 'volume' | 'newest' | 'ending';
type WeatherFilter = 'all' | 'temperature' | 'weather' | 'hurricanes' | 'earthquakes' | 'global-temp' | 'natural-disasters';

const WEATHER_FILTERS: { value: WeatherFilter; label: string; icon: string }[] = [
  { value: 'all', label: 'All', icon: '🌍' },
  { value: 'temperature', label: 'Temperature', icon: '🌡️' },
  { value: 'weather', label: 'Weather', icon: '⛅' },
  { value: 'hurricanes', label: 'Hurricanes', icon: '🌀' },
  { value: 'earthquakes', label: 'Earthquakes', icon: '🌋' },
  { value: 'global-temp', label: 'Global Temp', icon: '🌎' },
  { value: 'natural-disasters', label: 'Natural Disasters', icon: '🌪️' },
];

function matchesFilter(event: PolymarketEvent, filter: WeatherFilter): boolean {
  if (filter === 'all') return true;
  const text = `${event.title} ${event.description ?? ''}`.toLowerCase();
  switch (filter) {
    case 'temperature':
      return text.includes('temperature') || text.includes('highest temp') || text.includes('hottest') || text.includes('coldest') || /\d+\s*[°ºf]/i.test(text);
    case 'weather':
      return text.includes('storm') || text.includes('tornado') || text.includes('precipitation') || text.includes('rain') || text.includes('snow') || text.includes('wind') || text.includes('weather');
    case 'hurricanes':
      return text.includes('hurricane') || text.includes('cyclone') || text.includes('typhoon') || text.includes('tropical storm') || text.includes('landfall') || text.includes('category');
    case 'earthquakes':
      return text.includes('earthquake') || text.includes('seismic') || text.includes('quake') || text.includes('megaquake');
    case 'global-temp':
      return text.includes('hottest year') || text.includes('rank among') || text.includes('on record') || text.includes('global') || text.includes('sea ice') || text.includes('arctic') || text.includes('climate');
    case 'natural-disasters':
      return text.includes('earthquake') || text.includes('volcano') || text.includes('eruption') || text.includes('tsunami') || text.includes('meteor') || text.includes('disaster') || text.includes('tornado');
    default:
      return true;
  }
}

function SearchParamsHandler({ setSearchQuery, setWeatherFilter }: { setSearchQuery: (query: string) => void; setWeatherFilter: (filter: WeatherFilter) => void }) {
  const searchParams = useSearchParams();
  const urlQuery = searchParams.get('q');
  const urlCategory = searchParams.get('category');

  useEffect(() => {
    if (urlQuery && urlQuery.trim()) {
      setSearchQuery(urlQuery);
    }
  }, [urlQuery, setSearchQuery]);

  useEffect(() => {
    if (urlCategory) {
      const categoryMap: Record<string, WeatherFilter> = {
        'All': 'all',
        'All Weather': 'all',
        'Temperature': 'temperature',
        'Weather': 'weather',
        'Hurricanes': 'hurricanes',
        'Earthquakes': 'earthquakes',
        'Global Temp': 'global-temp',
        'Natural Disasters': 'natural-disasters',
      };
      const filter = categoryMap[urlCategory];
      if (filter) {
        setWeatherFilter(filter);
      }
    }
  }, [urlCategory, setWeatherFilter]);

  return null;
}

function HomePageContent() {
  const [searchQuery, setSearchQuery] = useState('');
  const [sort, setSort] = useState<SortOption>('volume');
  const [weatherFilter, setWeatherFilter] = useState<WeatherFilter>('all');
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

    // Weather sub-category filter
    result = result.filter(e => matchesFilter(e, weatherFilter));

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
        <SearchParamsHandler setSearchQuery={setSearchQuery} setWeatherFilter={setWeatherFilter} />
      </Suspense>

      {/* Header Bar */}
      <div className="sticky top-16 z-40 bg-[#1a1d26]/80 backdrop-blur-sm border-b border-gray-800">
        {/* Weather Category Filter Pills */}
        <div className="px-4 lg:px-6 pt-3 pb-2 flex items-center gap-2 overflow-x-auto scrollbar-hide">
          {WEATHER_FILTERS.map(f => (
            <button
              key={f.value}
              onClick={() => setWeatherFilter(f.value)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all whitespace-nowrap flex-shrink-0 flex items-center gap-1.5 ${
                weatherFilter === f.value
                  ? 'bg-blue-500 text-white'
                  : 'bg-[#0f1117] text-gray-400 border border-gray-700 hover:bg-[#1f2330] hover:text-white'
              }`}
            >
              <span>{f.icon}</span>
              {f.label}
            </button>
          ))}
        </div>

        <div className="px-4 lg:px-6 pb-3 flex flex-col sm:flex-row items-start sm:items-center gap-3">
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
