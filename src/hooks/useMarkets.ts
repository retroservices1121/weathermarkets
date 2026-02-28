import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api';
import type { PolymarketMarket, GetMarketsOptions } from '@/types';

export function useMarkets(options: GetMarketsOptions = {}) {
  const [markets, setMarkets] = useState<PolymarketMarket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function fetchMarkets() {
      try {
        setLoading(true);
        setError(null);
        const data = await apiClient.getMarkets(options);
        if (isMounted) {
          setMarkets(data);
        }
      } catch (err) {
        if (isMounted) {
          setError(err as Error);
          console.error('Failed to fetch markets:', err);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchMarkets();

    return () => {
      isMounted = false;
    };
  }, [JSON.stringify(options)]);

  return { markets, loading, error };
}

export function useTrendingMarkets(limit: number = 20) {
  const [markets, setMarkets] = useState<PolymarketMarket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function fetchTrendingMarkets() {
      try {
        setLoading(true);
        setError(null);
        const data = await apiClient.getTrendingMarkets(limit);
        if (isMounted) {
          setMarkets(data);
        }
      } catch (err) {
        if (isMounted) {
          setError(err as Error);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchTrendingMarkets();

    return () => {
      isMounted = false;
    };
  }, [limit]);

  return { markets, loading, error };
}

export function useFeaturedMarkets(limit: number = 20) {
  const [markets, setMarkets] = useState<PolymarketMarket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function fetchFeaturedMarkets() {
      try {
        setLoading(true);
        setError(null);
        const data = await apiClient.getFeaturedMarkets(limit);
        if (isMounted) {
          setMarkets(data);
        }
      } catch (err) {
        if (isMounted) {
          setError(err as Error);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchFeaturedMarkets();

    return () => {
      isMounted = false;
    };
  }, [limit]);

  return { markets, loading, error };
}
