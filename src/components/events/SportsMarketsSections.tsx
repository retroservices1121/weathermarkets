'use client';

import { useState } from 'react';
import type { PolymarketMarket } from '@/types';
import { parseOutcomePrices, formatVolume } from '@/lib/utils';

interface SportsMarketsSectionsProps {
  markets: PolymarketMarket[];
  eventTitle: string;
  teamNames?: { team1: string; team2: string };
}

interface GroupedMarkets {
  moneyline: PolymarketMarket[];
  spreads: PolymarketMarket[];
  totals: PolymarketMarket[];
  bothTeamsToScore: PolymarketMarket[];
  other: PolymarketMarket[];
}

export function SportsMarketsSections({ markets, eventTitle, teamNames }: SportsMarketsSectionsProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['moneyline']));

  // Group markets by type
  const groupedMarkets: GroupedMarkets = markets.reduce(
    (acc, market) => {
      const question = (market.question || market.groupItemTitle || '').toLowerCase();

      // Moneyline: "Will [Team] win"
      if (question.includes('will') && question.includes('win') && !question.includes('draw')) {
        acc.moneyline.push(market);
      }
      // Spreads: Contains "+", "-", or "spread"
      else if (question.match(/[+-]\d+/) || question.includes('spread')) {
        acc.spreads.push(market);
      }
      // Totals: "over", "under", "total", "o ", "u "
      else if (
        question.includes('over') ||
        question.includes('under') ||
        question.includes('total') ||
        question.match(/\bo\s+\d/) ||
        question.match(/\bu\s+\d/)
      ) {
        acc.totals.push(market);
      }
      // Both Teams to Score
      else if (question.includes('both') && question.includes('score')) {
        acc.bothTeamsToScore.push(market);
      }
      // Draw
      else if (question.includes('draw')) {
        // Add draw to moneyline
        acc.moneyline.push(market);
      }
      // Everything else
      else {
        acc.other.push(market);
      }

      return acc;
    },
    { moneyline: [], spreads: [], totals: [], bothTeamsToScore: [], other: [] } as GroupedMarkets
  );

  // Extract team names from markets if not provided
  let team1 = teamNames?.team1;
  let team2 = teamNames?.team2;

  if (!team1 || !team2) {
    const moneylineMarkets = groupedMarkets.moneyline.filter(m => !m.question?.includes('draw'));
    if (moneylineMarkets.length >= 2) {
      // Extract team names from "Will [Team] win" questions
      const match1 = moneylineMarkets[0].question?.match(/Will\s+(.+?)\s+win/i);
      const match2 = moneylineMarkets[1].question?.match(/Will\s+(.+?)\s+win/i);
      team1 = match1?.[1] || team1 || 'Team 1';
      team2 = match2?.[1] || team2 || 'Team 2';
    }
  }

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const renderMoneyline = () => {
    if (groupedMarkets.moneyline.length === 0) return null;

    // Find team markets and draw market
    const team1Market = groupedMarkets.moneyline.find(m =>
      m.question?.toLowerCase().includes(team1?.toLowerCase() || '')
    );
    const team2Market = groupedMarkets.moneyline.find(m =>
      m.question?.toLowerCase().includes(team2?.toLowerCase() || '')
    );
    const drawMarket = groupedMarkets.moneyline.find(m => m.question?.toLowerCase().includes('draw'));

    const team1Prices = team1Market ? parseOutcomePrices(team1Market.outcomePrices) : [];
    const team2Prices = team2Market ? parseOutcomePrices(team2Market.outcomePrices) : [];
    const drawPrices = drawMarket ? parseOutcomePrices(drawMarket.outcomePrices) : [];

    const team1Prob = Math.round((team1Prices[0] || 0) * 100);
    const team2Prob = Math.round((team2Prices[0] || 0) * 100);
    const drawProb = Math.round((drawPrices[0] || 0) * 100);

    const totalVolume = groupedMarkets.moneyline.reduce((sum, m) => {
      const vol = typeof m.volume === 'string' ? parseFloat(m.volume) : (m.volume || 0);
      return sum + vol;
    }, 0);

    return (
      <div className="bg-[#12141a] rounded-2xl border border-gray-800/30 overflow-hidden">
        <div className="p-5 border-b border-gray-800/30">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-white">Moneyline</h3>
              <p className="text-sm text-gray-500">{formatVolume(totalVolume)} Vol.</p>
            </div>
          </div>
        </div>
        <div className="p-5 space-y-3">
          {/* Team 1 */}
          {team1Market && (
            <button className="w-full px-6 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all font-semibold text-lg flex items-center justify-between">
              <span>{team1}</span>
              <span>{team1Prob}¢</span>
            </button>
          )}

          {/* Draw (if exists) */}
          {drawMarket && (
            <button className="w-full px-6 py-4 bg-gray-700 hover:bg-gray-600 text-white rounded-xl transition-all font-semibold text-lg flex items-center justify-between">
              <span>DRAW</span>
              <span>{drawProb}¢</span>
            </button>
          )}

          {/* Team 2 */}
          {team2Market && (
            <button className="w-full px-6 py-4 bg-rose-600 hover:bg-rose-700 text-white rounded-xl transition-all font-semibold text-lg flex items-center justify-between">
              <span>{team2}</span>
              <span>{team2Prob}¢</span>
            </button>
          )}
        </div>
      </div>
    );
  };

  const renderSpreads = () => {
    if (groupedMarkets.spreads.length === 0) return null;

    const totalVolume = groupedMarkets.spreads.reduce((sum, m) => {
      const vol = typeof m.volume === 'string' ? parseFloat(m.volume) : (m.volume || 0);
      return sum + vol;
    }, 0);

    return (
      <div className="bg-[#12141a] rounded-2xl border border-gray-800/30 overflow-hidden">
        <div className="p-5 border-b border-gray-800/30">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-white">Spreads</h3>
              <p className="text-sm text-gray-500">{formatVolume(totalVolume)} Vol.</p>
            </div>
          </div>
        </div>
        <div className="p-5 space-y-3">
          {groupedMarkets.spreads.map((market, idx) => {
            const prices = parseOutcomePrices(market.outcomePrices);
            const yesProb = Math.round((prices[0] || 0) * 100);
            const noProb = Math.round((prices[1] || 1 - (prices[0] || 0)) * 100);

            // Extract spread value from question
            const spreadMatch = market.question?.match(/([+-]\d+\.?\d*)/);
            const spreadValue = spreadMatch ? spreadMatch[1] : '';
            const teamMatch = market.question?.match(/Will\s+(.+?)\s+(?:cover|win)/i);
            const teamName = teamMatch ? teamMatch[1] : market.groupItemTitle || `Option ${idx + 1}`;

            return (
              <div key={market.id} className="grid grid-cols-2 gap-3">
                <button className="px-5 py-4 bg-[#1a1f2e] hover:bg-[#1f2635] text-white rounded-xl transition-all border border-gray-700/50">
                  <div className="text-sm text-gray-400 mb-1">{teamName} {spreadValue}</div>
                  <div className="text-xl font-bold">{yesProb}¢</div>
                </button>
                <button className="px-5 py-4 bg-[#1a1f2e] hover:bg-[#1f2635] text-white rounded-xl transition-all border border-gray-700/50">
                  <div className="text-sm text-gray-400 mb-1">{teamName} {spreadValue ? `+${Math.abs(parseFloat(spreadValue))}` : ''}</div>
                  <div className="text-xl font-bold">{noProb}¢</div>
                </button>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderTotals = () => {
    if (groupedMarkets.totals.length === 0) return null;

    const totalVolume = groupedMarkets.totals.reduce((sum, m) => {
      const vol = typeof m.volume === 'string' ? parseFloat(m.volume) : (m.volume || 0);
      return sum + vol;
    }, 0);

    return (
      <div className="bg-[#12141a] rounded-2xl border border-gray-800/30 overflow-hidden">
        <div className="p-5 border-b border-gray-800/30">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-white">Totals</h3>
              <p className="text-sm text-gray-500">{formatVolume(totalVolume)} Vol.</p>
            </div>
          </div>
        </div>
        <div className="p-5 space-y-3">
          {groupedMarkets.totals.map((market) => {
            const prices = parseOutcomePrices(market.outcomePrices);
            const overProb = Math.round((prices[0] || 0) * 100);
            const underProb = Math.round((prices[1] || 1 - (prices[0] || 0)) * 100);

            // Extract total value from question
            const totalMatch = market.question?.match(/(\d+\.?\d*)/);
            const totalValue = totalMatch ? totalMatch[1] : '';

            return (
              <div key={market.id} className="grid grid-cols-2 gap-3">
                <button className="px-5 py-4 bg-[#1a1f2e] hover:bg-[#1f2635] text-white rounded-xl transition-all border border-gray-700/50">
                  <div className="text-sm text-gray-400 mb-1">O {totalValue}</div>
                  <div className="text-xl font-bold">{overProb}¢</div>
                </button>
                <button className="px-5 py-4 bg-[#1a1f2e] hover:bg-[#1f2635] text-white rounded-xl transition-all border border-gray-700/50">
                  <div className="text-sm text-gray-400 mb-1">U {totalValue}</div>
                  <div className="text-xl font-bold">{underProb}¢</div>
                </button>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderBothTeamsToScore = () => {
    if (groupedMarkets.bothTeamsToScore.length === 0) return null;

    const market = groupedMarkets.bothTeamsToScore[0];
    const prices = parseOutcomePrices(market.outcomePrices);
    const yesProb = Math.round((prices[0] || 0) * 100);
    const noProb = Math.round((prices[1] || 1 - (prices[0] || 0)) * 100);

    const totalVolume = groupedMarkets.bothTeamsToScore.reduce((sum, m) => {
      const vol = typeof m.volume === 'string' ? parseFloat(m.volume) : (m.volume || 0);
      return sum + vol;
    }, 0);

    return (
      <div className="bg-[#12141a] rounded-2xl border border-gray-800/30 overflow-hidden">
        <div className="p-5 border-b border-gray-800/30">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-white">Both Teams to Score?</h3>
              <p className="text-sm text-gray-500">{formatVolume(totalVolume)} Vol.</p>
            </div>
          </div>
        </div>
        <div className="p-5">
          <div className="grid grid-cols-2 gap-3">
            <button className="px-5 py-4 bg-green-600 hover:bg-green-700 text-white rounded-xl transition-all font-semibold text-lg flex items-center justify-between">
              <span>YES</span>
              <span>{yesProb}¢</span>
            </button>
            <button className="px-5 py-4 bg-[#1a1f2e] hover:bg-[#1f2635] text-white rounded-xl transition-all font-semibold text-lg flex items-center justify-between border border-gray-700/50">
              <span>NO</span>
              <span>{noProb}¢</span>
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderOtherMarkets = () => {
    if (groupedMarkets.other.length === 0) return null;

    return (
      <div className="bg-[#12141a] rounded-2xl border border-gray-800/30 overflow-hidden">
        <div className="p-5 border-b border-gray-800/30">
          <h3 className="text-lg font-bold text-white">Other Markets</h3>
        </div>
        <div className="p-5 space-y-3">
          {groupedMarkets.other.map((market) => {
            const prices = parseOutcomePrices(market.outcomePrices);
            const yesProb = Math.round((prices[0] || 0) * 100);
            const noProb = Math.round((prices[1] || 1 - (prices[0] || 0)) * 100);

            return (
              <div key={market.id} className="space-y-2">
                <p className="text-sm text-gray-400">{market.question || market.groupItemTitle}</p>
                <div className="grid grid-cols-2 gap-3">
                  <button className="px-5 py-4 bg-[#1a1f2e] hover:bg-[#1f2635] text-white rounded-xl transition-all border border-gray-700/50">
                    <div className="text-sm text-gray-400 mb-1">YES</div>
                    <div className="text-xl font-bold">{yesProb}¢</div>
                  </button>
                  <button className="px-5 py-4 bg-[#1a1f2e] hover:bg-[#1f2635] text-white rounded-xl transition-all border border-gray-700/50">
                    <div className="text-sm text-gray-400 mb-1">NO</div>
                    <div className="text-xl font-bold">{noProb}¢</div>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {renderMoneyline()}
      {renderSpreads()}
      {renderTotals()}
      {renderBothTeamsToScore()}
      {renderOtherMarkets()}
    </div>
  );
}
