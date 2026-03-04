import { NextResponse } from 'next/server';

// Hardcoded geocoding for ~50 major US cities
const CITY_GEOCODING: Record<string, { lat: number; lon: number }> = {
  'New York': { lat: 40.7128, lon: -74.006 },
  'Los Angeles': { lat: 34.0522, lon: -118.2437 },
  'Chicago': { lat: 41.8781, lon: -87.6298 },
  'Houston': { lat: 29.7604, lon: -95.3698 },
  'Phoenix': { lat: 33.4484, lon: -112.074 },
  'Philadelphia': { lat: 39.9526, lon: -75.1652 },
  'San Antonio': { lat: 29.4241, lon: -98.4936 },
  'San Diego': { lat: 32.7157, lon: -117.1611 },
  'Dallas': { lat: 32.7767, lon: -96.797 },
  'San Jose': { lat: 37.3382, lon: -121.8863 },
  'Austin': { lat: 30.2672, lon: -97.7431 },
  'Jacksonville': { lat: 30.3322, lon: -81.6557 },
  'Fort Worth': { lat: 32.7555, lon: -97.3308 },
  'Columbus': { lat: 39.9612, lon: -82.9988 },
  'Charlotte': { lat: 35.2271, lon: -80.8431 },
  'San Francisco': { lat: 37.7749, lon: -122.4194 },
  'Indianapolis': { lat: 39.7684, lon: -86.1581 },
  'Seattle': { lat: 47.6062, lon: -122.3321 },
  'Denver': { lat: 39.7392, lon: -104.9903 },
  'Washington': { lat: 38.9072, lon: -77.0369 },
  'Nashville': { lat: 36.1627, lon: -86.7816 },
  'Oklahoma City': { lat: 35.4676, lon: -97.5164 },
  'El Paso': { lat: 31.7619, lon: -106.485 },
  'Boston': { lat: 42.3601, lon: -71.0589 },
  'Portland': { lat: 45.5155, lon: -122.6789 },
  'Las Vegas': { lat: 36.1699, lon: -115.1398 },
  'Memphis': { lat: 35.1495, lon: -90.049 },
  'Louisville': { lat: 38.2527, lon: -85.7585 },
  'Baltimore': { lat: 39.2904, lon: -76.6122 },
  'Milwaukee': { lat: 43.0389, lon: -87.9065 },
  'Albuquerque': { lat: 35.0844, lon: -106.6504 },
  'Tucson': { lat: 32.2226, lon: -110.9747 },
  'Fresno': { lat: 36.7378, lon: -119.7871 },
  'Sacramento': { lat: 38.5816, lon: -121.4944 },
  'Mesa': { lat: 33.4152, lon: -111.8315 },
  'Kansas City': { lat: 39.0997, lon: -94.5786 },
  'Atlanta': { lat: 33.749, lon: -84.388 },
  'Omaha': { lat: 41.2565, lon: -95.9345 },
  'Colorado Springs': { lat: 38.8339, lon: -104.8214 },
  'Raleigh': { lat: 35.7796, lon: -78.6382 },
  'Miami': { lat: 25.7617, lon: -80.1918 },
  'Tampa': { lat: 27.9506, lon: -82.4572 },
  'Minneapolis': { lat: 44.9778, lon: -93.265 },
  'New Orleans': { lat: 29.9511, lon: -90.0715 },
  'Cleveland': { lat: 41.4993, lon: -81.6944 },
  'Orlando': { lat: 28.5383, lon: -81.3792 },
  'St. Louis': { lat: 38.627, lon: -90.1994 },
  'Pittsburgh': { lat: 40.4406, lon: -79.9959 },
  'Detroit': { lat: 42.3314, lon: -83.0458 },
  'Cincinnati': { lat: 39.1031, lon: -84.512 },
};

// US state names for location extraction
const US_STATES: string[] = [
  'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado',
  'Connecticut', 'Delaware', 'Florida', 'Georgia', 'Hawaii', 'Idaho',
  'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky', 'Louisiana',
  'Maine', 'Maryland', 'Massachusetts', 'Michigan', 'Minnesota',
  'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada',
  'New Hampshire', 'New Jersey', 'New Mexico', 'New York', 'North Carolina',
  'North Dakota', 'Ohio', 'Oklahoma', 'Oregon', 'Pennsylvania',
  'Rhode Island', 'South Carolina', 'South Dakota', 'Tennessee', 'Texas',
  'Utah', 'Vermont', 'Virginia', 'Washington', 'West Virginia',
  'Wisconsin', 'Wyoming',
];

