'use client';

import { useState, useMemo } from 'react';
import {
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Filter,
  ExternalLink,
  ChevronDown,
} from 'lucide-react';
import { formatVolume, getEndTimeString } from '@/lib/utils';
import type { WeatherMarket } from '@/hooks/useWeatherMarkets';
import { EdgeSignal } from './EdgeSignal';

interface MarketScannerProps {
  markets: WeatherMarket[];
  loading: boolean;
  onMarketSelect: (market: WeatherMarket) => void;
  edgeSignals?: Record<string, { strength: 'weak' | 'moderate' | 'strong' | null; explanation: string }>;
}

type SortField = 'question' | 'price' | 'volume' | 'endDate' | 'location';
type SortDirection = 'asc' | 'desc';

const WEATHER_TYPES = ['All Types', 'Hurricane', 'Temperature', 'Snow', 'Rain', 'Storm', 'Tornado', 'Flood', 'Drought', 'Wind'] as const;
const REGIONS = ['All Regions', 'Northeast', 'Southeast', 'Midwest', 'Southwest', 'West', 'Northwest'] as const;
const TIMEFRAMES = ['All Timeframes', 'This Week', 'This Month', 'Next 3 Months', '6+ Months'] as const;
const PRICE_RANGES = ['All Prices', '<20¢', '20-40¢', '40-60¢', '60-80¢', '>80¢'] as const;

