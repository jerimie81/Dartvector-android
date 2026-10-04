import React, { useState, useEffect } from 'react';
import { X, Trophy, Download, Upload, Trash2, Award, Zap } from 'lucide-react';
import { Match, PlayerStats } from '../types/darts';
import { appStorage } from '../services/storage';
import { calculateMatchStats } from '../engine/darts-engine';

interface MatchVaultModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MatchVaultModal: React.FC<MatchVaultModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const [matches, setMatches] = useState<Match[]>([]);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [matchStats, setMatchStats] = useState<PlayerStats[]>([]);

  useEffect(() => {
    loadMatches();
  }, []);

  const loadMatches = async () => {
    const list = await appStorage.getMatches(200);
    setMatches(list);
    if (list.length > 0 && !selectedMatch) {
      handleSelectMatch(list[0]);
    }
  };

  const handleSelectMatch = (m: Match) => {
    setSelectedMatch(m);
    const stats = calculateMatchStats(m);
    setMatchStats(stats);
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await appStorage.deleteMatch(id);
    const updated = matches.filter((m) => m.id !== id);
    setMatches(updated);
    if (selectedMatch?.id === id) {
      setSelectedMatch(updated[0] || null);
    }
  };

  const handleExport = async () => {
    const json = await appStorage.exportData();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dartvector_backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    try {
      await appStorage.importData(text);
      await loadMatches();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto overflow-x-hidden">
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl max-w-4xl w-full p-4 sm:p-6 shadow-2xl flex flex-col gap-5 max-h-[92vh] overflow-hidden min-w-0">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-4 min-w-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
              <Trophy className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base sm:text-lg font-black text-white uppercase tracking-wide truncate">
                Match Vault & Career Analytics
              </h2>
              <p className="text-xs text-zinc-400 truncate">
                PDC performance archives, 3-dart averages, and match breakdown
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleExport}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white rounded-xl text-xs font-bold transition-all border border-zinc-700"
              title="Export database JSON"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Export</span>
            </button>
            <label className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white rounded-xl text-xs font-bold transition-all border border-zinc-700 cursor-pointer">
              <Upload className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Import</span>
              <input type="file" accept=".json" onChange={handleImport} className="hidden" />
            </label>
            <button
              onClick={onClose}
              className="p-2 text-zinc-400 hover:text-white rounded-xl hover:bg-zinc-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content split: Match List & Detail view */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 flex-1 min-h-0 overflow-hidden min-w-0">
          {/* List Column */}
          <div className="md:col-span-5 flex flex-col gap-2 overflow-y-auto pr-1 max-h-[500px] min-w-0">
            <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
              Saved Matches ({matches.length})
            </span>
            {matches.length === 0 ? (
              <div className="p-8 text-center bg-zinc-950 rounded-2xl border border-zinc-800 text-xs text-zinc-500 italic">
                No archived matches found in local vault.
              </div>
            ) : (
              matches.map((m) => {
                const isSelected = selectedMatch?.id === m.id;
                const winner = m.players.find((p) => p.id === m.winnerPlayerId);
                const dateStr = new Date(m.startTime).toLocaleDateString([], {
                  month: 'short',
                  day: 'numeric',
                });

                return (
                  <div
                    key={m.id}
                    onClick={() => handleSelectMatch(m)}
                    className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex flex-col gap-2 ${
                      isSelected
                        ? 'bg-amber-500/10 border-amber-500 text-white shadow-md'
                        : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-amber-400 uppercase">
                        {m.rules.type === 'x01'
                          ? `${m.rules.config.startingScore} Match`
                          : m.gameType.toUpperCase()}
                      </span>
                      <span className="text-[10px] text-zinc-500">{dateStr}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs font-black text-white">
                        <span>{m.players.map((p) => p.name).join(' vs ')}</span>
                      </div>
                      <button
                        onClick={(e) => handleDelete(m.id, e)}
                        className="text-zinc-600 hover:text-red-400 p-1"
                        title="Delete Match"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {winner && (
                      <div className="text-[10px] text-zinc-400 flex items-center gap-1">
                        <span>🏆 Won by:</span>
                        <strong className="text-amber-300">{winner.name}</strong>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Details Column */}
          <div className="md:col-span-7 flex flex-col gap-4 overflow-y-auto max-h-[500px] bg-zinc-950 p-5 rounded-2xl border border-zinc-800">
            {selectedMatch ? (
              <>
                <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                  <div>
                    <h3 className="text-base font-black text-white uppercase">
                      Match Breakdown & Stats
                    </h3>
                    <p className="text-[11px] text-zinc-400">
                      Total Legs Played: {selectedMatch.legs.length} • Status:{' '}
                      <span className="uppercase text-amber-400 font-bold">
                        {selectedMatch.status}
                      </span>
                    </p>
                  </div>
                </div>

                {/* Player Stats Cards */}
                <div className="flex flex-col gap-3">
                  {matchStats.map((st) => (
                    <div
                      key={st.playerId}
                      className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl flex flex-col gap-3"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">
                            {selectedMatch.players.find((p) => p.id === st.playerId)?.avatar || '🎯'}
                          </span>
                          <span className="font-black text-sm text-white">{st.name}</span>
                        </div>
                        <span className="text-xs font-mono font-bold text-amber-400">
                          {st.legsWon} Legs Won
                        </span>
                      </div>

                      {/* Stats Grid */}
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 pt-2 border-t border-zinc-800 text-xs">
                        <div className="flex flex-col">
                          <span className="text-[10px] text-zinc-500 uppercase font-semibold">
                            3-Dart Avg
                          </span>
                          <span className="font-mono font-black text-amber-400 text-sm">
                            {st.threeDartAvg}
                          </span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] text-zinc-500 uppercase font-semibold">
                            First 9 Avg
                          </span>
                          <span className="font-mono font-black text-white text-sm">
                            {st.first9Avg}
                          </span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] text-zinc-500 uppercase font-semibold">
                            High Turn
                          </span>
                          <span className="font-mono font-black text-white text-sm">
                            {st.highestTurn}
                          </span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] text-zinc-500 uppercase font-semibold">
                            High Checkout
                          </span>
                          <span className="font-mono font-black text-amber-300 text-sm">
                            {st.highestCheckout || '-'}
                          </span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] text-zinc-500 uppercase font-semibold">
                            180s
                          </span>
                          <span className="font-mono font-black text-red-400 text-sm">
                            {st.scores180}
                          </span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] text-zinc-500 uppercase font-semibold">
                            140+ / 100+
                          </span>
                          <span className="font-mono font-bold text-zinc-300 text-sm">
                            {st.scores140Plus} / {st.scores100Plus}
                          </span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] text-zinc-500 uppercase font-semibold">
                            Checkout %
                          </span>
                          <span className="font-mono font-bold text-emerald-400 text-sm">
                            {st.checkoutPct}%
                          </span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] text-zinc-500 uppercase font-semibold">
                            Darts Thrown
                          </span>
                          <span className="font-mono font-bold text-zinc-300 text-sm">
                            {st.dartsThrown}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center text-xs text-zinc-500 italic py-12">
                Select a match on the left to review stats.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