// State capital coordinates as fallback for state-level location
const STATE_COORDS: Record<string, { lat: number; lon: number }> = {
  'Alabama': { lat: 32.3792, lon: -86.3077 },
  'Alaska': { lat: 58.3005, lon: -134.4197 },
  'Arizona': { lat: 33.4484, lon: -112.074 },
  'Arkansas': { lat: 34.7465, lon: -92.2896 },
  'California': { lat: 38.5816, lon: -121.4944 },
  'Colorado': { lat: 39.7392, lon: -104.9903 },
  'Connecticut': { lat: 41.764, lon: -72.6823 },
  'Delaware': { lat: 39.1582, lon: -75.5244 },
  'Florida': { lat: 30.4383, lon: -84.2807 },
  'Georgia': { lat: 33.749, lon: -84.388 },
  'Hawaii': { lat: 21.3069, lon: -157.8583 },
  'Idaho': { lat: 43.6150, lon: -116.2023 },
  'Illinois': { lat: 39.7984, lon: -89.6544 },
  'Indiana': { lat: 39.7684, lon: -86.1581 },
  'Iowa': { lat: 41.5868, lon: -93.625 },
  'Kansas': { lat: 39.0489, lon: -95.678 },
  'Kentucky': { lat: 38.1867, lon: -84.8753 },
  'Louisiana': { lat: 30.4515, lon: -91.1871 },
  'Maine': { lat: 44.3106, lon: -69.7795 },
  'Maryland': { lat: 38.9784, lon: -76.4922 },
  'Massachusetts': { lat: 42.3601, lon: -71.0589 },
  'Michigan': { lat: 42.7325, lon: -84.5555 },
  'Minnesota': { lat: 44.9553, lon: -93.1022 },
  'Mississippi': { lat: 32.2988, lon: -90.1848 },
  'Missouri': { lat: 38.5767, lon: -92.1735 },
  'Montana': { lat: 46.5958, lon: -112.027 },
  'Nebraska': { lat: 40.8136, lon: -96.7026 },
  'Nevada': { lat: 39.1638, lon: -119.7674 },
  'New Hampshire': { lat: 43.2081, lon: -71.5376 },
  'New Jersey': { lat: 40.2206, lon: -74.77 },
  'New Mexico': { lat: 35.687, lon: -105.9378 },
  'New York': { lat: 42.6526, lon: -73.7562 },
  'North Carolina': { lat: 35.7796, lon: -78.6382 },
  'North Dakota': { lat: 46.8083, lon: -100.7837 },
  'Ohio': { lat: 39.9612, lon: -82.9988 },
  'Oklahoma': { lat: 35.4676, lon: -97.5164 },
  'Oregon': { lat: 44.9429, lon: -123.0351 },
  'Pennsylvania': { lat: 40.2732, lon: -76.8867 },
  'Rhode Island': { lat: 41.824, lon: -71.4128 },
  'South Carolina': { lat: 34.0007, lon: -81.0348 },
  'South Dakota': { lat: 44.3683, lon: -100.3510 },
  'Tennessee': { lat: 36.1627, lon: -86.7816 },
  'Texas': { lat: 30.2672, lon: -97.7431 },
  'Utah': { lat: 40.7608, lon: -111.891 },
  'Vermont': { lat: 44.2601, lon: -72.5754 },
  'Virginia': { lat: 37.5407, lon: -77.436 },
  'Washington': { lat: 47.0379, lon: -122.9007 },
  'West Virginia': { lat: 38.3498, lon: -81.6326 },
  'Wisconsin': { lat: 43.0731, lon: -89.4012 },
  'Wyoming': { lat: 41.14, lon: -104.8202 },
};

interface GammaMarket {
  id: string;
  question: string;
  description: string;
  slug: string;
  volume: string | number;
  endDate: string;
  clobTokenIds: string;
  image: string;
  conditionId: string;
  active: boolean;
  closed: boolean;
}

