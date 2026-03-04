'use client';

import { useEffect, useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import type { WeatherMarket } from '@/hooks/useWeatherMarkets';

// Types for alerts
export interface WeatherAlert {
  id: string;
  event: string;
  headline: string | null;
  description: string | null;
  severity: string;
  certainty: string;
  urgency: string;
  areaDesc: string;
  onset: string | null;
  expires: string | null;
  geometry: any;
}

export interface MapLayers {
  radar: boolean;
  temperature: boolean;
  wind: boolean;
  clouds: boolean;
  precipitation: boolean;
  alerts: boolean;
}

interface WeatherMapProps {
  weatherMarkets: WeatherMarket[];
  activeAlerts: WeatherAlert[];
  selectedMarketId: string | null;
  onMarketSelect: (id: string) => void;
  layers: MapLayers;
}

// Dynamically import the inner map component to avoid SSR issues with Leaflet
const MapInner = dynamic(() => import('./MapInner'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-[#0a0e1a] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-2 border-[#00d4ff] border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-400 text-sm font-medium">Loading map...</p>
      </div>
    </div>
  ),
});

export function WeatherMap({
  weatherMarkets,
  activeAlerts,
  selectedMarketId,
  onMarketSelect,
  layers,
}: WeatherMapProps) {
  return (
    <div className="w-full" style={{ height: 'calc(100vh - 64px)' }}>
      <MapInner
        weatherMarkets={weatherMarkets}
        activeAlerts={activeAlerts}
        selectedMarketId={selectedMarketId}
        onMarketSelect={onMarketSelect}
        layers={layers}
      />
    </div>
  );
}

export default WeatherMap;
