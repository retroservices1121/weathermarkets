'use client';

import { useState, useCallback } from 'react';

export interface EdgeSignal {
  edge: boolean;
  strength: 'weak' | 'moderate' | 'strong';
  forecastValue: number;
  marketPrice: number;
  divergence: number;
  explanation: string;
}

export function useEdgeDetection() {
  const [loading, setLoading] = useState(false);

  const detectEdge = useCallback(async (
    lat: number,
    lon: number,
    metric: 'temperature' | 'precipitation',
    marketPrice: number
  ): Promise<EdgeSignal | null> => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/storm/edge?lat=${lat}&lon=${lon}&metric=${metric}&marketPrice=${marketPrice}`
      );
      if (!res.ok) return null;
      const json = await res.json();
      return json;
    } catch {
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { detectEdge, loading };
}
