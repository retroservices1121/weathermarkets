import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api';
import type { Trade, OrderBook } from '@/types';

export function useEventActivity(eventSlug: string | null) {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [orderBook, setOrderBook] = useState<OrderBook | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!eventSlug) {
      setTrades([]);
      setOrderBook(null);
      setLoading(false);
      return;
    }

    let isMounted = true;
    let intervalId: NodeJS.Timeout | null = null;

    async function fetchActivityData() {
      if (!eventSlug) return;

      try {
        setLoading(true);
        setError(null);

        // Fetch trades and order book in parallel
        const [tradesData, orderBookData] = await Promise.all([
          apiClient.getEventActivity(eventSlug, 50),
          apiClient.getEventOrderBook(eventSlug),
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

    // Initial fetch
    fetchActivityData();

    // Refresh every 10 seconds for real-time updates
    intervalId = setInterval(fetchActivityData, 10000);

    return () => {
      isMounted = false;
      if (intervalId) clearInterval(intervalId);
    };
  }, [eventSlug]);

  return { trades, orderBook, loading, error };
}
