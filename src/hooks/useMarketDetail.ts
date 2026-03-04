'use client';

import { useState, useEffect, useCallback } from 'react';

export interface OrderBookLevel {
  price: number;
  size: number;
}

export interface TradeRecord {
  id: string;
  price: number;
  size: number;
  side: 'BUY' | 'SELL';
  timestamp: string;
}

export interface PricePoint {
  time: number;
  value: number;
}

export interface MarketDetail {
  id: string;
  question: string;
  description: string;
  slug: string;
  volume: number;
  endDate: string;
  image: string;
  yesPrice: number;
  noPrice: number;
  spread: number;
  bids: OrderBookLevel[];
  asks: OrderBookLevel[];
  trades: TradeRecord[];
  priceHistory: PricePoint[];
}

export function useMarketDetail(marketId: string | null) {
  const [detail, setDetail] = useState<MarketDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDetail = useCallback(async () => {
    if (!marketId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/storm/markets/${marketId}`);
      if (!res.ok) throw new Error('Failed to fetch market detail');
      const json = await res.json();
      setDetail(json);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [marketId]);

  useEffect(() => {
    fetchDetail();
    // Refresh price data every 15 seconds
    const interval = setInterval(fetchDetail, 15000);
    return () => clearInterval(interval);
  }, [fetchDetail]);

  return { detail, loading, error, refetch: fetchDetail };
}
