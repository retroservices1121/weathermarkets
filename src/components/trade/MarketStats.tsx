import { Users, TrendingUp, Activity, Clock } from 'lucide-react';
import { formatVolume, getEndTimeString } from '@/lib/utils';

export interface MarketStatsProps {
  volume?: number;
  liquidity?: number;
  traders?: number;
  endDate?: string;
}

export function MarketStats({ volume, liquidity, traders, endDate }: MarketStatsProps) {
  const stats = [
    {
      label: 'Volume',
      value: formatVolume(volume || 0),
      icon: TrendingUp,
      color: 'text-primary',
    },
    {
      label: 'Liquidity',
      value: formatVolume(liquidity || 0),
      icon: Activity,
      color: 'text-success',
    },
    {
      label: 'Traders',
      value: traders?.toString() || 'N/A',
      icon: Users,
      color: 'text-blue-400',
    },
    {
      label: 'Ends',
      value: getEndTimeString(endDate),
      icon: Clock,
      color: 'text-text-secondary',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="bg-background-card border border-border rounded-lg p-4"
        >
          <div className="flex items-center space-x-2 mb-2">
            <stat.icon className={`h-4 w-4 ${stat.color}`} />
            <span className="text-text-muted text-sm">{stat.label}</span>
          </div>
          <p className="text-text-primary text-xl font-bold">{stat.value}</p>
        </div>
      ))}
    </div>
  );
}
