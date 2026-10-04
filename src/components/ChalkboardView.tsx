import React from 'react';
import { X, Trophy, Target } from 'lucide-react';
import { GameState } from '../types/darts';

interface ChalkboardViewProps {
  gameState: GameState;
  onClose: () => void;
}

export const ChalkboardView: React.FC<ChalkboardViewProps> = ({ gameState, onClose }) => {
  const { match, currentLeg, remainingScores, activePlayerIndex } = gameState;
  const players = match.players;

  return (
    <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col p-4 sm:p-8 overflow-y-auto">
      {/* Chalkboard Frame */}
      <div className="max-w-6xl w-full mx-auto flex-1 flex flex-col bg-[#121516] border-8 border-[#3c2a1a] rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.9)] relative overflow-hidden font-mono">
        {/* Chalk Texture Gradient */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.05),_transparent_70%)] pointer-events-none" />

        {/* Chalkboard Header */}
        <div className="flex items-center justify-between border-b-2 border-white/20 p-4 sm:p-6 bg-black/40">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🍻</span>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-amber-300 tracking-wider uppercase">
                PDC Official Chalkboard
              </h1>
              <p className="text-xs text-zinc-400">
                {match.rules.type === 'x01'
                  ? `${match.rules.config.startingScore} Match`
                  : match.gameType.toUpperCase()}{' '}
                • Leg {currentLeg.legNumber}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="flex items-center gap-1.5 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl border border-zinc-600 font-sans text-xs font-bold transition-all active:scale-95"
          >
            <X className="w-4 h-4" />
            <span>Close Chalkboard</span>
          </button>
        </div>

        {/* Score Columns */}
        <div className="flex-1 grid grid-cols-2 divide-x-2 divide-white/20">
          {players.map((p, idx) => {
            const isThrowing = idx === activePlayerIndex;
            const remaining = remainingScores[p.id] ?? 0;
            const legsWon = match.scores[p.id]?.legsWon || 0;
            const turns = currentLeg.turns.filter((t) => t.playerId === p.id);

            return (
              <div
                key={p.id}
                className={`flex flex-col p-4 sm:p-8 justify-between ${
                  isThrowing ? 'bg-white/[0.03]' : ''
                }`}
              >
                {/* Player Header */}
                <div className="flex flex-col items-center gap-2 border-b border-white/10 pb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{p.avatar || '🎯'}</span>
                    <span className="text-lg sm:text-2xl font-black text-white tracking-wide">
                      {p.name}
                    </span>
                    {isThrowing && (
                      <span className="text-[10px] bg-amber-500 text-zinc-950 font-black px-2 py-0.5 rounded-full uppercase">
                        Darts
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-xs text-zinc-400">
                    <span className="flex items-center gap-1">
                      <Trophy className="w-3.5 h-3.5 text-amber-400" />
                      Legs: <strong className="text-white font-mono">{legsWon}</strong>
                    </span>
                  </div>
                </div>

                {/* Score Log Column */}
                <div className="flex-1 my-6 overflow-y-auto max-h-[360px] flex flex-col items-center gap-2">
                  <div className="text-zinc-500 text-sm tracking-widest border-b border-zinc-700/50 pb-1">
                    START: {currentLeg.startingScore}
                  </div>
                  {turns.map((t) => (
                    <div
                      key={t.id}
                      className="flex items-center justify-between w-full max-w-xs text-sm sm:text-base border-b border-white/5 py-1"
                    >
                      <span className="text-zinc-400">-{t.isBust ? 'BUST' : t.turnTotal}</span>
                      <span className="text-amber-300 font-bold tracking-wider">{t.scoreAfter}</span>
                    </div>
                  ))}
                </div>

                {/* Big White Chalk Current Score */}
                <div className="flex flex-col items-center justify-center border-t-2 border-white/20 pt-4">
                  <span className="text-[11px] uppercase tracking-widest text-zinc-400 font-bold">
                    REMAINING
                  </span>
                  <div
                    className={`text-6xl sm:text-8xl font-black tracking-tight drop-shadow-[0_0_15px_rgba(255,255,255,0.4)] ${
                      isThrowing ? 'text-amber-400' : 'text-zinc-200'
                    }`}
                  >
                    {remaining}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Chalkboard Tray Footer */}
        <div className="border-t-4 border-[#2c1d11] bg-[#1a1209] p-3 text-center text-xs text-amber-200/60 font-sans flex items-center justify-center gap-3">
          <span>🪵 House Darts Sisal Board</span>
          <span>•</span>
          <span>PDC Broadcast Engine</span>
          <span>•</span>
          <span>Double-Out Required</span>
        </div>
      </div>
    </div>
  );
};
