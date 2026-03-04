'use client';

import { useState, useEffect, useCallback } from 'react';

export interface WeatherMarket {
  id: string;
  question: string;
  description: string;
  slug: string;
  volume: number;
  endDate: string;
  image: string;
  tokenIds: { yes: string; no: string };
  currentPrice: number;
  location: { city: string; lat: number; lon: number } | null;
  conditionId: string;
}

export function useWeatherMarkets() {
  const [markets, setMarkets] = useState<WeatherMarket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMarkets = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/storm/markets');
      if (!res.ok) throw new Error('Failed to fetch weather markets');
      const json = await res.json();
      setMarkets(json.markets || []);
    } catch (err: any) {
      setError(err.message);
      setMarkets([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMarkets();
    // Refresh every 5 minutes
    const interval = setInterval(fetchMarkets, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchMarkets]);

  return { markets, loading, error, refetch: fetchMarkets };
}
