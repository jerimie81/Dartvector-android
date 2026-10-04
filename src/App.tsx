import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import {
  Target,
  Play,
  BarChart3,
  Radio,
  HelpCircle,
  Volume2,
  RefreshCw,
  Mic,
  MicOff,
  SkipForward,
  Bot,
} from 'lucide-react';
import {
  GameState,
  GameType,
  GameRules,
  Player,
  DartThrow,
} from './types/darts';
import {
  createInitialGameState,
  applyDartThrow,
  applyQuickTurnScore,
  getCheckoutAdvice,
} from './engine/darts-engine';
import { determineBotTarget, simulateBotThrow, DARTBOT_LEVELS } from './engine/dartbot';
import { audioEngine } from './services/audio-engine';
import { appStorage, DEFAULT_PLAYERS } from './services/storage';

import { Dartboard } from './components/Dartboard';
import { ScoreboardCard } from './components/ScoreboardCard';
import { QuickScores } from './components/QuickScores';
import { TurnKeypad } from './components/TurnKeypad';
import { DartPicker } from './components/DartPicker';
import { ThrowLogPanel } from './components/ThrowLogPanel';
import { ChalkboardView } from './components/ChalkboardView';
import { AICoachPanel } from './components/AICoachPanel';

import { NewMatchModal } from './components/NewMatchModal';
import { MatchVaultModal } from './components/MatchVaultModal';
import { OnlineHubModal } from './components/OnlineHubModal';
import { LeagueNightModal } from './components/LeagueNightModal';
import { GuideModal } from './components/GuideModal';
import { AudioSettingsModal } from './components/AudioSettingsModal';

