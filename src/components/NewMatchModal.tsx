import React, { useState } from 'react';
import { X, Play, Plus, Trash2, Bot, Users } from 'lucide-react';
import { GameType, GameRules, Player, Team } from '../types/darts';
import { DARTBOT_LEVELS } from '../engine/dartbot';

interface NewMatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartMatch: (
    gameType: GameType,
    rules: GameRules,
    players: Player[],
    isTeamMatch: boolean,
    teams?: { team_1: Team; team_2: Team }
  ) => void;
  availablePlayers: Player[];
  onSaveNewPlayer: (player: Player) => Promise<void>;
}

export const NewMatchModal: React.FC<NewMatchModalProps> = ({
  isOpen,
  onClose,
  onStartMatch,
  availablePlayers,
  onSaveNewPlayer,
}) => {
  if (!isOpen) return null;

  const [gameType, setGameType] = useState<GameType>('x01');
  const [startingScore, setStartingScore] = useState<301 | 501 | 701>(501);
  const [inRule, setInRule] = useState<'straight_in' | 'double_in'>('straight_in');
  const [outRule, setOutRule] = useState<'straight_out' | 'double_out' | 'master_out'>('double_out');
  const [legsToWin, setLegsToWin] = useState<number>(3);
  const [setsToWin, setSetsToWin] = useState<number>(1);

  // Cricket rules
  const [cricketPoints, setCricketPoints] = useState<boolean>(true);

  // Around Clock
  const [aroundTarget, setAroundTarget] = useState<'singles' | 'doubles' | 'trebles'>('singles');
  const [aroundBull, setAroundBull] = useState<boolean>(true);

  // Killer
  const [killerLives, setKillerLives] = useState<number>(5);
  const [killerDoubleQualify, setKillerDoubleQualify] = useState<boolean>(true);

  // Players
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<string[]>([
    availablePlayers[0]?.id || 'p1',
    availablePlayers.find((p) => p.isBot)?.id || 'bot_lvl12',
  ]);

  // Bot Settings
  const [includeBot, setIncludeBot] = useState<boolean>(true);
  const [botLevel, setBotLevel] = useState<number>(12);

  // Team match
  const [isTeamMatch, setIsTeamMatch] = useState<boolean>(false);

  // Add custom player state
  const [newPlayerName, setNewPlayerName] = useState('');
  const [newPlayerAvatar, setNewPlayerAvatar] = useState('🎯');

  const handleAddPlayer = async () => {
    if (!newPlayerName.trim()) return;
    const newP: Player = {
      id: `p_${Date.now()}`,
      name: newPlayerName.trim(),
      avatar: newPlayerAvatar || '🎯',
      color: '#F59E0B',
      isBot: false,
      createdAt: new Date().toISOString(),
    };
    await onSaveNewPlayer(newP);
    setSelectedPlayerIds((prev) => [...prev, newP.id]);
    setNewPlayerName('');
  };

  const handleTogglePlayer = (id: string) => {
    if (selectedPlayerIds.includes(id)) {
      if (selectedPlayerIds.length > 1) {
        setSelectedPlayerIds(selectedPlayerIds.filter((pId) => pId !== id));
      }
    } else {
      setSelectedPlayerIds([...selectedPlayerIds, id]);
    }
  };

  const handleStart = () => {
    let players = availablePlayers.filter((p) => selectedPlayerIds.includes(p.id));

    if (includeBot && !players.some((p) => p.isBot)) {
      const botProfile = DARTBOT_LEVELS.find((l) => l.level === botLevel) || DARTBOT_LEVELS[11];
      const botPlayer: Player = {
        id: `bot_${botLevel}`,
        name: `DartBot (Lvl ${botLevel})`,
        avatar: '🤖',
        color: '#EF4444',
        isBot: true,
        botLevel,
        createdAt: new Date().toISOString(),
      };
      players = [players[0], botPlayer];
    }

    let rulesConfig: any = {};
    if (gameType === 'x01') {
      rulesConfig = {
        startingScore,
        inRule,
        outRule,
        legsToWin,
        setsToWin,
      };
    } else if (gameType === 'cricket') {
      rulesConfig = {
        pointsAllowed: cricketPoints,
        includePoints: cricketPoints,
      };
    } else if (gameType === 'around_the_clock') {
      rulesConfig = {
        targetType: aroundTarget,
        includeBull: aroundBull,
      };
    } else if (gameType === 'killer') {
      rulesConfig = {
        startingLives: killerLives,
        doubleToQualify: killerDoubleQualify,
        selfHitPenalty: true,
      };
    } else if (gameType === 'shanghai' || gameType === 'bobs_27') {
      rulesConfig = {};
    }

    const rules: GameRules = {
      type: gameType,
      config: rulesConfig,
    };

    onStartMatch(gameType, rules, players, isTeamMatch);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto overflow-x-hidden">
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl max-w-2xl w-full p-4 sm:p-6 shadow-2xl flex flex-col gap-5 max-h-[90vh] overflow-y-auto overflow-x-hidden min-w-0">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-4 min-w-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
              <Play className="w-5 h-5 fill-current" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base sm:text-lg font-black text-white uppercase tracking-wide truncate">
                Start New Darts Match
              </h2>
              <p className="text-xs text-zinc-400 truncate">Configure game rules, match format, and players</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-white rounded-xl hover:bg-zinc-800 transition-colors shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Game Mode Picker */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-bold uppercase tracking-wider text-zinc-400">
            Select Game Type
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {[
              { id: 'x01', name: 'X01 (501 / 301)', desc: 'Standard PDC Match' },
              { id: 'cricket', name: 'Cricket', desc: 'Tactical Marks & Points' },
              { id: 'around_the_clock', name: 'Around The Clock', desc: 'Hit 1 through 20 + Bull' },
              { id: 'killer', name: 'Killer', desc: 'Elimination Party Game' },
              { id: 'shanghai', name: 'Shanghai', desc: 'Single, Double, Treble' },
              { id: 'bobs_27', name: "Bob's 27", desc: 'Classic Double Practice' },
            ].map((g) => (
              <button
                key={g.id}
                onClick={() => setGameType(g.id as GameType)}
                className={`p-3 rounded-xl border text-left flex flex-col gap-1 transition-all ${
                  gameType === g.id
                    ? 'border-amber-500 bg-amber-500/10 text-amber-300 shadow-md ring-1 ring-amber-500/30'
                    : 'border-zinc-800 bg-zinc-950 text-zinc-400 hover:text-white hover:border-zinc-700'
                }`}
              >
                <span className="text-xs font-black uppercase text-white">{g.name}</span>
                <span className="text-[10px] text-zinc-400">{g.desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Specific Rules Configuration */}
        {gameType === 'x01' && (
          <div className="bg-zinc-950 p-4 rounded-2xl border border-zinc-800 flex flex-col gap-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Starting Score */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold uppercase text-zinc-400">
                  Starting Score
                </label>
                <div className="flex gap-1">
                  {[301, 501, 701].map((s) => (
                    <button
                      key={s}
                      onClick={() => setStartingScore(s as any)}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                        startingScore === s
                          ? 'bg-amber-500 text-zinc-950 border-amber-400'
                          : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* In Rule */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold uppercase text-zinc-400">In Rule</label>
                <div className="flex gap-1">
                  <button
                    onClick={() => setInRule('straight_in')}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                      inRule === 'straight_in'
                        ? 'bg-amber-500 text-zinc-950 border-amber-400'
                        : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white'
                    }`}
                  >
                    Straight
                  </button>
                  <button
                    onClick={() => setInRule('double_in')}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                      inRule === 'double_in'
                        ? 'bg-amber-500 text-zinc-950 border-amber-400'
                        : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white'
                    }`}
                  >
                    Double-In
                  </button>
                </div>
              </div>

              {/* Out Rule */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold uppercase text-zinc-400">Out Rule</label>
                <div className="flex gap-1">
                  <button
                    onClick={() => setOutRule('double_out')}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                      outRule === 'double_out'
                        ? 'bg-amber-500 text-zinc-950 border-amber-400'
                        : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white'
                    }`}
                  >
                    Double
                  </button>
                  <button
                    onClick={() => setOutRule('master_out')}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                      outRule === 'master_out'
                        ? 'bg-amber-500 text-zinc-950 border-amber-400'
                        : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white'
                    }`}
                  >
                    Master
                  </button>
                  <button
                    onClick={() => setOutRule('straight_out')}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                      outRule === 'straight_out'
                        ? 'bg-amber-500 text-zinc-950 border-amber-400'
                        : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white'
                    }`}
                  >
                    Single
                  </button>
                </div>
              </div>
            </div>

            {/* Legs to win */}
            <div className="flex items-center justify-between border-t border-zinc-800/80 pt-3">
              <span className="text-xs font-semibold text-zinc-300">Legs to Win Match:</span>
              <div className="flex items-center gap-2">
                {[1, 3, 5, 7, 9].map((l) => (
                  <button
                    key={l}
                    onClick={() => setLegsToWin(l)}
                    className={`w-8 h-8 rounded-lg text-xs font-mono font-bold border ${
                      legsToWin === l
                        ? 'bg-amber-500 text-zinc-950 border-amber-400'
                        : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white'
                    }`}
                  >
                    {l}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* DartBot Integration */}
        <div className="bg-zinc-950 p-4 rounded-2xl border border-zinc-800 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Bot className="w-5 h-5 text-amber-400" />
              <div>
                <div className="text-xs font-bold text-white uppercase">DartBot Opponent</div>
                <div className="text-[11px] text-zinc-400">
                  Play against calibrated PDC bot simulator (Levels 1 - 25)
                </div>
              </div>
            </div>
            <button
              onClick={() => setIncludeBot(!includeBot)}
              className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase transition-all ${
                includeBot
                  ? 'bg-amber-500 text-zinc-950 shadow-md'
                  : 'bg-zinc-900 text-zinc-400 border border-zinc-800'
              }`}
            >
              {includeBot ? 'Bot ON' : 'Bot OFF'}
            </button>
          </div>

          {includeBot && (
            <div className="flex flex-col gap-2 pt-2 border-t border-zinc-800/80">
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-400 font-semibold">
                  Difficulty:{' '}
                  <strong className="text-white font-mono">
                    Level {botLevel} -{' '}
                    {DARTBOT_LEVELS.find((l) => l.level === botLevel)?.name || ''}
                  </strong>
                </span>
                <span className="text-amber-400 font-mono font-bold">
                  Avg ~{DARTBOT_LEVELS.find((l) => l.level === botLevel)?.target3DA} 3DA
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="25"
                value={botLevel}
                onChange={(e) => setBotLevel(parseInt(e.target.value, 10))}
                className="w-full accent-amber-500"
              />
            </div>
          )}
        </div>

        {/* Players Selection */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-bold uppercase tracking-wider text-zinc-400">
            Select Active Players ({selectedPlayerIds.length})
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {availablePlayers
              .filter((p) => !p.isBot)
              .map((p) => {
                const isSelected = selectedPlayerIds.includes(p.id);
                return (
                  <button
                    key={p.id}
                    onClick={() => handleTogglePlayer(p.id)}
                    className={`p-2.5 rounded-xl border flex items-center gap-2 transition-all ${
                      isSelected
                        ? 'border-amber-500 bg-amber-500/10 text-white'
                        : 'border-zinc-800 bg-zinc-950 text-zinc-400 hover:text-white'
                    }`}
                  >
                    <span className="text-lg">{p.avatar || '🎯'}</span>
                    <span className="text-xs font-bold truncate">{p.name}</span>
                  </button>
                );
              })}
          </div>

          {/* Quick Add Custom Player */}
          <div className="flex items-center gap-2 mt-2">
            <input
              type="text"
              placeholder="New player name..."
              value={newPlayerName}
              onChange={(e) => setNewPlayerName(e.target.value)}
              className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500"
            />
            <button
              onClick={handleAddPlayer}
              disabled={!newPlayerName.trim()}
              className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-1 transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add</span>
            </button>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="border-t border-zinc-800 pt-4 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold text-xs transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleStart}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-amber-500/20 active:scale-95 transition-all flex items-center gap-2"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Start Match Now</span>
          </button>
        </div>
      </div>
    </div>
  );
};
