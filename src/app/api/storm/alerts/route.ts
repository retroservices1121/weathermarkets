import { NextRequest, NextResponse } from 'next/server';

const USER_AGENT = 'StormSpredd (contact@stormsspredd.com)';

interface AlertFeature {
  id: string;
  properties: {
    event: string;
    headline: string | null;
    description: string | null;
    severity: string;
    certainty: string;
    urgency: string;
    areaDesc: string;
    onset: string | null;
    expires: string | null;
  };
  geometry: unknown;
}

interface AlertsResponse {
  features: AlertFeature[];
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const state = searchParams.get('state');

    let apiUrl: string;

    if (state) {
      const stateCode = state.toUpperCase().trim();
      if (!/^[A-Z]{2}$/.test(stateCode)) {
        return NextResponse.json(
          { error: 'State must be a valid 2-letter state code (e.g., FL, TX, CA)' },
          { status: 400 }
        );
      }
      apiUrl = `https://api.weather.gov/alerts/active?area=${stateCode}`;
    } else {
      apiUrl = 'https://api.weather.gov/alerts/active?status=actual&limit=50';
    }

    const response = await fetch(apiUrl, {
      headers: {
        'User-Agent': USER_AGENT,
        'Accept': 'application/geo+json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { error: 'Failed to fetch alerts from NOAA', details: errorText },
        { status: response.status }
      );
    }

    const data: AlertsResponse = await response.json();

    const alerts = (data.features || []).map((feature: AlertFeature) => ({
      id: feature.id,
      event: feature.properties.event,
      headline: feature.properties.headline,
      description: feature.properties.description,
      severity: feature.properties.severity,
      certainty: feature.properties.certainty,
      urgency: feature.properties.urgency,
      areaDesc: feature.properties.areaDesc,
      onset: feature.properties.onset,
      expires: feature.properties.expires,
      geometry: feature.geometry,
    }));

    return NextResponse.json({ alerts, count: alerts.length }, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=30',
      },
    });
  } catch (error) {
    console.error('Alerts API error:', error);
    return NextResponse.json(
      { error: 'Internal server error fetching weather alerts' },
      { status: 500 }
    );
  }
}