export const App: React.FC = () => {
  // Navigation & Modals
  const [activeNav, setActiveNav] = useState<'scoreboard' | 'setup' | 'analytics' | 'multiplayer'>('scoreboard');
  const [showSetupModal, setShowSetupModal] = useState(false);
  const [showVaultModal, setShowVaultModal] = useState(false);
  const [showOnlineModal, setShowOnlineModal] = useState(false);
  const [showLeagueModal, setShowLeagueModal] = useState(false);
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [showAudioModal, setShowAudioModal] = useState(false);
  const [showChalkboard, setShowChalkboard] = useState(false);

  // Custom score prompt dialog
  const [showCustomScoreDialog, setShowCustomScoreDialog] = useState(false);
  const [customScoreInput, setCustomScoreInput] = useState('');

  // Players
  const [availablePlayers, setAvailablePlayers] = useState<Player[]>(DEFAULT_PLAYERS);

  // Input tab: 'quick' | 'keypad' | 'dart'
  const [activeInputTab, setActiveInputTab] = useState<'quick' | 'keypad' | 'dart'>('quick');

  // Dartboard display states
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [isBotEnabled, setIsBotEnabled] = useState(true);

  // Speech Recognition (Voice entry)
  const [isListeningVoice, setIsListeningVoice] = useState(false);

  // Core Game State
  const [gameState, setGameState] = useState<GameState>(() => {
    const rules: GameRules = {
      type: 'x01',
      config: {
        startingScore: 501,
        inRule: 'straight_in',
        outRule: 'double_out',
        legsToWin: 3,
        setsToWin: 1,
      },
    };
    return createInitialGameState('x01', rules, [
      { id: 'p1', name: 'Player 1', avatar: '🎯', color: '#F59E0B', isBot: false, createdAt: new Date().toISOString() },
      { id: 'bot_lvl12', name: 'DartBot (Lvl 12)', avatar: '🤖', color: '#EF4444', isBot: true, botLevel: 12, createdAt: new Date().toISOString() },
    ]);
  });

  // Load saved players on start
  useEffect(() => {
    appStorage.getPlayers().then((players) => {
      if (players && players.length > 0) {
        setAvailablePlayers(players);
      }
    });
  }, []);

  // Save completed match to storage
  useEffect(() => {
    if (gameState.isMatchOver && gameState.match.status === 'completed') {
      appStorage.saveMatch(gameState.match).catch(console.error);
    }
  }, [gameState.isMatchOver, gameState.match]);

  // Determine aim target for highlight on board
  const activePlayer = gameState.match.players[gameState.activePlayerIndex];
  const activeRemaining = gameState.remainingScores[activePlayer.id] ?? 0;
  const dartsLeft = 3 - gameState.currentTurnDarts.length;

  let aimTarget: string | null = null;
  if (gameState.match.rules.type === 'x01' && activeRemaining <= 170 && activeRemaining > 1) {
    const checkout = getCheckoutAdvice(activeRemaining, dartsLeft);
    if (checkout && checkout.route.length > 0) {
      aimTarget = checkout.route[0];
    }
  }

  // Handle DartBot Turn Automation
  const botTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (gameState.isMatchOver || !isBotEnabled) return;
    const current = gameState.match.players[gameState.activePlayerIndex];
    if (!current?.isBot) return;

    const botLevel = current.botLevel || 12;
    const profile = DARTBOT_LEVELS.find((l) => l.level === botLevel) || DARTBOT_LEVELS[11];

    botTimeoutRef.current = setTimeout(() => {
      const target = determineBotTarget(gameState, botLevel);
      const botDart = simulateBotThrow(target, botLevel);
      handleThrowDart(botDart);
    }, profile.reactionDelayMs);

    return () => {
      if (botTimeoutRef.current) clearTimeout(botTimeoutRef.current);
    };
  }, [gameState, isBotEnabled]);

  // Handle single dart throw
  const handleThrowDart = (dart: DartThrow) => {
    const isWire = !!dart.isWireHit;
    const isSpecial = dart.multiplier >= 2 || dart.segment === 50;

    audioEngine.playDartHit(isSpecial, isWire);

    const result = applyDartThrow(gameState, dart);
    setGameState(result.nextState);

    // Audio referee announcements
    if (result.matchCompleted) {
      confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
      const winner = gameState.match.players.find((p) => p.id === result.nextState.winnerPlayerId);
      audioEngine.callGameShot(true, winner?.name || 'Winner');
    } else if (result.legCompleted) {
      confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
      const winner = gameState.match.players[gameState.activePlayerIndex];
      audioEngine.callGameShot(false, winner?.name || 'Winner', `Leg ${gameState.currentLeg.legNumber}`);
    } else if (result.turnCompleted) {
      const lastTurn = result.nextState.currentLeg.turns[result.nextState.currentLeg.turns.length - 1];
      if (lastTurn) {
        audioEngine.callScore(lastTurn.turnTotal, lastTurn.isBust);
        const nextActive = result.nextState.match.players[result.nextState.activePlayerIndex];
        const nextRem = result.nextState.remainingScores[nextActive.id];
        if (nextRem !== undefined && nextRem <= 170 && nextRem > 1) {
          setTimeout(() => {
            audioEngine.callRequirement(nextActive.name, nextRem);
          }, 800);
        }
      }
    }
  };

  // Handle quick scores (e.g. 60, 100, 140, 180, BUST)
  const handleQuickScore = (totalScore: number) => {
    const result = applyQuickTurnScore(gameState, totalScore);
    setGameState(result.nextState);

    if (result.matchCompleted) {
      confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
      const winner = gameState.match.players.find((p) => p.id === result.nextState.winnerPlayerId);
      audioEngine.callGameShot(true, winner?.name || 'Winner');
    } else if (result.legCompleted) {
      confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
      const winner = gameState.match.players[gameState.activePlayerIndex];
      audioEngine.callGameShot(false, winner?.name || 'Winner', `Leg ${gameState.currentLeg.legNumber}`);
    } else if (result.turnCompleted) {
      const lastTurn = result.nextState.currentLeg.turns[result.nextState.currentLeg.turns.length - 1];
      if (lastTurn) {
        audioEngine.callScore(lastTurn.turnTotal, lastTurn.isBust);
        const nextActive = result.nextState.match.players[result.nextState.activePlayerIndex];
        const nextRem = result.nextState.remainingScores[nextActive.id];
        if (nextRem !== undefined && nextRem <= 170 && nextRem > 1) {
          setTimeout(() => {
            audioEngine.callRequirement(nextActive.name, nextRem);
          }, 800);
        }
      }
    }
  };

  // End turn manually (e.g. after 1 or 2 darts, or to pass visit)
  const handleEndTurn = () => {
    if (gameState.currentTurnDarts.length === 0) {
      // 0 score pass
      handleQuickScore(0);
      return;
    }
    // Pad remaining with MISS darts and apply
    let s = gameState;
    while (s.currentTurnDarts.length < 3) {
      const miss: DartThrow = {
        segment: 0,
        multiplier: 0,
        score: 0,
        label: 'MISS',
        timestamp: Date.now(),
      };
      const res = applyDartThrow(s, miss);
      s = res.nextState;
      if (res.turnCompleted || res.legCompleted || res.matchCompleted) break;
    }
    setGameState(s);
  };

  // Start new match
  const handleStartNewMatch = (
    gameType: GameType,
    rules: GameRules,
    players: Player[],
    isTeamMatch: boolean
  ) => {
    const fresh = createInitialGameState(gameType, rules, players, isTeamMatch);
    setGameState(fresh);
    setActiveNav('scoreboard');
  };

  // Toggle voice recognition entry
  const handleToggleVoice = () => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      alert('Speech recognition is not supported in this browser. Please use keyboard or board input.');
      return;
    }

    if (isListeningVoice) {
      setIsListeningVoice(false);
      return;
    }

    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRec();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    setIsListeningVoice(true);

    recognition.onresult = (event: any) => {
      const speech = event.results[0][0].transcript.toLowerCase();
      setIsListeningVoice(false);

      if (speech.includes('one eighty') || speech.includes('180') || speech.includes('maximum')) {
        handleQuickScore(180);
      } else if (speech.includes('ton forty') || speech.includes('140')) {
        handleQuickScore(140);
      } else if (speech.includes('ton') || speech.includes('100')) {
        handleQuickScore(100);
      } else if (speech.includes('twenty six') || speech.includes('breakfast') || speech.includes('26')) {
        handleQuickScore(26);
      } else if (speech.includes('bust')) {
        handleQuickScore(-1);
      } else {
        const num = parseInt(speech.replace(/\D/g, ''), 10);
        if (!isNaN(num) && num >= 0 && num <= 180) {
          handleQuickScore(num);
        }
      }
    };

    recognition.onerror = () => {
      setIsListeningVoice(false);
    };

    recognition.onend = () => {
      setIsListeningVoice(false);
    };

    recognition.start();
  };

  // All historical throws for heatmap
  const historicalThrows: DartThrow[] = [];
  gameState.match.legs.forEach((leg) => {
    leg.turns.forEach((turn) => {
      historicalThrows.push(...turn.darts);
    });
  });

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col selection:bg-amber-500 selection:text-zinc-950">
      {/* Top Application Header */}
      <header className="sticky top-0 z-40 bg-zinc-950/95 backdrop-blur-md border-b border-zinc-800/80 px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div
          onClick={() => setActiveNav('scoreboard')}
          className="flex items-center gap-3 cursor-pointer select-none group"
        >
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-300 text-zinc-950 flex items-center justify-center font-black shadow-lg shadow-amber-500/20 group-hover:scale-105 transition-transform">
            <Target className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-lg text-white tracking-tight">DARTVECTOR</span>
              <span className="text-[10px] font-black uppercase bg-amber-500 text-zinc-950 px-1.5 py-0.2 rounded shadow-sm">
                PRO
              </span>
            </div>
            <span className="text-[10px] text-zinc-400 font-semibold tracking-wider uppercase block">
              PDC Precision Match Engine
            </span>
          </div>
        </div>

        {/* Primary Navigation Buttons with explicit IDs matching blueprint and original HTML */}
        <div className="hidden md:flex items-center gap-1.5 bg-zinc-900/90 p-1 rounded-2xl border border-zinc-800">
          <button
            id="nav-scoreboard-btn"
            onClick={() => setActiveNav('scoreboard')}
            className={`px-4 py-2 text-xs font-black uppercase tracking-wider rounded-xl transition-all flex items-center gap-2 ${
              activeNav === 'scoreboard'
                ? 'bg-amber-500 text-zinc-950 shadow-md'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
            }`}
          >
            <Target className="w-4 h-4" />
            <span>Scoreboard</span>
          </button>

          <button
            id="nav-setup-btn"
            onClick={() => setShowSetupModal(true)}
            className="px-4 py-2 text-xs font-black uppercase tracking-wider rounded-xl transition-all flex items-center gap-2 text-zinc-400 hover:text-white hover:bg-zinc-800/60"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>New Match</span>
          </button>

          <button
            id="nav-analytics-btn"
            onClick={() => setShowVaultModal(true)}
            className="px-4 py-2 text-xs font-black uppercase tracking-wider rounded-xl transition-all flex items-center gap-2 text-zinc-400 hover:text-white hover:bg-zinc-800/60"
          >
            <BarChart3 className="w-4 h-4" />
            <span>Match Vault</span>
          </button>

          <button
            id="nav-multiplayer-btn"
            onClick={() => setShowOnlineModal(true)}
            className="px-4 py-2 text-xs font-black uppercase tracking-wider rounded-xl transition-all flex items-center gap-2 text-zinc-400 hover:text-white hover:bg-zinc-800/60"
          >
            <Radio className="w-4 h-4" />
            <span>Online Hub</span>
          </button>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            id="nav-league-night-btn"
            onClick={() => setShowLeagueModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 rounded-xl border border-amber-500/30 text-xs font-bold transition-all active:scale-95 shadow-sm"
            title="House League Night Leaderboard & Stats"
          >
            <span>🍺</span>
            <span className="hidden sm:inline">League Night</span>
          </button>

          <button
            id="nav-guide-btn"
            onClick={() => setShowGuideModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white rounded-xl border border-zinc-800 text-xs font-bold transition-colors"
            title="How To Play & Scoring Quick Guide"
          >
            <HelpCircle className="w-4 h-4 text-amber-400" />
            <span className="hidden lg:inline">Guide</span>
          </button>

          <button
            id="audio-settings-toggle-btn"
            onClick={() => setShowAudioModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white rounded-xl border border-zinc-800 text-xs font-bold transition-colors"
            title="Referee & Audio Settings"
          >
            <Volume2 className="w-4 h-4 text-amber-400" />
            <span className="hidden sm:inline">Caller FX</span>
          </button>

          {/* Connection badge */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-emerald-400 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="hidden sm:inline">Online</span>
          </div>

          {/* Mobile start new match */}
          <button
            id="mobile-new-match-btn"
            onClick={() => setShowSetupModal(true)}
            className="md:hidden p-2 bg-amber-500 text-zinc-950 rounded-xl"
            title="New Match"
          >
            <Play className="w-4 h-4 fill-current" />
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 flex flex-col gap-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column (Scoreboard Card + Input Controls) */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            <ScoreboardCard
              gameState={gameState}
              onEndTurn={handleEndTurn}
              onToggleChalkboard={() => setShowChalkboard(true)}
            />

            {/* Turn Input Card */}
            <div className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-4 shadow-xl flex flex-col gap-3">
              {/* Input Tabs Header */}
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <div className="flex bg-zinc-950 p-1 rounded-xl border border-zinc-800">
                  <button
                    id="tab-house-quick-btn"
                    onClick={() => setActiveInputTab('quick')}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                      activeInputTab === 'quick'
                        ? 'bg-amber-500 text-zinc-950 shadow-md'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    🏠 Quick Scores
                  </button>
                  <button
                    id="tab-keypad-btn"
                    onClick={() => setActiveInputTab('keypad')}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                      activeInputTab === 'keypad'
                        ? 'bg-amber-500 text-zinc-950 shadow-md'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    🔢 Turn NumPad
                  </button>
                  <button
                    id="tab-dart-btn"
                    onClick={() => setActiveInputTab('dart')}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                      activeInputTab === 'dart'
                        ? 'bg-amber-500 text-zinc-950 shadow-md'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    🎯 Dart Picker
                  </button>
                </div>

                {/* Voice Entry Button */}
                <div className="flex items-center gap-2">
                  <button
                    id="voice-mic-btn"
                    onClick={handleToggleVoice}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                      isListeningVoice
                        ? 'bg-red-500/20 text-red-400 border-red-500/40 animate-pulse'
                        : 'bg-zinc-800 text-zinc-300 border-zinc-700 hover:bg-zinc-700 hover:text-white'
                    }`}
                    title="Voice Caller Entry"
                  >
                    {isListeningVoice ? <Mic className="w-3.5 h-3.5 text-red-400 animate-spin" /> : <MicOff className="w-3.5 h-3.5 text-zinc-400" />}
                    <span>{isListeningVoice ? 'Listening...' : 'Voice Entry'}</span>
                  </button>
                </div>
              </div>

              {/* Current Turn Status */}
              <div className="flex flex-wrap items-center justify-between gap-2 bg-zinc-950/80 px-3 py-2 rounded-xl border border-zinc-800/80">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-zinc-400">Current Turn:</span>
                  <div className="flex gap-1.5">
                    {[0, 1, 2].map((idx) => {
                      const d = gameState.currentTurnDarts[idx];
                      return (
                        <div
                          key={idx}
                          className={`min-w-[42px] h-7 px-2 flex items-center justify-center rounded-md text-xs font-black border transition-all ${
                            d
                              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm'
                              : 'bg-zinc-900/60 text-zinc-600 border-zinc-800'
                          }`}
                        >
                          {d ? d.label : `D${idx + 1}`}
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    id="end-turn-btn"
                    onClick={handleEndTurn}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-black bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 rounded-lg shadow-md transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
                    title="Finish turn and switch to next player"
                  >
                    <SkipForward className="w-3.5 h-3.5 fill-current" />
                    <span>End Turn</span>
                  </button>
                </div>
              </div>

              {/* Tab Bodies */}
              {activeInputTab === 'quick' && (
                <QuickScores
                  onScoreSelect={handleQuickScore}
                  onOpenCustomDialog={() => setShowCustomScoreDialog(true)}
                />
              )}

              {activeInputTab === 'keypad' && (
                <TurnKeypad onSubmitScore={handleQuickScore} />
              )}

              {activeInputTab === 'dart' && (
                <DartPicker
                  onAddDart={handleThrowDart}
                  dartsInHand={3 - gameState.currentTurnDarts.length}
                />
              )}
            </div>
          </div>

          {/* Right Column (Regulation Sisal Dartboard + AI Coach) */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 shadow-2xl flex flex-col items-center gap-4 relative overflow-hidden">
              <div className="w-full flex items-center justify-between border-b border-zinc-800 pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black uppercase tracking-wider text-amber-400">
                    Regulation Sisal Board
                  </span>
                  <button
                    id="toggle-dartbot-btn"
                    onClick={() => setIsBotEnabled(!isBotEnabled)}
                    className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border transition-all flex items-center gap-1 ${
                      isBotEnabled
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30'
                        : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                    }`}
                    title={isBotEnabled ? 'DartBot is Active' : 'DartBot is Disabled'}
                  >
                    <Bot className="w-3 h-3" />
                    <span>{isBotEnabled ? 'Bot ON' : 'Bot OFF'}</span>
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    id="toggle-heatmap-btn"
                    onClick={() => setShowHeatmap(!showHeatmap)}
                    className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border transition-all ${
                      showHeatmap
                        ? 'bg-amber-500 text-zinc-950 font-black shadow-sm'
                        : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:text-white'
                    }`}
                  >
                    Heatmap
                  </button>
                </div>
              </div>

              {/* Dartboard SVG */}
              <Dartboard
                onThrowDart={handleThrowDart}
                currentTurnDarts={gameState.currentTurnDarts}
                highlightTarget={aimTarget}
                historicalThrows={historicalThrows}
                showHeatmap={showHeatmap}
                interactive={!activePlayer.isBot}
              />

              <div className="text-[11px] text-zinc-500 text-center font-medium">
                Click or touch the board to throw pinpoint darts into double, treble, or single beds.
              </div>
            </div>

            {/* AI Coach Panel */}
            <AICoachPanel gameState={gameState} />
          </div>
        </div>

        {/* Throw-by-Throw Log Panel */}
        <ThrowLogPanel gameState={gameState} />
      </main>

      {/* Chalkboard Fullscreen View */}
      {showChalkboard && (
        <ChalkboardView
          gameState={gameState}
          onClose={() => setShowChalkboard(false)}
        />
      )}

      {/* Modals */}
      <NewMatchModal
        isOpen={showSetupModal}
        onClose={() => setShowSetupModal(false)}
        onStartMatch={handleStartNewMatch}
        availablePlayers={availablePlayers}
        onSaveNewPlayer={async (p) => {
          await appStorage.savePlayer(p);
          const list = await appStorage.getPlayers();
          setAvailablePlayers(list);
        }}
      />

      <MatchVaultModal
        isOpen={showVaultModal}
        onClose={() => setShowVaultModal(false)}
      />

      <OnlineHubModal
        isOpen={showOnlineModal}
        onClose={() => setShowOnlineModal(false)}
      />

      <LeagueNightModal
        isOpen={showLeagueModal}
        onClose={() => setShowLeagueModal(false)}
        players={availablePlayers}
      />

      <GuideModal
        isOpen={showGuideModal}
        onClose={() => setShowGuideModal(false)}
      />

      <AudioSettingsModal
        isOpen={showAudioModal}
        onClose={() => setShowAudioModal(false)}
      />

      {/* Custom Score Dialog */}
      {showCustomScoreDialog && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-sm w-full p-5 shadow-2xl flex flex-col gap-4">
            <h3 className="text-sm font-black text-white uppercase">Enter Custom Turn Score</h3>
            <p className="text-xs text-zinc-400">Type any total visit score from 0 to 180.</p>
            <input
              type="number"
              min="0"
              max="180"
              value={customScoreInput}
              onChange={(e) => setCustomScoreInput(e.target.value)}
              placeholder="e.g. 95"
              autoFocus
              className="bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-lg font-mono font-bold text-amber-400 focus:outline-none focus:border-amber-500"
            />
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => {
                  setShowCustomScoreDialog(false);
                  setCustomScoreInput('');
                }}
                className="px-4 py-2 bg-zinc-800 text-zinc-400 hover:text-white rounded-xl text-xs font-bold"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const s = parseInt(customScoreInput, 10);
                  if (!isNaN(s) && s >= 0 && s <= 180) {
                    handleQuickScore(s);
                    setShowCustomScoreDialog(false);
                    setCustomScoreInput('');
                  }
                }}
                disabled={!customScoreInput}
                className="px-5 py-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-zinc-950 font-black rounded-xl text-xs uppercase"
              >
                Score
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
