'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useOrderBook, type OrderBookLevel } from '@/hooks/useOrderBook';

interface OrderBookProps {
  tokenId?: string;
}

// Custom scrollbar styles
const scrollbarStyles = `
  .order-book-scroll::-webkit-scrollbar {
    width: 6px;
  }
  .order-book-scroll::-webkit-scrollbar-track {
    background: transparent;
  }
  .order-book-scroll::-webkit-scrollbar-thumb {
    background: #374151;
    border-radius: 3px;
  }
  .order-book-scroll::-webkit-scrollbar-thumb:hover {
    background: #4B5563;
  }
  .order-book-scroll {
    scrollbar-width: thin;
    scrollbar-color: #374151 transparent;
  }
`;

export function OrderBook({ tokenId }: OrderBookProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { orderBook, loading, error } = useOrderBook(tokenId);

  if (!tokenId) {
    return null;
  }

  const renderOrderLevel = (level: OrderBookLevel, type: 'bid' | 'ask', index: number) => {
    const price = parseFloat(level.price);
    const size = parseFloat(level.size);
    const total = price * size;

    return (
      <div
        key={`${type}-${index}`}
        className="flex items-center justify-between py-1.5 px-3 hover:bg-[#1a1d26] transition-colors text-xs"
      >
        <span className={`font-mono tabular-nums ${type === 'bid' ? 'text-emerald-400' : 'text-rose-400'}`}>
          {price.toFixed(2)}¢
        </span>
        <span className="text-gray-400 font-mono tabular-nums">
          {size.toLocaleString()}
        </span>
        <span className="text-gray-500 font-mono tabular-nums">
          ${total.toFixed(0)}
        </span>
      </div>
    );
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: scrollbarStyles }} />
      <div className="bg-[#12141a] rounded-2xl border border-gray-800/30 overflow-hidden">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-[#1a1d26] transition-colors"
        >
        <div className="flex items-center gap-2">
          <h3 className="text-white font-bold text-base">Order Book</h3>
          <button className="w-4 h-4 rounded-full border border-gray-600 flex items-center justify-center text-gray-400 hover:text-white text-[10px]">
            ?
          </button>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-5 h-5 text-gray-400" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-400" />
        )}
      </button>

      {isExpanded && (
        <div className="border-t border-gray-800/50">
          {loading && (
            <div className="px-4 py-8 text-center text-gray-500 text-sm">
              Loading order book...
            </div>
          )}

          {error && (
            <div className="px-4 py-8 text-center text-gray-500 text-sm">
              Failed to load order book
            </div>
          )}

          {orderBook && !loading && !error && (
            <div className="max-h-96 overflow-y-auto order-book-scroll">
              {/* Header */}
              <div className="flex items-center justify-between px-3 py-2 bg-[#0f1117] text-gray-500 text-[10px] font-semibold uppercase sticky top-0">
                <span>Price</span>
                <span>Size</span>
                <span>Total</span>
              </div>

              {/* Asks (Sell Orders) - Reversed to show lowest first */}
              <div className="border-b border-gray-800/50">
                {orderBook.asks.slice(0, 10).reverse().map((ask, idx) =>
                  renderOrderLevel(ask, 'ask', idx)
                )}
              </div>

              {/* Bids (Buy Orders) */}
              <div>
                {orderBook.bids.slice(0, 10).map((bid, idx) =>
                  renderOrderLevel(bid, 'bid', idx)
                )}
              </div>

              {(orderBook.asks.length === 0 && orderBook.bids.length === 0) && (
                <div className="px-4 py-8 text-center text-gray-500 text-sm">
                  No orders available
                </div>
              )}
            </div>
          )}
        </div>
      )}
      </div>
    </>
  );
}
