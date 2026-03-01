import { NextRequest, NextResponse } from 'next/server';
import { buildHmacSignature } from '@polymarket/builder-signing-sdk';

export async function POST(request: NextRequest) {
  try {
    const { method, requestPath, body } = await request.json();

    const apiKey = process.env.POLYMARKET_BUILDER_API_KEY;
    const secret = process.env.POLYMARKET_BUILDER_SECRET;
    const passphrase = process.env.POLYMARKET_BUILDER_PASSPHRASE;

    if (!apiKey || !secret || !passphrase) {
      return NextResponse.json(
        { error: 'Builder credentials not configured' },
        { status: 500 }
      );
    }

    const timestamp = Math.floor(Date.now() / 1000);
    const signature = buildHmacSignature(
      secret,
      timestamp,
      method,
      requestPath,
      body ? JSON.stringify(body) : ''
    );

    return NextResponse.json({
      'POLY_BUILDER_API_KEY': apiKey,
      'POLY_BUILDER_SIGNATURE': signature,
      'POLY_BUILDER_TIMESTAMP': timestamp.toString(),
      'POLY_BUILDER_PASSPHRASE': passphrase,
    });
  } catch (error: any) {
    console.error('Builder signing error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to sign request' },
      { status: 500 }
    );
  }
}
