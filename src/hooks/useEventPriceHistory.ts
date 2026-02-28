import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api';
import { parseClobTokenIds, parseOutcomePrices } from '@/lib/utils';
import type { PolymarketEvent, PolymarketMarket } from '@/types';

export function useEventPriceHistory(
  event: PolymarketEvent | null,
  interval: '1h' | '1d' | '1w' | 'max' = '1d'
) {
  const [priceData, setPriceData] = useState<Record<string, Array<{ t: number; p: number }>>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!event || !event.markets || event.markets.length === 0) {
      setPriceData({});
      setLoading(false);
      return;
    }

    let isMounted = true;

    async function fetchAllPriceHistory() {
      if (!event || !event.markets) return;

      try {
        setLoading(true);
        setError(null);

        // Sort markets by current probability (highest first) and get top 4
        const topMarkets = [...event.markets]
          .filter(m => {
            const tokenIds = parseClobTokenIds(m.clobTokenIds);
            return tokenIds.length > 0;
          })
          .sort((a, b) => {
            const pricesA = parseOutcomePrices(a.outcomePrices);
            const pricesB = parseOutcomePrices(b.outcomePrices);
            return (pricesB[0] || 0) - (pricesA[0] || 0);
          })
          .slice(0, 4);

        // Fetch price history for all markets in parallel
        const priceHistoryPromises = topMarkets.map(async (market) => {
          try {
            const tokenIds = parseClobTokenIds(market.clobTokenIds);
            const tokenId = tokenIds[0];

            if (!tokenId) {
              return { marketId: market.id, data: [] };
            }

            // For 'max' interval, request higher fidelity to get more historical data
            const fidelity = interval === 'max' ? 1000 : undefined;
            const data = await apiClient.getPriceHistoryByToken(tokenId, interval, undefined, undefined, fidelity);
            return { marketId: market.id, data };
          } catch (err) {
            console.error(`Failed to fetch price history for market ${market.id}:`, err);
            return { marketId: market.id, data: [] };
          }
        });

        const results = await Promise.all(priceHistoryPromises);

        if (isMounted) {
          const dataMap: Record<string, Array<{ t: number; p: number }>> = {};
          results.forEach(result => {
            dataMap[result.marketId] = result.data;
          });
          setPriceData(dataMap);
        }
      } catch (err) {
        if (isMounted) {
          setError(err as Error);
          console.error('Failed to fetch event price history:', err);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchAllPriceHistory();

    return () => {
      isMounted = false;
    };
  }, [event?.id, interval]);

  return { priceData, loading, error };
}
