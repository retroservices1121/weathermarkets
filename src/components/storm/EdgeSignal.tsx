'use client';

import { useState } from 'react';
import { Zap } from 'lucide-react';

interface EdgeSignalProps {
  strength: 'weak' | 'moderate' | 'strong' | null;
  explanation: string;
}

function getStrengthConfig(strength: 'weak' | 'moderate' | 'strong' | null) {
  switch (strength) {
    case 'strong':
      return {
        label: 'Strong Edge',
        textColor: 'text-red-400',
        bgColor: 'bg-red-500/15',
        borderColor: 'border-red-500/30',
        glowColor: 'shadow-[0_0_8px_rgba(239,68,68,0.3)]',
        pulseClass: 'animate-pulse',
        iconColor: 'text-red-400',
        dotColor: 'bg-red-400',
      };
    case 'moderate':
      return {
        label: 'Moderate Edge',
        textColor: 'text-amber-400',
        bgColor: 'bg-amber-500/15',
        borderColor: 'border-amber-500/30',
        glowColor: '',
        pulseClass: '',
        iconColor: 'text-amber-400',
        dotColor: 'bg-amber-400',
      };
    case 'weak':
      return {
        label: 'Weak Edge',
        textColor: 'text-yellow-400',
        bgColor: 'bg-yellow-500/10',
        borderColor: 'border-yellow-500/20',
        glowColor: '',
        pulseClass: '',
        iconColor: 'text-yellow-400',
        dotColor: 'bg-yellow-400',
      };
    default:
      return null;
  }
}

export function EdgeSignal({ strength, explanation }: EdgeSignalProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  const config = getStrengthConfig(strength);
  if (!config) return null;

  return (
    <div
      className="relative inline-flex"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <div
        className={`
          inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-semibold uppercase tracking-wider
          border cursor-default
          ${config.bgColor} ${config.borderColor} ${config.textColor} ${config.glowColor} ${config.pulseClass}
        `}
      >
        <Zap className={`w-3 h-3 ${config.iconColor}`} />
        <span>{config.label}</span>
        {strength === 'strong' && (
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
            <span className={`relative inline-flex rounded-full h-2 w-2 ${config.dotColor}`} />
          </span>
        )}
      </div>

      {/* Tooltip */}
      {showTooltip && explanation && (
        <div
          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 w-60 pointer-events-none"
        >
          <div className="bg-[#1a1f2e] border border-gray-700/50 rounded-lg p-3 shadow-xl text-xs text-gray-300 leading-relaxed">
            {explanation}
            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-[#1a1f2e] border-b border-r border-gray-700/50 rotate-45" />
          </div>
        </div>
      )}
    </div>
  );
}
