'use client';

import { useWorldWeather } from '@/hooks/useWorldWeather';

export function WeatherTicker() {
  const { cities, loading } = useWorldWeather();

  if (loading) {
    return (
      <div className="w-full h-8 bg-[#0f1117] border-b border-white/10">
        <div className="h-full w-full animate-pulse bg-white/5" />
      </div>
    );
  }

  if (cities.length === 0) return null;

  const cityItems = cities.map((city, i) => (
    <span key={i} className="inline-flex items-center whitespace-nowrap">
      <span>{city.flag} {city.name} {city.weatherEmoji} {city.temperature}°F</span>
      <span className="mx-4 text-white/30">·</span>
    </span>
  ));

  return (
    <div className="w-full h-8 bg-[#0f1117] border-b border-white/10 overflow-hidden relative z-50">
      <div className="animate-scroll inline-flex items-center h-full hover:[animation-play-state:paused] text-sm text-white/70">
        <div className="inline-flex items-center">{cityItems}</div>
        <div className="inline-flex items-center">{cityItems}</div>
      </div>
    </div>
  );
}
