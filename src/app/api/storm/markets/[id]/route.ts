import { NextRequest, NextResponse } from 'next/server';

interface GammaMarket {
  id: string;
  question: string;
  description: string;
  slug: string;
  volume: string | number;
  endDate: string;
  clobTokenIds: string;
  conditionId: string;
  image: string;
  active: boolean;
  closed: boolean;
  outcomes: string;
  outcomePrices: string;
}

interface OrderBookResponse {
  bids?: Array<{ price: string; size: string }>;
  asks?: Array<{ price: string; size: string }>;
}

interface Trade {
  id: string;
  price: string;
  size: string;
  side: string;
  timestamp: string;
  asset_id: string;
}

interface PriceHistoryPoint {
  t: number;
  p: number;
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { error: 'Market ID is required' },
        { status: 400 }
      );
    }

    // 1. Fetch market details from Gamma
    const marketResponse = await fetch(
      `https://gamma-api.polymarket.com/markets/${id}`,
      { signal: AbortSignal.timeout(10000) }
    );

    if (!marketResponse.ok) {
      if (marketResponse.status === 404) {
        return NextResponse.json(
          { error: 'Market not found' },
          { status: 404 }
        );
      }
      return NextResponse.json(
        { error: 'Failed to fetch market from Polymarket' },
        { status: marketResponse.status }
      );
    }

    const market: GammaMarket = await marketResponse.json();

    // Parse token IDs
    let tokenIds: string[] = [];
    try {
      tokenIds = JSON.parse(market.clobTokenIds || '[]');
    } catch {
      tokenIds = [];
    }

    const yesTokenId = tokenIds[0] || null;
    const conditionId = market.conditionId;

    // 2. Fetch order book, trades, and price history in parallel
    const [orderBookData, tradesData, priceHistoryData] = await Promise.all([
      // Order book
      yesTokenId
        ? fetch(`https://clob.polymarket.com/book?token_id=${yesTokenId}`, {
            signal: AbortSignal.timeout(8000),
          })
            .then(async (res) => {
              if (!res.ok) return null;
              return res.json() as Promise<OrderBookResponse>;
            })
            .catch(() => null)
        : Promise.resolve(null),

      // Recent trades
      yesTokenId
        ? fetch(
            `https://clob.polymarket.com/trades?asset_id=${yesTokenId}&limit=20`,
            { signal: AbortSignal.timeout(8000) }
          )
            .then(async (res) => {
              if (!res.ok) return [];
              return res.json() as Promise<Trade[]>;
            })
            .catch(() => [])
        : Promise.resolve([]),

      // Price history
      conditionId
        ? fetch(
            `https://clob.polymarket.com/prices-history?market=${conditionId}&interval=1h&fidelity=60`,
            { signal: AbortSignal.timeout(8000) }
          )
            .then(async (res) => {
              if (!res.ok) return [];
              return res.json() as Promise<PriceHistoryPoint[]>;
            })
            .catch(() => [])
        : Promise.resolve([]),
    ]);

    // Calculate mid-price from order book
    let midPrice: number | null = null;
    if (orderBookData) {
      const bestBid =
        orderBookData.bids && orderBookData.bids.length > 0
          ? parseFloat(orderBookData.bids[0].price)
          : null;
      const bestAsk =
        orderBookData.asks && orderBookData.asks.length > 0
          ? parseFloat(orderBookData.asks[0].price)
          : null;

      if (bestBid !== null && bestAsk !== null) {
        midPrice = (bestBid + bestAsk) / 2;
      } else if (bestBid !== null) {
        midPrice = bestBid;
      } else if (bestAsk !== null) {
        midPrice = bestAsk;
      }
    }

    // Parse outcomes and prices
    let outcomes: string[] = [];
    let outcomePrices: string[] = [];
    try {
      outcomes = JSON.parse(market.outcomes || '[]');
    } catch {
      outcomes = [];
    }
    try {
      outcomePrices = JSON.parse(market.outcomePrices || '[]');
    } catch {
      outcomePrices = [];
    }

    const result = {
      market: {
        id: market.id,
        question: market.question,
        description: market.description,
        slug: market.slug,
        volume: market.volume,
        endDate: market.endDate,
        active: market.active,
        closed: market.closed,
        image: market.image,
        conditionId: market.conditionId,
        outcomes,
        outcomePrices,
        tokenIds: {
          yes: yesTokenId,
          no: tokenIds[1] || null,
        },
        midPrice,
      },
      orderBook: orderBookData || { bids: [], asks: [] },
      trades: tradesData || [],
      priceHistory: priceHistoryData || [],
    };

    return NextResponse.json(result, {
      headers: {
        'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=15',
      },
    });
  } catch (error) {
    console.error('Market detail API error:', error);
    return NextResponse.json(
      { error: 'Internal server error fetching market details' },
      { status: 500 }
    );
  }
}
