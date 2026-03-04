'use client';

import { useRef, useState, useCallback } from 'react';
import { Share2, Link2, Download, X, Check, CloudLightning } from 'lucide-react';

interface ShareCardProps {
  marketQuestion: string;
  prediction: 'YES' | 'NO';
  outcome?: 'correct' | 'incorrect' | null;
  accuracy?: number | null; // Percentage of correct predictions
  marketPrice: number;
  onClose?: () => void;
}

export function ShareCard({
  marketQuestion,
  prediction,
  outcome,
  accuracy,
  marketPrice,
  onClose,
}: ShareCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const pricePercent = Math.round(marketPrice * 100);

  const handleShareToX = useCallback(() => {
    const text = `My prediction on StormSpredd: ${prediction} on "${marketQuestion}" (Market: ${pricePercent}%)${
      outcome === 'correct' ? ' - I was RIGHT!' : outcome === 'incorrect' ? ' - Market was right.' : ''
    }`;
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank', 'width=550,height=420');
  }, [marketQuestion, prediction, pricePercent, outcome]);

  const handleCopyLink = useCallback(async () => {
    try {
      const shareUrl = `${window.location.origin}/storm?prediction=${prediction}&q=${encodeURIComponent(marketQuestion)}`;
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API not available
    }
  }, [prediction, marketQuestion]);

  const handleDownload = useCallback(async () => {
    if (!cardRef.current) return;
    setDownloading(true);

    try {
      // Dynamic import of html2canvas
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: '#0a0e1a',
        scale: 2,
        useCORS: true,
      });

      const link = document.createElement('a');
      link.download = `stormspredd-prediction-${Date.now()}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error('Failed to capture card:', err);
    } finally {
      setDownloading(false);
    }
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="max-w-md w-full">
        {/* Close Button */}
        {onClose && (
          <div className="flex justify-end mb-3">
            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-gray-800/50 hover:bg-gray-700/50 text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Card Content - this is what gets captured as PNG */}
        <div
          ref={cardRef}
          className="rounded-2xl overflow-hidden border border-gray-800/50"
          style={{
            background: 'linear-gradient(135deg, #0a0e1a 0%, #12141a 40%, #1a1f2e 100%)',
          }}
        >
          {/* Radar texture background decoration */}
          <div className="relative p-6">
            {/* Decorative radar circles */}
            <div className="absolute top-0 right-0 w-40 h-40 rounded-full border border-[#00d4ff]/10 opacity-30" style={{ transform: 'translate(30%, -30%)' }} />
            <div className="absolute top-0 right-0 w-28 h-28 rounded-full border border-[#00d4ff]/15 opacity-30" style={{ transform: 'translate(30%, -30%)' }} />
            <div className="absolute top-0 right-0 w-16 h-16 rounded-full border border-[#00d4ff]/20 opacity-30" style={{ transform: 'translate(30%, -30%)' }} />

            {/* Branding */}
            <div className="flex items-center gap-2 mb-5">
              <CloudLightning className="w-5 h-5 text-[#00d4ff]" />
              <span className="text-[#00d4ff] font-bold text-sm tracking-wider uppercase">
                StormSpredd
              </span>
            </div>

            {/* Market Question */}
            <p className="text-white text-base font-semibold leading-snug mb-5">
              {marketQuestion}
            </p>

            {/* Prediction */}
            <div className="flex items-center gap-4 mb-4">
              <div>
                <p className="text-gray-500 text-xs font-medium mb-1">My Prediction</p>
                <span
                  className={`inline-block px-4 py-1.5 rounded-lg text-lg font-bold ${
                    prediction === 'YES'
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-red-500/20 text-red-400 border border-red-500/30'
                  }`}
                >
                  {prediction}
                </span>
              </div>
              <div>
                <p className="text-gray-500 text-xs font-medium mb-1">Market Price</p>
                <span className="text-[#00d4ff] text-lg font-bold font-mono tabular-nums">
                  {pricePercent}¢
                </span>
              </div>
            </div>

            {/* Outcome */}
            {outcome && (
              <div
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold mb-3 ${
                  outcome === 'correct'
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                    : 'bg-red-500/15 text-red-400 border border-red-500/20'
                }`}
              >
                {outcome === 'correct' ? (
                  <>
                    <Check className="w-4 h-4" />
                    Correct!
                  </>
                ) : (
                  <>
                    <X className="w-4 h-4" />
                    Incorrect
                  </>
                )}
              </div>
            )}

            {/* Accuracy stats */}
            {accuracy !== null && accuracy !== undefined && (
              <p className="text-gray-500 text-xs">
                Overall accuracy:{' '}
                <span className="text-white font-semibold">{accuracy}%</span>
              </p>
            )}

            {/* Footer */}
            <div className="mt-5 pt-4 border-t border-gray-800/50 flex items-center justify-between">
              <p className="text-gray-600 text-[10px]">stormspredd.com</p>
              <p className="text-gray-600 text-[10px]">Weather x Prediction Markets</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 mt-4">
          <button
            onClick={handleShareToX}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-[#12141a] border border-gray-800/50 rounded-xl text-white text-sm font-medium hover:bg-[#1a1f2e] transition-colors"
          >
            <Share2 className="w-4 h-4" />
            Share to X
          </button>
          <button
            onClick={handleCopyLink}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-[#12141a] border border-gray-800/50 rounded-xl text-white text-sm font-medium hover:bg-[#1a1f2e] transition-colors"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span className="text-emerald-400">Copied!</span>
              </>
            ) : (
              <>
                <Link2 className="w-4 h-4" />
                Copy Link
              </>
            )}
          </button>
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-[#00d4ff] hover:bg-[#00b8e0] disabled:opacity-50 rounded-xl text-[#0a0e1a] text-sm font-bold transition-colors"
          >
            {downloading ? (
              <div className="w-4 h-4 border-2 border-[#0a0e1a] border-t-transparent rounded-full animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
