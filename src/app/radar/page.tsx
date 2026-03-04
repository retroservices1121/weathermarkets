'use client';

import { useState, useCallback, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { useWeatherMarkets, WeatherMarket } from '@/hooks/useWeatherMarkets';
import { useAlerts, WeatherAlert } from '@/hooks/useAlerts';
import type { AlertItem } from '@/components/storm/AlertFeed';
import { Map, List } from 'lucide-react';

// Dynamic imports for components that need client-only rendering
const WeatherMap = dynamic(() => import('@/components/storm/WeatherMap').then(m => ({ default: m.WeatherMap })), { ssr: false });
const MarketCard = dynamic(() => import('@/components/storm/MarketCard').then(m => ({ default: m.MarketCard })), { ssr: false });
const WeatherLayers = dynamic(() => import('@/components/storm/WeatherLayers').then(m => ({ default: m.WeatherLayers })), { ssr: false });
const AlertFeed = dynamic(() => import('@/components/storm/AlertFeed').then(m => ({ default: m.AlertFeed })), { ssr: false });
const MarketScanner = dynamic(() => import('@/components/storm/MarketScanner').then(m => ({ default: m.MarketScanner })), { ssr: false });

function alertToFeedItem(alert: WeatherAlert): AlertItem {
  return {
    id: alert.id,
    type: 'weather',
    title: alert.event,
    description: alert.headline || alert.description,
    timestamp: alert.onset || new Date().toISOString(),
    severity: alert.severity?.toLowerCase() as AlertItem['severity'],
  };
}

type RadarTab = 'map' | 'markets';

export default function RadarPage() {
  const { markets, loading: marketsLoading } = useWeatherMarkets();
  const { alerts, loading: alertsLoading } = useAlerts();
  const [selectedMarketId, setSelectedMarketId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<RadarTab>('map');
  const [layers, setLayers] = useState({
    radar: true,
    temperature: false,
    wind: false,
    clouds: false,
    precipitation: false,
    alerts: true,
  });
  const [feedOpen, setFeedOpen] = useState(false);

  const selectedMarket = useMemo(
    () => markets.find(m => m.id === selectedMarketId) || null,
    [markets, selectedMarketId]
  );

  const alertFeedItems = useMemo(
    () => alerts.map(alertToFeedItem),
    [alerts]
  );

  const handleLayerToggle = useCallback((layer: string) => {
    setLayers(prev => ({ ...prev, [layer]: !prev[layer as keyof typeof prev] }));
  }, []);

  const handleMarketSelect = useCallback((id: string) => {
    setSelectedMarketId(prev => prev === id ? null : id);
  }, []);

  const handleScannerMarketSelect = useCallback((market: WeatherMarket) => {
    setSelectedMarketId(market.id);
    setActiveTab('map');
  }, []);

  const handleCloseCard = useCallback(() => {
    setSelectedMarketId(null);
  }, []);

  return (
    <div className="relative w-full flex flex-col" style={{ height: 'calc(100vh - 64px)' }}>
      {/* Tab Bar */}
      <div className="flex items-center bg-[#0a0e1a] border-b border-gray-800/50 px-4 z-[1000] flex-shrink-0">
        <button
          onClick={() => setActiveTab('map')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === 'map'
              ? 'border-[#00d4ff] text-[#00d4ff]'
              : 'border-transparent text-gray-400 hover:text-gray-200'
          }`}
        >
          <Map className="w-4 h-4" />
          Radar Map
        </button>
        <button
          onClick={() => setActiveTab('markets')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === 'markets'
              ? 'border-[#00d4ff] text-[#00d4ff]'
              : 'border-transparent text-gray-400 hover:text-gray-200'
          }`}
        >
          <List className="w-4 h-4" />
          Markets
          {!marketsLoading && markets.length > 0 && (
            <span className="bg-[#00d4ff]/15 text-[#00d4ff] text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
              {markets.length}
            </span>
          )}
        </button>
      </div>

      {/* Map Tab */}
      {activeTab === 'map' && (
        <div className="relative flex-1">
          <WeatherMap
            weatherMarkets={markets}
            activeAlerts={alerts}
            selectedMarketId={selectedMarketId}
            onMarketSelect={handleMarketSelect}
            layers={layers}
          />

          {/* Layer Controls - Top Left */}
          <div className="absolute top-4 left-4 z-[1000]">
            <WeatherLayers layers={layers} onToggle={handleLayerToggle} />
          </div>

          {/* Loading indicator */}
          {(marketsLoading || alertsLoading) && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] px-4 py-2 bg-black/70 backdrop-blur-md rounded-lg border border-gray-800/50">
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#00d4ff] border-t-transparent" />
                <span className="text-gray-300 text-sm font-medium">Loading data...</span>
              </div>
            </div>
          )}

          {/* Market count badge */}
          {!marketsLoading && markets.length > 0 && (
            <div className="absolute bottom-4 left-4 z-[1000] px-3 py-1.5 bg-black/70 backdrop-blur-md rounded-lg border border-gray-800/50">
              <span className="text-[#00d4ff] font-bold text-sm">{markets.length}</span>
              <span className="text-gray-400 text-sm ml-1.5">weather markets</span>
            </div>
          )}

          {/* No markets state */}
          {!marketsLoading && markets.length === 0 && (
            <div className="absolute bottom-4 left-4 z-[1000] px-4 py-3 bg-black/70 backdrop-blur-md rounded-lg border border-gray-800/50 max-w-sm">
              <p className="text-gray-300 text-sm font-medium">No active weather markets right now</p>
              <p className="text-gray-500 text-xs mt-1">Weather prediction markets on Polymarket will appear here as map pins when available</p>
            </div>
          )}

          {/* Alert Feed Toggle */}
          <button
            onClick={() => setFeedOpen(!feedOpen)}
            className="absolute top-4 right-4 z-[1000] px-3 py-2 bg-black/70 backdrop-blur-md rounded-lg border border-gray-800/50 hover:border-[#00d4ff]/30 transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4 text-[#FF6B35]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            <span className="text-gray-300 text-sm font-medium">Alerts</span>
            {alerts.length > 0 && (
              <span className="bg-[#FF6B35] text-white text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                {alerts.length}
              </span>
            )}
          </button>

          {/* Alert Feed Panel */}
          {feedOpen && (
            <div className="absolute top-16 right-4 z-[1000] w-80 max-h-[calc(100vh-160px)]">
              <AlertFeed alerts={alertFeedItems} marketUpdates={[]} />
            </div>
          )}

          {/* Market Detail Card */}
          {selectedMarket && (
            <MarketCard
              market={selectedMarket}
              onClose={handleCloseCard}
            />
          )}
        </div>
      )}

      {/* Markets Tab */}
      {activeTab === 'markets' && (
        <div className="flex-1 overflow-y-auto">
          <MarketScanner
            markets={markets}
            loading={marketsLoading}
            onMarketSelect={handleScannerMarketSelect}
          />
          {/* Market Detail Card (also available in markets tab) */}
          {selectedMarket && (
            <MarketCard
              market={selectedMarket}
              onClose={handleCloseCard}
            />
          )}
        </div>
      )}
    </div>
  );
}
