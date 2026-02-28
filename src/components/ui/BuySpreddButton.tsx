'use client';

import './BuySpreddButton.css';

interface BuySpreddButtonProps {
  className?: string;
}

export function BuySpreddButton({ className = '' }: BuySpreddButtonProps) {
  return (
    <a
      href="https://app.virtuals.io/geneses/1057"
      target="_blank"
      rel="noopener noreferrer"
      className={`spredd-btn ${className}`}
    >
      <strong>Buy $SPRDD</strong>
    </a>
  );
}
