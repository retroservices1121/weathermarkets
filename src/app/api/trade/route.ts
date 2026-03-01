import { NextRequest, NextResponse } from 'next/server';
import { buildHmacSignature } from '@polymarket/builder-signing-sdk';

const CLOB_HOST = 'https://clob.polymarket.com';

export async function POST(request: NextRequest) {
  try {
    const { signedOrder, userHeaders } = await request.json();

    const apiKey = process.env.POLYMARKET_BUILDER_API_KEY;
    const secret = process.env.POLYMARKET_BUILDER_SECRET;
    const passphrase = process.env.POLYMARKET_BUILDER_PASSPHRASE;

    if (!apiKey || !secret || !passphrase) {
      return NextResponse.json(
        { error: 'Builder credentials not configured' },
        { status: 500 }
      );
    }

    // Generate builder HMAC headers for this order submission
    const timestamp = Math.floor(Date.now() / 1000);
    const requestPath = '/order';
    const bodyStr = JSON.stringify(signedOrder);

    const signature = buildHmacSignature(
      secret,
      timestamp,
      'POST',
      requestPath,
      bodyStr
    );

    // Forward the order to the CLOB with builder headers
    const response = await fetch(`${CLOB_HOST}/order`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // User auth headers
        ...(userHeaders || {}),
        // Builder headers
        'POLY_BUILDER_API_KEY': apiKey,
        'POLY_BUILDER_SIGNATURE': signature,
        'POLY_BUILDER_TIMESTAMP': timestamp.toString(),
        'POLY_BUILDER_PASSPHRASE': passphrase,
      },
      body: bodyStr,
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.error || 'Order submission failed', details: data },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Trade submission error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to submit trade' },
      { status: 500 }
    );
  }
}