export function MarketScanner({ markets, loading, onMarketSelect, edgeSignals = {} }: MarketScannerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>('volume');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [weatherType, setWeatherType] = useState<string>('All Types');
  const [region, setRegion] = useState<string>('All Regions');
  const [timeframe, setTimeframe] = useState<string>('All Timeframes');
  const [priceRange, setPriceRange] = useState<string>('All Prices');
  const [showFilters, setShowFilters] = useState(false);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const filteredAndSorted = useMemo(() => {
    let result = [...markets];

    // Search filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (m) =>
          m.question.toLowerCase().includes(q) ||
          m.location?.city.toLowerCase().includes(q) ||
          m.description?.toLowerCase().includes(q)
      );
    }

    // Weather type filter
    if (weatherType !== 'All Types') {
      const typeQ = weatherType.toLowerCase();
      result = result.filter(
        (m) =>
          m.question.toLowerCase().includes(typeQ) ||
          m.description?.toLowerCase().includes(typeQ)
      );
    }

    // Price range filter
    if (priceRange !== 'All Prices') {
      result = result.filter((m) => {
        const p = (m.currentPrice ?? 0) * 100;
        switch (priceRange) {
          case '<20¢': return p < 20;
          case '20-40¢': return p >= 20 && p < 40;
          case '40-60¢': return p >= 40 && p < 60;
          case '60-80¢': return p >= 60 && p < 80;
          case '>80¢': return p >= 80;
          default: return true;
        }
      });
    }

    // Timeframe filter
    if (timeframe !== 'All Timeframes') {
      const now = new Date();
      result = result.filter((m) => {
        if (!m.endDate) return false;
        const end = new Date(m.endDate);
        const diffDays = (end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
        switch (timeframe) {
          case 'This Week': return diffDays >= 0 && diffDays <= 7;
          case 'This Month': return diffDays >= 0 && diffDays <= 30;
          case 'Next 3 Months': return diffDays >= 0 && diffDays <= 90;
          case '6+ Months': return diffDays > 180;
          default: return true;
        }
      });
    }

    // Sort
    result.sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case 'question':
          cmp = a.question.localeCompare(b.question);
          break;
        case 'price':
          cmp = (a.currentPrice ?? 0) - (b.currentPrice ?? 0);
          break;
        case 'volume':
          const volA = typeof a.volume === 'string' ? parseFloat(a.volume) : a.volume || 0;
          const volB = typeof b.volume === 'string' ? parseFloat(b.volume) : b.volume || 0;
          cmp = volA - volB;
          break;
        case 'endDate':
          cmp = new Date(a.endDate || 0).getTime() - new Date(b.endDate || 0).getTime();
          break;
        case 'location':
          cmp = (a.location?.city || '').localeCompare(b.location?.city || '');
          break;
      }
      return sortDirection === 'asc' ? cmp : -cmp;
    });

    return result;
  }, [markets, searchQuery, sortField, sortDirection, weatherType, region, timeframe, priceRange]);

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="w-3 h-3 text-gray-600" />;
    return sortDirection === 'asc' ? (
      <ArrowUp className="w-3 h-3 text-[#00d4ff]" />
    ) : (
      <ArrowDown className="w-3 h-3 text-[#00d4ff]" />
    );
  };

  const FilterSelect = ({
    value,
    onChange,
    options,
  }: {
    value: string;
    onChange: (v: string) => void;
    options: readonly string[];
  }) => (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none bg-[#1a1f2e] border border-gray-800/50 rounded-lg pl-3 pr-8 py-2 text-xs text-gray-300 focus:outline-none focus:border-[#00d4ff]/50 cursor-pointer"
      >
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
      <ChevronDown className="w-3 h-3 text-gray-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
    </div>
  );

  return (
    <div className="w-full bg-[#0a0e1a]">
      <div className="max-w-7xl mx-auto px-4 py-4">

        {/* Search + Filter Toggle */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search markets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#12141a] border border-gray-800/50 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-[#00d4ff]/50 transition-colors"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-xs font-medium transition-colors ${
              showFilters
                ? 'bg-[#00d4ff]/10 border-[#00d4ff]/30 text-[#00d4ff]'
                : 'bg-[#12141a] border-gray-800/50 text-gray-400 hover:text-gray-300'
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            Filters
          </button>
        </div>

        {/* Filter Row */}
        {showFilters && (
          <div className="flex flex-wrap gap-3 mb-4 p-4 bg-[#12141a] rounded-xl border border-gray-800/30">
            <FilterSelect value={weatherType} onChange={setWeatherType} options={WEATHER_TYPES} />
            <FilterSelect value={region} onChange={setRegion} options={REGIONS} />
            <FilterSelect value={timeframe} onChange={setTimeframe} options={TIMEFRAMES} />
            <FilterSelect value={priceRange} onChange={setPriceRange} options={PRICE_RANGES} />
          </div>
        )}

        {/* Results count */}
        <p className="text-gray-500 text-xs mb-3">
          {filteredAndSorted.length} market{filteredAndSorted.length !== 1 ? 's' : ''} found
        </p>

        {/* Loading state */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-[#00d4ff] border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* Desktop Table */}
        {!loading && (
          <>
            <div className="hidden lg:block">
              <div className="bg-[#12141a] rounded-xl border border-gray-800/30 overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-800/50">
                      <th className="text-left px-4 py-3">
                        <button
                          onClick={() => handleSort('question')}
                          className="flex items-center gap-1.5 text-gray-500 text-xs font-semibold uppercase tracking-wider hover:text-gray-300 transition-colors"
                        >
                          Market Question
                          <SortIcon field="question" />
                        </button>
                      </th>
                      <th className="text-left px-4 py-3">
                        <button
                          onClick={() => handleSort('location')}
                          className="flex items-center gap-1.5 text-gray-500 text-xs font-semibold uppercase tracking-wider hover:text-gray-300 transition-colors"
                        >
                          Location
                          <SortIcon field="location" />
                        </button>
                      </th>
                      <th className="text-right px-4 py-3">
                        <button
                          onClick={() => handleSort('price')}
                          className="flex items-center gap-1.5 text-gray-500 text-xs font-semibold uppercase tracking-wider hover:text-gray-300 transition-colors ml-auto"
                        >
                          Price (YES)
                          <SortIcon field="price" />
                        </button>
                      </th>
                      <th className="text-right px-4 py-3">
                        <span className="text-gray-500 text-xs font-semibold uppercase tracking-wider">
                          24h Change
                        </span>
                      </th>
                      <th className="text-right px-4 py-3">
                        <button
                          onClick={() => handleSort('volume')}
                          className="flex items-center gap-1.5 text-gray-500 text-xs font-semibold uppercase tracking-wider hover:text-gray-300 transition-colors ml-auto"
                        >
                          Volume
                          <SortIcon field="volume" />
                        </button>
                      </th>
                      <th className="text-right px-4 py-3">
                        <button
                          onClick={() => handleSort('endDate')}
                          className="flex items-center gap-1.5 text-gray-500 text-xs font-semibold uppercase tracking-wider hover:text-gray-300 transition-colors ml-auto"
                        >
                          Resolution
                          <SortIcon field="endDate" />
                        </button>
                      </th>
                      <th className="text-center px-4 py-3">
                        <span className="text-gray-500 text-xs font-semibold uppercase tracking-wider">
                          Edge
                        </span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAndSorted.map((market) => {
                      const price = market.currentPrice ?? 0;
                      const pricePercent = Math.round(price * 100);
                      const vol = typeof market.volume === 'string' ? parseFloat(market.volume) : market.volume || 0;
                      const edge = edgeSignals[market.id] ?? null;

                      return (
                        <tr
                          key={market.id}
                          onClick={() => onMarketSelect(market)}
                          className="border-b border-gray-800/30 hover:bg-[#1a1f2e]/50 cursor-pointer transition-colors group"
                        >
                          <td className="px-4 py-3.5">
                            <p className="text-white text-sm font-medium group-hover:text-[#00d4ff] transition-colors leading-snug">
                              {market.question}
                            </p>
                          </td>
                          <td className="px-4 py-3.5">
                            <span className="text-gray-400 text-xs">
                              {market.location?.city || '--'}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 text-right">
                            <span
                              className={`font-mono font-semibold text-sm tabular-nums ${
                                price > 0.55
                                  ? 'text-emerald-400'
                                  : price < 0.45
                                  ? 'text-red-400'
                                  : 'text-gray-300'
                              }`}
                            >
                              {pricePercent}¢
                            </span>
                          </td>
                          <td className="px-4 py-3.5 text-right">
                            <span className="text-gray-600 text-xs">--</span>
                          </td>
                          <td className="px-4 py-3.5 text-right">
                            <span className="text-gray-300 text-xs font-mono tabular-nums">
                              {formatVolume(vol)}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 text-right">
                            <span className="text-gray-400 text-xs">
                              {getEndTimeString(market.endDate)}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 text-center">
                            {edge?.strength ? (
                              <EdgeSignal strength={edge.strength} explanation={edge.explanation} />
                            ) : (
                              <span className="text-gray-700 text-xs">--</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {filteredAndSorted.length === 0 && (
                  <div className="px-4 py-16 text-center">
                    <Search className="w-8 h-8 text-gray-700 mx-auto mb-3" />
                    <p className="text-gray-500 text-sm">No markets match your filters</p>
                  </div>
                )}
              </div>
            </div>

            {/* Mobile Cards */}
            <div className="lg:hidden space-y-3">
              {filteredAndSorted.map((market) => {
                const price = market.currentPrice ?? 0;
                const pricePercent = Math.round(price * 100);
                const vol = typeof market.volume === 'string' ? parseFloat(market.volume) : market.volume || 0;
                const edge = edgeSignals[market.id] ?? null;

                return (
                  <button
                    key={market.id}
                    onClick={() => onMarketSelect(market)}
                    className="w-full text-left bg-[#12141a] rounded-xl border border-gray-800/30 p-4 hover:border-gray-700/50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <p className="text-white text-sm font-medium leading-snug flex-1">
                        {market.question}
                      </p>
                      <span
                        className={`text-lg font-bold font-mono tabular-nums flex-shrink-0 ${
                          price > 0.55
                            ? 'text-emerald-400'
                            : price < 0.45
                            ? 'text-red-400'
                            : 'text-gray-300'
                        }`}
                      >
                        {pricePercent}¢
                      </span>
                    </div>
                    <div className="flex items-center gap-3 flex-wrap text-xs">
                      {market.location && (
                        <span className="text-gray-500">{market.location.city}</span>
                      )}
                      <span className="text-gray-600">|</span>
                      <span className="text-gray-400 font-mono tabular-nums">
                        Vol: {formatVolume(vol)}
                      </span>
                      <span className="text-gray-600">|</span>
                      <span className="text-gray-500">{getEndTimeString(market.endDate)}</span>
                      {edge?.strength && (
                        <>
                          <span className="text-gray-600">|</span>
                          <EdgeSignal strength={edge.strength} explanation={edge.explanation} />
                        </>
                      )}
                    </div>
                  </button>
                );
              })}

              {filteredAndSorted.length === 0 && (
                <div className="py-16 text-center">
                  <Search className="w-8 h-8 text-gray-700 mx-auto mb-3" />
                  <p className="text-gray-500 text-sm">No markets match your filters</p>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
