'use client';

import { useState, useEffect, useRef } from 'react';
import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Bell,
  CloudLightning,
  Zap,
  Info,
} from 'lucide-react';
import { getTimeAgo } from '@/lib/utils';

export interface AlertItem {
  id: string;
  type: 'weather' | 'market_up' | 'market_down' | 'edge';
  title: string;
  description: string;
  timestamp: string;
  severity?: 'extreme' | 'severe' | 'moderate' | 'minor';
}

interface AlertFeedProps {
  alerts: AlertItem[];
  marketUpdates: AlertItem[];
}

function getSeverityStyles(severity?: string): { border: string; icon: string; bg: string } {
  switch (severity) {
    case 'extreme':
      return { border: 'border-red-500/40', icon: 'text-red-400', bg: 'bg-red-500/10' };
    case 'severe':
      return { border: 'border-orange-500/40', icon: 'text-orange-400', bg: 'bg-orange-500/10' };
    case 'moderate':
      return { border: 'border-amber-500/40', icon: 'text-amber-400', bg: 'bg-amber-500/10' };
    case 'minor':
      return { border: 'border-blue-500/40', icon: 'text-blue-400', bg: 'bg-blue-500/10' };
    default:
      return { border: 'border-gray-700/40', icon: 'text-gray-400', bg: 'bg-gray-800/50' };
  }
}

function getItemIcon(item: AlertItem) {
  switch (item.type) {
    case 'weather':
      return item.severity === 'extreme' || item.severity === 'severe' ? (
        <CloudLightning className="w-4 h-4" />
      ) : (
        <AlertTriangle className="w-4 h-4" />
      );
    case 'market_up':
      return <TrendingUp className="w-4 h-4" />;
    case 'market_down':
      return <TrendingDown className="w-4 h-4" />;
    case 'edge':
      return <Zap className="w-4 h-4" />;
    default:
      return <Info className="w-4 h-4" />;
  }
}

function getItemTypeStyles(item: AlertItem): { icon: string; bg: string } {
  switch (item.type) {
    case 'weather':
      return getSeverityStyles(item.severity);
    case 'market_up':
      return { icon: 'text-emerald-400', bg: 'bg-emerald-500/10' };
    case 'market_down':
      return { icon: 'text-red-400', bg: 'bg-red-500/10' };
    case 'edge':
      return { icon: 'text-[#00d4ff]', bg: 'bg-[#00d4ff]/10' };
    default:
      return { icon: 'text-gray-400', bg: 'bg-gray-800/50' };
  }
}

export function AlertFeed({ alerts, marketUpdates }: AlertFeedProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Combine and sort all items by timestamp (newest first)
  const allItems = [...alerts, ...marketUpdates].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  // Auto-scroll to top when new items arrive
  useEffect(() => {
    if (scrollRef.current && !isCollapsed) {
      scrollRef.current.scrollTop = 0;
    }
  }, [allItems.length, isCollapsed]);

  return (
    <div
      className={`absolute z-[1000] transition-all duration-300 ease-out
        md:right-4 md:top-4 md:bottom-auto
        bottom-4 left-4 right-4 md:left-auto
        ${isCollapsed ? 'md:w-10' : 'md:w-80'}
      `}
    >
      <div
        className="rounded-xl border border-gray-700/50 overflow-hidden"
        style={{
          background: 'rgba(0, 0, 0, 0.65)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2.5 border-b border-gray-700/50">
          {!isCollapsed && (
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-[#00d4ff]" />
              <span className="text-white text-xs font-semibold">Live Feed</span>
              {allItems.length > 0 && (
                <span className="bg-red-500/20 text-red-400 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  {allItems.length}
                </span>
              )}
            </div>
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1 rounded-md hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
          >
            {isCollapsed ? (
              <ChevronLeft className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Feed Items */}
        {!isCollapsed && (
          <div
            ref={scrollRef}
            className="max-h-80 md:max-h-[calc(100vh-200px)] overflow-y-auto"
            style={{ scrollbarWidth: 'thin', scrollbarColor: '#374151 transparent' }}
          >
            {allItems.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <Bell className="w-6 h-6 text-gray-600 mx-auto mb-2" />
                <p className="text-gray-500 text-xs">No alerts at this time</p>
              </div>
            ) : (
              <div className="p-2 space-y-1">
                {allItems.map((item) => {
                  const styles = getItemTypeStyles(item);
                  return (
                    <div
                      key={item.id}
                      className={`rounded-lg p-2.5 border border-transparent hover:border-gray-700/30 transition-colors cursor-default ${styles.bg}`}
                    >
                      <div className="flex items-start gap-2">
                        <div className={`flex-shrink-0 mt-0.5 ${styles.icon}`}>
                          {getItemIcon(item)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-xs font-medium leading-snug truncate">
                            {item.title}
                          </p>
                          <p className="text-gray-400 text-[10px] leading-snug mt-0.5 line-clamp-2">
                            {item.description}
                          </p>
                          <p className="text-gray-600 text-[10px] mt-1">
                            {getTimeAgo(item.timestamp)}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
