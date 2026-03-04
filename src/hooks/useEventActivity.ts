import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api';
import type { PolymarketEvent, Trade, OrderBook } from '@/types';

export function useEventActivity(event: PolymarketEvent | null) {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [orderBook, setOrderBook] = useState<OrderBook | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!event?.markets?.length) {
      setTrades([]);
      setOrderBook(null);
      setLoading(false);
      return;
    }

    let isMounted = true;
    let intervalId: NodeJS.Timeout | null = null;
    const markets = event.markets;

    async function fetchActivityData() {
      try {
        if (!isMounted) return;
        setError(null);

        const [tradesData, orderBookData] = await Promise.all([
          apiClient.getTradesForMarkets(markets, 50),
          apiClient.getOrderBookForMarkets(markets),
        ]);

        if (isMounted) {
          setTrades(tradesData);
          setOrderBook(orderBookData);
        }
      } catch (err) {
        if (isMounted) {
          setError(err as Error);
          console.error('Failed to fetch event activity:', err);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchActivityData();

    // Refresh every 30 seconds
    intervalId = setInterval(fetchActivityData, 30000);

    return () => {
      isMounted = false;
      if (intervalId) clearInterval(intervalId);
    };
  }, [event?.id]);

  return { trades, orderBook, loading, error };
}
