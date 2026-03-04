'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import L from 'leaflet';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { MarketPin } from './MarketPin';
import { AlertPolygon } from './AlertPolygon';
import type { WeatherMarket } from '@/hooks/useWeatherMarkets';
import type { WeatherAlert, MapLayers } from './WeatherMap';

// Fix Leaflet default icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

interface MapInnerProps {
  weatherMarkets: WeatherMarket[];
  activeAlerts: WeatherAlert[];
  selectedMarketId: string | null;
  onMarketSelect: (id: string) => void;
  layers: MapLayers;
}

// Component to handle radar tile layer with RainViewer
function RadarLayer({ visible }: { visible: boolean }) {
  const map = useMap();
  const layerRef = useRef<L.TileLayer | null>(null);

  useEffect(() => {
    if (!visible) {
      if (layerRef.current) {
        map.removeLayer(layerRef.current);
        layerRef.current = null;
      }
      return;
    }

    // Fetch latest radar timestamp from RainViewer
    fetch('https://api.rainviewer.com/public/weather-maps.json')
      .then((res) => res.json())
      .then((data) => {
        const radarFrames = data?.radar?.past;
        if (!radarFrames || radarFrames.length === 0) return;

        const latestFrame = radarFrames[radarFrames.length - 1];
        const path = latestFrame.path;

        if (layerRef.current) {
          map.removeLayer(layerRef.current);
        }

        layerRef.current = L.tileLayer(
          `https://tilecache.rainviewer.com${path}/256/{z}/{x}/{y}/2/1_1.png`,
          {
            opacity: 0.6,
            zIndex: 10,
          }
        );
        layerRef.current.addTo(map);
      })
      .catch(() => {
        // Silently fail - radar is optional
      });

    return () => {
      if (layerRef.current) {
        map.removeLayer(layerRef.current);
        layerRef.current = null;
      }
    };
  }, [visible, map]);

  return null;
}

// Component to handle cloud tile layer
function CloudLayer({ visible }: { visible: boolean }) {
  const map = useMap();
  const layerRef = useRef<L.TileLayer | null>(null);

  useEffect(() => {
    if (!visible) {
      if (layerRef.current) {
        map.removeLayer(layerRef.current);
        layerRef.current = null;
      }
      return;
    }

    // Use RainViewer satellite/infrared layer for clouds
    fetch('https://api.rainviewer.com/public/weather-maps.json')
      .then((res) => res.json())
      .then((data) => {
        const satFrames = data?.satellite?.infrared;
        if (!satFrames || satFrames.length === 0) return;

        const latestFrame = satFrames[satFrames.length - 1];
        const path = latestFrame.path;

        if (layerRef.current) {
          map.removeLayer(layerRef.current);
        }

        layerRef.current = L.tileLayer(
          `https://tilecache.rainviewer.com${path}/256/{z}/{x}/{y}/0/0_0.png`,
          {
            opacity: 0.4,
            zIndex: 8,
          }
        );
        layerRef.current.addTo(map);
      })
      .catch(() => {});

    return () => {
      if (layerRef.current) {
        map.removeLayer(layerRef.current);
        layerRef.current = null;
      }
    };
  }, [visible, map]);

  return null;
}

export default function MapInner({
  weatherMarkets,
  activeAlerts,
  selectedMarketId,
  onMarketSelect,
  layers,
}: MapInnerProps) {
  const mapCenter: [number, number] = [39.8, -98.5];
  const mapZoom = 4;

  return (
    <MapContainer
      center={mapCenter}
      zoom={mapZoom}
      className="w-full h-full"
      zoomControl={false}
      style={{ background: '#0a0e1a' }}
    >
      {/* Dark base tiles from CartoDB */}
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      />

      {/* Weather overlay layers */}
      <RadarLayer visible={layers.radar} />
      <CloudLayer visible={layers.clouds} />

      {/* Market pins */}
      {weatherMarkets
        .filter((m) => m.location)
        .map((market) => (
          <MarketPin
            key={market.id}
            market={market}
            isSelected={market.id === selectedMarketId}
            onSelect={() => onMarketSelect(market.id)}
          />
        ))}

      {/* Alert polygons */}
      {layers.alerts &&
        activeAlerts
          .filter((a) => a.geometry)
          .map((alert) => (
            <AlertPolygon key={alert.id} alert={alert} />
          ))}
    </MapContainer>
  );
}
