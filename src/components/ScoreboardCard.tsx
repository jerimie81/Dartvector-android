import React from 'react';
import { Target, Users, Flame, Zap, Award, SkipForward, RotateCcw } from 'lucide-react';
import { GameState } from '../types/darts';
import { getCheckoutAdvice } from '../engine/darts-engine';

interface ScoreboardCardProps {
  gameState: GameState;
  onEndTurn: () => void;
  onToggleChalkboard: () => void;
  onUndo?: () => void;
  canUndo?: boolean;
}

export const ScoreboardCard: React.FC<ScoreboardCardProps> = ({
  gameState,
  onEndTurn,
  onToggleChalkboard,
  onUndo,
  canUndo = false,
}) => {
  const { match, currentLeg, activePlayerIndex, remainingScores, currentTurnDarts } = gameState;
  const isTeam = !!(match.isTeamMatch && match.teams);
  const activePlayer = match.players[activePlayerIndex];
  const activeRemaining = remainingScores[activePlayer.id] ?? 0;
  const dartsLeft = 3 - (currentTurnDarts.length || 0);

  const getPlayerLegStats = (playerId: string) => {
    const turns = currentLeg.turns.filter((t) => t.playerId === playerId);
    let darts = 0;
    let score = 0;
    let high = 0;
    turns.forEach((t) => {
      const d = t.darts.length || 3;
      darts += d;
      if (!t.isBust) {
        score += t.turnTotal;
        if (t.turnTotal > high) high = t.turnTotal;
      }
    });
    const avg = darts > 0 ? (score / darts) * 3 : 0;
    return {
      avg: Math.round(avg * 10) / 10,
      darts,
      highTurn: high,
    };
  };

  const checkoutAdvice =
    match.rules.type === 'x01' && activeRemaining <= 170 && activeRemaining > 1
      ? getCheckoutAdvice(activeRemaining, dartsLeft)
      : null;

  return (
    <div className="w-full flex flex-col gap-4 min-w-0">
      {/* Match Bar */}
      <div className="bg-zinc-950/90 border border-zinc-800/90 rounded-2xl p-3 sm:p-4 shadow-xl flex flex-wrap items-center justify-between gap-3 min-w-0 w-full">
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
            {isTeam ? <Users className="w-4 h-4 sm:w-5 sm:h-5" /> : <Target className="w-4 h-4 sm:w-5 sm:h-5" />}
          </div>
          <div className="min-w-0">
            <div className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-amber-500 flex items-center gap-1.5 truncate">
              <span>
                {match.rules.type === 'x01'
                  ? `${match.rules.config.startingScore} Match`
                  : match.gameType.toUpperCase()}
              </span>
              {isTeam && (
                <span className="text-[9px] font-black uppercase bg-amber-500 text-zinc-950 px-1 py-0.2 rounded shadow-sm shrink-0">
                  Team
                </span>
              )}
            </div>
            <div className="text-xs sm:text-sm font-black text-white flex items-center gap-1.5 truncate">
              <span>Leg {currentLeg.legNumber}</span>
              {match.rules.type === 'x01' && match.rules.config.setsToWin > 1 && (
                <span className="text-zinc-400 font-normal text-xs">
                  (Set {currentLeg.setNumber})
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Players / Team Score overview */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-4 bg-zinc-900/80 px-3 py-1.5 rounded-xl border border-zinc-800 min-w-0">
          {match.players.map((p, idx) => {
            const legsWon = isTeam && p.teamId && match.teamScores
              ? match.teamScores[p.teamId]?.legsWon || 0
              : match.scores[p.id]?.legsWon || 0;
            const isCurrent = idx === activePlayerIndex;

            return (
              <div key={p.id} className="flex items-center gap-1.5 min-w-0">
                <span className="text-xs sm:text-sm shrink-0">{p.avatar || '🎯'}</span>
                <span
                  className={`text-xs font-bold truncate max-w-[80px] sm:max-w-[120px] ${
                    isCurrent ? 'text-amber-400 font-black' : 'text-zinc-400'
                  }`}
                >
                  {p.name}
                </span>
                <span className="px-1.5 py-0.5 bg-zinc-950 text-amber-400 font-mono font-black text-[11px] sm:text-xs rounded border border-zinc-800 shrink-0">
                  {legsWon}
                </span>
              </div>
            );
          })}
        </div>

        {/* Chalkboard Mode Toggle */}
        <button
          onClick={onToggleChalkboard}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all bg-zinc-900 text-zinc-300 border-zinc-800 hover:text-white shrink-0 active:scale-95"
          title="Toggle Big Chalkboard Display Mode"
        >
          <span>🍻</span>
          <span>Chalkboard</span>
        </button>
      </div>

      {/* Current Thrower Banner */}
      <div className="w-full p-3.5 sm:p-4 rounded-2xl border flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 shadow-xl transition-all bg-amber-950/30 border-amber-500/50 text-amber-200 min-w-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-zinc-950/80 border border-zinc-700/80 flex items-center justify-center text-xl sm:text-2xl shadow-inner shrink-0">
            {activePlayer.avatar || '🎯'}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-zinc-900 text-amber-400 border border-zinc-700 shrink-0">
                👉 Current Thrower
              </span>
              {activePlayer.isBot && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-red-950 text-red-300 border border-red-800 shrink-0">
                  Bot Lvl {activePlayer.botLevel || 12}
                </span>
              )}
            </div>
            <div className="text-lg sm:text-xl font-black text-white mt-0.5 truncate">
              {activePlayer.name}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between md:justify-end gap-2.5 min-w-0">
          <div className="flex items-center gap-3 bg-zinc-950/80 px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl border border-zinc-800/80 shrink-0">
            <div className="flex flex-col items-center">
              <span className="text-[9px] sm:text-[10px] uppercase font-bold text-zinc-400">Darts</span>
              <div className="flex gap-1 mt-0.5">
                {[...Array(dartsLeft)].map((_, i) => (
                  <span
                    key={i}
                    className="text-xs sm:text-sm text-amber-400 drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]"
                  >
                    🎯
                  </span>
                ))}
                {[...Array(3 - dartsLeft)].map((_, i) => (
                  <span key={i} className="text-xs sm:text-sm text-zinc-700 opacity-40">
                    🎯
                  </span>
                ))}
              </div>
            </div>
            <div className="pl-3 sm:pl-4 border-l border-zinc-800 flex flex-col items-end">
              <span className="text-[9px] sm:text-[10px] uppercase font-bold text-zinc-400">Remaining</span>
              <span className="text-xl sm:text-2xl font-mono font-black text-amber-400 leading-none">
                {activeRemaining}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {onUndo && (
              <button
                id="scoreboard-undo-btn"
                onClick={onUndo}
                disabled={!canUndo}
                className="flex items-center gap-1.5 px-3 py-2 bg-zinc-900 hover:bg-zinc-800 disabled:opacity-40 disabled:pointer-events-none text-zinc-300 hover:text-white border border-zinc-700 rounded-xl text-xs font-black uppercase tracking-wider transition-all active:scale-95 shadow-sm"
                title="Undo last throw (Ctrl+Z)"
              >
                <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                <span>Undo</span>
              </button>
            )}

            <button
              id="scoreboard-end-turn-btn"
              onClick={onEndTurn}
              className="flex items-center gap-1.5 px-3 py-2 bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 hover:text-amber-200 border border-amber-500/40 rounded-xl text-xs font-black uppercase tracking-wider transition-all active:scale-95 shadow-sm"
              title="End this player's turn"
            >
              <SkipForward className="w-3.5 h-3.5 fill-current" />
              <span>Pass/End</span>
            </button>
          </div>
        </div>
      </div>

      {/* Checkout Guide Banner if available */}
      {checkoutAdvice && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl px-3.5 py-2 flex items-center justify-between flex-wrap gap-2 min-w-0">
          <div className="flex items-center gap-2 flex-wrap min-w-0">
            <span className="text-xs font-black uppercase text-amber-400 shrink-0">Checkout:</span>
            <div className="flex items-center gap-1.5 flex-wrap">
              {checkoutAdvice.route.map((segment, idx) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 rounded bg-zinc-950 font-mono font-black text-xs text-white border border-amber-500/40 shadow-sm shrink-0"
                >
                  {segment}
                </span>
              ))}
            </div>
          </div>
          <span className="text-xs text-amber-300/80 italic font-medium truncate">
            {checkoutAdvice.description}
          </span>
        </div>
      )}

      {/* Players Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 min-w-0 w-full">
        {match.players.map((p, idx) => {
          const isThrowing = idx === activePlayerIndex;
          const remaining = remainingScores[p.id] ?? 0;
          const stats = getPlayerLegStats(p.id);
          const legsWon = isTeam && p.teamId && match.teamScores
            ? match.teamScores[p.teamId]?.legsWon || 0
            : match.scores[p.id]?.legsWon || 0;

          return (
            <div
              key={p.id}
              className={`relative overflow-hidden rounded-2xl border-2 transition-all p-4 sm:p-5 shadow-2xl flex flex-col justify-between min-w-0 ${
                isThrowing
                  ? 'bg-zinc-900 border-amber-500 shadow-amber-500/10 ring-2 ring-amber-500/20'
                  : 'bg-zinc-950 border-zinc-800/80 opacity-90'
              }`}
            >
              {isThrowing && (
                <div className="absolute top-0 right-0 bg-amber-500 text-zinc-950 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-bl-lg flex items-center gap-1 shadow-md">
                  <Flame className="w-3 h-3 fill-zinc-950" />
                  <span>Throwing</span>
                </div>
              )}

              <div className="flex items-center justify-between mb-2 min-w-0">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-xl sm:text-2xl shrink-0">{p.avatar || '🎯'}</span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-extrabold text-white text-sm sm:text-base truncate">{p.name}</span>
                      {p.isBot && (
                        <span className="text-[9px] bg-red-950 text-red-400 border border-red-800 px-1 py-0.2 rounded font-bold shrink-0">
                          BOT
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] font-semibold text-zinc-400">
                      Legs: {legsWon}
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                    Darts
                  </div>
                  <div className="text-xs sm:text-sm font-mono font-bold text-zinc-300">{stats.darts}</div>
                </div>
              </div>

              {/* Big Remaining Score */}
              <div className="my-2 sm:my-3 flex flex-col items-center justify-center min-w-0">
                <div
                  className={`font-mono font-black tracking-tight leading-none transition-all text-5xl sm:text-6xl md:text-7xl truncate max-w-full ${
                    isThrowing
                      ? 'text-amber-400 drop-shadow-[0_0_24px_rgba(245,158,11,0.35)]'
                      : 'text-zinc-300'
                  }`}
                >
                  {match.rules.type === 'cricket'
                    ? gameState.cricketState[p.id]?.score || 0
                    : match.rules.type === 'around_the_clock'
                    ? gameState.aroundClockState[p.id]?.currentTarget === 25
                      ? 'BULL'
                      : gameState.aroundClockState[p.id]?.currentTarget || 1
                    : match.rules.type === 'killer'
                    ? `${gameState.killerState[p.id]?.lives ?? 5} ♥`
                    : remaining}
                </div>
              </div>

              {/* Stats Footer */}
              <div className="mt-2 pt-2 sm:mt-3 sm:pt-3 border-t border-zinc-800/80 flex items-center justify-between text-xs min-w-0">
                <div className="flex items-center gap-1.5 min-w-0">
                  <Zap className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span className="text-zinc-400 font-semibold truncate">3DA:</span>
                  <span className="font-mono font-bold text-white shrink-0">{stats.avg}</span>
                </div>
                <div className="flex items-center gap-1.5 min-w-0">
                  <Award className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                  <span className="text-zinc-400 font-semibold truncate">High:</span>
                  <span className="font-mono font-bold text-white shrink-0">{stats.highTurn}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Leg Turns Snippet */}
      <div className="bg-zinc-950/80 border border-zinc-800/80 rounded-2xl p-3 sm:p-4 shadow-lg min-w-0 w-full">
        <div className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2.5 flex items-center justify-between min-w-0">
          <span>Recent Leg Turns</span>
          <span className="text-[11px] text-zinc-500 font-normal">
            Total Turns: {currentLeg.turns.length}
          </span>
        </div>
        {currentLeg.turns.length === 0 ? (
          <div className="text-xs text-zinc-600 italic py-2 text-center">
            Leg started. Awaiting first turn throws...
          </div>
        ) : (
          <div className="flex flex-col gap-1.5 min-w-0">
            {currentLeg.turns.slice(-3).reverse().map((t) => {
              const p = match.players.find((pl) => pl.id === t.playerId);
              return (
                <div
                  key={t.id}
                  className="flex items-center justify-between bg-zinc-900/60 px-3 py-2 rounded-xl border border-zinc-800/60 text-xs min-w-0 gap-2"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-sm shrink-0">{p?.avatar || '🎯'}</span>
                    <span className="font-bold text-white truncate max-w-[90px] sm:max-w-[130px]">{p?.name}</span>
                    <span className="text-[10px] text-zinc-500 truncate hidden sm:inline">
                      {t.darts.map((d) => d.label).join(' + ')}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                    <span
                      className={`font-mono font-black ${
                        t.isBust ? 'text-red-400' : 'text-amber-400'
                      }`}
                    >
                      {t.isBust ? 'BUST' : t.turnTotal}
                    </span>
                    <span className="text-[11px] text-zinc-400 font-mono">
                      Rem: {t.scoreAfter}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
