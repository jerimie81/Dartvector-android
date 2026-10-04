export type GameType = 'x01' | 'cricket' | 'around_the_clock' | 'shanghai' | 'killer' | 'bobs_27';

export interface X01Config {
  startingScore: 301 | 501 | 701 | 1001;
  inRule: 'straight_in' | 'double_in';
  outRule: 'straight_out' | 'double_out' | 'master_out';
  legsToWin: number;
  setsToWin: number;
}

export interface CricketConfig {
  pointsAllowed: boolean;
  includePoints?: boolean;
  strictOrder?: boolean;
}

export interface AroundClockConfig {
  targetType: 'singles' | 'doubles' | 'trebles';
  includeBull: boolean;
}

export interface KillerConfig {
  startingLives: number;
  doubleToQualify: boolean;
  selfHitPenalty: boolean;
}

export interface GameRules {
  type: GameType;
  config: any;
}

export interface Player {
  id: string;
  name: string;
  avatar: string;
  color: string;
  isBot?: boolean;
  botLevel?: number;
  teamId?: 'team_1' | 'team_2';
  createdAt: string;
}

export interface Team {
  id: 'team_1' | 'team_2';
  name: string;
  avatar: string;
  color: string;
}

export interface DartThrow {
  segment: number; // 0..20, 25 (bull), 50 (double bull)
  multiplier: number; // 0, 1, 2, 3
  score: number; // segment * multiplier
  label: string; // e.g. "T20", "D16", "S20", "BULL", "D-BULL", "MISS"
  isWireHit?: boolean;
  radius?: number;
  angleDeg?: number;
  x?: number;
  y?: number;
  timestamp?: number;
}

export interface Turn {
  id: string;
  legNumber: number;
  setNumber: number;
  playerId: string;
  darts: DartThrow[];
  turnTotal: number;
  isBust: boolean;
  scoreBefore: number;
  scoreAfter: number;
  createdAt: number;
}

export interface Leg {
  legNumber: number;
  setNumber: number;
  startingScore: number;
  turns: Turn[];
  startTime: number;
  endTime?: number;
  winnerPlayerId?: string;
}

export interface MatchScores {
  legsWon: number;
  setsWon: number;
}

export interface Match {
  id: string;
  gameType: GameType;
  rules: GameRules;
  isTeamMatch: boolean;
  teams?: {
    team_1: Team;
    team_2: Team;
  };
  players: Player[];
  legs: Leg[];
  scores: Record<string, MatchScores>;
  teamScores?: {
    team_1: MatchScores;
    team_2: MatchScores;
  };
  startTime: number;
  endTime?: number;
  status: 'in_progress' | 'completed';
  winnerPlayerId?: string;
  winnerTeamId?: string;
}

export interface CricketPlayerState {
  marks: Record<number, number>; // 15, 16, 17, 18, 19, 20, 25
  score: number;
  points: number;
}

export interface AroundClockPlayerState {
  currentTarget: number; // 1..20, 25
  completed: boolean;
}

export interface KillerPlayerState {
  assignedDouble?: number;
  isKiller: boolean;
  lives: number;
  eliminated: boolean;
}

export interface ShanghaiPlayerState {
  roundScores: number[];
  totalScore: number;
  hasShanghaiWon: boolean;
}

export interface Bobs27PlayerState {
  currentRound: number; // 1..21 (21 is Bull)
  score: number;
  isEliminated: boolean;
  hitsPerRound: number[];
}

export interface GameState {
  match: Match;
  currentLeg: Leg;
  activePlayerIndex: number;
  currentTurnDarts: DartThrow[];
  isMatchOver: boolean;
  cricketState: Record<string, CricketPlayerState>;
  aroundClockState: Record<string, AroundClockPlayerState>;
  killerState: Record<string, KillerPlayerState>;
  shanghaiState: Record<string, ShanghaiPlayerState>;
  bobs27State: Record<string, Bobs27PlayerState>;
  remainingScores: Record<string, number>;
  legStarterIndex: number;
  winnerPlayerId?: string;
  winnerTeamId?: string;
}

export interface CheckoutRoute {
  score: number;
  dartsInHand: number;
  totalDarts: number;
  route: string[];
  path: { label: string }[];
  preferredTarget: string;
  description: string;
  isBogey?: boolean;
}

export interface PlayerStats {
  playerId: string;
  name: string;
  teamId?: string;
  threeDartAvg: number;
  first9Avg: number;
  highestTurn: number;
  highestCheckout: number;
  checkoutsAttempted: number;
  checkoutsHit: number;
  checkoutPct: number;
  dartsThrown: number;
  scores60Plus: number;
  scores100Plus: number;
  scores140Plus: number;
  scores180: number;
  legsWon: number;
  setsWon: number;
}

export interface TeamStats {
  teamId: string;
  name: string;
  avatar: string;
  color: string;
  playerIds: string[];
  threeDartAvg: number;
  first9Avg: number;
  highestTurn: number;
  highestCheckout: number;
  checkoutsAttempted: number;
  checkoutsHit: number;
  checkoutPct: number;
  dartsThrown: number;
  scores60Plus: number;
  scores100Plus: number;
  scores140Plus: number;
  scores180: number;
  legsWon: number;
  setsWon: number;
}
