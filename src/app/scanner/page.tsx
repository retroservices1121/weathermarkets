'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useWeatherMarkets, WeatherMarket } from '@/hooks/useWeatherMarkets';
import { TrendingBar } from '@/components/layout/TrendingBar';
import { Search, Filter, ArrowUpDown, MapPin, Clock, DollarSign, Activity } from 'lucide-react';
import type { MarketCategory } from '@/types';

type SortField = 'question' | 'price' | 'volume' | 'endDate';
type SortDir = 'asc' | 'desc';

const WEATHER_TYPES = ['All', 'Temperature', 'Precipitation', 'Hurricane', 'Snow', 'Wind', 'Severe'] as const;
const REGIONS = ['All', 'Northeast', 'Southeast', 'Midwest', 'West', 'Gulf Coast'] as const;
const TIMEFRAMES = ['All', 'Today', 'This Week', 'This Month'] as const;
const PRICE_RANGES = ['All', 'Under 20c', '20c - 80c', 'Over 80c'] as const;

export default function ScannerPage() {
  const { markets, loading } = useWeatherMarkets();
  const [search, setSearch] = useState('');
  const [weatherType, setWeatherType] = useState<string>('All');
  const [region, setRegion] = useState<string>('All');
  const [timeframe, setTimeframe] = useState<string>('All');
  const [priceRange, setPriceRange] = useState<string>('All');
  const [sortField, setSortField] = useState<SortField>('volume');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [activeCategory, setActiveCategory] = useState<MarketCategory>('All Weather');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('desc');
    }
  };

  const filteredMarkets = useMemo(() => {
    let result = [...markets];

    // Search filter
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(m => m.question.toLowerCase().includes(q));
    }

    // Weather type filter
    if (weatherType !== 'All') {
      const keywords: Record<string, string[]> = {
        Temperature: ['temperature', 'heat', 'cold', 'hot', 'warm', 'freeze'],
        Precipitation: ['rain', 'precipitation', 'rainfall'],
        Hurricane: ['hurricane', 'cyclone', 'typhoon', 'tropical'],
        Snow: ['snow', 'blizzard', 'ice', 'winter'],
        Wind: ['wind', 'gust'],
        Severe: ['storm', 'tornado', 'severe', 'flood'],
      };
      const kws = keywords[weatherType] || [];
      result = result.filter(m => kws.some(kw => m.question.toLowerCase().includes(kw)));
    }

    // Price range filter
    if (priceRange === 'Under 20c') result = result.filter(m => m.currentPrice < 0.2);
    else if (priceRange === '20c - 80c') result = result.filter(m => m.currentPrice >= 0.2 && m.currentPrice <= 0.8);
    else if (priceRange === 'Over 80c') result = result.filter(m => m.currentPrice > 0.8);

    // Sort
    result.sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case 'question': cmp = a.question.localeCompare(b.question); break;
        case 'price': cmp = a.currentPrice - b.currentPrice; break;
        case 'volume': cmp = a.volume - b.volume; break;
        case 'endDate': cmp = new Date(a.endDate).getTime() - new Date(b.endDate).getTime(); break;
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });

    return result;
  }, [markets, search, weatherType, region, timeframe, priceRange, sortField, sortDir]);

  const SortHeader = ({ field, label }: { field: SortField; label: string }) => (
    <button
      onClick={() => handleSort(field)}
      className="flex items-center gap-1 text-gray-500 text-xs font-semibold uppercase tracking-wider hover:text-gray-300 transition-colors"
    >
      {label}
      <ArrowUpDown className={`w-3 h-3 ${sortField === field ? 'text-[#00d4ff]' : ''}`} />
    </button>
  );

  return (
    <div className="min-h-screen bg-[#0a0b0f]">
      <TrendingBar activeCategory={activeCategory} onCategoryChange={setActiveCategory} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">Weather Market Scanner</h1>
            <p className="text-gray-500 text-sm mt-1">Active weather prediction markets from Polymarket</p>
          </div>
          <Link
            href="/radar"
            className="px-4 py-2 bg-[#00d4ff]/10 text-[#00d4ff] border border-[#00d4ff]/30 rounded-lg text-sm font-semibold hover:bg-[#00d4ff]/20 transition-colors flex items-center gap-2"
          >
            <Activity className="w-4 h-4" />
            Open Radar
          </Link>
        </div>

        {/* Search & Filters */}
        <div className="bg-[#12141a] rounded-2xl p-4 border border-gray-800/30 mb-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search weather markets..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full bg-[#0a0e1a] border border-gray-800 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-[#00d4ff]/50 transition-colors"
              />
            </div>
            <select
              value={weatherType}
              onChange={e => setWeatherType(e.target.value)}
              className="bg-[#0a0e1a] border border-gray-800 rounded-lg px-3 py-2.5 text-sm text-gray-300 focus:outline-none focus:border-[#00d4ff]/50"
            >
              {WEATHER_TYPES.map(t => <option key={t} value={t}>{t === 'All' ? 'All Types' : t}</option>)}
            </select>
            <select
              value={priceRange}
              onChange={e => setPriceRange(e.target.value)}
              className="bg-[#0a0e1a] border border-gray-800 rounded-lg px-3 py-2.5 text-sm text-gray-300 focus:outline-none focus:border-[#00d4ff]/50"
            >
              {PRICE_RANGES.map(p => <option key={p} value={p}>{p === 'All' ? 'All Prices' : p}</option>)}
            </select>
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="bg-[#12141a] rounded-2xl p-12 border border-gray-800/30 text-center">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#00d4ff] border-t-transparent mx-auto mb-4" />
            <p className="text-gray-400 font-medium">Scanning Polymarket for weather markets...</p>
          </div>
        )}

        {/* Empty state */}
        {!loading && filteredMarkets.length === 0 && (
          <div className="bg-[#12141a] rounded-2xl p-12 border border-gray-800/30 text-center">
            <Activity className="w-12 h-12 text-gray-700 mx-auto mb-4" />
            <p className="text-gray-400 font-medium">No weather markets found</p>
            <p className="text-gray-600 text-sm mt-1">
              {markets.length === 0
                ? 'No active weather prediction markets on Polymarket right now'
                : 'Try adjusting your filters'}
            </p>
          </div>
        )}

        {/* Desktop Table */}
        {!loading && filteredMarkets.length > 0 && (
          <>
            <div className="hidden lg:block bg-[#12141a] rounded-2xl border border-gray-800/30 overflow-hidden">
              <div className="grid grid-cols-12 gap-4 px-5 py-3 border-b border-gray-800/30">
                <div className="col-span-5"><SortHeader field="question" label="Market" /></div>
                <div className="col-span-1 text-center"><span className="text-gray-500 text-xs font-semibold uppercase tracking-wider">Location</span></div>
                <div className="col-span-2 text-center"><SortHeader field="price" label="YES Price" /></div>
                <div className="col-span-2 text-center"><SortHeader field="volume" label="Volume" /></div>
                <div className="col-span-2 text-center"><SortHeader field="endDate" label="Resolves" /></div>
              </div>
              <div className="divide-y divide-gray-800/30">
                {filteredMarkets.map(market => (
                  <Link
                    key={market.id}
                    href={`/radar?market=${market.id}`}
                    className="grid grid-cols-12 gap-4 px-5 py-4 hover:bg-white/[0.02] transition-colors items-center"
                  >
                    <div className="col-span-5">
                      <p className="text-white text-sm font-medium leading-snug">{market.question}</p>
                    </div>
                    <div className="col-span-1 text-center">
                      {market.location ? (
                        <span className="text-gray-500 text-xs flex items-center justify-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {market.location.city}
                        </span>
                      ) : (
                        <span className="text-gray-700 text-xs">-</span>
                      )}
                    </div>
                    <div className="col-span-2 text-center">
                      <span className={`font-bold text-sm tabular-nums ${
                        market.currentPrice > 0.5 ? 'text-emerald-400' : market.currentPrice < 0.5 ? 'text-rose-400' : 'text-gray-300'
                      }`}>
                        {(market.currentPrice * 100).toFixed(1)}c
                      </span>
                    </div>
                    <div className="col-span-2 text-center">
                      <span className="text-gray-400 text-sm tabular-nums">
                        ${market.volume >= 1000000 ? `${(market.volume / 1000000).toFixed(1)}M` : market.volume >= 1000 ? `${(market.volume / 1000).toFixed(1)}K` : market.volume.toFixed(0)}
                      </span>
                    </div>
                    <div className="col-span-2 text-center">
                      <span className="text-gray-500 text-xs">
                        {market.endDate ? new Date(market.endDate).toLocaleDateString() : '-'}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Mobile Cards */}
            <div className="lg:hidden space-y-3">
              {filteredMarkets.map(market => (
                <Link
                  key={market.id}
                  href={`/radar?market=${market.id}`}
                  className="block bg-[#12141a] rounded-2xl p-4 border border-gray-800/30 hover:border-[#00d4ff]/20 transition-colors"
                >
                  <p className="text-white text-sm font-medium mb-2">{market.question}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className={`font-bold text-lg tabular-nums ${
                        market.currentPrice > 0.5 ? 'text-emerald-400' : market.currentPrice < 0.5 ? 'text-rose-400' : 'text-gray-300'
                      }`}>
                        {(market.currentPrice * 100).toFixed(1)}c
                      </span>
                      {market.location && (
                        <span className="text-gray-500 text-xs flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {market.location.city}
                        </span>
                      )}
                    </div>
                    <div className="text-right">
                      <span className="text-gray-500 text-xs block">
                        ${market.volume >= 1000 ? `${(market.volume / 1000).toFixed(1)}K` : market.volume.toFixed(0)} vol
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
