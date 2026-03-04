'use client';

import { useState, useEffect, useCallback } from 'react';
import { Users, CheckCircle } from 'lucide-react';

interface ConsensusMeterProps {
  marketId: string;
  marketPrice: number;
  onPredict: (prediction: 'YES' | 'NO') => void;
}

interface ConsensusData {
  yesVotes: number;
  noVotes: number;
  userVote: 'YES' | 'NO' | null;
}

const STORAGE_KEY_PREFIX = 'stormspredd_consensus_';

function getStoredConsensus(marketId: string): ConsensusData {
  if (typeof window === 'undefined') {
    return { yesVotes: 0, noVotes: 0, userVote: null };
  }

  try {
    const stored = localStorage.getItem(`${STORAGE_KEY_PREFIX}${marketId}`);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch {
    // Ignore parse errors
  }

  // Default consensus: seed with some baseline votes based on market ID hash
  const hash = marketId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const baseYes = (hash % 30) + 10;
  const baseNo = ((hash * 7) % 25) + 8;

  return {
    yesVotes: baseYes,
    noVotes: baseNo,
    userVote: null,
  };
}

function saveConsensus(marketId: string, data: ConsensusData) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}${marketId}`, JSON.stringify(data));
  } catch {
    // Ignore storage errors
  }
}

export function ConsensusMeter({ marketId, marketPrice, onPredict }: ConsensusMeterProps) {
  const [consensus, setConsensus] = useState<ConsensusData>({
    yesVotes: 0,
    noVotes: 0,
    userVote: null,
  });

  // Load from localStorage on mount
  useEffect(() => {
    const stored = getStoredConsensus(marketId);
    setConsensus(stored);
  }, [marketId]);

  const totalVotes = consensus.yesVotes + consensus.noVotes;
  const yesPercent = totalVotes > 0 ? Math.round((consensus.yesVotes / totalVotes) * 100) : 50;
  const noPercent = totalVotes > 0 ? 100 - yesPercent : 50;
  const marketPercent = Math.round(marketPrice * 100);
  const delta = yesPercent - marketPercent;

  const hasVoted = consensus.userVote !== null;

  const handleVote = useCallback(
    (side: 'YES' | 'NO') => {
      if (hasVoted) return;

      const updated: ConsensusData = {
        ...consensus,
        yesVotes: consensus.yesVotes + (side === 'YES' ? 1 : 0),
        noVotes: consensus.noVotes + (side === 'NO' ? 1 : 0),
        userVote: side,
      };

      setConsensus(updated);
      saveConsensus(marketId, updated);
      onPredict(side);
    },
    [consensus, hasVoted, marketId, onPredict]
  );

  return (
    <div className="bg-[#12141a] rounded-xl border border-gray-800/30 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-gray-400 text-xs font-semibold uppercase tracking-wider">
          Crowd Consensus
        </h3>
        <div className="flex items-center gap-1.5 text-gray-500">
          <Users className="w-3.5 h-3.5" />
          <span className="text-[10px] font-medium">{totalVotes} votes</span>
        </div>
      </div>

      {/* Consensus Bar */}
      <div className="mb-3">
        <div className="flex justify-between mb-1.5">
          <span className="text-emerald-400 text-xs font-semibold tabular-nums">
            YES {yesPercent}%
          </span>
          <span className="text-red-400 text-xs font-semibold tabular-nums">
            NO {noPercent}%
          </span>
        </div>
        <div className="h-3 bg-gray-800 rounded-full overflow-hidden flex">
          <div
            className="bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-500 ease-out rounded-l-full"
            style={{ width: `${yesPercent}%` }}
          />
          <div
            className="bg-gradient-to-r from-red-400 to-red-500 transition-all duration-500 ease-out rounded-r-full"
            style={{ width: `${noPercent}%` }}
          />
        </div>
      </div>

      {/* Market vs Crowd delta */}
      <div className="text-center mb-4">
        <p className="text-gray-500 text-xs">
          Crowd says{' '}
          <span className="text-white font-semibold">{yesPercent}%</span>. Market says{' '}
          <span className="text-[#00d4ff] font-semibold">{marketPercent}%</span>.
          {delta !== 0 && (
            <span
              className={`ml-1.5 font-semibold ${
                delta > 0 ? 'text-emerald-400' : 'text-red-400'
              }`}
            >
              ({delta > 0 ? '+' : ''}
              {delta}%)
            </span>
          )}
        </p>
      </div>

      {/* Vote Buttons */}
      {!hasVoted ? (
        <div className="space-y-2">
          <p className="text-gray-400 text-xs text-center font-medium mb-2">
            Make Your Call
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => handleVote('YES')}
              className="flex-1 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm font-bold hover:bg-emerald-500/20 hover:border-emerald-500/50 transition-all"
            >
              YES
            </button>
            <button
              onClick={() => handleVote('NO')}
              className="flex-1 py-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm font-bold hover:bg-red-500/20 hover:border-red-500/50 transition-all"
            >
              NO
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#1a1f2e] border border-gray-800/30">
          <CheckCircle className="w-4 h-4 text-[#00d4ff]" />
          <span className="text-gray-300 text-xs font-medium">
            You predicted{' '}
            <span
              className={
                consensus.userVote === 'YES' ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold'
              }
            >
              {consensus.userVote}
            </span>
          </span>
        </div>
      )}
    </div>
  );
}
