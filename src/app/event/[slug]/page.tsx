'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, Share2, Bookmark, TrendingUp, TrendingDown, Clock, Info, Loader2 } from 'lucide-react';
import { usePrivy } from '@privy-io/react-auth';
import { useEventDetails } from '@/hooks/useEventDetails';
import { useEventPriceHistory } from '@/hooks/useEventPriceHistory';
import { useEventActivity } from '@/hooks/useEventActivity';
import { useTradingSession } from '@/hooks/useTradingSession';
import { useTradeExecution, calculatePlatformFee } from '@/hooks/useTradeExecution';
import { EventPriceChart } from '@/components/trade/EventPriceChart';
import { OrderBook } from '@/components/trade/OrderBook';
import { TrendingBar } from '@/components/layout/TrendingBar';
import { AnimatedNumber } from '@/components/ui/AnimatedNumber';
import { SportsMarketsSections } from '@/components/events/SportsMarketsSections';
import { formatVolume, parseOutcomePrices, isSportsMatch } from '@/lib/utils';
import { FEE_RATE } from '@/lib/constants';
import type { MarketCategory } from '@/types';

interface EventPageProps {
  params: { slug: string };
}

export default function EventPage({ params }: EventPageProps) {
  const { slug } = params;
  const { event, loading, error } = useEventDetails(slug);
  const { trades, orderBook, loading: activityLoading } = useEventActivity(slug);
  const [selectedMarketId, setSelectedMarketId] = useState<string | null>(null);
  const [timeInterval, setTimeInterval] = useState<'1h' | '1d' | '1w' | 'max'>('1d');
  const [orderType, setOrderType] = useState<'buy' | 'sell'>('buy');
  const [outcome, setOutcome] = useState<'YES' | 'NO'>('YES');
  const [limitPrice, setLimitPrice] = useState('');
  const [shares, setShares] = useState('');
  const [expirationEnabled, setExpirationEnabled] = useState(false);
  const [activeTab, setActiveTab] = useState<'markets' | 'activity' | 'about'>('markets');
  const [activeCategory, setActiveCategory] = useState<MarketCategory>('All');
  const [hoveredProbability, setHoveredProbability] = useState<number | null>(null);
  const [showAboutModal, setShowAboutModal] = useState(false);

  // Trading integration
  let authenticated = false;
  let privyLogin: (() => void) | undefined;
  try {
    const privy = usePrivy();
    authenticated = privy.authenticated;
    privyLogin = privy.login;
  } catch {
    // Privy not available
  }
  const { isReady: tradingReady, isInitializing, clobClient, error: tradingError, initialize: initTrading } = useTradingSession();
  const { execute: executeTrade, isSubmitting } = useTradeExecution(clobClient);

  // Auto-initialize trading session when authenticated
  useEffect(() => {
    if (authenticated && !tradingReady && !isInitializing) {
      initTrading();
    }
  }, [authenticated, tradingReady, isInitializing, initTrading]);

  // Fetch price history for all markets
  const { priceData } = useEventPriceHistory(event, timeInterval);

  // Get the leading market for the chart
  const leadingMarket = event?.markets?.length
    ? [...event.markets].sort((a, b) => {
        const pricesA = parseOutcomePrices(a.outcomePrices);
        const pricesB = parseOutcomePrices(b.outcomePrices);
        return (pricesB[0] || 0) - (pricesA[0] || 0);
      })[0]
    : null;

  // Set selected market to leading market if not set
  const selectedMarket = selectedMarketId
    ? event?.markets?.find(m => m.id === selectedMarketId)
    : leadingMarket;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0b0f]">
        <div className="text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#3B82F6] border-t-transparent mx-auto mb-4" />
          <p className="text-gray-400 font-medium">Loading event...</p>
        </div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0b0f]">
        <div className="text-center">
          <p className="text-rose-400 mb-4 font-semibold">Failed to load event</p>
          <Link href="/" className="text-[#3B82F6] hover:text-[#1D4ED8] font-medium transition-colors">
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  // Sort markets by price (highest first)
  const sortedMarkets = [...(event.markets || [])].sort((a, b) => {
    const pricesA = parseOutcomePrices(a.outcomePrices);
    const pricesB = parseOutcomePrices(b.outcomePrices);
    const priceA = pricesA[0] || 0;
    const priceB = pricesB[0] || 0;
    return priceB - priceA;
  });

  const leadingProbability = sortedMarkets[0] ? (parseOutcomePrices(sortedMarkets[0].outcomePrices)[0] || 0) * 100 : 0;

  // Check if any market is live
  const hasLiveMarkets = event.markets?.some(m => m.active && !m.closed) || false;
  const allMarketsClosed = event.markets?.every(m => m.closed) || false;

  // Calculate trading values
  const selectedMarketPrices = selectedMarket ? parseOutcomePrices(selectedMarket.outcomePrices) : [];
  const currentPrice = outcome === 'YES'
    ? (selectedMarketPrices[0] || 0)
    : (selectedMarketPrices[1] || 1 - (selectedMarketPrices[0] || 0));

  const avgPrice = limitPrice ? (parseFloat(limitPrice) / 100) : currentPrice;
  const sharesNum = parseFloat(shares) || 0;
  const subtotal = orderType === 'buy' ? (avgPrice * sharesNum) : 0;
  const platformFee = subtotal * FEE_RATE;
  const total = subtotal + platformFee;
  const potentialReturn = orderType === 'buy' ? (sharesNum - subtotal) : (sharesNum * avgPrice);

  const handleTrade = async () => {
    if (!selectedMarket || !sharesNum) return;

    const tokenIdx = outcome === 'YES' ? 0 : 1;
    const tokenId = selectedMarket.clobTokenIds?.[tokenIdx];
    if (!tokenId) return;

    await executeTrade({
      tokenId,
      side: orderType === 'buy' ? 'BUY' : 'SELL',
      price: avgPrice,
      size: sharesNum,
      negRisk: selectedMarket.negRisk,
    });
  };

  return (
    <>
      <div className="min-h-screen bg-[#0a0b0f]">
        {/* Trending Bar */}
        <TrendingBar
          activeCategory={activeCategory}
          onCategoryChange={setActiveCategory}
          showSearchBar={false}
        />

        <div className="max-w-[1600px] mx-auto px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-5">
              {event.image && (
                <div className="relative w-20 h-20 rounded-2xl overflow-hidden flex-shrink-0 bg-white/5 backdrop-blur-sm border border-gray-800/50">
                  <Image
                    src={event.image}
                    alt={event.title}
                    fill
                    className="object-contain p-3"
                  />
                </div>
              )}
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
                  {event.title}
                </h1>
                <div className="flex items-center gap-3">
                  {hasLiveMarkets && (
                    <span className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/15 text-red-400 rounded-lg text-sm font-semibold border border-red-500/30">
                      <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                      LIVE
                    </span>
                  )}
                  {allMarketsClosed && (
                    <span className="px-3 py-1.5 bg-gray-500/15 text-gray-400 rounded-lg text-sm font-semibold border border-gray-500/30">
                      CLOSED
                    </span>
                  )}
                  {!hasLiveMarkets && !allMarketsClosed && (
                    <span className="px-3 py-1.5 bg-blue-500/15 text-blue-400 rounded-lg text-sm font-semibold border border-blue-500/30">
                      ACTIVE
                    </span>
                  )}
                  <span className="text-gray-500 text-sm font-medium">
                    {event.markets?.length || 0} {event.markets?.length === 1 ? 'Market' : 'Markets'}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button className="p-3 hover:bg-white/5 rounded-xl transition-all duration-200 border border-transparent hover:border-gray-800/50">
                <Share2 className="w-5 h-5 text-gray-400 hover:text-gray-300 transition-colors" />
              </button>
              <button className="p-3 hover:bg-white/5 rounded-xl transition-all duration-200 border border-transparent hover:border-gray-800/50">
                <Bookmark className="w-5 h-5 text-gray-400 hover:text-gray-300 transition-colors" />
              </button>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mb-8 border-b border-gray-800/50">
          <div className="flex gap-8">
            <button
              onClick={() => setActiveTab('markets')}
              className={`pb-4 px-2 font-semibold transition-all duration-200 border-b-2 ${
                activeTab === 'markets'
                  ? 'text-white border-[#3B82F6]'
                  : 'text-gray-500 border-transparent hover:text-gray-300'
              }`}
            >
              Markets
            </button>
            <button
              onClick={() => setActiveTab('activity')}
              className={`pb-4 px-2 font-semibold transition-all duration-200 border-b-2 ${
                activeTab === 'activity'
                  ? 'text-white border-[#3B82F6]'
                  : 'text-gray-500 border-transparent hover:text-gray-300'
              }`}
            >
              Activity
            </button>
            <button
              onClick={() => setActiveTab('about')}
              className={`pb-4 px-2 font-semibold transition-all duration-200 border-b-2 ${
                activeTab === 'about'
                  ? 'text-white border-[#3B82F6]'
                  : 'text-gray-500 border-transparent hover:text-gray-300'
              }`}
            >
              About
            </button>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Chart & Outcomes */}
          <div className="lg:col-span-2 space-y-6">
            {/* Markets Tab Content */}
            {activeTab === 'markets' && (
              <>
                {/* Event Chart */}
                <div className="bg-[#12141a] rounded-2xl p-4 border border-gray-800/30">
                  {event && event.markets && (
                    <EventPriceChart
                      markets={event.markets.filter(m => priceData[m.id])}
                      data={priceData}
                      timeInterval={timeInterval}
                      onTimeIntervalChange={setTimeInterval}
                      onInfoClick={() => setShowAboutModal(true)}
                    />
                  )}
                </div>

                {/* Sports Markets Sections (if it's a sports event) */}
                {event && isSportsMatch(event) && (
                  <SportsMarketsSections
                    markets={event.markets || []}
                    eventTitle={event.title}
                  />
                )}

                {/* Order Book */}
                <OrderBook tokenId={selectedMarket?.clobTokenIds?.[outcome === 'YES' ? 0 : 1]} />

                {/* Outcomes List */}
                <div className="space-y-4">
                  {sortedMarkets.map((market) => {
                    const prices = parseOutcomePrices(market.outcomePrices);
                    const probability = (prices[0] || 0) * 100;
                    const isSelected = selectedMarket?.id === market.id;
                    const isLive = market.active && !market.closed;
                    const isClosed = market.closed;

                    return (
                      <div
                        key={market.id}
                        onClick={() => {
                          setSelectedMarketId(market.id);
                          setOutcome('YES');
                        }}
                        className={`bg-[#12141a] rounded-2xl p-5 transition-all duration-200 cursor-pointer border ${
                          isSelected
                            ? 'border-[#3B82F6] shadow-lg shadow-[#3B82F6]/10'
                            : 'border-[#3B82F6]/20 hover:border-[#3B82F6]/40 hover:shadow-md'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          {/* Left: Outcome info */}
                          <div className="flex items-center gap-5 flex-1">
                            {market.image && (
                              <div className="relative w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 bg-white/5 border border-gray-800/50">
                                <Image
                                  src={market.image}
                                  alt={market.groupItemTitle || market.question}
                                  fill
                                  className="object-cover"
                                />
                              </div>
                            )}
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h3 className="text-white font-semibold text-lg">
                                  {market.groupItemTitle || market.question}
                                </h3>
                                {isLive && (
                                  <span className="flex items-center gap-1 px-2 py-0.5 bg-red-500/15 text-red-400 rounded text-xs font-semibold border border-red-500/30">
                                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
                                    LIVE
                                  </span>
                                )}
                                {isClosed && (
                                  <span className="px-2 py-0.5 bg-gray-500/15 text-gray-400 rounded text-xs font-semibold border border-gray-500/30">
                                    CLOSED
                                  </span>
                                )}
                              </div>
                              <p className="text-gray-500 text-sm font-medium">
                                {formatVolume(typeof market.volume === 'string' ? parseFloat(market.volume) : (market.volume || 0))} Vol.
                              </p>
                            </div>
                          </div>

                          {/* Center: Probability */}
                          <div className="text-center px-8">
                            <div className="text-4xl font-bold text-white tabular-nums">
                              {probability < 1 ? '<1' : probability.toFixed(0)}%
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            {/* Activity Tab Content */}
            {activeTab === 'activity' && (
              <div className="space-y-6">
                {/* Order Book */}
                {orderBook && (
                  <div className="bg-[#12141a] rounded-2xl p-7 border border-gray-800/30 shadow-lg">
                    <h3 className="text-white font-bold text-xl mb-6">Order Book</h3>
                    <div className="grid grid-cols-2 gap-6">
                      {/* Bids (Buy Orders) */}
                      <div>
                        <h4 className="text-emerald-400 font-semibold text-sm mb-3 uppercase tracking-wide">Bids (Buy)</h4>
                        <div className="space-y-2">
                          {orderBook.bids && orderBook.bids.length > 0 ? (
                            orderBook.bids.slice(0, 10).map((bid, idx) => (
                              <div key={idx} className="flex justify-between items-center text-sm">
                                <span className="text-emerald-400 font-semibold tabular-nums">
                                  {(parseFloat(bid.price) * 100).toFixed(2)}¢
                                </span>
                                <span className="text-gray-400 tabular-nums">
                                  {parseFloat(bid.size).toLocaleString()}
                                </span>
                              </div>
                            ))
                          ) : (
                            <p className="text-gray-500 text-sm">No buy orders</p>
                          )}
                        </div>
                      </div>

                      {/* Asks (Sell Orders) */}
                      <div>
                        <h4 className="text-rose-400 font-semibold text-sm mb-3 uppercase tracking-wide">Asks (Sell)</h4>
                        <div className="space-y-2">
                          {orderBook.asks && orderBook.asks.length > 0 ? (
                            orderBook.asks.slice(0, 10).map((ask, idx) => (
                              <div key={idx} className="flex justify-between items-center text-sm">
                                <span className="text-rose-400 font-semibold tabular-nums">
                                  {(parseFloat(ask.price) * 100).toFixed(2)}¢
                                </span>
                                <span className="text-gray-400 tabular-nums">
                                  {parseFloat(ask.size).toLocaleString()}
                                </span>
                              </div>
                            ))
                          ) : (
                            <p className="text-gray-500 text-sm">No sell orders</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Recent Trades */}
                <div className="bg-[#12141a] rounded-2xl p-7 border border-gray-800/30 shadow-lg">
                  <h3 className="text-white font-bold text-xl mb-6">Recent Trades</h3>
                  {activityLoading ? (
                    <div className="text-center py-12">
                      <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#3B82F6] border-t-transparent mx-auto" />
                      <p className="text-gray-400 font-medium mt-4">Loading trades...</p>
                    </div>
                  ) : trades && trades.length > 0 ? (
                    <div className="space-y-3">
                      {trades.map((trade, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-4 bg-black/20 rounded-xl border border-gray-800/30 hover:border-gray-700/50 transition-colors"
                        >
                          <div className="flex items-center gap-4">
                            {trade.side === 'BUY' ? (
                              <TrendingUp className="w-5 h-5 text-emerald-400" />
                            ) : (
                              <TrendingDown className="w-5 h-5 text-rose-400" />
                            )}
                            <div>
                              <p className={`font-semibold ${trade.side === 'BUY' ? 'text-emerald-400' : 'text-rose-400'}`}>
                                {trade.side}
                              </p>
                              <p className="text-gray-500 text-xs">
                                {new Date(Number(trade.timestamp) * 1000).toLocaleTimeString()}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-white font-semibold tabular-nums">
                              {(trade.price * 100).toFixed(2)}¢
                            </p>
                            <p className="text-gray-400 text-sm tabular-nums">
                              {trade.size.toLocaleString()} shares
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <p className="text-gray-500 font-medium">No recent trades</p>
                      <p className="text-gray-600 text-sm mt-2">Trading activity will appear here</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* About Tab Content */}
            {activeTab === 'about' && (
              <div className="space-y-6">
                <div className="bg-[#12141a] rounded-2xl p-7 border border-gray-800/30 shadow-lg">
                  <h3 className="text-white font-bold text-xl mb-4">About this event</h3>
                  <p className="text-gray-400 text-base leading-relaxed">
                    {event.description || event.title}
                  </p>
                </div>

                {/* Event Details */}
                <div className="bg-[#12141a] rounded-2xl p-7 border border-gray-800/30 shadow-lg">
                  <h3 className="text-white font-bold text-xl mb-5">Event Details</h3>
                  <div className="space-y-4">
                    <div>
                      <span className="text-sm text-gray-500 font-semibold block mb-1">Total Volume</span>
                      <span className="text-base text-white font-bold">
                        {formatVolume(event.volume || 0)}
                      </span>
                    </div>
                    {event.markets && (
                      <div>
                        <span className="text-sm text-gray-500 font-semibold block mb-1">Number of Markets</span>
                        <span className="text-base text-white font-bold">
                          {event.markets.length}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Trading Panel (Sticky) */}
          <div className="lg:col-span-1">
            <div className="sticky top-8 bg-[#1a1f2e] rounded-2xl p-3 space-y-2 border border-gray-800/50 shadow-xl relative">
              {/* Wallet Connection Overlay */}
              {!authenticated && (
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm rounded-2xl z-10 flex items-center justify-center">
                  <div className="text-center px-4">
                    <h3 className="text-white text-xl font-bold mb-2">Connect to Trade</h3>
                    <p className="text-gray-400 text-sm mb-4">Connect your wallet to start trading</p>
                    <button
                      onClick={() => privyLogin?.()}
                      className="px-6 py-2.5 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg transition-colors"
                    >
                      Connect Wallet
                    </button>
                  </div>
                </div>
              )}
              {/* Selected Candidate/Outcome Header */}
              {selectedMarket && (
                <div className="flex items-center gap-2 pb-2 border-b border-gray-700/50">
                  {selectedMarket.image ? (
                    <div className="relative w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-gradient-to-br from-[#3B82F6] to-[#60A5FA]">
                      <Image
                        src={selectedMarket.image}
                        alt={selectedMarket.groupItemTitle || selectedMarket.question || ''}
                        fill
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#3B82F6] to-[#60A5FA] flex items-center justify-center text-white font-bold text-base flex-shrink-0">
                      {(selectedMarket.groupItemTitle || selectedMarket.question || '?').charAt(0).toUpperCase()}
                    </div>
                  )}
                  <h3 className="text-white font-bold text-sm leading-tight line-clamp-2">
                    {selectedMarket.groupItemTitle || selectedMarket.question}
                  </h3>
                </div>
              )}

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

              {/* Outcome Selection (Yes/No) */}
              <div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setOutcome('YES')}
                    className={`py-2 px-4 rounded-lg font-bold text-sm transition-all duration-200 ${
                      outcome === 'YES'
                        ? 'bg-emerald-500 text-white'
                        : 'bg-gray-800/50 text-gray-400 hover:bg-gray-800'
                    }`}
                  >
                    Yes {selectedMarket && ((parseOutcomePrices(selectedMarket.outcomePrices)[0] || 0) * 100).toFixed(1)}¢
                  </button>
                  <button
                    onClick={() => setOutcome('NO')}
                    className={`py-2 px-4 rounded-lg font-bold text-sm transition-all duration-200 ${
                      outcome === 'NO'
                        ? 'bg-rose-500 text-white'
                        : 'bg-gray-800/50 text-gray-400 hover:bg-gray-800'
                    }`}
                  >
                    No {selectedMarket && ((parseOutcomePrices(selectedMarket.outcomePrices)[1] || (1 - (parseOutcomePrices(selectedMarket.outcomePrices)[0] || 0))) * 100).toFixed(1)}¢
                  </button>
                </div>
              </div>

              {/* Limit Price */}
              <div>
                <label className="text-white text-xs font-bold mb-1 block flex items-center justify-between">
                  <span>Limit Price</span>
                  <button className="text-[10px] text-gray-400 hover:text-white font-normal">
                    Limit ▼
                  </button>
                </label>
                <div className="flex items-center gap-2 bg-[#12141a] rounded-lg border border-[#3B82F6]/20 px-3 py-1.5">
                  <button
                    onClick={() => {
                      const current = parseFloat(limitPrice) || (currentPrice * 100);
                      setLimitPrice(Math.max(0, current - 0.1).toFixed(1));
                    }}
                    className="text-gray-400 hover:text-white font-bold text-lg"
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
                  <span className="text-gray-500 font-bold text-[10px]">¢</span>
                  <button
                    onClick={() => {
                      const current = parseFloat(limitPrice) || (currentPrice * 100);
                      setLimitPrice(Math.min(100, current + 0.1).toFixed(1));
                    }}
                    className="text-gray-400 hover:text-white font-bold text-lg"
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
                    className="w-full bg-[#12141a] text-white px-4 py-1.5 rounded-lg border border-[#3B82F6]/20 focus:outline-none focus:border-[#3B82F6]/50 font-bold text-center text-2xl"
                  />
                  <div className="flex gap-2 justify-end">
                    <button
                      onClick={() => {
                        const current = parseFloat(shares) || 0;
                        setShares(Math.max(0, current - 10).toString());
                      }}
                      className="px-4 py-0.5 bg-gray-800/50 hover:bg-gray-800 text-gray-400 hover:text-white rounded font-bold text-[10px] transition-colors"
                    >
                      -10
                    </button>
                    <button
                      onClick={() => {
                        const current = parseFloat(shares) || 0;
                        setShares((current + 10).toString());
                      }}
                      className="px-4 py-0.5 bg-gray-800/50 hover:bg-gray-800 text-gray-400 hover:text-white rounded font-bold text-[10px] transition-colors"
                    >
                      +10
                    </button>
                  </div>
                </div>
              </div>

              {/* Set Expiration Toggle */}
              <div className="flex items-center justify-between py-0.5">
                <span className="text-white text-xs font-bold">Set Expiration</span>
                <button
                  onClick={() => setExpirationEnabled(!expirationEnabled)}
                  className={`relative w-10 h-5 rounded-full transition-all duration-200 ${
                    expirationEnabled ? 'bg-[#3B82F6]' : 'bg-gray-700'
                  }`}
                >
                  <div
                    className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform duration-200 shadow-md ${
                      expirationEnabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Summary */}
              <div className="space-y-1 pt-1.5 border-t border-gray-800/30">
                {orderType === 'buy' && (
                  <>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300 font-semibold text-xs">Subtotal</span>
                      <span className="text-white font-bold text-base tabular-nums">${subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400 font-semibold text-xs">Platform Fee (0.50%)</span>
                      <span className="text-gray-400 font-semibold text-xs tabular-nums">${platformFee.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center pt-1 border-t border-gray-800/20">
                      <span className="text-gray-300 font-semibold text-xs">Total</span>
                      <span className="text-white font-bold text-base tabular-nums">${total.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300 font-semibold text-xs">To Win</span>
                      <span className="text-emerald-400 font-bold text-base tabular-nums">${potentialReturn.toFixed(2)}</span>
                    </div>
                  </>
                )}
                {orderType === 'sell' && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300 font-semibold text-xs">You&apos;ll Receive</span>
                    <span className="text-white font-bold text-base tabular-nums">${potentialReturn.toFixed(2)}</span>
                  </div>
                )}
              </div>

              {/* Trade Button */}
              <button
                onClick={handleTrade}
                disabled={!shares || parseFloat(shares) <= 0 || isSubmitting || (authenticated && !tradingReady)}
                className="w-full py-2.5 bg-gradient-to-r from-[#4A9DFF] to-[#3b82f6] hover:from-[#3d8ae6] hover:to-[#2563eb] disabled:from-[#2a3142] disabled:to-[#2a3142] disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-lg transition-all shadow-lg text-xs"
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Submitting...
                  </span>
                ) : isInitializing ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Initializing...
                  </span>
                ) : (
                  'Trade'
                )}
              </button>
              {tradingError && (
                <p className="text-xs text-rose-400 text-center">{tradingError}</p>
              )}

              {/* Terms */}
              <p className="text-xs text-gray-500 text-center font-normal leading-relaxed">
                By trading, you agree to the <span className="underline cursor-pointer hover:text-gray-400">Terms of Use</span>.
              </p>
            </div>
          </div>
        </div>
      </div>
      </div>

      {/* About Modal */}
      {showAboutModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowAboutModal(false)}>
          <div className="bg-[#12141a] rounded-2xl border border-gray-800/50 max-w-2xl w-full max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-[#12141a] border-b border-gray-800/50 px-6 py-4 flex items-center justify-between">
              <h2 className="text-white font-bold text-xl">About this event</h2>
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
              {event.description && (
                <p className="text-gray-400 text-base leading-relaxed whitespace-pre-wrap">
                  {event.description}
                </p>
              )}
              {event.endDate && (
                <div className="mt-6 pt-6 border-t border-gray-800/50">
                  <span className="text-sm text-gray-500 font-semibold">Closes:</span>
                  <span className="text-sm text-white ml-3 font-medium">
                    {new Date(event.endDate).toLocaleDateString('en-US', {
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
