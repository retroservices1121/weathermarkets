'use client';

import { useRef, useEffect, useState } from 'react';
import { useNYCWeather } from '@/hooks/useNYCWeather';
import { WeatherRenderer } from '@/lib/weatherRenderers';
import type { WeatherCondition } from '@/types/weather';

const CONDITIONS: WeatherCondition[] = [
  'clear', 'cloudy', 'fog', 'drizzle', 'rain', 'snow', 'thunderstorm',
];

const CONDITION_LABELS: Record<WeatherCondition, string> = {
  clear: 'Clear',
  cloudy: 'Cloudy',
  fog: 'Fog',
  drizzle: 'Drizzle',
  rain: 'Rain',
  snow: 'Snow',
  thunderstorm: 'Thunderstorm',
};

export function WeatherBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<WeatherRenderer | null>(null);
  const liveCondition = useNYCWeather();
  const [override, setOverride] = useState<WeatherCondition | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);

  const activeCondition = override ?? liveCondition;

  // Initialize renderer
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const renderer = new WeatherRenderer(canvas);
    rendererRef.current = renderer;
    renderer.start();

    const onResize = () => renderer.resize();
    window.addEventListener('resize', onResize);

    const onVisibility = () => {
      renderer.setPaused(document.hidden);
    };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      renderer.stop();
      window.removeEventListener('resize', onResize);
      document.removeEventListener('visibilitychange', onVisibility);
      rendererRef.current = null;
    };
  }, []);

  // Sync condition changes to renderer
  useEffect(() => {
    rendererRef.current?.setCondition(activeCondition);
  }, [activeCondition]);

  return (
    <>
      <canvas
        ref={canvasRef}
        className="fixed inset-0 z-[100] pointer-events-none"
        aria-hidden="true"
      />

      {/* Weather simulator picker */}
      <div className="fixed bottom-4 left-4 z-[200]">
        <button
          onClick={() => setPickerOpen(!pickerOpen)}
          className="px-3 py-2 bg-[#1a1d26]/90 backdrop-blur-sm border border-gray-800 rounded-lg shadow-lg text-sm font-medium text-gray-300 hover:bg-[#1a1d26] transition-colors"
        >
          {override ? CONDITION_LABELS[override] : `Live: ${CONDITION_LABELS[liveCondition]}`}
        </button>

        {pickerOpen && (
          <div className="absolute bottom-full left-0 mb-2 bg-[#1a1d26]/95 backdrop-blur-sm border border-gray-800 rounded-lg shadow-xl overflow-hidden min-w-[160px]">
            <button
              onClick={() => { setOverride(null); setPickerOpen(false); }}
              className={`w-full px-4 py-2 text-left text-sm transition-colors ${
                override === null
                  ? 'bg-blue-500/15 text-blue-400 font-medium'
                  : 'text-gray-300 hover:bg-[#1f2330]'
              }`}
            >
              Live ({CONDITION_LABELS[liveCondition]})
            </button>
            <div className="h-px bg-gray-800" />
            {CONDITIONS.map((c) => (
              <button
                key={c}
                onClick={() => { setOverride(c); setPickerOpen(false); }}
                className={`w-full px-4 py-2 text-left text-sm transition-colors ${
                  override === c
                    ? 'bg-blue-500/15 text-blue-400 font-medium'
                    : 'text-gray-300 hover:bg-[#1f2330]'
                }`}
              >
                {CONDITION_LABELS[c]}
              </button>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
