import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merge Tailwind CSS classes
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format number as percentage
 */
export function formatPercent(value: number, decimals: number = 0): string {
  return `${(value * 100).toFixed(decimals)}%`;
}

/**
 * Format number as USD
 */
export function formatUSD(value: number, decimals: number = 2): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

/**
 * Format large numbers (1000 -> 1K, 1000000 -> 1M)
 */
export function formatCompactNumber(value: number): string {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}K`;
  }
  return value.toString();
}

/**
 * Format volume with $ prefix
 */
export function formatVolume(value: number): string {
  return `$${formatCompactNumber(value)}`;
}

/**
 * Calculate percentage change
 */
export function calculatePercentChange(current: number, previous: number): number {
  if (previous === 0) return 0;
  return ((current - previous) / previous) * 100;
}

/**
 * Truncate address
 */
export function truncateAddress(address: string, start: number = 6, end: number = 4): string {
  if (!address) return '';
  return `${address.slice(0, start)}...${address.slice(-end)}`;
}

/**
 * Get time ago string
 */
export function getTimeAgo(timestamp: string | number): string {
  const now = new Date();
  const date = new Date(timestamp);
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return date.toLocaleDateString();
}

/**
 * Get market end time string
 */
export function getEndTimeString(endDate: string | undefined): string {
  if (!endDate) return '';

  const now = new Date();
  const end = new Date(endDate);
  const diff = end.getTime() - now.getTime();

  if (diff < 0) return 'Ended';

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

  if (days > 0) return `${days}d ${hours}h left`;
  if (hours > 0) return `${hours}h left`;
  return 'Ending soon';
}

/**
 * Get price change color
 */
export function getPriceChangeColor(change: number): string {
  if (change > 0) return 'text-success';
  if (change < 0) return 'text-error';
  return 'text-text-secondary';
}

/**
 * Sleep utility
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Debounce function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };

    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Parse outcome prices from string array to numbers
 */
export function parseOutcomePrices(prices: string[] | any): number[] {
  if (!prices) return [];

  if (Array.isArray(prices)) {
    return prices.map((p) => {
      const num = typeof p === 'number' ? p : parseFloat(p);
      return num;
    });
  }

  if (typeof prices === 'string') {
    try {
      const parsed = JSON.parse(prices);
      if (Array.isArray(parsed)) {
        return parsed.map((p) => {
          const num = typeof p === 'number' ? p : parseFloat(p);
          return num;
        });
      }
    } catch {
      return [];
    }
  }

  return [];
}

/**
 * Parse CLOB token IDs from string array to strings
 */
export function parseClobTokenIds(tokenIds: string[] | any): string[] {
  if (!tokenIds) return [];

  if (Array.isArray(tokenIds)) {
    return tokenIds;
  }

  if (typeof tokenIds === 'string') {
    try {
      const parsed = JSON.parse(tokenIds);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    } catch {
      return [];
    }
  }

  return [];
}

/**
 * Get Yes/No probabilities
 */
export function getYesNoProbabilities(outcomePrices: string[] | any): {
  yes: number;
  no: number;
} {
  const prices = parseOutcomePrices(outcomePrices);
  return {
    yes: prices[0],
    no: prices[1],
  };
}

/**
 * Check if an event is a sports match
 */
export function isSportsMatch(event: any): boolean {
  if (!event || !event.markets || event.markets.length === 0) {
    return false;
  }

  // Check for sports tags
  const hasSportsTag = event.tags?.some((tag: any) => {
    const label = typeof tag === 'object' ? tag.label : tag;
    return ['Football', 'Soccer', 'Basketball', 'NFL', 'NBA', 'NHL', 'Hockey', 'Baseball', 'MLB', 'Tennis', 'Esports'].some(
      sport => label?.includes(sport)
    );
  });

  // Check for sports category
  const hasSportsCategory = event.category === 'Sports';

  // Check for match-like title (Team vs Team)
  const matchPattern = /\svs\s|\sversus\s|\s@\s|\s-\s/i;
  const hasMatchTitle = matchPattern.test(event.title || '');

  // Check for negRisk (common for sports matches)
  const isNegRisk = event.enableNegRisk || event.negRisk;

  // Check for 2-4 markets (typical for sports outcomes)
  const hasMatchMarketCount = event.markets.length >= 2 && event.markets.length <= 4;

  // Check if markets have team names (groupItemTitle)
  const hasTeamNames = event.markets.some((m: any) => m.groupItemTitle);

  return (hasSportsTag || hasSportsCategory) &&
         (isNegRisk || hasMatchTitle) &&
         hasMatchMarketCount &&
         hasTeamNames;
}

/**
 * Check if a market is a sports match (individual 2-outcome market)
 */
export function isSportsMatchMarket(market: any): boolean {
  if (!market || !market.question || !market.outcomes || market.outcomes.length !== 2) {
    return false;
  }

  // Check for sports tags
  const hasSportsTag = market.tags?.some((tag: any) => {
    const label = typeof tag === 'object' ? tag.label : tag;
    return ['Football', 'Soccer', 'Basketball', 'NFL', 'NBA', 'NHL', 'Hockey', 'Baseball', 'MLB', 'Tennis', 'Esports', 'UFC', 'MMA', 'Boxing', 'Cricket'].some(
      sport => label?.includes(sport)
    );
  });

  // Check for sports category
  const hasSportsCategory = market.category === 'Sports';

  // Check for match-like question (Team vs Team)
  const matchPattern = /\svs\.?\s|\sversus\s|\s@\s/i;
  const hasMatchQuestion = matchPattern.test(market.question || '');

  // Check for negRisk (common for sports matches)
  const isNegRisk = market.enableNegRisk || market.negRisk;

  // Check if outcomes are team/player names (not Yes/No)
  const hasYesNo = market.outcomes.some((outcome: string) =>
    outcome.toLowerCase() === 'yes' || outcome.toLowerCase() === 'no'
  );

  return (hasSportsTag || hasSportsCategory || hasMatchQuestion) && !hasYesNo && (isNegRisk || hasMatchQuestion);
}

/**
 * Check if a market/event has date range outcomes
 */
export function isDateRangeMarket(item: any): boolean {
  if (!item) return false;

  // Check outcomes for date patterns
  const outcomes = item.outcomes || item.markets?.[0]?.outcomes || [];
  if (!Array.isArray(outcomes) || outcomes.length === 0) return false;

  // Common date patterns
  const datePatterns = [
    /\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)/i, // Month names
    /\b\d{4}\b/, // Years
    /\b\d{1,2}\/\d{1,2}\b/, // Dates (MM/DD or DD/MM)
    /\b(Q[1-4]|H[1-2])\s+\d{4}\b/i, // Quarters/Halves
    /before|after|by/i, // Temporal keywords
  ];

  const hasDateOutcomes = outcomes.some((outcome: any) => {
    const text = typeof outcome === 'string' ? outcome : outcome?.toString() || '';
    return datePatterns.some(pattern => pattern.test(text));
  });

  // Check for "when" in question
  const hasWhenQuestion = /when|date|time|by when/i.test(item.question || item.title || '');

  return hasDateOutcomes && hasWhenQuestion;
}

/**
 * Check if a market/event has numeric range outcomes
 */
export function isNumericRangeMarket(item: any): boolean {
  if (!item) return false;

  // Check outcomes for numeric patterns
  const outcomes = item.outcomes || item.markets?.[0]?.outcomes || [];
  if (!Array.isArray(outcomes) || outcomes.length === 0) return false;

  const numericPatterns = [
    /\d+\s*-\s*\d+/, // Range (e.g., "10-20")
    /(?:more|less|over|under|above|below)\s+\d+/i, // Thresholds
    /\d+\+/, // Plus (e.g., "100+")
  ];

  const hasNumericOutcomes = outcomes.some((outcome: any) => {
    const text = typeof outcome === 'string' ? outcome : outcome?.toString() || '';
    return numericPatterns.some(pattern => pattern.test(text));
  });

  // Check for "how many" in question
  const hasNumericQuestion = /how many|how much|what.*number|total/i.test(item.question || item.title || '');

  return hasNumericOutcomes || hasNumericQuestion;
}

/**
 * Get event/market display type
 */
export function getMarketDisplayType(item: any): 'single' | 'sports' | 'grouped' | 'multi' | 'date' | 'numeric' {
  // Events (multi-market containers)
  if (item.markets && Array.isArray(item.markets)) {
    if (isSportsMatch(item)) return 'sports';
    if (isDateRangeMarket(item)) return 'date';
    if (isNumericRangeMarket(item)) return 'numeric';
    if (item.markets.length > 2) return 'grouped';
  }

  // Single markets
  if (item.outcomes && Array.isArray(item.outcomes)) {
    if (isDateRangeMarket(item)) return 'date';
    if (isNumericRangeMarket(item)) return 'numeric';
    if (item.outcomes.length === 2) return 'single';
    if (item.outcomes.length > 2) return 'multi';
  }

  return 'single';
}
