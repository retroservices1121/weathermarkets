import { useState, useEffect } from 'react';
import { wsClient } from '@/lib/websocket';
import type { PriceUpdate } from '@/types';

export function useRealTimePrice(marketId: string | null) {
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);
  const [lastUpdate, setLastUpdate] = useState<number>(Date.now());

  useEffect(() => {
    if (!marketId) return;

    // Subscribe to price updates
    const unsubscribe = wsClient.onPriceUpdate((update: PriceUpdate) => {
      if (update.marketId === marketId) {
        setCurrentPrice(update.price);
        setLastUpdate(update.timestamp);
      }
    });

    // Subscribe to market
    wsClient.subscribeToMarket(marketId);

    return () => {
      // Unsubscribe from price updates
      unsubscribe();
      // Unsubscribe from market
      wsClient.unsubscribeFromMarket(marketId);
    };
  }, [marketId]);

  return { currentPrice, lastUpdate };
}

export function useRealTimePrices(marketIds: string[]) {
  const [prices, setPrices] = useState<Record<string, number>>({});

  useEffect(() => {
    if (marketIds.length === 0) return;

    // Subscribe to price updates
    const unsubscribe = wsClient.onPriceUpdate((update: PriceUpdate) => {
      if (marketIds.includes(update.marketId)) {
        setPrices((prev) => ({
          ...prev,
          [update.marketId]: update.price,
        }));
      }
    });

    // Subscribe to all markets
    marketIds.forEach((marketId) => {
      wsClient.subscribeToMarket(marketId);
    });

    return () => {
      // Unsubscribe from price updates
      unsubscribe();
      // Unsubscribe from all markets
      marketIds.forEach((marketId) => {
        wsClient.unsubscribeFromMarket(marketId);
      });
    };
  }, [marketIds.join(',')]);

  return prices;
}

export function useWebSocketStatus() {
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const checkConnection = () => {
      setIsConnected(wsClient.isConnected());
    };

    // Check initial connection
    checkConnection();

    // Check connection status every 5 seconds
    const interval = setInterval(checkConnection, 5000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  return { isConnected };
}
