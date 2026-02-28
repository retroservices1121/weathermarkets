'use client';

import { useState, useEffect } from 'react';
import type { WeatherCondition } from '@/types/weather';

const NYC_LAT = 40.7128;
const NYC_LON = -74.006;
const CACHE_KEY = 'nyc-weather-cache';
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

interface CacheEntry {
  condition: WeatherCondition;
  timestamp: number;
}

/** Map WMO weather codes to our condition types */
function wmoToCondition(code: number): WeatherCondition {
  // WMO Weather interpretation codes (WW)
  // https://open-meteo.com/en/docs
  if (code === 0 || code === 1) return 'clear';
  if (code === 2 || code === 3) return 'cloudy';
  if (code === 45 || code === 48) return 'fog';
  if (code >= 51 && code <= 57) return 'drizzle';
  if (code >= 61 && code <= 67) return 'rain';
  if (code >= 71 && code <= 77) return 'snow';
  if (code >= 80 && code <= 82) return 'rain';
  if (code >= 85 && code <= 86) return 'snow';
  if (code >= 95 && code <= 99) return 'thunderstorm';
  return 'clear';
}

function getCached(): WeatherCondition | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const entry: CacheEntry = JSON.parse(raw);
    if (Date.now() - entry.timestamp < CACHE_DURATION) {
      return entry.condition;
    }
  } catch {
    // ignore
  }
  return null;
}

function setCache(condition: WeatherCondition) {
  try {
    const entry: CacheEntry = { condition, timestamp: Date.now() };
    localStorage.setItem(CACHE_KEY, JSON.stringify(entry));
  } catch {
    // ignore
  }
}

export function useNYCWeather(): WeatherCondition {
  const [condition, setCondition] = useState<WeatherCondition>('clear');

  useEffect(() => {
    const cached = getCached();
    if (cached) {
      setCondition(cached);
      return;
    }

    let cancelled = false;

    async function fetchWeather() {
      try {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${NYC_LAT}&longitude=${NYC_LON}&current=weather_code&timezone=America%2FNew_York`;
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        const code: number = data.current.weather_code;
        const mapped = wmoToCondition(code);
        if (!cancelled) {
          setCondition(mapped);
          setCache(mapped);
        }
      } catch {
        // fallback to clear on error
        if (!cancelled) setCondition('clear');
      }
    }

    fetchWeather();

    // Refetch every 30 minutes
    const interval = setInterval(fetchWeather, CACHE_DURATION);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  return condition;
}