interface OrderBookResponse {
  bids?: Array<{ price: string; size: string }>;
  asks?: Array<{ price: string; size: string }>;
}

function extractLocation(text: string): { city: string; lat: number; lon: number } | null {
  if (!text) return null;

  // Check for city names (longest first to match "New York" before "York", etc.)
  const sortedCities = Object.keys(CITY_GEOCODING).sort((a, b) => b.length - a.length);
  for (const city of sortedCities) {
    const regex = new RegExp(`\\b${city.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
    if (regex.test(text)) {
      const coords = CITY_GEOCODING[city];
      return { city, lat: coords.lat, lon: coords.lon };
    }
  }

  // Check for state names
  for (const state of US_STATES) {
    const regex = new RegExp(`\\b${state.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
    if (regex.test(text)) {
      const coords = STATE_COORDS[state];
      if (coords) {
        return { city: state, lat: coords.lat, lon: coords.lon };
      }
    }
  }

  return null;
}

async function fetchMidPrice(tokenId: string): Promise<number | null> {
  try {
    const response = await fetch(`https://clob.polymarket.com/book?token_id=${tokenId}`, {
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) return null;

    const book: OrderBookResponse = await response.json();

    const bestBid = book.bids && book.bids.length > 0 ? parseFloat(book.bids[0].price) : null;
    const bestAsk = book.asks && book.asks.length > 0 ? parseFloat(book.asks[0].price) : null;

    if (bestBid !== null && bestAsk !== null) {
      return (bestBid + bestAsk) / 2;
    }
    if (bestBid !== null) return bestBid;
    if (bestAsk !== null) return bestAsk;

    return null;
  } catch {
    return null;
  }
}

export async function GET() {
  try {
    const keywords = [
      'temperature', 'weather', 'hurricane', 'snow', 'rain',
      'storm', 'tornado', 'flood', 'heat', 'cold',
      'wind', 'drought', 'blizzard',
    ];

    // Fetch markets for each keyword in parallel
    const fetchPromises = keywords.map(async (keyword) => {
      try {
        const url = `https://gamma-api.polymarket.com/markets?_q=${encodeURIComponent(keyword)}&active=true&closed=false&limit=20`;
        const response = await fetch(url, {
          signal: AbortSignal.timeout(10000),
        });

        if (!response.ok) return [];

        const markets: GammaMarket[] = await response.json();
        return markets;
      } catch {
        return [];
      }
    });

    const results = await Promise.all(fetchPromises);

    // Flatten and deduplicate by market ID
    const seenIds = new Set<string>();
    const uniqueMarkets: GammaMarket[] = [];

    for (const marketList of results) {
      for (const market of marketList) {
        if (!seenIds.has(market.id)) {
          seenIds.add(market.id);
          uniqueMarkets.push(market);
        }
      }
    }

    // Parse token IDs and fetch prices, extract locations
    const enrichedMarkets = await Promise.all(
      uniqueMarkets.map(async (market) => {
        // Parse clobTokenIds - it's a JSON string array like '["token1","token2"]'
        let tokenIds: string[] = [];
        try {
          tokenIds = JSON.parse(market.clobTokenIds || '[]');
        } catch {
          tokenIds = [];
        }

        const yesTokenId = tokenIds[0] || null;
        const noTokenId = tokenIds[1] || null;

        // Fetch mid-price for the YES token
        let currentPrice: number | null = null;
        if (yesTokenId) {
          currentPrice = await fetchMidPrice(yesTokenId);
        }

        // Extract location from the question text
        const location = extractLocation(market.question) || extractLocation(market.description);

        return {
          id: market.id,
          question: market.question,
          description: market.description,
          slug: market.slug,
          volume: market.volume,
          endDate: market.endDate,
          tokenIds: {
            yes: yesTokenId,
            no: noTokenId,
          },
          currentPrice,
          location,
          image: market.image,
        };
      })
    );

    return NextResponse.json(
      { markets: enrichedMarkets, count: enrichedMarkets.length },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=120',
        },
      }
    );
  } catch (error) {
    console.error('Markets API error:', error);
    return NextResponse.json(
      { error: 'Internal server error fetching weather markets' },
      { status: 500 }
    );
  }
}
