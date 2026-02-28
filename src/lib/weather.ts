import type { PolymarketMarket, PolymarketEvent } from '@/types';

const WEATHER_KEYWORDS = [
  'weather', 'temperature', 'rain', 'rainfall', 'snow', 'snowfall',
  'hurricane', 'tornado', 'storm', 'tropical', 'cyclone', 'typhoon',
  'flood', 'drought', 'heatwave', 'heat wave', 'cold wave', 'blizzard',
  'frost', 'freeze', 'el niño', 'el nino', 'la niña', 'la nina',
  'climate', 'celsius', 'fahrenheit', 'precipitation', 'wind speed',
  'humidity', 'wildfire', 'fire season', 'monsoon', 'polar vortex',
  'atmospheric', 'noaa', 'hottest', 'coldest', 'warmest',
  'record high', 'record low', 'above average', 'below average',
  'global warming', 'ice cap', 'arctic', 'antarctic', 'sea level',
  'ocean temperature', 'coral bleaching', 'thunderstorm', 'lightning',
  'wind chill', 'heat index', 'dew point', 'barometric', 'forecast',
  'severe weather', 'winter storm', 'ice storm', 'fog', 'hail',
  'climate change', 'greenhouse', 'carbon emission', 'el nino',
  'la nina', 'jet stream', 'weather pattern', 'meteorolog',
];

// Search terms to query the API with (subset that's likely to return results)
export const WEATHER_SEARCH_TERMS = [
  'weather', 'temperature', 'hurricane', 'storm', 'climate',
  'snow', 'rainfall', 'drought', 'wildfire', 'flood',
  'tornado', 'heatwave', 'el nino', 'arctic',
];

export function isWeatherMarket(market: PolymarketMarket): boolean {
  const text = `${market.question} ${market.description ?? ''}`.toLowerCase();
  return WEATHER_KEYWORDS.some(kw => text.includes(kw));
}

export function isWeatherEvent(event: PolymarketEvent): boolean {
  const text = `${event.title} ${event.description ?? ''}`.toLowerCase();
  if (WEATHER_KEYWORDS.some(kw => text.includes(kw))) return true;
  // Also check if any child market is weather-related
  return event.markets?.some(m => isWeatherMarket(m)) ?? false;
}
