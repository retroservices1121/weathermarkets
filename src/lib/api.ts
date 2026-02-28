import axios, { AxiosInstance } from 'axios';
import { parseClobTokenIds } from './utils';
// Weather keyword filters kept in ./weather.ts for local search fallback
import type {
  PolymarketMarket,
  PolymarketEvent,
  GetMarketsOptions,
  GetEventsOptions,
  PricePoint,
  OrderBook,
  Trade,
} from '@/types';

// ── Polymarket API proxied through Next.js rewrites (avoids CORS) ────
const GAMMA_API = '/api/gamma';
const CLOB_API = '/api/clob';

// ── Helpers ──────────────────────────────────────────────────────────

function tryParseJsonArray(value: unknown): string[] {
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

function normalizeMarket(raw: any): PolymarketMarket {
  return {
    ...raw,
    outcomes: tryParseJsonArray(raw.outcomes),
    outcomePrices: tryParseJsonArray(raw.outcomePrices),
    clobTokenIds: tryParseJsonArray(raw.clobTokenIds),
    volume24hr: typeof raw.volume24hr === 'number'
      ? raw.volume24hr
      : parseFloat(raw.volume24hr) || 0,
  };
}

function normalizeEvent(raw: any): PolymarketEvent {
  return {
    ...raw,
    markets: Array.isArray(raw.markets)
      ? raw.markets.map(normalizeMarket)
      : [],
  };
}

// ── API Client ───────────────────────────────────────────────────────

class ApiClient {
  private gamma: AxiosInstance;
  private clob: AxiosInstance;

  constructor() {
    this.gamma = axios.create({
      baseURL: GAMMA_API,
      timeout: 30000,
    });

    this.clob = axios.create({
      baseURL: CLOB_API,
      timeout: 30000,
    });

    // Error logging interceptors
    for (const client of [this.gamma, this.clob]) {
      client.interceptors.response.use(
        (r) => r,
        (err) => {
          console.error('API Error:', err.response?.status, err.message);
          return Promise.reject(err);
        },
      );
    }
  }

  // ==================== MARKETS ====================

  async getMarkets(options: GetMarketsOptions = {}): Promise<PolymarketMarket[]> {
    try {
      const params: Record<string, unknown> = {
        limit: options.limit || 20,
        active: options.active !== false,
        closed: options.closed || false,
        order: options.order || 'volume24hr',
        ascending: options.ascending || false,
      };
      if (options.offset) params.offset = options.offset;
      if (options.slug) params.slug = options.slug;

      const { data } = await this.gamma.get('/markets', { params });
      const arr = Array.isArray(data) ? data : [];
      return arr.map(normalizeMarket);
    } catch (error) {
      console.error('Failed to fetch markets:', error);
      return [];
    }
  }

  async getMarket(idOrSlug: string): Promise<PolymarketMarket | null> {
    try {
      // Try by slug first
      const { data } = await this.gamma.get('/markets', {
        params: { slug: idOrSlug },
      });
      if (Array.isArray(data) && data.length > 0) {
        return normalizeMarket(data[0]);
      }
      // Fall back to condition_id
      const { data: data2 } = await this.gamma.get('/markets', {
        params: { id: idOrSlug },
      });
      if (Array.isArray(data2) && data2.length > 0) {
        return normalizeMarket(data2[0]);
      }
      return null;
    } catch (error) {
      console.error(`Failed to fetch market ${idOrSlug}:`, error);
      throw error;
    }
  }

  async getFeaturedMarkets(limit = 20): Promise<PolymarketMarket[]> {
    return this.getMarkets({ limit, active: true, order: 'volume24hr', ascending: false });
  }

  async getTrendingMarkets(limit = 20): Promise<PolymarketMarket[]> {
    return this.getMarkets({ limit, active: true, order: 'volume24hr', ascending: false });
  }

  async searchMarkets(query: string, limit = 100): Promise<PolymarketMarket[]> {
    try {
      const { data } = await this.gamma.get('/markets', {
        params: { limit: Math.min(limit, 300), active: true, closed: false, order: 'volume24hr', ascending: false },
        timeout: 15000,
      });
      const markets = Array.isArray(data) ? data : [];
      const q = query.toLowerCase();
      return markets
        .filter((m: any) =>
          m.question?.toLowerCase().includes(q) ||
          m.description?.toLowerCase().includes(q),
        )
        .map(normalizeMarket);
    } catch (error) {
      console.error('Failed to search markets:', error);
      return [];
    }
  }

  async getMarketsByCategory(category: string, limit = 50): Promise<PolymarketMarket[]> {
    return this.getMarkets({ limit, active: true });
  }

  async getMarketsByTag(tag: string, limit = 50): Promise<PolymarketMarket[]> {
    return this.getMarkets({ limit, active: true });
  }

  async getNewMarkets(limit = 40): Promise<PolymarketMarket[]> {
    return this.getMarkets({ limit, order: 'volume24hr', ascending: false });
  }

  // ==================== EVENTS ====================

  async getEvents(options: GetEventsOptions = {}): Promise<PolymarketEvent[]> {
    try {
      const params: Record<string, unknown> = {
        limit: options.limit || 20,
        active: options.active !== false,
        closed: options.closed || false,
        order: options.order || 'volume24hr',
        ascending: options.ascending || false,
      };
      if (options.offset) params.offset = options.offset;
      if (options.slug) params.slug = options.slug;

      const { data } = await this.gamma.get('/events', { params });
      const arr = Array.isArray(data) ? data : [];
      return arr.map(normalizeEvent);
    } catch (error) {
      console.error('Failed to fetch events:', error);
      return [];
    }
  }

  async getEvent(idOrSlug: string): Promise<PolymarketEvent | null> {
    try {
      // Try direct by id
      const { data } = await this.gamma.get(`/events/${idOrSlug}`);
      if (data) return normalizeEvent(data);
      return null;
    } catch {
      try {
        // Fall back to slug query
        const { data } = await this.gamma.get('/events', {
          params: { slug: idOrSlug },
        });
        if (Array.isArray(data) && data.length > 0) {
          return normalizeEvent(data[0]);
        }
      } catch {}
      return null;
    }
  }

  async getActiveEvents(limit = 50): Promise<PolymarketEvent[]> {
    return this.getEvents({ limit, active: true });
  }

  async getFeaturedEvents(limit = 20): Promise<PolymarketEvent[]> {
    return this.getEvents({ limit, active: true, order: 'volume' });
  }

  async getTrendingEvents(limit = 20): Promise<PolymarketEvent[]> {
    return this.getEvents({ limit, active: true, order: 'volume', ascending: false });
  }

  async getMultiOutcomeEventsByCategory(category: string, limit = 20): Promise<PolymarketEvent[]> {
    return this.getEvents({ limit, active: true });
  }

  async getEventMarkets(eventId: string): Promise<PolymarketMarket[]> {
    try {
      const event = await this.getEvent(eventId);
      return event?.markets || [];
    } catch (error) {
      console.error(`Failed to fetch markets for event ${eventId}:`, error);
      return [];
    }
  }

  // ==================== PRICE & TRADING DATA ====================

  async getPriceHistory(
    marketSlug: string,
    outcome: 'YES' | 'NO' = 'YES',
    interval: string = '1h',
  ): Promise<PricePoint[]> {
    try {
      const market = await this.getMarket(marketSlug);
      if (!market) return [];
      const tokenIds = parseClobTokenIds(market.clobTokenIds);
      const tokenId = outcome === 'YES' ? tokenIds[0] : tokenIds[1];
      if (!tokenId) return [];
      return this.getPriceHistoryByToken(tokenId, interval as any);
    } catch (error) {
      console.error('Failed to fetch price history:', error);
      return [];
    }
  }

  async getOrderBook(
    marketSlug: string,
    outcome: 'YES' | 'NO' = 'YES',
  ): Promise<OrderBook> {
    try {
      const market = await this.getMarket(marketSlug);
      if (!market) return { bids: [], asks: [] };
      const tokenIds = parseClobTokenIds(market.clobTokenIds);
      const tokenId = outcome === 'YES' ? tokenIds[0] : tokenIds[1];
      if (!tokenId) return { bids: [], asks: [] };
      return this.getOrderBookByToken(tokenId);
    } catch {
      return { bids: [], asks: [] };
    }
  }

  async getCurrentPrice(
    marketSlug: string,
    outcome: 'YES' | 'NO' = 'YES',
  ): Promise<{ bid: number; ask: number; mid: number }> {
    try {
      const market = await this.getMarket(marketSlug);
      if (!market) return { bid: 0, ask: 0, mid: 0 };
      const tokenIds = parseClobTokenIds(market.clobTokenIds);
      const tokenId = outcome === 'YES' ? tokenIds[0] : tokenIds[1];
      if (!tokenId) return { bid: 0, ask: 0, mid: 0 };
      const { midpoint } = await this.getMidpoint(tokenId);
      return { bid: 0, ask: 0, mid: midpoint };
    } catch {
      return { bid: 0, ask: 0, mid: 0 };
    }
  }

  async getPriceHistoryByToken(
    tokenId: string,
    interval: string = '1h',
    startTs?: number,
    endTs?: number,
    fidelity?: number,
  ): Promise<PricePoint[]> {
    try {
      const params: Record<string, unknown> = { market: tokenId, interval };
      if (startTs) params.startTs = startTs;
      if (endTs) params.endTs = endTs;
      if (fidelity) params.fidelity = fidelity;

      const { data } = await this.clob.get('/prices-history', { params });
      // CLOB returns { history: [{ t, p }] }
      return Array.isArray(data?.history) ? data.history : [];
    } catch (error) {
      console.error('Failed to fetch price history by token:', error);
      return [];
    }
  }

  async getOrderBookByToken(tokenId: string): Promise<OrderBook> {
    try {
      const { data } = await this.clob.get('/book', {
        params: { token_id: tokenId },
      });
      return {
        bids: (data?.bids || []).map((b: any) => ({
          price: String(b.price),
          size: String(b.size),
        })),
        asks: (data?.asks || []).map((a: any) => ({
          price: String(a.price),
          size: String(a.size),
        })),
      };
    } catch {
      return { bids: [], asks: [] };
    }
  }

  async getMidpoint(tokenId: string): Promise<{ midpoint: number }> {
    try {
      const { data } = await this.clob.get('/midpoint', {
        params: { token_id: tokenId },
      });
      return { midpoint: parseFloat(data?.mid || '0') };
    } catch {
      return { midpoint: 0 };
    }
  }

  async getSpread(
    tokenId: string,
  ): Promise<{ spread: number; spreadPercent: number; bid: number; ask: number }> {
    try {
      const { data } = await this.clob.get('/spread', {
        params: { token_id: tokenId },
      });
      return {
        spread: parseFloat(data?.spread || '0'),
        spreadPercent: 0,
        bid: parseFloat(data?.bid || '0'),
        ask: parseFloat(data?.ask || '0'),
      };
    } catch {
      return { spread: 0, spreadPercent: 0, bid: 0, ask: 0 };
    }
  }

  async getRecentTrades(tokenId: string, limit = 50): Promise<Trade[]> {
    try {
      const { data } = await this.clob.get('/trades', {
        params: { token_id: tokenId, limit },
      });
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  }

  async getEventActivity(eventId: string, limit = 50): Promise<Trade[]> {
    try {
      const event = await this.getEvent(eventId);
      if (!event?.markets) return [];

      const tradePromises = event.markets
        .slice(0, 10)
        .map((m) => {
          const tokenIds = parseClobTokenIds(m.clobTokenIds);
          if (!tokenIds[0]) return Promise.resolve([]);
          return this.getRecentTrades(tokenIds[0], 20).catch(() => []);
        });

      const arrays = await Promise.all(tradePromises);
      return arrays
        .flat()
        .sort((a, b) => Number(b.timestamp) - Number(a.timestamp))
        .slice(0, limit);
    } catch {
      return [];
    }
  }

  async getEventOrderBook(eventId: string): Promise<OrderBook | null> {
    try {
      const event = await this.getEvent(eventId);
      if (!event?.markets?.length) return null;

      const leading = event.markets.reduce((prev, cur) => {
        const pv = typeof prev.volume === 'string' ? parseFloat(prev.volume) : (prev.volume || 0);
        const cv = typeof cur.volume === 'string' ? parseFloat(cur.volume) : (cur.volume || 0);
        return cv > pv ? cur : prev;
      });

      const tokenIds = parseClobTokenIds(leading.clobTokenIds);
      if (!tokenIds[0]) return null;
      return this.getOrderBookByToken(tokenIds[0]);
    } catch {
      return null;
    }
  }

  // ==================== WEATHER ====================

  /**
   * Fetch weather markets by extracting individual markets from
   * weather-tagged events. The Gamma API's tag_slug=weather on events
   * is the most reliable way to get actual weather content.
   */
  async getWeatherMarkets(): Promise<PolymarketMarket[]> {
    try {
      const events = await this.getWeatherEvents();
      const seen = new Set<string>();
      const markets: PolymarketMarket[] = [];

      for (const event of events) {
        for (const m of event.markets) {
          if (!seen.has(m.id)) {
            seen.add(m.id);
            markets.push(m);
          }
        }
      }

      markets.sort((a, b) => {
        const va = typeof a.volume24hr === 'number' ? a.volume24hr : 0;
        const vb = typeof b.volume24hr === 'number' ? b.volume24hr : 0;
        return vb - va;
      });

      return markets;
    } catch (error) {
      console.error('Failed to fetch weather markets:', error);
      return [];
    }
  }

  /**
   * Fetch weather events using Polymarket's tag_slug=weather parameter.
   * This directly queries the weather category (polymarket.com/climate-science/weather)
   * and returns all tagged events without client-side keyword filtering.
   */
  async getWeatherEvents(): Promise<PolymarketEvent[]> {
    try {
      const { data } = await this.gamma.get('/events', {
        params: {
          limit: 100,
          active: true,
          closed: false,
          order: 'volume24hr',
          ascending: false,
          tag_slug: 'weather',
        },
        timeout: 20000,
      });
      const events = (Array.isArray(data) ? data : []).map(normalizeEvent);
      return events;
    } catch (error) {
      console.error('Failed to fetch weather events:', error);
      return [];
    }
  }

  // ==================== STUBS (unused by weather app) ================

  async get24HourStats(_tokenId: string) {
    return { volume24h: 0, priceChange24h: 0, priceChangePercent24h: 0, high24h: 0, low24h: 0, trades24h: 0 };
  }
  async getMarketDepth(_tokenId: string, _levels = 10) {
    return { bids: [], asks: [], bidDepth: 0, askDepth: 0, totalDepth: 0 };
  }
  async getCandlesticks(_tokenId: string) { return []; }
  async getOrderBookByTokenId(tokenId: string): Promise<any> {
    const book = await this.getOrderBookByToken(tokenId);
    return { ...book, timestamp: Date.now().toString() };
  }
  async getAllTags(): Promise<{ id: string; label: string; slug: string }[]> { return []; }
  async getTrendingTags(_limit = 20): Promise<{ tag: string; slug: string; eventCount: number; totalVolume: number; score: number }[]> { return []; }
  async getSportsCategories() { return []; }
  async healthCheck() { return { healthy: true }; }
}

// Export singleton
export const apiClient = new ApiClient();

// Named exports for convenience
export const {
  getMarkets,
  getMarket,
  getFeaturedMarkets,
  getTrendingMarkets,
  searchMarkets,
  getMarketsByCategory,
  getMarketsByTag,
  getNewMarkets,
  getEvents,
  getEvent,
  getActiveEvents,
  getFeaturedEvents,
  getTrendingEvents,
  getMultiOutcomeEventsByCategory,
  getEventMarkets,
  getPriceHistory,
  getOrderBook,
  getCurrentPrice,
  getRecentTrades,
  getPriceHistoryByToken,
  getMidpoint,
  getSpread,
  getOrderBookByToken,
  getEventActivity,
  getEventOrderBook,
  getAllTags,
  getTrendingTags,
  healthCheck,
} = apiClient;
