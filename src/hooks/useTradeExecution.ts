'use client';

import { useState, useCallback } from 'react';
import { ClobClient } from '@polymarket/clob-client';
import { FEE_RATE, FEE_RECIPIENT } from '@/lib/constants';

interface TradeParams {
  tokenId: string;
  side: 'BUY' | 'SELL';
  price: number;
  size: number;
  orderType?: 'limit' | 'market';
  negRisk?: boolean;
}

interface TradeResult {
  success: boolean;
  orderId?: string;
  error?: string;
  fee?: number;
}

interface UseTradeExecution {
  execute: (params: TradeParams) => Promise<TradeResult>;
  isSubmitting: boolean;
  result: TradeResult | null;
  error: string | null;
}

export function useTradeExecution(clobClient: ClobClient | null): UseTradeExecution {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<TradeResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(
    async (params: TradeParams): Promise<TradeResult> => {
      if (!clobClient) {
        const err = { success: false, error: 'Trading session not initialized' };
        setError(err.error);
        setResult(err);
        return err;
      }

      setIsSubmitting(true);
      setError(null);
      setResult(null);

      try {
        const { tokenId, side, price, size, orderType = 'limit', negRisk } = params;

        // Calculate platform fee
        const tradeAmount = price * size;
        const fee = tradeAmount * FEE_RATE;

        let signedOrder;

        if (orderType === 'market') {
          // Market order using Fill-or-Kill
          signedOrder = await clobClient.createMarketOrder({
            tokenID: tokenId,
            amount: side === 'BUY' ? tradeAmount : size,
            side: side as any,
            feeRateBps: 0,
          });
        } else {
          // Limit order using Good-Till-Cancelled
          signedOrder = await clobClient.createOrder({
            tokenID: tokenId,
            price,
            size,
            side: side as any,
            feeRateBps: 0,
          });
        }

        // Submit order via our API route (which attaches builder headers)
        const response = await fetch('/api/trade', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            signedOrder,
            orderType: orderType === 'market' ? 'FOK' : 'GTC',
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Order submission failed');
        }

        const tradeResult: TradeResult = {
          success: true,
          orderId: data.orderID || data.id,
          fee,
        };
        setResult(tradeResult);
        return tradeResult;
      } catch (err: any) {
        console.error('Trade execution error:', err);
        const errorMsg = err.message || 'Failed to execute trade';
        const tradeResult: TradeResult = { success: false, error: errorMsg };
        setError(errorMsg);
        setResult(tradeResult);
        return tradeResult;
      } finally {
        setIsSubmitting(false);
      }
    },
    [clobClient]
  );

  return { execute, isSubmitting, result, error };
}

// Helper to calculate fee for display purposes
export function calculatePlatformFee(tradeAmount: number): {
  fee: number;
  feePercent: string;
  total: number;
  feeRecipient: string;
} {
  const fee = tradeAmount * FEE_RATE;
  return {
    fee,
    feePercent: '0.50%',
    total: tradeAmount + fee,
    feeRecipient: FEE_RECIPIENT,
  };
}
