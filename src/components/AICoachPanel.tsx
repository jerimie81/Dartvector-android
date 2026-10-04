import React, { useState } from 'react';
import { Sparkles, ChevronDown, ChevronUp, Brain, Target, ShieldCheck } from 'lucide-react';
import { GameState } from '../types/darts';
import { getCheckoutAdvice } from '../engine/darts-engine';

interface AICoachPanelProps {
  gameState: GameState;
}

export const AICoachPanel: React.FC<AICoachPanelProps> = ({ gameState }) => {
  const [isOpen, setIsOpen] = useState(false);

  const { match, currentLeg, activePlayerIndex, remainingScores, currentTurnDarts } = gameState;
  const activePlayer = match.players[activePlayerIndex];
  const remaining = remainingScores[activePlayer.id] ?? 0;
  const dartsLeft = 3 - currentTurnDarts.length;

  const checkout =
    match.rules.type === 'x01' && remaining <= 170 && remaining > 1
      ? getCheckoutAdvice(remaining, dartsLeft, true)
      : null;

  // Compute tactical advice based on match state
  const getTacticalAnalysis = () => {
    if (match.rules.type !== 'x01') {
      return {
        strategy: 'Focus on closing high-value target beds methodically to apply scoreboard pressure.',
        keyFocus: 'Rhythm and release consistency across the 3 darts in hand.',
        caution: 'Avoid rushed dart transitions between different sectors.',
      };
    }

    if (remaining > 350) {
      return {
        strategy: 'Heavy scoring phase. Stack your darts in the upper bed of Treble 20 to establish match dominance.',
        keyFocus: 'Keep your elbow tucked and follow through toward the lipstick (T20 wire).',
        caution: 'If the first dart drifts into the 1 bed, switch immediately to Treble 19 to protect your turn average.',
      };
    }

    if (remaining > 170) {
      const targetScore = remaining - 170;
      return {
        strategy: `Setup Phase: Score at least ${Math.max(60, targetScore)} points to bring your score into the two or three-dart checkout zone.`,
        keyFocus: 'Leave a clean two-dart double finish (e.g., 32 for D16, 40 for Tops D20).',
        caution: 'Avoid leaving bogey finishes like 169, 168, 166, 165, 163, 162, 159.',
      };
    }

    if (remaining <= 170 && remaining > 40) {
      return {
        strategy: checkout
          ? `Checkout opportunity: ${checkout.route.join(' → ')}. ${checkout.description}`
          : 'Setup required to hit a finishing double on your next visit.',
        keyFocus: 'Commit with conviction on the first treble. Do not steer the dart.',
        caution: 'Double-check math before throwing your final dart to prevent a bust.',
      };
    }

    // <= 40
    return {
      strategy: `Single double finish: ${checkout ? checkout.route[0] : 'Double bed'}. One clean dart to seal the leg!`,
      keyFocus: 'Aim for the top wire of the double bed to use dart trajectory as a backboard.',
      caution: 'Stay calm, breathe before the release, and trust your muscle memory.',
    };
  };

  const advice = getTacticalAnalysis();

  return (
    <div className="flex flex-col gap-3 min-w-0 w-full">
      <button
        id="toggle-ai-coach-btn"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full py-3 px-4 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-2xl text-xs font-black uppercase tracking-wider text-amber-400 flex items-center justify-between transition-colors shadow-lg min-w-0"
      >
        <div className="flex items-center gap-2 truncate">
          <Sparkles className="w-4 h-4 shrink-0" />
          <span className="truncate">PDC Match Coach & Tactics</span>
        </div>
        <span className="text-zinc-500 flex items-center gap-1 shrink-0">
          {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          <span>{isOpen ? 'Hide' : 'Tips'}</span>
        </span>
      </button>

      {isOpen && (
        <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-4 shadow-xl flex flex-col gap-3 text-xs leading-relaxed animate-in fade-in duration-200 min-w-0 w-full">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-2 min-w-0">
            <span className="font-bold text-white flex items-center gap-1.5 truncate">
              <Brain className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="truncate">Tactical Analysis for {activePlayer.name}</span>
            </span>
            <span className="text-[10px] text-zinc-500 font-mono shrink-0">PDC Engine</span>
          </div>

          <div className="flex flex-col gap-2.5">
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">
                Target Strategy
              </span>
              <p className="text-zinc-300 bg-zinc-950 p-2.5 rounded-xl border border-zinc-800/80">
                {advice.strategy}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div className="bg-zinc-950 p-2.5 rounded-xl border border-zinc-800/80 flex flex-col gap-0.5">
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                  <Target className="w-3 h-3" />
                  <span>Key Focus</span>
                </span>
                <span className="text-zinc-400 text-[11px]">{advice.keyFocus}</span>
              </div>

              <div className="bg-zinc-950 p-2.5 rounded-xl border border-zinc-800/80 flex flex-col gap-0.5">
                <span className="text-[10px] font-bold text-red-400 uppercase tracking-wider flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" />
                  <span>Pitfall to Avoid</span>
                </span>
                <span className="text-zinc-400 text-[11px]">{advice.caution}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
