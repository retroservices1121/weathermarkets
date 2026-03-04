'use client';

import {
  CloudRain,
  Thermometer,
  Wind,
  Cloud,
  AlertTriangle,
  Layers,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useState } from 'react';
import type { MapLayers } from './WeatherMap';

interface WeatherLayersProps {
  layers: MapLayers;
  onToggle: (layer: keyof MapLayers) => void;
}

const LAYER_CONFIG: {
  key: keyof MapLayers;
  label: string;
  icon: typeof CloudRain;
}[] = [
  { key: 'radar', label: 'Radar', icon: CloudRain },
  { key: 'temperature', label: 'Temperature', icon: Thermometer },
  { key: 'wind', label: 'Wind', icon: Wind },
  { key: 'clouds', label: 'Clouds', icon: Cloud },
  { key: 'alerts', label: 'Alerts', icon: AlertTriangle },
];

export function WeatherLayers({ layers, onToggle }: WeatherLayersProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  const activeCount = Object.values(layers).filter(Boolean).length;

  return (
    <div
      className="absolute top-4 left-4 z-[1000]"
      style={{
        background: 'rgba(0, 0, 0, 0.6)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
      }}
    >
      <div className="rounded-xl border border-gray-700/50 overflow-hidden">
        {/* Header / Toggle */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center justify-between gap-3 w-full px-3.5 py-2.5 hover:bg-white/5 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#00d4ff]" />
            <span className="text-white text-xs font-semibold">Layers</span>
            {activeCount > 0 && (
              <span className="bg-[#00d4ff]/20 text-[#00d4ff] text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                {activeCount}
              </span>
            )}
          </div>
          {isExpanded ? (
            <ChevronUp className="w-3.5 h-3.5 text-gray-400" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
          )}
        </button>

        {/* Layer buttons */}
        {isExpanded && (
          <div className="border-t border-gray-700/50 p-1.5 space-y-0.5">
            {LAYER_CONFIG.map(({ key, label, icon: Icon }) => {
              const isActive = layers[key];
              return (
                <button
                  key={key}
                  onClick={() => onToggle(key)}
                  className={`flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-[#00d4ff]/15 text-[#00d4ff]'
                      : 'text-gray-400 hover:bg-white/5 hover:text-gray-300'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{label}</span>
                  <div
                    className={`ml-auto w-7 h-4 rounded-full transition-colors relative ${
                      isActive ? 'bg-[#00d4ff]/30' : 'bg-gray-700'
                    }`}
                  >
                    <div
                      className={`absolute top-0.5 w-3 h-3 rounded-full transition-all ${
                        isActive
                          ? 'left-3.5 bg-[#00d4ff]'
                          : 'left-0.5 bg-gray-500'
                      }`}
                    />
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
