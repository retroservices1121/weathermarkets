'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export interface OrderFormProps {
  outcome: 'YES' | 'NO';
  currentPrice: number;
  onPlaceOrder?: (amount: number) => void;
}

export function OrderForm({ outcome, currentPrice, onPlaceOrder }: OrderFormProps) {
  const [amount, setAmount] = useState('');
  const [shares, setShares] = useState('');

  const handleAmountChange = (value: string) => {
    setAmount(value);
    if (value && !isNaN(parseFloat(value))) {
      const numAmount = parseFloat(value);
      const numShares = numAmount / currentPrice;
      setShares(numShares.toFixed(2));
    } else {
      setShares('');
    }
  };

  const handleSharesChange = (value: string) => {
    setShares(value);
    if (value && !isNaN(parseFloat(value))) {
      const numShares = parseFloat(value);
      const numAmount = numShares * currentPrice;
      setAmount(numAmount.toFixed(2));
    } else {
      setAmount('');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (amount && !isNaN(parseFloat(amount))) {
      onPlaceOrder?.(parseFloat(amount));
    }
  };

  const isYes = outcome === 'YES';

  return (
    <div className="bg-background-card border border-border rounded-lg p-4">
      <div className="mb-4">
        <h3 className="text-text-primary font-semibold mb-1">Place Order</h3>
        <p className="text-text-muted text-sm">
          Buy {outcome} at {(currentPrice * 100).toFixed(1)}%
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Amount Input */}
        <div>
          <label className="block text-text-secondary text-sm mb-2">
            Amount (USD)
          </label>
          <Input
            type="number"
            value={amount}
            onChange={(e) => handleAmountChange(e.target.value)}
            placeholder="0.00"
            step="0.01"
            min="0"
          />
        </div>

        {/* Shares Input */}
        <div>
          <label className="block text-text-secondary text-sm mb-2">
            Shares
          </label>
          <Input
            type="number"
            value={shares}
            onChange={(e) => handleSharesChange(e.target.value)}
            placeholder="0.00"
            step="0.01"
            min="0"
          />
        </div>

        {/* Quick Amount Buttons */}
        <div className="grid grid-cols-4 gap-2">
          {[10, 25, 50, 100].map((value) => (
            <Button
              key={value}
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => handleAmountChange(value.toString())}
            >
              ${value}
            </Button>
          ))}
        </div>

        {/* Summary */}
        {amount && shares && (
          <div className="bg-background-hover p-3 rounded-lg space-y-2 text-sm">
            <div className="flex justify-between text-text-secondary">
              <span>Price per share</span>
              <span>${currentPrice.toFixed(3)}</span>
            </div>
            <div className="flex justify-between text-text-secondary">
              <span>Shares</span>
              <span>{shares}</span>
            </div>
            <div className="flex justify-between text-text-primary font-semibold pt-2 border-t border-border">
              <span>Total</span>
              <span>${amount}</span>
            </div>
            <div className="flex justify-between text-text-muted text-xs">
              <span>Potential return</span>
              <span className={isYes ? 'text-success' : 'text-error'}>
                ${(parseFloat(shares) || 0).toFixed(2)}
              </span>
            </div>
          </div>
        )}

        {/* Submit Button */}
        <Button
          type="submit"
          variant={isYes ? 'success' : 'error'}
          className="w-full"
          disabled={!amount || parseFloat(amount) <= 0}
        >
          Buy {outcome}
        </Button>

        {/* Info Message */}
        <p className="text-text-muted text-xs text-center">
          Wallet connection coming soon. Orders will be bridged from Base to Polymarket.
        </p>
      </form>
    </div>
  );
}
