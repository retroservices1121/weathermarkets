import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api';

export interface OrderBookLevel {
  price: string;
  size: string;
}

export interface OrderBook {
  bids: OrderBookLevel[];
  asks: OrderBookLevel[];
  timestamp: string;
}

export function useOrderBook(tokenId: string | undefined) {
  const [orderBook, setOrderBook] = useState<OrderBook | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!tokenId) {
      setLoading(false);
      return;
    }

    const fetchOrderBook = async () => {
      try {
        setLoading(true);
        const data = await apiClient.getOrderBookByTokenId(tokenId);

        setOrderBook({
          bids: data.bids || [],
          asks: data.asks || [],
          timestamp: data.timestamp || Date.now().toString()
        });
        setError(null);
      } catch (err) {
        console.error('Error fetching order book:', err);
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrderBook();

    // Refresh every 5 seconds
    const interval = setInterval(fetchOrderBook, 5000);

    return () => clearInterval(interval);
  }, [tokenId]);

  return { orderBook, loading, error };
}
