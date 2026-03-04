import { NextRequest, NextResponse } from 'next/server';

const USER_AGENT = 'StormSpredd (contact@stormsspredd.com)';

interface NWSPointsResponse {
  properties: {
    forecast: string;
    forecastHourly: string;
    forecastGridData: string;
  };
}

interface NWSForecastPeriod {
  number: number;
  name: string;
  temperature: number;
  temperatureUnit: string;
  windSpeed: string;
  shortForecast: string;
  detailedForecast: string;
  probabilityOfPrecipitation?: {
    value: number | null;
  };
}

interface NWSForecastResponse {
  properties: {
    periods: NWSForecastPeriod[];
  };
}

function determineEdge(
  forecastValue: number,
  marketPrice: number,
  metric: string
): {
  edge: boolean;
  strength: 'weak' | 'moderate' | 'strong';
  divergence: number;
  explanation: string;
} {
  // Market price is typically 0-1 (probability), convert to percentage for comparison
  const marketPercent = marketPrice * 100;

  let divergence: number;
  let explanation: string;

  if (metric === 'precipitation') {
    // forecastValue is precipitation probability (0-100)
    divergence = forecastValue - marketPercent;

    if (Math.abs(divergence) < 5) {
      return {
        edge: false,
        strength: 'weak',
        divergence,
        explanation: `NWS precipitation probability (${forecastValue.toFixed(1)}%) closely matches market price (${marketPercent.toFixed(1)}%). No significant edge detected.`,
      };
    }

    const direction = divergence > 0 ? 'higher' : 'lower';
    explanation = `NWS forecasts ${forecastValue.toFixed(1)}% precipitation probability, but the market implies ${marketPercent.toFixed(1)}%. The forecast is ${Math.abs(divergence).toFixed(1)} percentage points ${direction} than the market price.`;
  } else {
    // temperature metric - compare forecast temp to what market implies
    // For temperature markets, forecastValue is the actual forecast temperature
    // and marketPrice represents the implied probability of a threshold being met
    divergence = forecastValue - marketPercent;

    if (Math.abs(divergence) < 3) {
      return {
        edge: false,
        strength: 'weak',
        divergence,
        explanation: `NWS temperature forecast aligns with market expectations. Forecast value: ${forecastValue.toFixed(1)}. Market implied: ${marketPercent.toFixed(1)}%. No significant edge detected.`,
      };
    }

    const direction = divergence > 0 ? 'above' : 'below';
    explanation = `NWS forecasts a temperature value of ${forecastValue.toFixed(1)}, while market implies ${marketPercent.toFixed(1)}%. The forecast is ${Math.abs(divergence).toFixed(1)} points ${direction} market expectations.`;
  }

  const absDivergence = Math.abs(divergence);
  let strength: 'weak' | 'moderate' | 'strong';

  if (absDivergence >= 20) {
    strength = 'strong';
  } else if (absDivergence >= 10) {
    strength = 'moderate';
  } else {
    strength = 'weak';
  }

  return {
    edge: absDivergence >= 5,
    strength,
    divergence,
    explanation,
  };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const lat = searchParams.get('lat');
    const lon = searchParams.get('lon');
    const metric = searchParams.get('metric') || 'temperature';
    const marketPriceStr = searchParams.get('marketPrice');

    if (!lat || !lon) {
      return NextResponse.json(
        { error: 'Missing required query parameters: lat and lon' },
        { status: 400 }
      );
    }

    if (!marketPriceStr) {
      return NextResponse.json(
        { error: 'Missing required query parameter: marketPrice' },
        { status: 400 }
      );
    }

    const latitude = parseFloat(lat);
    const longitude = parseFloat(lon);
    const marketPrice = parseFloat(marketPriceStr);

    if (isNaN(latitude) || isNaN(longitude)) {
      return NextResponse.json(
        { error: 'lat and lon must be valid numbers' },
        { status: 400 }
      );
    }

    if (isNaN(marketPrice) || marketPrice < 0 || marketPrice > 1) {
      return NextResponse.json(
        { error: 'marketPrice must be a number between 0 and 1' },
        { status: 400 }
      );
    }

    if (metric !== 'temperature' && metric !== 'precipitation') {
      return NextResponse.json(
        { error: 'metric must be "temperature" or "precipitation"' },
        { status: 400 }
      );
    }

    // Step 1: Get the forecast URL for this location from NWS points API
    const pointsResponse = await fetch(
      `https://api.weather.gov/points/${latitude.toFixed(4)},${longitude.toFixed(4)}`,
      {
        headers: {
          'User-Agent': USER_AGENT,
          'Accept': 'application/json',
        },
        signal: AbortSignal.timeout(10000),
      }
    );

    if (!pointsResponse.ok) {
      if (pointsResponse.status === 404) {
        return NextResponse.json(
          { error: 'Location not supported by NWS (only US locations are covered)' },
          { status: 404 }
        );
      }
      return NextResponse.json(
        { error: 'Failed to fetch location data from NWS' },
        { status: pointsResponse.status }
      );
    }

    const pointsData: NWSPointsResponse = await pointsResponse.json();
    const forecastUrl = pointsData.properties.forecast;

    if (!forecastUrl) {
      return NextResponse.json(
        { error: 'No forecast URL available for this location' },
        { status: 404 }
      );
    }

    // Step 2: Fetch the actual forecast
    const forecastResponse = await fetch(forecastUrl, {
      headers: {
        'User-Agent': USER_AGENT,
        'Accept': 'application/json',
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!forecastResponse.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch forecast from NWS' },
        { status: forecastResponse.status }
      );
    }

    const forecastData: NWSForecastResponse = await forecastResponse.json();
    const periods = forecastData.properties.periods;

    if (!periods || periods.length === 0) {
      return NextResponse.json(
        { error: 'No forecast periods available' },
        { status: 404 }
      );
    }

    // Extract relevant forecast value based on metric
    let forecastValue: number;
    const firstPeriod = periods[0];

    if (metric === 'precipitation') {
      // Use precipitation probability from the forecast
      forecastValue = firstPeriod.probabilityOfPrecipitation?.value ?? 0;
    } else {
      // Use temperature
      forecastValue = firstPeriod.temperature;
    }

    // Step 3: Calculate edge
    const edgeResult = determineEdge(forecastValue, marketPrice, metric);

    return NextResponse.json(
      {
        edge: edgeResult.edge,
        strength: edgeResult.strength,
        forecastValue,
        marketPrice,
        divergence: edgeResult.divergence,
        explanation: edgeResult.explanation,
        forecast: {
          period: firstPeriod.name,
          temperature: firstPeriod.temperature,
          temperatureUnit: firstPeriod.temperatureUnit,
          windSpeed: firstPeriod.windSpeed,
          shortForecast: firstPeriod.shortForecast,
          detailedForecast: firstPeriod.detailedForecast,
          precipitationProbability: firstPeriod.probabilityOfPrecipitation?.value ?? null,
        },
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=60',
        },
      }
    );
  } catch (error) {
    console.error('Edge detection API error:', error);
    return NextResponse.json(
      { error: 'Internal server error during edge detection' },
      { status: 500 }
    );
  }
}
