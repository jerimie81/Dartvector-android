import React, { useState } from 'react';
import { History, Clock, ArrowUpDown, Target } from 'lucide-react';
import { GameState, DartThrow } from '../types/darts';

interface ThrowLogPanelProps {
  gameState: GameState;
}

interface FlattenedThrow {
  id: string;
  turnId: string;
  playerId: string;
  playerName: string;
  playerAvatar: string;
  dart: DartThrow;
  dartIndex: number;
  timestamp: number;
  scoreAfterTurn?: number;
}

export const ThrowLogPanel: React.FC<ThrowLogPanelProps> = ({ gameState }) => {
  const [isNewestFirst, setIsNewestFirst] = useState(false);

  // Flatten all darts across all legs and current turn
  const flattened: FlattenedThrow[] = [];

  gameState.match.legs.forEach((leg) => {
    leg.turns.forEach((turn) => {
      const player = gameState.match.players.find((p) => p.id === turn.playerId);
      turn.darts.forEach((d, dIdx) => {
        flattened.push({
          id: `${turn.id}_${dIdx}`,
          turnId: turn.id,
          playerId: turn.playerId,
          playerName: player?.name || 'Player',
          playerAvatar: player?.avatar || '🎯',
          dart: d,
          dartIndex: dIdx + 1,
          timestamp: d.timestamp || turn.createdAt,
          scoreAfterTurn: turn.scoreAfter,
        });
      });
    });
  });

  // Include darts in active turn
  const activePlayer = gameState.match.players[gameState.activePlayerIndex];
  gameState.currentTurnDarts.forEach((d, dIdx) => {
    flattened.push({
      id: `current_${dIdx}`,
      turnId: 'current',
      playerId: activePlayer.id,
      playerName: activePlayer.name,
      playerAvatar: activePlayer.avatar,
      dart: d,
      dartIndex: dIdx + 1,
      timestamp: d.timestamp || Date.now(),
    });
  });

  const displayList = isNewestFirst ? [...flattened].reverse() : flattened;

  const formatTime = (ts: number) => {
    const date = new Date(ts);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const getMultiplierBadge = (mult: number) => {
    if (mult === 3) return 'bg-red-500/20 text-red-300 border-red-500/40';
    if (mult === 2) return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
    return 'bg-zinc-800 text-zinc-300 border-zinc-700';
  };

  return (
    <div
      id="throw-by-throw-log-panel"
      className="w-full bg-zinc-900 border border-zinc-800 rounded-3xl p-4 sm:p-5 shadow-2xl flex flex-col gap-4 min-w-0 overflow-hidden"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800 pb-3.5 min-w-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-sm shrink-0">
            <History className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-sm font-black text-white tracking-wide uppercase truncate">
                Throw-by-Throw Log
              </h2>
              <span className="text-[10px] font-black uppercase bg-zinc-800 text-amber-400 px-2 py-0.5 rounded-full border border-zinc-700 shrink-0">
                Last {Math.min(displayList.length, 50)} / {displayList.length} Darts
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 flex items-center gap-1 truncate">
              <Clock className="w-3 h-3 text-zinc-500 shrink-0" />
              <span className="truncate">Chronological sequence with timestamps & segment values</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            id="toggle-throw-order-btn"
            onClick={() => setIsNewestFirst((prev) => !prev)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-950 hover:bg-zinc-800 text-zinc-300 hover:text-white rounded-xl border border-zinc-800 text-xs font-bold transition-colors shadow-sm"
            title="Toggle sort direction"
          >
            <ArrowUpDown className="w-3.5 h-3.5 text-amber-400" />
            <span>{isNewestFirst ? 'Newest' : 'Oldest'}</span>
          </button>
        </div>
      </div>

      {displayList.length === 0 ? (
        <div className="p-8 text-center bg-zinc-950/50 border border-zinc-800/60 rounded-2xl flex flex-col items-center gap-2 text-zinc-500 min-w-0">
          <Target className="w-8 h-8 stroke-1 text-zinc-600" />
          <p className="text-xs font-medium text-zinc-400">No darts recorded in this match yet.</p>
          <p className="text-[11px] text-zinc-600 max-w-sm">
            Throw darts on the board, enter scores via keypad, or play against DartBot to view the
            live chronological throw stream.
          </p>
        </div>
      ) : (
        <div className="max-h-[320px] overflow-y-auto pr-1 flex flex-col gap-2 min-w-0 w-full">
          {displayList.map((item, index) => (
            <div
              key={item.id}
              className="flex items-center justify-between bg-zinc-950/80 px-3.5 py-2.5 rounded-xl border border-zinc-800/80 hover:border-zinc-700 transition-all text-xs min-w-0 gap-2"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="font-mono text-zinc-500 text-[10px] w-6 shrink-0">
                  #{isNewestFirst ? flattened.length - index : index + 1}
                </span>
                <span className="text-base shrink-0">{item.playerAvatar}</span>
                <div className="flex flex-col min-w-0">
                  <span className="font-bold text-white leading-tight truncate max-w-[120px] sm:max-w-[200px]">{item.playerName}</span>
                  <span className="text-[10px] text-zinc-500 flex items-center gap-1 truncate">
                    <span>Dart #{item.dartIndex}</span>
                    <span>•</span>
                    <span>{formatTime(item.timestamp)}</span>
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2.5 shrink-0">
                <span
                  className={`px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg border font-mono font-black text-xs shadow-sm ${getMultiplierBadge(
                    item.dart.multiplier
                  )}`}
                >
                  {item.dart.label}
                </span>
                <span className="font-mono font-bold text-amber-400 text-sm w-9 sm:w-10 text-right">
                  +{item.dart.score}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
