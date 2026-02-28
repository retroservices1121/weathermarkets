import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api';
import type { PolymarketMarket, PricePoint } from '@/types';

export function useMarketDetails(marketSlug: string | null) {
  const [market, setMarket] = useState<PolymarketMarket | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!marketSlug) {
      setMarket(null);
      setLoading(false);
      return;
    }

    let isMounted = true;

    async function fetchMarket() {
      if (!marketSlug) return;

      try {
        setLoading(true);
        setError(null);
        const data = await apiClient.getMarket(marketSlug);
        if (isMounted) {
          setMarket(data);
        }
      } catch (err) {
        if (isMounted) {
          setError(err as Error);
          console.error('Failed to fetch market:', err);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchMarket();

    return () => {
      isMounted = false;
    };
  }, [marketSlug]);

  return { market, loading, error };
}

export function usePriceHistory(
  marketSlug: string | null,
  outcome: 'YES' | 'NO' = 'YES',
  interval: '1m' | '1h' | '6h' | '1d' | '1w' | 'max' = '1h'
) {
  const [priceHistory, setPriceHistory] = useState<PricePoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!marketSlug) {
      setPriceHistory([]);
      setLoading(false);
      return;
    }

    let isMounted = true;
    let intervalId: NodeJS.Timeout | null = null;

    async function fetchPriceHistory() {
      if (!marketSlug) return;

      try {
        setLoading(true);
        setError(null);
        const data = await apiClient.getPriceHistory(marketSlug, outcome, interval);
        if (isMounted) {
          setPriceHistory(data);
        }
      } catch (err) {
        if (isMounted) {
          setError(err as Error);
          console.error('Failed to fetch price history:', err);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    // Initial fetch
    fetchPriceHistory();

    // Refresh every 15 seconds for real-time updates
    intervalId = setInterval(fetchPriceHistory, 15000);

    return () => {
      isMounted = false;
      if (intervalId) clearInterval(intervalId);
    };
  }, [marketSlug, outcome, interval]);

  return { priceHistory, loading, error };
}
