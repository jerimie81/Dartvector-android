import React, { useState } from 'react';
import { X, Trophy, Beer, RotateCcw } from 'lucide-react';
import { Player } from '../types/darts';

interface LeagueNightModalProps {
  isOpen: boolean;
  onClose: () => void;
  players: Player[];
}

export const LeagueNightModal: React.FC<LeagueNightModalProps> = ({
  isOpen,
  onClose,
  players,
}) => {
  if (!isOpen) return null;

  // Mock initial league standing data based on available players
  const [standings, setStandings] = useState([
    { id: 'p1', name: 'Phil The Power', avatar: '⚡', p: 6, w: 5, l: 1, legsFor: 18, legsAgainst: 8, pts: 10, avg: 94.6 },
    { id: 'p2', name: 'Luke The Nuke', avatar: '🎯', p: 6, w: 5, l: 1, legsFor: 17, legsAgainst: 9, pts: 10, avg: 97.2 },
    { id: 'p3', name: 'Mighty Mike', avatar: '👑', p: 6, w: 4, l: 2, legsFor: 15, legsAgainst: 11, pts: 8, avg: 91.8 },
    { id: 'p4', name: 'The Iceman', avatar: '❄️', p: 6, w: 3, l: 3, legsFor: 13, legsAgainst: 12, pts: 6, avg: 88.4 },
    { id: 'bot_lvl12', name: 'DartBot (Club)', avatar: '🤖', p: 6, w: 2, l: 4, legsFor: 10, legsAgainst: 14, pts: 4, avg: 61.2 },
    { id: 'p5', name: 'Snakebite Peter', avatar: '🐍', p: 6, w: 1, l: 5, legsFor: 7, legsAgainst: 17, pts: 2, avg: 84.1 },
  ]);

  const handleResetSeason = () => {
    if (confirm('Reset League Night standings for a new season?')) {
      setStandings((prev) =>
        prev.map((s) => ({ ...s, p: 0, w: 0, l: 0, legsFor: 0, legsAgainst: 0, pts: 0 }))
      );
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto overflow-x-hidden">
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl max-w-3xl w-full p-4 sm:p-6 shadow-2xl flex flex-col gap-5 max-h-[90vh] overflow-hidden min-w-0">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-4 min-w-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
              <span className="text-xl">🍺</span>
            </div>
            <div className="min-w-0">
              <h2 className="text-base sm:text-lg font-black text-white uppercase tracking-wide truncate">
                House League Night Leaderboard
              </h2>
              <p className="text-xs text-zinc-400 truncate">
                Weekly pub league standings, head-to-head points, and averages
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleResetSeason}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white rounded-xl text-xs font-bold transition-all border border-zinc-700"
              title="Reset Season"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Reset</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-zinc-400 hover:text-white rounded-xl hover:bg-zinc-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Standings Table */}
        <div className="overflow-x-auto flex-1 bg-zinc-950 rounded-2xl border border-zinc-800 min-w-0">
          <table className="w-full text-left text-xs min-w-[500px]">
            <thead className="bg-zinc-900 text-zinc-400 font-bold uppercase tracking-wider border-b border-zinc-800 text-[10px]">
              <tr>
                <th className="py-2.5 px-3">Pos</th>
                <th className="py-2.5 px-3">Player</th>
                <th className="py-2.5 px-2 text-center">P</th>
                <th className="py-2.5 px-2 text-center">W</th>
                <th className="py-2.5 px-2 text-center">L</th>
                <th className="py-2.5 px-2 text-center">Legs (+/-)</th>
                <th className="py-2.5 px-2 text-center">3DA</th>
                <th className="py-2.5 px-3 text-right">PTS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60 font-mono">
              {standings.map((s, idx) => {
                const legDiff = s.legsFor - s.legsAgainst;
                return (
                  <tr
                    key={s.id}
                    className={`hover:bg-zinc-900/40 transition-colors ${
                      idx === 0 ? 'bg-amber-500/5' : ''
                    }`}
                  >
                    <td className="py-2.5 px-3 font-bold text-zinc-400">
                      {idx === 0 ? '🥇 1' : idx === 1 ? '🥈 2' : idx === 2 ? '🥉 3' : idx + 1}
                    </td>
                    <td className="py-2.5 px-3 font-sans font-black text-white flex items-center gap-1.5 truncate">
                      <span className="text-base shrink-0">{s.avatar}</span>
                      <span className="truncate">{s.name}</span>
                    </td>
                    <td className="py-2.5 px-2 text-center text-zinc-400">{s.p}</td>
                    <td className="py-2.5 px-2 text-center text-emerald-400 font-bold">{s.w}</td>
                    <td className="py-2.5 px-2 text-center text-red-400 font-bold">{s.l}</td>
                    <td className="py-2.5 px-2 text-center text-zinc-300">
                      {s.legsFor}-{s.legsAgainst} ({legDiff > 0 ? `+${legDiff}` : legDiff})
                    </td>
                    <td className="py-2.5 px-2 text-center text-amber-400 font-bold">
                      {s.avg ? s.avg.toFixed(1) : '-'}
                    </td>
                    <td className="py-2.5 px-3 text-right font-black text-amber-300 text-sm">
                      {s.pts}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer info */}
        <div className="flex flex-wrap items-center justify-between text-xs text-zinc-500 pt-2 border-t border-zinc-800 gap-2">
          <span>Points format: 2 points for a win, 0 for loss</span>
          <span className="font-semibold text-zinc-400">PDC Official League Rules</span>
        </div>
      </div>
    </div>
  );
};
