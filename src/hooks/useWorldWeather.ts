'use client';

import { useState, useEffect } from 'react';

export interface WorldWeatherCity {
  name: string;
  flag: string;
  temperature: number;
  weatherEmoji: string;
}

interface CityDef {
  name: string;
  lat: number;
  lon: number;
  flag: string;
}

const CITIES: CityDef[] = [
  { name: 'New York', lat: 40.7128, lon: -74.006, flag: '🇺🇸' },
  { name: 'London', lat: 51.5074, lon: -0.1278, flag: '🇬🇧' },
  { name: 'Tokyo', lat: 35.6762, lon: 139.6503, flag: '🇯🇵' },
  { name: 'Sydney', lat: -33.8688, lon: 151.2093, flag: '🇦🇺' },
  { name: 'Dubai', lat: 25.2048, lon: 55.2708, flag: '🇦🇪' },
  { name: 'Paris', lat: 48.8566, lon: 2.3522, flag: '🇫🇷' },
  { name: 'Berlin', lat: 52.52, lon: 13.405, flag: '🇩🇪' },
  { name: 'Moscow', lat: 55.7558, lon: 37.6173, flag: '🇷🇺' },
  { name: 'Mumbai', lat: 19.076, lon: 72.8777, flag: '🇮🇳' },
  { name: 'Singapore', lat: 1.3521, lon: 103.8198, flag: '🇸🇬' },
  { name: 'São Paulo', lat: -23.5505, lon: -46.6333, flag: '🇧🇷' },
  { name: 'Cairo', lat: 30.0444, lon: 31.2357, flag: '🇪🇬' },
  { name: 'Toronto', lat: 43.6532, lon: -79.3832, flag: '🇨🇦' },
  { name: 'Seoul', lat: 37.5665, lon: 126.978, flag: '🇰🇷' },
  { name: 'Bangkok', lat: 13.7563, lon: 100.5018, flag: '🇹🇭' },
  { name: 'Mexico City', lat: 19.4326, lon: -99.1332, flag: '🇲🇽' },
  { name: 'Lagos', lat: 6.5244, lon: 3.3792, flag: '🇳🇬' },
  { name: 'Istanbul', lat: 41.0082, lon: 28.9784, flag: '🇹🇷' },
  { name: 'Buenos Aires', lat: -34.6037, lon: -58.3816, flag: '🇦🇷' },
  { name: 'Hong Kong', lat: 22.3193, lon: 114.1694, flag: '🇭🇰' },
];

const CACHE_KEY = 'world-weather-cache';
const CACHE_DURATION = 15 * 60 * 1000; // 15 minutes

function wmoToEmoji(code: number): string {
  if (code === 0 || code === 1) return '☀️';
  if (code === 2 || code === 3) return '⛅';
  if (code === 45 || code === 48) return '🌫️';
  if (code >= 51 && code <= 57) return '🌦️';
  if ((code >= 61 && code <= 67) || (code >= 80 && code <= 82)) return '🌧️';
  if ((code >= 71 && code <= 77) || (code >= 85 && code <= 86)) return '❄️';
  if (code >= 95 && code <= 99) return '⛈️';
  return '☀️';
}

interface CacheEntry {
  cities: WorldWeatherCity[];
  timestamp: number;
}

function getCached(): WorldWeatherCity[] | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const entry: CacheEntry = JSON.parse(raw);
    if (Date.now() - entry.timestamp < CACHE_DURATION) {
      return entry.cities;
    }
  } catch {
    // ignore
  }
  return null;
}

function setCache(cities: WorldWeatherCity[]) {
  try {
    const entry: CacheEntry = { cities, timestamp: Date.now() };
    localStorage.setItem(CACHE_KEY, JSON.stringify(entry));
  } catch {
    // ignore
  }
}

export function useWorldWeather(): { cities: WorldWeatherCity[]; loading: boolean } {
  const [cities, setCities] = useState<WorldWeatherCity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cached = getCached();
    if (cached) {
      setCities(cached);
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function fetchWeather() {
      try {
        const latitudes = CITIES.map((c) => c.lat).join(',');
        const longitudes = CITIES.map((c) => c.lon).join(',');
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitudes}&longitude=${longitudes}&current=weather_code,temperature_2m&temperature_unit=fahrenheit`;
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();

        // Open-Meteo returns an array when multiple locations are queried
        const results: WorldWeatherCity[] = (data as Array<{ current: { weather_code: number; temperature_2m: number } }>).map(
          (entry, i) => ({
            name: CITIES[i].name,
            flag: CITIES[i].flag,
            temperature: Math.round(entry.current.temperature_2m),
            weatherEmoji: wmoToEmoji(entry.current.weather_code),
          })
        );

        if (!cancelled) {
          setCities(results);
          setCache(results);
          setLoading(false);
        }
      } catch {
        if (!cancelled) setLoading(false);
      }
    }

    fetchWeather();

    const interval = setInterval(fetchWeather, CACHE_DURATION);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  return { cities, loading };
}
