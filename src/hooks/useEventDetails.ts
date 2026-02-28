import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api';
import type { PolymarketEvent } from '@/types';

export function useEventDetails(eventSlug: string | null) {
  const [event, setEvent] = useState<PolymarketEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!eventSlug) {
      setEvent(null);
      setLoading(false);
      return;
    }

    let isMounted = true;
    let intervalId: NodeJS.Timeout | null = null;

    async function fetchEvent() {
      if (!eventSlug) return;

      try {
        setLoading(true);
        setError(null);
        const data = await apiClient.getEvent(eventSlug);
        if (isMounted) {
          setEvent(data);
        }
      } catch (err) {
        if (isMounted) {
          setError(err as Error);
          console.error('Failed to fetch event:', err);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    // Initial fetch
    fetchEvent();

    // Refresh every 20 seconds for real-time updates
    intervalId = setInterval(fetchEvent, 20000);

    return () => {
      isMounted = false;
      if (intervalId) clearInterval(intervalId);
    };
  }, [eventSlug]);

  return { event, loading, error };
}
