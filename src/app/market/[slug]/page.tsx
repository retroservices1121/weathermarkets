'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, Share2, Bookmark, TrendingUp, Users, Trophy, Flame, Clock, Info } from 'lucide-react';
import { useMarketDetails, usePriceHistory } from '@/hooks/useMarketDetails';
import { PriceChart } from '@/components/trade/PriceChart';
import { OrderBook } from '@/components/trade/OrderBook';
import { TrendingBar } from '@/components/layout/TrendingBar';
import { AnimatedNumber } from '@/components/ui/AnimatedNumber';
import { formatVolume, isSportsMatchMarket } from '@/lib/utils';
import { apiClient } from '@/lib/api';
import type { MarketCategory } from '@/types';

interface MarketPageProps {
  params: { slug: string };
}

export default function MarketPage({ params }: MarketPageProps) {
  const { slug } = params;
  const [selectedOutcome, setSelectedOutcome] = useState(0);
  const [timeInterval, setTimeInterval] = useState<'1h' | '1d' | '1w' | 'max'>('1d');
  const [orderType, setOrderType] = useState<'buy' | 'sell'>('buy');
  const [limitPrice, setLimitPrice] = useState('');
  const [shares, setShares] = useState('');
  const [expirationEnabled, setExpirationEnabled] = useState(false);
  const [activeTab, setActiveTab] = useState<'markets' | 'comments' | 'holders' | 'activity'>('markets');
  const [activeCategory, setActiveCategory] = useState<MarketCategory>('Sports');
  const [hoveredProbability, setHoveredProbability] = useState<number | null>(null);
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [sportsCategories, setSportsCategories] = useState<Array<{ name: string; emoji: string; count: number }>>([]);

  const { market, loading, error } = useMarketDetails(slug);
  const outcome = selectedOutcome === 0 ? 'YES' : 'NO';
  const { priceHistory } = usePriceHistory(slug, outcome, timeInterval);

  useEffect(() => {
    const fetchSportsCategories = async () => {
      const categories = await apiClient.getSportsCategories();
      setSportsCategories(categories);
    };
    fetchSportsCategories();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0b0f]">
        <div className="text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#3B82F6] border-t-transparent mx-auto mb-4" />
          <p className="text-gray-400 font-medium">Loading market...</p>
        </div>
      </div>
    );
  }

  if (error || !market) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0b0f]">
        <div className="text-center">
          <p className="text-rose-400 mb-4 font-semibold">Failed to load market</p>
          <Link href="/" className="text-[#3B82F6] hover:text-[#1D4ED8] font-medium transition-colors">
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  const isSports = isSportsMatchMarket(market);
  const outcomes = market.outcomes || [];
  const prices = market.outcomePrices?.map((p: any) => typeof p === 'string' ? parseFloat(p) : p) || [];

  const currentPrice = prices[selectedOutcome] || 0;
  const totalVolume = typeof market.volume === 'string' ? parseFloat(market.volume) : (market.volume || 0);

  // Calculate trading values
  const avgPrice = limitPrice ? parseFloat(limitPrice) / 100 : currentPrice;
  const sharesNum = parseFloat(shares) || 0;
  const total = orderType === 'buy' ? (avgPrice * sharesNum) : 0;
  const potentialReturn = orderType === 'buy' ? (sharesNum - total) : (sharesNum * avgPrice);

  return (
    <>
      <div className="min-h-screen bg-[#0a0b0f]">
        {/* Trending Bar */}
        <TrendingBar
          activeCategory={activeCategory}
          onCategoryChange={setActiveCategory}
          showSearchBar={false}
        />

      <div className="max-w-[1600px] mx-auto px-6 lg:px-8 py-8">
        <div className="flex items-start gap-8">
          {/* Left Sidebar - Sports Categories */}
          {isSports && (
            <div className="hidden lg:block w-56 flex-shrink-0">
              <div className="bg-[#12141a] rounded-2xl border border-gray-800/30 p-3 space-y-2">
                <div className="space-y-0.5">
              <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg bg-[#1e2a4a] text-[#3B82F6] font-semibold text-sm transition-colors">
                <span className="text-base">🔥</span>
                <span>Live</span>
                <span className="ml-auto bg-[#2d3a5f] text-[#3B82F6] text-xs font-bold px-2 py-0.5 rounded-full">3</span>
              </button>
              <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white font-medium text-sm transition-colors">
                <span className="text-base">🏆</span>
                <span>Futures</span>
              </button>
            </div>

            <div className="pt-3 mt-3 border-t border-gray-800/30">
              <h3 className="text-gray-500 text-[10px] font-bold uppercase px-3 mb-2 tracking-wider">Sports</h3>
              <div className="space-y-0.5">
                {sportsCategories.length > 0 ? (
                  sportsCategories.map((sport) => (
                    <button
                      key={sport.name}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg font-medium text-sm transition-colors ${
                        sport.name === 'NHL' || (market.category === 'Sports' && sport.name === market.category)
                          ? 'bg-white/5 text-white'
                          : 'text-gray-400 hover:bg-white/5 hover:text-white'
                      }`}
                    >
                      <span className="text-base">{sport.emoji}</span>
                      <span className="flex-1">{sport.name}</span>
                      <span className="text-xs text-gray-500 font-semibold">{sport.count}</span>
                    </button>
                  ))
                ) : (
                  <div className="px-3 py-2 text-sm text-gray-500">Loading sports...</div>
                )}
              </div>
                </div>
              </div>
            </div>
          )}

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {isSports ? (
            /* Sports Match Layout */
            <>
              {/* Top: Match Header + Trading Panel */}
              <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-8 mb-8">
                {/* Left: Match Header */}
                <div className="flex-1 min-w-0">
                  {/* Match Header Card with Polymarket-style Border */}
                  <div className="relative">
                    {/* Decorative SVG Border Frame */}
                    <div className="relative">
                      {/* SVG Top Border */}
                      <svg
                        width="100%"
                        height="24"
                        viewBox="0 0 1200 92"
                        preserveAspectRatio="none"
                        xmlns="http://www.w3.org/2000/svg"
                        className="absolute -top-1 left-0 right-0 pointer-events-none z-10"
                      >
                        <path
                          d="M1 105V55Q1 10 46 10H350Q380 10 390 30L410 66Q415 80 430 80H770Q785 80 790 66L810 30Q820 10 850 10H1154Q1199 10 1199 55V105"
                          fill="none"
                          stroke="rgba(59, 130, 246, 0.9)"
                          strokeWidth="5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>

                      {/* Main Content Container */}
                      <div className="bg-transparent rounded-3xl p-3 pt-7 pb-4 relative overflow-hidden">
                        {/* Game Time */}
                        <div className="flex justify-center mb-3">
                          {market.gameStartTime && (
                            <div className="bg-[#334155] px-3 py-1 rounded-full border border-gray-600/30">
                              <p className="text-gray-200 text-[10px] font-bold tracking-wide">
                                {new Date(market.gameStartTime).toLocaleTimeString('en-US', {
                                  hour: 'numeric',
                                  minute: '2-digit',
                                  hour12: true
                                }).toUpperCase()}
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Team Matchup */}
                        <div className="flex items-center justify-between gap-3">
                          {outcomes.length === 2 && (
                            <>
                              {/* Team 1 */}
                              <div className="flex flex-col items-center flex-1 min-w-0">
                                <div className="relative w-12 h-12 lg:w-14 lg:h-14 rounded-lg overflow-hidden mb-1.5 bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg">
                                  {market.image ? (
                                    <Image
                                      src={market.image}
                                      alt={outcomes[0]}
                                      fill
                                      className="object-contain p-1.5"
                                      sizes="56px"
                                    />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                      <span className="text-white text-lg lg:text-xl font-black">
                                        {outcomes[0].substring(0, 3).toUpperCase()}
                                      </span>
                                    </div>
                                  )}
                                </div>
                                <h2 className="text-white text-xs lg:text-sm font-bold mb-0.5 text-center truncate max-w-full">
                                  {outcomes[0]}
                                </h2>
                                <p className="text-gray-400 text-[10px] font-medium">4-3</p>
                              </div>

                              {/* Center Stats */}
                              <div className="flex flex-col items-center gap-1.5 px-2 min-w-[140px]">
                                <div className="flex items-center gap-1.5 lg:gap-2 w-full justify-center">
                                  <span className="text-white text-xl lg:text-2xl font-bold tabular-nums">
                                    {Math.round((prices[0] || 0) * 100)}%
                                  </span>
                                  <div className="relative h-1.5 w-12 lg:w-16 bg-gray-700/50 rounded-full overflow-hidden flex">
                                    <div
                                      className="bg-blue-500 transition-all"
                                      style={{ width: `${(prices[0] || 0) * 100}%` }}
                                    />
                                    <div
                                      className="bg-yellow-500 transition-all"
                                      style={{ width: `${(prices[1] || 0) * 100}%` }}
                                    />
                                  </div>
                                  <span className="text-white text-xl lg:text-2xl font-bold tabular-nums">
                                    {Math.round((prices[1] || 0) * 100)}%
                                  </span>
                                </div>
                                <div className="flex items-center gap-3 text-gray-400 text-[10px] font-medium">
                                  <span>{formatVolume(totalVolume)} Vol.</span>
                                  {market.endDate && (
                                    <>
                                      <span>•</span>
                                      <span>
                                        {new Date(market.endDate).toLocaleDateString('en-US', {
                                          month: 'short',
                                          day: 'numeric',
                                          year: 'numeric'
                                        })}
                                      </span>
                                    </>
                                  )}
                                </div>
                              </div>

                              {/* Team 2 */}
                              <div className="flex flex-col items-center flex-1 min-w-0">
                                <div className="relative w-12 h-12 lg:w-14 lg:h-14 rounded-lg overflow-hidden mb-1.5 bg-gradient-to-br from-yellow-500 to-yellow-600 shadow-lg">
                                  {market.image ? (
                                    <Image
                                      src={market.image}
                                      alt={outcomes[1]}
                                      fill
                                      className="object-contain p-1.5"
                                      sizes="56px"
                                    />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                      <span className="text-red-900 text-lg lg:text-xl font-black">
                                        {outcomes[1].substring(0, 3).toUpperCase()}
                                      </span>
                                    </div>
                                  )}
                                </div>
                                <h2 className="text-white text-xs lg:text-sm font-bold mb-0.5 text-center truncate max-w-full">
                                  {outcomes[1]}
                                </h2>
                                <p className="text-gray-400 text-[10px] font-medium">5-5</p>
                              </div>
                            </>
                          )}
                        </div>
                      </div>

                      {/* SVG Bottom Border */}
                      <svg
                        width="100%"
                        height="24"
                        viewBox="0 0 1200 92"
                        preserveAspectRatio="none"
                        xmlns="http://www.w3.org/2000/svg"
                        className="absolute -bottom-1 left-0 right-0 pointer-events-none z-10"
                      >
                        <path
                          d="M1 -44V37Q1 82 46 82H1154Q1199 82 1199 37V-44"
                          fill="none"
                          stroke="rgba(59, 130, 246, 0.9)"
                          strokeWidth="5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                  </div>

                  {/* Moneyline Section Below */}
                  <div className="mt-6 bg-transparent rounded-2xl border-2 border-[#3B82F6]/40 overflow-hidden hover:bg-[#0f1419]/20 transition-colors cursor-pointer">
                    <div className="px-4 py-4">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex-1">
                          <p className="text-white text-sm font-semibold whitespace-nowrap">Moneyline</p>
                          <p className="text-gray-400 text-xs font-medium mt-0.5 whitespace-nowrap">
                            {formatVolume(totalVolume)} Vol.
                          </p>
                        </div>

                        {/* Betting Buttons with 3D Effect */}
                        <div className="flex justify-end items-center gap-3 w-[262px]">
                          {outcomes.map((outcome: string, idx: number) => {
                            const prob = prices[idx] || 0;
                            const teamCode = outcome.substring(0, 3).toUpperCase();
                            const isSelected = selectedOutcome === idx;
                            return (
                              <button
                                key={idx}
                                onClick={() => setSelectedOutcome(idx)}
                                className="flex-1 relative group select-none"
                              >
                                {/* 3D Shadow Layer - stays in place */}
                                <span className={`absolute inset-0 rounded-lg ${
                                  idx === 0
                                    ? 'bg-[#b91c1c]'
                                    : 'bg-[#1e40af]'
                                } translate-y-[4px]`} />

                                {/* Main Button Layer - moves down on hover */}
                                <span className={`relative flex items-center justify-center px-4 py-3 rounded-lg transition-transform ${
                                  idx === 0
                                    ? 'bg-[#dc2626]'
                                    : 'bg-[#2563eb]'
                                } translate-y-0 group-hover:translate-y-[4px]`}>
                                  <span className="flex items-center justify-between w-full text-white">
                                    <span className="uppercase text-sm font-semibold tracking-wide opacity-70">
                                      {teamCode}
                                    </span>
                                    <span className="text-sm font-bold ml-2">
                                      {Math.round(prob * 100)}¢
                                    </span>
                                  </span>
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right: Trading Panel - Sticky */}
                <div className="w-full lg:w-[340px]">
                  <div className="sticky top-8 bg-[#1a1f2e] rounded-2xl p-3 space-y-2 border border-gray-800/50 shadow-xl relative">
                    {/* Coming Soon Overlay */}
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm rounded-2xl z-10 flex items-center justify-center">
                      <div className="text-center px-4">
                        <h3 className="text-white text-2xl font-bold mb-2">Coming Soon</h3>
                        <p className="text-gray-400 text-sm">Trading will be available shortly</p>
                      </div>
                    </div>
                    {/* Market Header with Icon */}
                    <div className="flex items-center gap-2 pb-2 border-b border-gray-700/50">
                      <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-gradient-to-br from-[#3B82F6] to-[#60A5FA] shadow-lg">
                        {market.image ? (
                          <Image
                            src={market.image}
                            alt={market.question || ''}
                            fill
                            className="object-contain p-1"
                            sizes="40px"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <span className="text-white text-xs font-black">
                              {outcomes[0]?.substring(0, 3).toUpperCase() || ''}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-white font-bold text-sm line-clamp-1 leading-tight mb-0.5">
                          {market.question}
                        </h3>
                        <div className="inline-flex items-center bg-[#8B4513]/25 px-1.5 py-0.5 rounded border border-[#8B4513]/30">
                          <span className="text-xs font-semibold text-[#93C5FD]">{outcomes[selectedOutcome]}</span>
                        </div>
                      </div>
                    </div>
                    {/* Buy/Sell Tabs */}
                    <div className="flex gap-0.5 bg-[#1a1f2e] rounded-lg p-0.5">
                      <button
                        onClick={() => setOrderType('buy')}
                        className={`flex-1 py-1.5 font-bold text-sm rounded-md transition-all ${
                          orderType === 'buy'
                            ? 'bg-white text-gray-900 shadow-md'
                            : 'text-gray-400 hover:text-white'
                        }`}
                      >
                        Buy
                      </button>
                      <button
                        onClick={() => setOrderType('sell')}
                        className={`flex-1 py-1.5 font-bold text-sm rounded-md transition-all ${
                          orderType === 'sell'
                            ? 'bg-white text-gray-900 shadow-md'
                            : 'text-gray-400 hover:text-white'
                        }`}
                      >
                        Sell
                      </button>
                    </div>

                    {/* Team Selection */}
                    <div className="grid grid-cols-2 gap-1.5">
                      {outcomes.map((outcome: string, idx: number) => {
                        const prob = prices[idx] || 0;
                        const teamCode = outcome.substring(0, 3).toUpperCase();
                        return (
                          <button
                            key={idx}
                            onClick={() => setSelectedOutcome(idx)}
                            className={`py-2 px-2 rounded-lg font-bold transition-all ${
                              selectedOutcome === idx
                                ? idx === 0
                                  ? 'bg-gradient-to-br from-[#dc2626] to-[#b91c1c] text-white shadow-lg shadow-red-900/20'
                                  : 'bg-gradient-to-br from-[#3b82f6] to-[#2563eb] text-white shadow-lg shadow-blue-900/20'
                                : 'bg-[#1a1f2e] text-gray-300 hover:bg-[#222733] border border-gray-700/50'
                            }`}
                          >
                            <div className="text-sm font-semibold opacity-90 mb-0.5">{teamCode}</div>
                            <div className="text-base">{Math.round(prob * 100)}¢</div>
                          </button>
                        );
                      })}
                    </div>

                    {/* Limit Price */}
                    <div>
                      <label className="text-white text-xs font-bold mb-1 block flex items-center justify-between">
                        <span>Limit Price</span>
                        <button className="text-[10px] text-gray-400 hover:text-white font-medium flex items-center gap-0.5">
                          Limit <span>▼</span>
                        </button>
                      </label>
                      <div className="flex items-center gap-1.5 bg-[#1a1f2e] rounded-lg border border-gray-700/50 px-2 py-1.5">
                        <button
                          onClick={() => {
                            const current = parseFloat(limitPrice) || (currentPrice * 100);
                            setLimitPrice(Math.max(0, current - 0.1).toFixed(1));
                          }}
                          className="w-6 h-6 flex items-center justify-center rounded bg-[#2a3142] hover:bg-[#343d52] text-gray-300 hover:text-white font-bold text-sm transition-colors"
                        >
                          −
                        </button>
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          max="100"
                          value={limitPrice}
                          onChange={(e) => setLimitPrice(e.target.value)}
                          placeholder={(currentPrice * 100).toFixed(1)}
                          className="flex-1 bg-transparent text-white text-center font-bold text-lg focus:outline-none"
                        />
                        <span className="text-gray-400 font-semibold text-[10px]">¢</span>
                        <button
                          onClick={() => {
                            const current = parseFloat(limitPrice) || (currentPrice * 100);
                            setLimitPrice(Math.min(100, current + 0.1).toFixed(1));
                          }}
                          className="w-6 h-6 flex items-center justify-center rounded bg-[#2a3142] hover:bg-[#343d52] text-gray-300 hover:text-white font-bold text-sm transition-colors"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    {/* Shares */}
                    <div>
                      <label className="text-white text-xs font-bold mb-1 block">Shares</label>
                      <div className="space-y-1">
                        <input
                          type="number"
                          step="1"
                          min="0"
                          value={shares}
                          onChange={(e) => setShares(e.target.value)}
                          placeholder="0"
                          className="w-full bg-[#1a1f2e] text-white px-3 py-1.5 rounded-lg border border-gray-700/50 focus:outline-none focus:border-[#3B82F6]/50 font-bold text-center text-2xl transition-colors"
                        />
                        <div className="flex gap-1.5 justify-end">
                          <button
                            onClick={() => {
                              const current = parseFloat(shares) || 0;
                              setShares(Math.max(0, current - 10).toString());
                            }}
                            className="px-3 py-0.5 bg-[#2a3142] hover:bg-[#343d52] text-gray-300 hover:text-white rounded font-bold text-[10px] transition-colors"
                          >
                            -10
                          </button>
                          <button
                            onClick={() => {
                              const current = parseFloat(shares) || 0;
                              setShares((current + 10).toString());
                            }}
                            className="px-3 py-0.5 bg-[#2a3142] hover:bg-[#343d52] text-gray-300 hover:text-white rounded font-bold text-[10px] transition-colors"
                          >
                            +10
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Set Expiration */}
                    <div className="flex items-center justify-between py-0.5">
                      <span className="text-white text-xs font-bold">Set Expiration</span>
                      <button
                        onClick={() => setExpirationEnabled(!expirationEnabled)}
                        className={`relative w-10 h-5 rounded-full transition-all ${
                          expirationEnabled ? 'bg-gradient-to-r from-[#3B82F6] to-[#60A5FA]' : 'bg-[#2a3142]'
                        }`}
                      >
                        <div
                          className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform shadow-md ${
                            expirationEnabled ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>

                    {/* Summary */}
                    <div className="space-y-1 pt-1.5 border-t border-gray-700/30">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-300 font-semibold text-xs">Total</span>
                        <span className="text-white font-bold text-base tabular-nums">${total.toFixed(0)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-300 font-semibold text-xs">To Win</span>
                        <span className="text-emerald-400 font-bold text-base tabular-nums">${potentialReturn.toFixed(0)}</span>
                      </div>
                    </div>

                    {/* Trade Button */}
                    <button
                      disabled={!shares || parseFloat(shares) <= 0}
                      className="w-full py-2.5 bg-gradient-to-r from-[#4A9DFF] to-[#3b82f6] hover:from-[#3d8ae6] hover:to-[#2563eb] disabled:from-[#2a3142] disabled:to-[#2a3142] disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-lg transition-all text-xs shadow-lg"
                    >
                      Trade
                    </button>
                  </div>
                </div>
              </div>

            </>
          ) : (
            /* Regular Market Layout (Yes/No) */
            <div className="max-w-[1600px] mx-auto px-6 lg:px-8 py-6">
              <div className="flex items-start gap-8">
                {/* Main Content */}
                <div className="flex-1 space-y-4">
                  {/* Probability Display */}
                  <div className="flex items-baseline gap-3">
                    <span className="text-4xl font-bold text-white tabular-nums">
                      <AnimatedNumber value={hoveredProbability ?? Math.round((prices[0] || 0) * 100)} />%
                    </span>
                    <span className="text-sm text-gray-500 font-medium">chance</span>
                  </div>

                  {/* Volume and End Date */}
                  <div className="flex items-center gap-6 text-gray-400">
                    {market.volume && (
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4" />
                        <span className="text-base font-medium">
                          {formatVolume(typeof market.volume === 'string' ? parseFloat(market.volume) : market.volume)} Vol.
                        </span>
                      </div>
                    )}
                    {market.endDate && (
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        <span className="text-base font-medium">
                          {new Date(market.endDate).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Chart */}
                  <div className="bg-[#12141a] rounded-2xl p-4 border border-gray-800/30">
                    <PriceChart
                      data={priceHistory}
                      outcome={selectedOutcome === 0 ? 'YES' : 'NO'}
                      timeInterval={timeInterval}
                      onTimeIntervalChange={setTimeInterval}
                      onHover={(percentage) => setHoveredProbability(percentage)}
                      onHoverEnd={() => setHoveredProbability(null)}
                      onInfoClick={() => setShowAboutModal(true)}
                    />
                  </div>

                  {/* Order Book */}
                  <OrderBook tokenId={market.clobTokenIds?.[selectedOutcome]} />
                </div>

                {/* Right Column: Trading Panel */}
                <div className="w-[340px] flex-shrink-0">
                  <div className="sticky top-8 bg-[#1a1f2e] rounded-2xl p-3 space-y-2 border border-gray-800/50 shadow-xl relative">
                    {/* Coming Soon Overlay */}
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm rounded-2xl z-10 flex items-center justify-center">
                      <div className="text-center px-4">
                        <h3 className="text-white text-2xl font-bold mb-2">Coming Soon</h3>
                        <p className="text-gray-400 text-sm">Trading will be available shortly</p>
                      </div>
                    </div>
                    {/* Market Title Header */}
                    <div className="flex items-center gap-2 pb-2 border-b border-gray-700/50">
                      {market.image ? (
                        <div className="relative w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-gradient-to-br from-[#3B82F6] to-[#60A5FA]">
                          <Image
                            src={market.image}
                            alt={market.question || ''}
                            fill
                            className="object-cover"
                          />
                        </div>
                      ) : (
                        <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-gradient-to-br from-[#3B82F6] to-[#60A5FA] flex items-center justify-center text-white font-bold text-base flex-shrink-0">
                          {(market.question || '?').charAt(0).toUpperCase()}
                        </div>
                      )}
                      <h3 className="text-white font-bold text-sm leading-tight line-clamp-2">
                        {market.question}
                      </h3>
                    </div>

                    {/* Buy/Sell Tabs */}
                    <div className="flex gap-0.5 bg-[#1a1f2e] rounded-lg p-0.5">
                      <button
                        onClick={() => setOrderType('buy')}
                        className={`flex-1 py-1.5 font-bold text-sm rounded-md transition-all ${
                          orderType === 'buy'
                            ? 'bg-[#2a3142] text-white'
                            : 'text-gray-400 hover:text-white'
                        }`}
                      >
                        Buy
                      </button>
                      <button
                        onClick={() => setOrderType('sell')}
                        className={`flex-1 py-1.5 font-bold text-sm rounded-md transition-all ${
                          orderType === 'sell'
                            ? 'bg-[#2a3142] text-white'
                            : 'text-gray-400 hover:text-white'
                        }`}
                      >
                        Sell
                      </button>
                    </div>

                    {/* Outcome Selection */}
                    <div className="grid grid-cols-2 gap-1.5">
                      {outcomes.slice(0, 2).map((outcome: string, idx: number) => (
                        <button
                          key={idx}
                          onClick={() => setSelectedOutcome(idx)}
                          className={`py-2 px-2 rounded-lg font-bold transition-all ${
                            selectedOutcome === idx
                              ? idx === 0
                                ? 'bg-emerald-500 text-white'
                                : 'bg-rose-500 text-white'
                              : 'bg-[#2a3142] text-gray-400 hover:bg-[#343d52] hover:text-white'
                          }`}
                        >
                          <div className="text-sm font-semibold opacity-90 mb-0.5">{outcome}</div>
                          <div className="text-base">{Math.round((prices[idx] || 0) * 100)}¢</div>
                        </button>
                      ))}
                    </div>

                    {/* Limit Price */}
                    <div>
                      <label className="text-white text-xs font-bold mb-1 block flex items-center justify-between">
                        <span>Limit Price</span>
                        <button className="text-[10px] text-gray-400 hover:text-white font-medium flex items-center gap-0.5">
                          Limit <span>▼</span>
                        </button>
                      </label>
                      <div className="flex items-center gap-1.5 bg-[#1a1f2e] rounded-lg border border-gray-700/50 px-2 py-1.5">
                        <button
                          onClick={() => {
                            const current = parseFloat(limitPrice) || (currentPrice * 100);
                            setLimitPrice(Math.max(0, current - 0.1).toFixed(1));
                          }}
                          className="w-6 h-6 flex items-center justify-center rounded bg-[#2a3142] hover:bg-[#343d52] text-gray-300 hover:text-white font-bold text-sm transition-colors"
                        >
                          −
                        </button>
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          max="100"
                          value={limitPrice}
                          onChange={(e) => setLimitPrice(e.target.value)}
                          placeholder={(currentPrice * 100).toFixed(1)}
                          className="flex-1 bg-transparent text-white text-center font-bold text-lg focus:outline-none"
                        />
                        <span className="text-gray-400 font-semibold text-[10px]">¢</span>
                        <button
                          onClick={() => {
                            const current = parseFloat(limitPrice) || (currentPrice * 100);
                            setLimitPrice(Math.min(100, current + 0.1).toFixed(1));
                          }}
                          className="w-6 h-6 flex items-center justify-center rounded bg-[#2a3142] hover:bg-[#343d52] text-gray-300 hover:text-white font-bold text-sm transition-colors"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    {/* Shares */}
                    <div>
                      <label className="text-white text-xs font-bold mb-1 block">Shares</label>
                      <div className="space-y-1">
                        <input
                          type="number"
                          step="1"
                          min="0"
                          value={shares}
                          onChange={(e) => setShares(e.target.value)}
                          placeholder="0"
                          className="w-full bg-[#1a1f2e] text-white px-2 py-1.5 rounded-lg border border-gray-700/50 focus:outline-none focus:border-[#3B82F6]/50 font-bold text-center text-2xl transition-colors"
                        />
                        <div className="flex gap-1 justify-end">
                          <button
                            onClick={() => {
                              const current = parseFloat(shares) || 0;
                              setShares(Math.max(0, current - 10).toString());
                            }}
                            className="px-3 py-0.5 bg-[#2a3142] hover:bg-[#343d52] text-gray-300 hover:text-white rounded font-bold text-[10px] transition-colors"
                          >
                            -10
                          </button>
                          <button
                            onClick={() => {
                              const current = parseFloat(shares) || 0;
                              setShares((current + 10).toString());
                            }}
                            className="px-3 py-0.5 bg-[#2a3142] hover:bg-[#343d52] text-gray-300 hover:text-white rounded font-bold text-[10px] transition-colors"
                          >
                            +10
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Set Expiration */}
                    <div className="flex items-center justify-between py-0.5">
                      <span className="text-white text-xs font-bold">Set Expiration</span>
                      <button
                        onClick={() => setExpirationEnabled(!expirationEnabled)}
                        className={`relative w-10 h-5 rounded-full transition-all ${
                          expirationEnabled ? 'bg-gradient-to-r from-[#3B82F6] to-[#60A5FA]' : 'bg-[#2a3142]'
                        }`}
                      >
                        <div
                          className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform shadow-md ${
                            expirationEnabled ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>

                    {/* Summary */}
                    <div className="space-y-1 pt-1.5 border-t border-gray-700/30">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-300 font-semibold text-xs">Total</span>
                        <span className="text-white font-bold text-base tabular-nums">${total.toFixed(0)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-300 font-semibold text-xs">To Win</span>
                        <span className="text-emerald-400 font-bold text-base tabular-nums">${potentialReturn.toFixed(0)}</span>
                      </div>
                    </div>

                    {/* Trade Button */}
                    <button
                      disabled={!shares || parseFloat(shares) <= 0}
                      className="w-full py-2.5 bg-gradient-to-r from-[#4A9DFF] to-[#3b82f6] hover:from-[#3d8ae6] hover:to-[#2563eb] disabled:from-[#2a3142] disabled:to-[#2a3142] disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-lg transition-all text-xs shadow-lg"
                    >
                      Trade
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
          </div>
        </div>
      </div>
      </div>

      {/* About Modal */}
      {showAboutModal && (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowAboutModal(false)}>
        <div className="bg-[#12141a] rounded-2xl border border-gray-800/50 max-w-2xl w-full max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
          <div className="sticky top-0 bg-[#12141a] border-b border-gray-800/50 px-6 py-4 flex items-center justify-between">
            <h2 className="text-white font-bold text-xl">About this market</h2>
            <button
              onClick={() => setShowAboutModal(false)}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="px-6 py-6">
            {market.description && (
              <p className="text-gray-400 text-base leading-relaxed whitespace-pre-wrap">
                {market.description}
              </p>
            )}
            {market.endDate && (
              <div className="mt-6 pt-6 border-t border-gray-800/50">
                <span className="text-sm text-gray-500 font-semibold">Closes:</span>
                <span className="text-sm text-white ml-3 font-medium">
                  {new Date(market.endDate).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
      )}
    </>
  );
}
