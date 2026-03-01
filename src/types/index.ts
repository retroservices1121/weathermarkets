// Market Types
export interface PolymarketMarket {
  id: string;
  question: string;
  description?: string;
  image?: string;
  icon?: string;
  category?: string;
  outcomes: string[] | any;
  outcomePrices: string[] | any;
  clobTokenIds: string[] | any;
  volume?: number | string;
  volume24hr?: number;
  liquidity?: number;
  openInterest?: number;
  endDate?: string;
  startDate?: string;
  active?: boolean;
  closed?: boolean;
  archived?: boolean;
  new?: boolean;
  featured?: boolean;
  slug?: string;
  createdAt?: string;
  updatedAt?: string;
  // Multi-outcome market fields
  negRisk?: boolean;
  negRiskMarketID?: string;
  negRiskAugmented?: boolean;
  groupItemTitle?: string;
  groupItemThreshold?: string;
  // Display options
  wideFormat?: boolean;
  formatType?: string;
  marketType?: string;
  subtitle?: string;
  // Series/recurring markets
  series?: boolean;
  recurrence?: string;
  // Sports-specific
  gameStartTime?: string;
  gameStatus?: string;
  gameId?: string;
  enableOrderBook?: boolean;
}

// Event Types (grouped markets)
export interface PolymarketEvent {
  id: string;
  title: string;
  description?: string;
  image?: string;
  icon?: string;
  slug?: string;
  markets: PolymarketMarket[];
  startDate?: string;
  endDate?: string;
  category?: string;
  featured?: boolean;
  tags?: Array<{ id: string; label: string; slug: string } | string>;
  // Multi-outcome event fields
  enableNegRisk?: boolean;
  negRisk?: boolean;
  negRiskMarketID?: string;
  negRiskAugmented?: boolean;
  volume?: number;
  volume24hr?: number;
  liquidity?: number;
  openInterest?: number;
  sortBy?: string;
  // Display options
  wideFormat?: boolean;
  formatType?: string;
  subtitle?: string;
  // Series/recurring markets
  series?: boolean;
  recurrence?: string;
  collections?: string[];
  // Sports-specific
  gameStartTime?: string;
  gameStatus?: string;
}

// Tag Types
export interface Tag {
  id: string;
  label: string;
  slug: string;
}

export interface TrendingTag {
  tag: string;
  slug: string;
  eventCount: number;
  totalVolume: number;
  score: number;
}

// Price History
export interface PricePoint {
  t: number; // timestamp
  p: number; // price
}

// Order Book
export interface OrderBookEntry {
  price: string;
  size: string;
}

export interface OrderBook {
  bids: OrderBookEntry[];
  asks: OrderBookEntry[];
}

// Market Stats
export interface MarketStats {
  volume24h: number;
  priceChange24h: number;
  priceChangePercent24h: number;
  high24h: number;
  low24h: number;
  trades24h: number;
}

// Market Depth
export interface MarketDepth {
  bids: { price: number; size: number; total: number }[];
  asks: { price: number; size: number; total: number }[];
  bidDepth: number;
  askDepth: number;
  totalDepth: number;
}

// Trade
export interface Trade {
  id: string;
  timestamp: string | number;
  price: number;
  size: number;
  side: 'BUY' | 'SELL';
}

// Categories
export type MarketCategory =
  | 'All Weather'
  | 'Temperature'
  | 'Storms'
  | 'Earthquakes'
  | 'Climate';

export const MARKET_CATEGORIES: MarketCategory[] = [
  'All Weather',
  'Temperature',
  'Storms',
  'Earthquakes',
  'Climate',
];

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// WebSocket Events
export interface WebSocketMessage {
  type: 'price_update' | 'trade' | 'orderbook_update';
  data: any;
}

export interface PriceUpdate {
  tokenId: string;
  marketId: string;
  price: number;
  timestamp: number;
}

// Query Params
export interface GetMarketsOptions {
  limit?: number;
  offset?: number;
  active?: boolean;
  closed?: boolean;
  archived?: boolean;
  order?: 'volume' | 'liquidity' | 'created_at' | 'updated_at' | 'volume24hr';
  ascending?: boolean;
  category?: string;
  featured?: boolean;
  new?: boolean;
  tags?: string[];
  slug?: string;
}

export interface GetEventsOptions {
  limit?: number;
  offset?: number;
  active?: boolean;
  closed?: boolean;
  archived?: boolean;
  order?: 'id' | 'volume' | 'liquidity' | 'created_at' | 'updated_at';
  ascending?: boolean;
  category?: string;
  featured?: boolean;
  slug?: string;
}
