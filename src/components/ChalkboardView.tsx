import React from 'react';
import { X, Trophy, RotateCcw } from 'lucide-react';
import { GameState } from '../types/darts';

interface ChalkboardViewProps {
  gameState: GameState;
  onClose: () => void;
  onUndo?: () => void;
  canUndo?: boolean;
}

export const ChalkboardView: React.FC<ChalkboardViewProps> = ({
  gameState,
  onClose,
  onUndo,
  canUndo = false,
}) => {
  const { match, currentLeg, remainingScores, activePlayerIndex } = gameState;
  const players = match.players;

  return (
    <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col p-2 sm:p-6 lg:p-8 overflow-y-auto overflow-x-hidden">
      {/* Chalkboard Frame */}
      <div className="max-w-6xl w-full mx-auto flex-1 flex flex-col bg-[#121516] border-4 sm:border-8 border-[#3c2a1a] rounded-2xl sm:rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.9)] relative overflow-hidden font-mono min-w-0">
        {/* Chalk Texture Gradient */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.05),_transparent_70%)] pointer-events-none" />

        {/* Chalkboard Header */}
        <div className="flex flex-wrap items-center justify-between border-b-2 border-white/20 p-3 sm:p-5 bg-black/40 gap-2 min-w-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="text-2xl sm:text-3xl shrink-0">🍻</span>
            <div className="min-w-0">
              <h1 className="text-lg sm:text-2xl font-black text-amber-300 tracking-wider uppercase truncate">
                PDC Official Chalkboard
              </h1>
              <p className="text-xs text-zinc-400 truncate">
                {match.rules.type === 'x01'
                  ? `${match.rules.config.startingScore} Match`
                  : match.gameType.toUpperCase()}{' '}
                • Leg {currentLeg.legNumber}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {onUndo && (
              <button
                id="chalkboard-undo-btn"
                onClick={onUndo}
                disabled={!canUndo}
                className="flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 bg-amber-500/20 hover:bg-amber-500/30 disabled:opacity-40 disabled:pointer-events-none text-amber-300 rounded-xl border border-amber-500/40 font-sans text-xs font-bold transition-all active:scale-95 shadow-sm"
                title="Undo last throw (Ctrl+Z)"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Undo Throw</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl border border-zinc-600 font-sans text-xs font-bold transition-all active:scale-95"
            >
              <X className="w-4 h-4" />
              <span>Close</span>
            </button>
          </div>
        </div>

        {/* Score Columns */}
        <div className="flex-1 grid grid-cols-2 divide-x-2 divide-white/20 min-w-0 w-full">
          {players.map((p, idx) => {
            const isThrowing = idx === activePlayerIndex;
            const remaining = remainingScores[p.id] ?? 0;
            const legsWon = match.scores[p.id]?.legsWon || 0;
            const turns = currentLeg.turns.filter((t) => t.playerId === p.id);

            return (
              <div
                key={p.id}
                className={`flex flex-col p-3 sm:p-6 lg:p-8 justify-between min-w-0 ${
                  isThrowing ? 'bg-white/[0.03]' : ''
                }`}
              >
                {/* Player Header */}
                <div className="flex flex-col items-center gap-1 sm:gap-2 border-b border-white/10 pb-3 sm:pb-4 min-w-0 text-center">
                  <div className="flex items-center gap-1.5 sm:gap-2 max-w-full">
                    <span className="text-xl sm:text-2xl shrink-0">{p.avatar || '🎯'}</span>
                    <span className="text-base sm:text-2xl font-black text-white tracking-wide truncate max-w-[120px] sm:max-w-[200px]">
                      {p.name}
                    </span>
                    {isThrowing && (
                      <span className="text-[9px] sm:text-[10px] bg-amber-500 text-zinc-950 font-black px-1.5 py-0.5 rounded-full uppercase shrink-0">
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
                <div className="flex-1 my-4 sm:my-6 overflow-y-auto max-h-[340px] flex flex-col items-center gap-1.5 sm:gap-2 min-w-0 w-full px-1">
                  <div className="text-zinc-500 text-xs sm:text-sm tracking-widest border-b border-zinc-700/50 pb-1">
                    START: {currentLeg.startingScore}
                  </div>
                  {turns.map((t) => (
                    <div
                      key={t.id}
                      className="flex items-center justify-between w-full max-w-xs text-xs sm:text-base border-b border-white/5 py-0.5 sm:py-1 min-w-0"
                    >
                      <span className="text-zinc-400 shrink-0">-{t.isBust ? 'BUST' : t.turnTotal}</span>
                      <span className="text-amber-300 font-bold tracking-wider shrink-0">{t.scoreAfter}</span>
                    </div>
                  ))}
                </div>

                {/* Big White Chalk Current Score */}
                <div className="flex flex-col items-center justify-center border-t-2 border-white/20 pt-3 sm:pt-4 min-w-0">
                  <span className="text-[10px] sm:text-[11px] uppercase tracking-widest text-zinc-400 font-bold">
                    REMAINING
                  </span>
                  <div
                    className={`text-5xl sm:text-7xl md:text-8xl font-black tracking-tight drop-shadow-[0_0_15px_rgba(255,255,255,0.4)] truncate max-w-full ${
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
        <div className="border-t-4 border-[#2c1d11] bg-[#1a1209] p-2.5 sm:p-3 text-center text-[10px] sm:text-xs text-amber-200/60 font-sans flex items-center justify-center gap-2 sm:gap-3 flex-wrap">
          <span>🪵 Regulation Sisal Board</span>
          <span>•</span>
          <span>PDC Broadcast Engine</span>
          <span>•</span>
          <span>Double-Out Required</span>
        </div>
      </div>
    </div>
  );
};
