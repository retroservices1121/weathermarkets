'use client';

import { useState, useEffect, useCallback } from 'react';

export interface WeatherAlert {
  id: string;
  event: string;
  headline: string;
  description: string;
  severity: 'Extreme' | 'Severe' | 'Moderate' | 'Minor' | 'Unknown';
  certainty: string;
  urgency: string;
  areaDesc: string;
  onset: string;
  expires: string;
  geometry: any; // GeoJSON geometry for polygon overlay
}

export function useAlerts(state?: string) {
  const [alerts, setAlerts] = useState<WeatherAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAlerts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const url = state ? `/api/storm/alerts?state=${state}` : '/api/storm/alerts';
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch alerts');
      const json = await res.json();
      setAlerts(json.alerts || []);
    } catch (err: any) {
      setError(err.message);
      setAlerts([]);
    } finally {
      setLoading(false);
    }
  }, [state]);

  useEffect(() => {
    fetchAlerts();
    // Refresh every minute
    const interval = setInterval(fetchAlerts, 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchAlerts]);

  return { alerts, loading, error, refetch: fetchAlerts };
}
