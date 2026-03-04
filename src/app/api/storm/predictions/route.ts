import { NextRequest, NextResponse } from 'next/server';

// In-memory store for predictions (MVP - resets on server restart)
interface Prediction {
  id: string;
  marketId: string;
  prediction: 'YES' | 'NO';
  oddsAtPrediction: number;
  userId: string;
  timestamp: number;
}

const predictionsStore = new Map<string, Prediction[]>();

function generateId(): string {
  return `pred_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

function getConsensus(predictions: Prediction[]): {
  yesCount: number;
  noCount: number;
  yesPercent: number;
  noPercent: number;
  total: number;
} {
  const total = predictions.length;

  if (total === 0) {
    return { yesCount: 0, noCount: 0, yesPercent: 0, noPercent: 0, total: 0 };
  }

  const yesCount = predictions.filter((p) => p.prediction === 'YES').length;
  const noCount = total - yesCount;

  return {
    yesCount,
    noCount,
    yesPercent: Math.round((yesCount / total) * 10000) / 100,
    noPercent: Math.round((noCount / total) * 10000) / 100,
    total,
  };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const marketId = searchParams.get('marketId');

    if (!marketId) {
      return NextResponse.json(
        { error: 'Missing required query parameter: marketId' },
        { status: 400 }
      );
    }

    const predictions = predictionsStore.get(marketId) || [];
    const consensus = getConsensus(predictions);

    return NextResponse.json({
      marketId,
      consensus,
      predictions: predictions.map((p) => ({
        id: p.id,
        prediction: p.prediction,
        oddsAtPrediction: p.oddsAtPrediction,
        userId: p.userId,
        timestamp: p.timestamp,
      })),
    });
  } catch (error) {
    console.error('Predictions GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error fetching predictions' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    let body: {
      marketId?: string;
      prediction?: string;
      oddsAtPrediction?: number;
      userId?: string;
    };

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    const { marketId, prediction, oddsAtPrediction, userId } = body;

    // Validation
    if (!marketId || typeof marketId !== 'string') {
      return NextResponse.json(
        { error: 'marketId is required and must be a string' },
        { status: 400 }
      );
    }

    if (prediction !== 'YES' && prediction !== 'NO') {
      return NextResponse.json(
        { error: 'prediction must be "YES" or "NO"' },
        { status: 400 }
      );
    }

    if (
      oddsAtPrediction === undefined ||
      typeof oddsAtPrediction !== 'number' ||
      oddsAtPrediction < 0 ||
      oddsAtPrediction > 1
    ) {
      return NextResponse.json(
        { error: 'oddsAtPrediction must be a number between 0 and 1' },
        { status: 400 }
      );
    }

    // Generate anonymous ID if no userId provided
    const finalUserId = userId && typeof userId === 'string'
      ? userId
      : `anon_${Math.random().toString(36).substring(2, 9)}`;

    const newPrediction: Prediction = {
      id: generateId(),
      marketId,
      prediction: prediction as 'YES' | 'NO',
      oddsAtPrediction,
      userId: finalUserId,
      timestamp: Date.now(),
    };

    // Store the prediction
    const existing = predictionsStore.get(marketId) || [];
    existing.push(newPrediction);
    predictionsStore.set(marketId, existing);

    // Return the new prediction along with updated consensus
    const consensus = getConsensus(existing);

    return NextResponse.json(
      {
        prediction: {
          id: newPrediction.id,
          marketId: newPrediction.marketId,
          prediction: newPrediction.prediction,
          oddsAtPrediction: newPrediction.oddsAtPrediction,
          userId: newPrediction.userId,
          timestamp: newPrediction.timestamp,
        },
        consensus,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Predictions POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error saving prediction' },
      { status: 500 }
    );
  }
}
