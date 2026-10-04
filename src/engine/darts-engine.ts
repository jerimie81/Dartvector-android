import {
  DartThrow,
  GameState,
  GameRules,
  Player,
  Team,
  Turn,
  Leg,
  Match,
  CheckoutRoute,
  PlayerStats,
  TeamStats,
} from '../types/darts';

export const BOARD_SEGMENTS = [20, 1, 18, 4, 13, 6, 10, 15, 2, 17, 3, 19, 7, 16, 8, 11, 14, 9, 12, 5];

export const BOARD_DIMENSIONS = {
  DOUBLE_BULL_RADIUS: 6.35,
  SINGLE_BULL_RADIUS: 15.9,
  TRIPLE_INNER_RADIUS: 97,
  TRIPLE_OUTER_RADIUS: 107,
  DOUBLE_INNER_RADIUS: 162,
  DOUBLE_OUTER_RADIUS: 170,
  BOARD_TOTAL_RADIUS: 225,
};

export function polarToCartesian(radius: number, angleDeg: number) {
  const rad = (angleDeg * Math.PI) / 180;
  return {
    x: Math.round(radius * Math.cos(rad) * 100) / 100,
    y: Math.round(radius * Math.sin(rad) * 100) / 100,
  };
}

export function describeArc(
  x: number,
  y: number,
  innerRadius: number,
  outerRadius: number,
  startAngle: number,
  endAngle: number
): string {
  const startRad = (startAngle * Math.PI) / 180;
  const endRad = (endAngle * Math.PI) / 180;
  const r = (v: number) => Math.round(100 * v) / 100;

  const x1 = r(x + outerRadius * Math.cos(startRad));
  const y1 = r(y + outerRadius * Math.sin(startRad));
  const x2 = r(x + outerRadius * Math.cos(endRad));
  const y2 = r(y + outerRadius * Math.sin(endRad));
  const x3 = r(x + innerRadius * Math.cos(endRad));
  const y3 = r(y + innerRadius * Math.sin(endRad));
  const x4 = r(x + innerRadius * Math.cos(startRad));
  const y4 = r(y + innerRadius * Math.sin(startRad));

  const largeArcFlag = endAngle - startAngle <= 180 ? 0 : 1;

  return [
    'M', x1, y1,
    'A', outerRadius, outerRadius, 0, largeArcFlag, 1, x2, y2,
    'L', x3, y3,
    'A', innerRadius, innerRadius, 0, largeArcFlag, 0, x4, y4,
    'Z'
  ].join(' ');
}

export function getDartThrowFromCoords(x: number, y: number): DartThrow {
  const radius = Math.sqrt(x * x + y * y);
  let angleDeg = (180 * Math.atan2(y, x)) / Math.PI;

  if (radius <= BOARD_DIMENSIONS.DOUBLE_BULL_RADIUS) {
    return {
      segment: 50,
      multiplier: 2,
      score: 50,
      label: 'D-BULL',
      isWireHit: Math.abs(radius - BOARD_DIMENSIONS.DOUBLE_BULL_RADIUS) < 0.6,
      radius,
      angleDeg,
      x,
      y,
      timestamp: Date.now(),
    };
  }

  if (radius <= BOARD_DIMENSIONS.SINGLE_BULL_RADIUS) {
    return {
      segment: 25,
      multiplier: 1,
      score: 25,
      label: 'BULL',
      isWireHit: Math.abs(radius - BOARD_DIMENSIONS.SINGLE_BULL_RADIUS) < 0.6,
      radius,
      angleDeg,
      x,
      y,
      timestamp: Date.now(),
    };
  }

  if (radius > BOARD_DIMENSIONS.DOUBLE_OUTER_RADIUS) {
    return {
      segment: 0,
      multiplier: 0,
      score: 0,
      label: 'MISS',
      isWireHit: false,
      radius,
      angleDeg,
      x,
      y,
      timestamp: Date.now(),
    };
  }

  let adjustedAngle = angleDeg + 90;
  while (adjustedAngle < -9) adjustedAngle += 360;
  while (adjustedAngle >= 351) adjustedAngle -= 360;
  const sectorIndex = Math.floor((adjustedAngle + 9) / 18) % 20;
  const segment = BOARD_SEGMENTS[sectorIndex];

  if (radius >= BOARD_DIMENSIONS.TRIPLE_INNER_RADIUS && radius <= BOARD_DIMENSIONS.TRIPLE_OUTER_RADIUS) {
    const isWireHit = Math.min(
      Math.abs(radius - BOARD_DIMENSIONS.TRIPLE_INNER_RADIUS),
      Math.abs(radius - BOARD_DIMENSIONS.TRIPLE_OUTER_RADIUS)
    ) < 0.7;
    return {
      segment,
      multiplier: 3,
      score: segment * 3,
      label: `T${segment}`,
      isWireHit,
      radius,
      angleDeg,
      x,
      y,
      timestamp: Date.now(),
    };
  }

  if (radius >= BOARD_DIMENSIONS.DOUBLE_INNER_RADIUS && radius <= BOARD_DIMENSIONS.DOUBLE_OUTER_RADIUS) {
    const isWireHit = Math.min(
      Math.abs(radius - BOARD_DIMENSIONS.DOUBLE_INNER_RADIUS),
      Math.abs(radius - BOARD_DIMENSIONS.DOUBLE_OUTER_RADIUS)
    ) < 0.7;
    return {
      segment,
      multiplier: 2,
      score: segment * 2,
      label: `D${segment}`,
      isWireHit,
      radius,
      angleDeg,
      x,
      y,
      timestamp: Date.now(),
    };
  }

  return {
    segment,
    multiplier: 1,
    score: segment,
    label: `S${segment}`,
    isWireHit: false,
    radius,
    angleDeg,
    x,
    y,
    timestamp: Date.now(),
  };
}

export function getCoordsFromSegment(segmentOrTarget: number | string, multiplier = 1): { x: number; y: number } {
  let seg = 20;
  let mult = multiplier;

  if (typeof segmentOrTarget === 'number') {
    seg = segmentOrTarget;
  } else if (typeof segmentOrTarget === 'string') {
    const t = segmentOrTarget.toUpperCase().trim();
    if (t === 'BULL' || t === '25' || t === 'S25') {
      seg = 25;
      mult = 1;
    } else if (t === 'D-BULL' || t === 'DBULL' || t === '50' || t === 'D25') {
      seg = 50;
      mult = 2;
    } else if (t.startsWith('T')) {
      mult = 3;
      seg = parseInt(t.slice(1), 10) || 20;
    } else if (t.startsWith('D')) {
      mult = 2;
      seg = parseInt(t.slice(1), 10) || 20;
    } else if (t.startsWith('S')) {
      mult = 1;
      seg = parseInt(t.slice(1), 10) || 20;
    } else {
      seg = parseInt(t, 10) || 20;
      mult = 1;
    }
  }

  if (seg === 50 || (seg === 25 && mult === 2)) return { x: 0, y: 0 };
  if (seg === 25 && mult === 1) return polarToCartesian(11, 0);

  const idx = BOARD_SEGMENTS.indexOf(seg);
  if (idx === -1) return { x: 0, y: 0 };

  let angle = -90 + 18 * idx;
  if (angle > 180) angle -= 360;

  let r = 135;
  if (mult === 3) r = 102;
  else if (mult === 2) r = 166;
  else r = 135;

  return polarToCartesian(r, angle);
}

// Bogey scores that cannot be checked out with 3 darts
export const BOGEY_SCORES = new Set([169, 168, 166, 165, 163, 162, 159]);

export const CHECKOUT_TABLE: Record<number, string[]> = {
  170: ['T20', 'T20', 'D-BULL'],
  167: ['T20', 'T19', 'D-BULL'],
  164: ['T20', 'T18', 'D-BULL'],
  161: ['T20', 'T17', 'D-BULL'],
  160: ['T20', 'T20', 'D20'],
  158: ['T20', 'T20', 'D19'],
  157: ['T20', 'T19', 'D20'],
  156: ['T20', 'T20', 'D18'],
  155: ['T20', 'T19', 'D19'],
  154: ['T20', 'T18', 'D20'],
  153: ['T20', 'T19', 'D18'],
  152: ['T20', 'T20', 'D16'],
  151: ['T20', 'T17', 'D20'],
  150: ['T20', 'T18', 'D18'],
  149: ['T20', 'T19', 'D16'],
  148: ['T20', 'T20', 'D14'],
  147: ['T20', 'T17', 'D18'],
  146: ['T20', 'T18', 'D16'],
  145: ['T20', 'T15', 'D20'],
  144: ['T20', 'T20', 'D12'],
  143: ['T20', 'T17', 'D16'],
  142: ['T20', 'T14', 'D20'],
  141: ['T20', 'T19', 'D12'],
  140: ['T20', 'T20', 'D10'],
  139: ['T20', 'T13', 'D20'],
  138: ['T20', 'T18', 'D12'],
  137: ['T19', 'T16', 'D16'],
  136: ['T20', 'T20', 'D8'],
  135: ['T20', 'T15', 'D15'],
  134: ['T20', 'T14', 'D16'],
  133: ['T20', 'T19', 'D8'],
  132: ['T20', 'T16', 'D12'],
  131: ['T20', 'T13', 'D16'],
  130: ['T20', 'T18', 'D8'],
  129: ['T19', 'T16', 'D12'],
  128: ['T18', 'T14', 'D16'],
  127: ['T20', 'T17', 'D8'],
  126: ['T19', 'T19', 'D6'],
  125: ['25', 'T20', 'D20'],
  124: ['T20', 'T16', 'D8'],
  123: ['T19', 'T16', 'D9'],
  122: ['T18', 'T16', 'D10'],
  121: ['T20', 'T15', 'D8'],
  120: ['T20', '20', 'D20'],
  119: ['T19', 'T10', 'D16'],
  118: ['T20', '18', 'D20'],
  117: ['T20', '17', 'D20'],
  116: ['T20', '16', 'D20'],
  115: ['T20', '15', 'D20'],
  114: ['T20', '14', 'D20'],
  113: ['T19', '16', 'D20'],
  112: ['T20', '12', 'D20'],
  111: ['T20', '19', 'D16'],
  110: ['T20', '10', 'D20'],
  109: ['T19', '12', 'D20'],
  108: ['T20', '16', 'D16'],
  107: ['T19', '18', 'D16'],
  106: ['T20', '14', 'D16'],
  105: ['T20', '13', 'D16'],
  104: ['T18', '18', 'D16'],
  103: ['T19', '14', 'D16'],
  102: ['T20', '10', 'D16'],
  101: ['T17', '18', 'D16'],
  100: ['T20', 'D20'],
  99: ['T19', '10', 'D16'],
  98: ['T20', 'D19'],
  97: ['T19', 'D20'],
  96: ['T20', 'D18'],
  95: ['T19', 'D19'],
  94: ['T18', 'D20'],
  93: ['T19', 'D18'],
  92: ['T20', 'D16'],
  91: ['T17', 'D20'],
  90: ['T20', 'D15'],
  89: ['T19', 'D16'],
  88: ['T16', 'D20'],
  87: ['T17', 'D18'],
  86: ['T18', 'D16'],
  85: ['T15', 'D20'],
  84: ['T20', 'D12'],
  83: ['T17', 'D16'],
  82: ['T14', 'D20'],
  81: ['T19', 'D12'],
  80: ['T20', 'D10'],
  79: ['T19', 'D11'],
  78: ['T18', 'D12'],
  77: ['T19', 'D10'],
  76: ['T20', 'D8'],
  75: ['T17', 'D12'],
  74: ['T14', 'D16'],
  73: ['T19', 'D8'],
  72: ['T16', 'D12'],
  71: ['T13', 'D16'],
  70: ['T18', 'D8'],
  69: ['T15', 'D12'],
  68: ['T20', 'D4'],
  67: ['T17', 'D8'],
  66: ['T10', 'D18'],
  65: ['25', 'D20'],
  64: ['T16', 'D8'],
  63: ['T13', 'D12'],
  62: ['T10', 'D16'],
  61: ['T15', 'D8'],
  60: ['20', 'D20'],
  59: ['19', 'D20'],
  58: ['18', 'D20'],
  57: ['17', 'D20'],
  56: ['16', 'D20'],
  55: ['15', 'D20'],
  54: ['14', 'D20'],
  53: ['13', 'D20'],
  52: ['12', 'D20'],
  51: ['19', 'D16'],
  50: ['D-BULL'],
  49: ['17', 'D16'],
  48: ['16', 'D16'],
  47: ['15', 'D16'],
  46: ['14', 'D16'],
  45: ['13', 'D16'],
  44: ['12', 'D16'],
  43: ['11', 'D16'],
  42: ['10', 'D16'],
  41: ['9', 'D16'],
  40: ['D20'],
  39: ['7', 'D16'],
  38: ['D19'],
  37: ['5', 'D16'],
  36: ['D18'],
  35: ['3', 'D16'],
  34: ['D17'],
  33: ['1', 'D16'],
  32: ['D16'],
  31: ['15', 'D8'],
  30: ['D15'],
  29: ['13', 'D8'],
  28: ['D14'],
  27: ['11', 'D8'],
  26: ['D13'],
  25: ['9', 'D8'],
  24: ['D12'],
  23: ['7', 'D8'],
  22: ['D11'],
  21: ['5', 'D8'],
  20: ['D10'],
  19: ['3', 'D8'],
  18: ['D9'],
  17: ['1', 'D8'],
  16: ['D8'],
  15: ['7', 'D4'],
  14: ['D7'],
  13: ['5', 'D4'],
  12: ['D6'],
  11: ['3', 'D4'],
  10: ['D5'],
  9: ['1', 'D4'],
  8: ['D4'],
  7: ['3', 'D2'],
  6: ['D3'],
  5: ['1', 'D2'],
  4: ['D2'],
  3: ['1', 'D1'],
  2: ['D1'],
};

export function getCheckoutAdvice(score: number, dartsInHand = 3, showBogey = false): CheckoutRoute | null {
  if (score <= 1 || score > 170) return null;

  if (BOGEY_SCORES.has(score)) {
    if (showBogey) {
      return {
        score,
        dartsInHand,
        totalDarts: 3,
        route: ['T20', 'T20', 'D16'],
        path: [{ label: 'T20' }, { label: 'T20' }, { label: 'D16' }],
        preferredTarget: 'T20',
        description: 'Bogey Score (Setup dart needed)',
        isBogey: true,
      };
    }
    return null;
  }

  if (dartsInHand === 1) {
    if (score === 50) {
      return {
        score,
        dartsInHand: 1,
        totalDarts: 1,
        route: ['D-BULL'],
        path: [{ label: 'D-BULL' }],
        preferredTarget: 'D-BULL',
        description: 'Bullseye for the match',
      };
    }
    if (score % 2 === 0 && score <= 40) {
      const d = score / 2;
      return {
        score,
        dartsInHand: 1,
        totalDarts: 1,
        route: [`D${d}`],
        path: [{ label: `D${d}` }],
        preferredTarget: `D${d}`,
        description: `Double ${d}`,
      };
    }
    return null;
  }

  if (dartsInHand === 2) {
    if (score > 110 && score !== 120 && score !== 104) {
      if (score === 110) {
        return {
          score,
          dartsInHand: 2,
          totalDarts: 2,
          route: ['T20', 'D-BULL'],
          path: [{ label: 'T20' }, { label: 'D-BULL' }],
          preferredTarget: 'T20',
          description: 'Treble 20 then Bullseye',
        };
      }
      return null;
    }
    if (score % 2 === 0 && score <= 40) {
      return {
        score,
        dartsInHand: 2,
        totalDarts: 1,
        route: [`D${score / 2}`],
        path: [{ label: `D${score / 2}` }],
        preferredTarget: `D${score / 2}`,
        description: `Double ${score / 2}`,
      };
    }
    if (score === 50) {
      return {
        score,
        dartsInHand: 2,
        totalDarts: 1,
        route: ['D-BULL'],
        path: [{ label: 'D-BULL' }],
        preferredTarget: 'D-BULL',
        description: 'Bullseye',
      };
    }
    if (score <= 60) {
      if (score >= 41) {
        const s = score - 40;
        if (s >= 1 && s <= 20) {
          return {
            score,
            dartsInHand: 2,
            totalDarts: 2,
            route: [`${s}`, 'D20'],
            path: [{ label: `${s}` }, { label: 'D20' }],
            preferredTarget: `${s}`,
            description: `Single ${s}, Double 20`,
          };
        }
      }
      const single = score % 2 === 1 ? 1 : 2;
      const dbl = (score - single) / 2;
      return {
        score,
        dartsInHand: 2,
        totalDarts: 2,
        route: [`${single}`, `D${dbl}`],
        path: [{ label: `${single}` }, { label: `D${dbl}` }],
        preferredTarget: `${single}`,
        description: `Single ${single}, Double ${dbl}`,
      };
    }
    for (let t = 20; t >= 10; t--) {
      const rem = score - 3 * t;
      if (rem > 0 && rem <= 40 && rem % 2 === 0) {
        return {
          score,
          dartsInHand: 2,
          totalDarts: 2,
          route: [`T${t}`, `D${rem / 2}`],
          path: [{ label: `T${t}` }, { label: `D${rem / 2}` }],
          preferredTarget: `T${t}`,
          description: `Treble ${t}, Double ${rem / 2}`,
        };
      }
      if (rem === 50) {
        return {
          score,
          dartsInHand: 2,
          totalDarts: 2,
          route: [`T${t}`, 'D-BULL'],
          path: [{ label: `T${t}` }, { label: 'D-BULL' }],
          preferredTarget: `T${t}`,
          description: `Treble ${t}, Bullseye`,
        };
      }
    }
  }

  const route = CHECKOUT_TABLE[score];
  if (route && route.length > 0) {
    return {
      score,
      dartsInHand: 3,
      totalDarts: route.length,
      route,
      path: route.map((l) => ({ label: l })),
      preferredTarget: route[0],
      description: route.join(' → '),
    };
  }

  return null;
}

export function createInitialGameState(
  gameType: GameRules['type'],
  rules: GameRules,
  players: Player[],
  isTeamMatch = false,
  teams?: { team_1: Team; team_2: Team }
): GameState {
  const matchId = `m_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const startingScore = rules.type === 'x01' ? rules.config.startingScore : 0;

  const scores: Record<string, { legsWon: number; setsWon: number }> = {};
  const remainingScores: Record<string, number> = {};
  const cricketState: GameState['cricketState'] = {};
  const aroundClockState: GameState['aroundClockState'] = {};
  const killerState: GameState['killerState'] = {};
  const shanghaiState: GameState['shanghaiState'] = {};
  const bobs27State: GameState['bobs27State'] = {};

  const teamMatch = isTeamMatch || !!teams || players.some((p) => !!p.teamId);

  players.forEach((p) => {
    scores[p.id] = { legsWon: 0, setsWon: 0 };
    remainingScores[p.id] = startingScore;
    cricketState[p.id] = {
      marks: { 15: 0, 16: 0, 17: 0, 18: 0, 19: 0, 20: 0, 25: 0 },
      score: 0,
      points: 0,
    };
    aroundClockState[p.id] = { currentTarget: 1, completed: false };
    killerState[p.id] = {
      assignedDouble: undefined,
      isKiller: false,
      lives: rules.type === 'killer' ? rules.config.startingLives : 5,
      eliminated: false,
    };
    shanghaiState[p.id] = { roundScores: [], totalScore: 0, hasShanghaiWon: false };
    bobs27State[p.id] = { currentRound: 1, score: 27, isEliminated: false, hitsPerRound: [] };
  });

  const firstLeg: Leg = {
    legNumber: 1,
    setNumber: 1,
    startingScore,
    turns: [],
    startTime: Date.now(),
  };

  const match: Match = {
    id: matchId,
    gameType,
    rules,
    isTeamMatch: teamMatch,
    teams: teamMatch ? teams : undefined,
    players,
    legs: [firstLeg],
    scores,
    teamScores: teamMatch
      ? {
          team_1: { legsWon: 0, setsWon: 0 },
          team_2: { legsWon: 0, setsWon: 0 },
        }
      : undefined,
    startTime: Date.now(),
    status: 'in_progress',
  };

  return {
    match,
    currentLeg: firstLeg,
    activePlayerIndex: 0,
    currentTurnDarts: [],
    isMatchOver: false,
    cricketState,
    aroundClockState,
    killerState,
    shanghaiState,
    bobs27State,
    remainingScores,
    legStarterIndex: 0,
  };
}

export interface ThrowResult {
  nextState: GameState;
  turnCompleted: boolean;
  legCompleted: boolean;
  matchCompleted: boolean;
  isBust: boolean;
  isWinDart: boolean;
  isCheckout?: boolean;
}

export function applyDartThrow(state: GameState, dart: DartThrow): ThrowResult {
  const activePlayer = state.match.players[state.activePlayerIndex];
  const dartWithTime: DartThrow = {
    ...dart,
    timestamp: dart.timestamp || Date.now(),
  };

  const turnDarts = [...state.currentTurnDarts, dartWithTime];
  const rules = state.match.rules;
  const isTeam = !!(state.match.isTeamMatch && activePlayer.teamId);

  let isBust = false;
  let isWin = false;
  let turnDone = turnDarts.length >= 3;

  const next: GameState = {
    ...state,
    currentTurnDarts: turnDarts,
    remainingScores: { ...state.remainingScores },
    cricketState: { ...state.cricketState },
    aroundClockState: { ...state.aroundClockState },
    killerState: { ...state.killerState },
    shanghaiState: { ...state.shanghaiState },
    bobs27State: { ...state.bobs27State },
  };

  const updateRemainingScore = (score: number) => {
    if (isTeam && activePlayer.teamId) {
      state.match.players.forEach((p) => {
        if (p.teamId === activePlayer.teamId) {
          next.remainingScores[p.id] = score;
        }
      });
    } else {
      next.remainingScores[activePlayer.id] = score;
    }
  };

  if (rules.type === 'x01') {
    const currentScore = state.remainingScores[activePlayer.id];
    const inRule = rules.config.inRule;
    const outRule = rules.config.outRule;
    const scoreRem = currentScore - dart.score;

    if (inRule === 'double_in' && currentScore === rules.config.startingScore && dart.multiplier !== 2) {
      // In double_in, must hit double to start scoring
      // do not decrement score
    } else if (scoreRem === 0) {
      if (outRule === 'double_out') {
        if (dart.multiplier === 2 || dart.segment === 50) {
          isWin = true;
          turnDone = true;
          updateRemainingScore(0);
        } else {
          isBust = true;
          turnDone = true;
        }
      } else if (outRule === 'master_out') {
        if (dart.multiplier === 2 || dart.multiplier === 3 || dart.segment === 50) {
          isWin = true;
          turnDone = true;
          updateRemainingScore(0);
        } else {
          isBust = true;
          turnDone = true;
        }
      } else {
        // straight_out
        isWin = true;
        turnDone = true;
        updateRemainingScore(0);
      }
    } else if (scoreRem < 0 || (scoreRem === 1 && (outRule === 'double_out' || outRule === 'master_out'))) {
      isBust = true;
      turnDone = true;
    } else {
      updateRemainingScore(scoreRem);
    }

    if (isBust) {
      // Revert to score at start of this turn
      const turns = state.currentLeg.turns;
      const playerTurns = isTeam && activePlayer.teamId
        ? turns.filter((t) => state.match.players.find((p) => p.id === t.playerId)?.teamId === activePlayer.teamId)
        : turns.filter((t) => t.playerId === activePlayer.id);

      const scoreToRevert = playerTurns.length > 0 ? playerTurns[playerTurns.length - 1].scoreAfter : state.currentLeg.startingScore;
      updateRemainingScore(scoreToRevert);
    }
  } else if (rules.type === 'cricket') {
    const cState = { ...next.cricketState[activePlayer.id] };
    cState.marks = { ...cState.marks };
    const seg = dart.segment === 50 ? 25 : dart.segment;

    if ([15, 16, 17, 18, 19, 20, 25].includes(seg)) {
      const mult = dart.segment === 50 ? 2 : dart.multiplier;
      const currentMarks = cState.marks[seg] || 0;
      const newMarks = currentMarks + mult;
      cState.marks[seg] = Math.min(3, newMarks);

      const allowPoints = rules.config.includePoints !== undefined ? rules.config.includePoints : rules.config.pointsAllowed;
      if (newMarks > 3 && allowPoints) {
        const excess = currentMarks >= 3 ? mult : newMarks - 3;
        const allOpponentsClosed = state.match.players
          .filter((p) => (isTeam ? p.teamId !== activePlayer.teamId : p.id !== activePlayer.id))
          .every((p) => (next.cricketState[p.id]?.marks[seg] || 0) >= 3);

        if (!allOpponentsClosed) {
          cState.score += seg * excess;
          cState.points = cState.score;
        }
      }
    }

    cState.points = cState.score;
    if (isTeam && activePlayer.teamId) {
      state.match.players.forEach((p) => {
        if (p.teamId === activePlayer.teamId) {
          next.cricketState[p.id] = cState;
        }
      });
    } else {
      next.cricketState[activePlayer.id] = cState;
    }

    const allClosed = [15, 16, 17, 18, 19, 20, 25].every((s) => cState.marks[s] >= 3);
    const hasHighestOrEqualScore = state.match.players.every((p) => cState.score >= (next.cricketState[p.id]?.score || 0));

    if (allClosed && hasHighestOrEqualScore) {
      isWin = true;
      turnDone = true;
    }
  } else if (rules.type === 'around_the_clock') {
    const aState = { ...next.aroundClockState[activePlayer.id] };
    const target = aState.currentTarget;
    let hit = false;

    if (target === 25 && (dart.segment === 25 || dart.segment === 50)) {
      hit = true;
    } else if (dart.segment === target) {
      if (rules.config.targetType === 'trebles' && dart.multiplier === 3) hit = true;
      else if (rules.config.targetType === 'doubles' && dart.multiplier === 2) hit = true;
      else if (rules.config.targetType === 'singles') hit = true;
    }

    if (hit) {
      if (target === 20 && rules.config.includeBull) {
        aState.currentTarget = 25;
      } else if (target < 20) {
        aState.currentTarget = target + 1;
      } else {
        aState.completed = true;
        isWin = true;
        turnDone = true;
      }
    }

    if (isTeam && activePlayer.teamId) {
      state.match.players.forEach((p) => {
        if (p.teamId === activePlayer.teamId) next.aroundClockState[p.id] = aState;
      });
    } else {
      next.aroundClockState[activePlayer.id] = aState;
    }
  } else if (rules.type === 'shanghai') {
    const roundNumber = Math.floor(state.currentLeg.turns.length / state.match.players.length) + 1;
    const sState = { ...next.shanghaiState[activePlayer.id] };

    if (dart.segment === roundNumber) {
      sState.totalScore += dart.score;
    }

    if (isTeam && activePlayer.teamId) {
      state.match.players.forEach((p) => {
        if (p.teamId === activePlayer.teamId) next.shanghaiState[p.id] = sState;
      });
    } else {
      next.shanghaiState[activePlayer.id] = sState;
    }

    if (turnDarts.length === 3) {
      const roundDarts = turnDarts.filter((d) => d.segment === roundNumber);
      const hasSingle = roundDarts.some((d) => d.multiplier === 1);
      const hasDouble = roundDarts.some((d) => d.multiplier === 2);
      const hasTreble = roundDarts.some((d) => d.multiplier === 3);

      if (hasSingle && hasDouble && hasTreble) {
        sState.hasShanghaiWon = true;
        isWin = true;
      }
    }
  } else if (rules.type === 'bobs_27') {
    const bState = { ...next.bobs27State[activePlayer.id] };
    const target = bState.currentRound === 21 ? 50 : bState.currentRound;

    if ((target === 50 && dart.segment === 50) || (dart.segment === target && dart.multiplier === 2)) {
      bState.score += target * 2;
    }
    next.bobs27State[activePlayer.id] = bState;
  } else if (rules.type === 'killer') {
    const kState = { ...next.killerState[activePlayer.id] };
    const doubleToQualify = rules.config.doubleToQualify;
    const penalty = rules.config.selfHitPenalty !== false;

    if (!kState.eliminated) {
      if (kState.assignedDouble === undefined) {
        const isDouble = dart.multiplier === 2 || dart.segment === 50;
        if ((!doubleToQualify || isDouble) && dart.segment > 0) {
          const alreadyTaken = state.match.players.some(
            (p) => p.id !== activePlayer.id && next.killerState[p.id]?.assignedDouble === dart.segment
          );
          if (!alreadyTaken) {
            kState.assignedDouble = dart.segment;
          }
        }
      } else if (kState.isKiller) {
        const isDouble = dart.multiplier === 2 || dart.segment === 50;
        if ((!doubleToQualify || isDouble) && dart.segment > 0) {
          if (dart.segment === kState.assignedDouble) {
            if (penalty) {
              kState.lives = Math.max(0, kState.lives - 1);
              if (kState.lives <= 0) kState.eliminated = true;
            }
          } else {
            state.match.players.forEach((other) => {
              if (other.id !== activePlayer.id) {
                const targetState = { ...next.killerState[other.id] };
                if (targetState.assignedDouble === dart.segment && !targetState.eliminated) {
                  const dmg = doubleToQualify ? 1 : Math.max(1, dart.multiplier);
                  targetState.lives = Math.max(0, targetState.lives - dmg);
                  if (targetState.lives <= 0) targetState.eliminated = true;
                  next.killerState[other.id] = targetState;
                }
              }
            });
          }
        }
      } else {
        const isDouble = dart.multiplier === 2 || dart.segment === 50;
        if (dart.segment === kState.assignedDouble && (!doubleToQualify || isDouble)) {
          kState.isKiller = true;
        }
      }

      next.killerState[activePlayer.id] = kState;
    }

    const alive = state.match.players.filter((p) => !next.killerState[p.id]?.eliminated);
    if (state.match.players.length > 1 ? alive.length <= 1 : kState.isKiller) {
      isWin = true;
      turnDone = true;
    }
  }

  // Finalize Turn if 3 darts or win/bust
  if (turnDone) {
    const turnTotal = isBust ? 0 : turnDarts.reduce((acc, d) => acc + d.score, 0);
    const scoreBefore = state.remainingScores[activePlayer.id];
    const scoreAfter = isBust ? scoreBefore : next.remainingScores[activePlayer.id];

    const completedTurn: Turn = {
      id: `t_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      legNumber: state.currentLeg.legNumber,
      setNumber: state.currentLeg.setNumber,
      playerId: activePlayer.id,
      darts: turnDarts,
      turnTotal,
      isBust,
      scoreBefore,
      scoreAfter,
      createdAt: Date.now(),
    };

    const updatedLeg: Leg = {
      ...state.currentLeg,
      turns: [...state.currentLeg.turns, completedTurn],
    };

    if (rules.type === 'bobs_27') {
      const bState = { ...next.bobs27State[activePlayer.id] };
      const target = bState.currentRound === 21 ? 50 : bState.currentRound;
      const hits = turnDarts.filter(
        (d) => (target === 50 && d.segment === 50) || (d.segment === target && d.multiplier === 2)
      );
      if (hits.length === 0) {
        bState.score -= target * 2;
        if (bState.score <= 0) bState.isEliminated = true;
      }
      bState.currentRound++;
      bState.hitsPerRound.push(hits.length);
      next.bobs27State[activePlayer.id] = bState;
      if (bState.currentRound > 21 || bState.isEliminated) {
        isWin = true;
      }
    }

    if (isWin) {
      updatedLeg.winnerPlayerId = activePlayer.id;
      updatedLeg.endTime = Date.now();

      const newScores = { ...state.match.scores };
      const newTeamScores = state.match.teamScores
        ? {
            team_1: { ...state.match.teamScores.team_1 },
            team_2: { ...state.match.teamScores.team_2 },
          }
        : undefined;

      if (isTeam && activePlayer.teamId && newTeamScores) {
        const teamKey = activePlayer.teamId;
        newTeamScores[teamKey].legsWon += 1;
        state.match.players.forEach((p) => {
          if (p.teamId === teamKey) {
            newScores[p.id] = {
              ...newScores[p.id],
              legsWon: (newScores[p.id]?.legsWon || 0) + 1,
            };
          }
        });
      } else {
        newScores[activePlayer.id] = {
          ...newScores[activePlayer.id],
          legsWon: (newScores[activePlayer.id]?.legsWon || 0) + 1,
        };
      }

      let matchWon = false;
      let winnerPlayerId: string | undefined = activePlayer.id;
      let winnerTeamId: string | undefined = activePlayer.teamId;

      if (rules.type === 'x01') {
        const cfg = rules.config;
        const currentLegsWon = isTeam && activePlayer.teamId && newTeamScores
          ? newTeamScores[activePlayer.teamId].legsWon
          : newScores[activePlayer.id].legsWon;

        if (currentLegsWon >= cfg.legsToWin) {
          if (cfg.setsToWin > 1) {
            if (isTeam && activePlayer.teamId && newTeamScores) {
              newTeamScores[activePlayer.teamId].setsWon += 1;
              newTeamScores[activePlayer.teamId].legsWon = 0;
              if (newTeamScores[activePlayer.teamId].setsWon >= cfg.setsToWin) {
                matchWon = true;
              }
            } else {
              newScores[activePlayer.id].setsWon += 1;
              newScores[activePlayer.id].legsWon = 0;
              if (newScores[activePlayer.id].setsWon >= cfg.setsToWin) {
                matchWon = true;
              }
            }
          } else {
            matchWon = true;
          }
        }
      } else {
        matchWon = true;
      }

      if (matchWon) {
        next.match = {
          ...state.match,
          legs: [...state.match.legs.slice(0, -1), updatedLeg],
          scores: newScores,
          teamScores: newTeamScores,
          winnerPlayerId,
          winnerTeamId,
          endTime: Date.now(),
          status: 'completed',
        };
        next.currentLeg = updatedLeg;
        next.isMatchOver = true;
        next.winnerPlayerId = winnerPlayerId;
        next.winnerTeamId = winnerTeamId;
        next.currentTurnDarts = [];

        return {
          nextState: next,
          turnCompleted: true,
          legCompleted: true,
          matchCompleted: true,
          isBust,
          isWinDart: true,
          isCheckout: true,
        };
      }

      // Next Leg
      const nextStarter = (state.legStarterIndex + 1) % state.match.players.length;
      const nextLeg: Leg = {
        legNumber: state.currentLeg.legNumber + 1,
        setNumber: state.currentLeg.setNumber,
        startingScore: rules.type === 'x01' ? rules.config.startingScore : 0,
        turns: [],
        startTime: Date.now(),
      };

      state.match.players.forEach((p) => {
        next.remainingScores[p.id] = rules.type === 'x01' ? rules.config.startingScore : 0;
      });

      next.match = {
        ...state.match,
        legs: [...state.match.legs.slice(0, -1), updatedLeg, nextLeg],
        scores: newScores,
        teamScores: newTeamScores,
      };
      next.currentLeg = nextLeg;
      next.activePlayerIndex = nextStarter;
      next.legStarterIndex = nextStarter;
      next.currentTurnDarts = [];

      return {
        nextState: next,
        turnCompleted: true,
        legCompleted: true,
        matchCompleted: false,
        isBust,
        isWinDart: true,
        isCheckout: true,
      };
    }

    // Switch to Next Player
    let nextIndex = (state.activePlayerIndex + 1) % state.match.players.length;
    if (rules.type === 'killer') {
      let attempts = 0;
      while (next.killerState[state.match.players[nextIndex].id]?.eliminated && attempts < state.match.players.length) {
        nextIndex = (nextIndex + 1) % state.match.players.length;
        attempts++;
      }
    }

    next.match = {
      ...state.match,
      legs: [...state.match.legs.slice(0, -1), updatedLeg],
    };
    next.currentLeg = updatedLeg;
    next.activePlayerIndex = nextIndex;
    next.currentTurnDarts = [];

    return {
      nextState: next,
      turnCompleted: true,
      legCompleted: false,
      matchCompleted: false,
      isBust,
      isWinDart: false,
    };
  }

  return {
    nextState: next,
    turnCompleted: false,
    legCompleted: false,
    matchCompleted: false,
    isBust,
    isWinDart: false,
  };
}

export function applyQuickTurnScore(state: GameState, totalTurnScore: number): ThrowResult {
  if (totalTurnScore === -1) {
    // Quick BUST
    const bustDart: DartThrow = {
      segment: 0,
      multiplier: 0,
      score: 0,
      label: 'BUST',
      timestamp: Date.now(),
    };
    return applyDartThrow({ ...state, currentTurnDarts: [bustDart, bustDart] }, bustDart);
  }

  // Decompose score into 3 darts roughly or use default darts
  const decomposed: DartThrow[] = [];
  if (totalTurnScore === 180) {
    decomposed.push({ segment: 20, multiplier: 3, score: 60, label: 'T20', timestamp: Date.now() });
    decomposed.push({ segment: 20, multiplier: 3, score: 60, label: 'T20', timestamp: Date.now() });
    decomposed.push({ segment: 20, multiplier: 3, score: 60, label: 'T20', timestamp: Date.now() });
  } else if (totalTurnScore === 140) {
    decomposed.push({ segment: 20, multiplier: 3, score: 60, label: 'T20', timestamp: Date.now() });
    decomposed.push({ segment: 20, multiplier: 3, score: 60, label: 'T20', timestamp: Date.now() });
    decomposed.push({ segment: 20, multiplier: 1, score: 20, label: 'S20', timestamp: Date.now() });
  } else if (totalTurnScore === 100) {
    decomposed.push({ segment: 20, multiplier: 3, score: 60, label: 'T20', timestamp: Date.now() });
    decomposed.push({ segment: 20, multiplier: 1, score: 20, label: 'S20', timestamp: Date.now() });
    decomposed.push({ segment: 20, multiplier: 1, score: 20, label: 'S20', timestamp: Date.now() });
  } else if (totalTurnScore === 60) {
    decomposed.push({ segment: 20, multiplier: 1, score: 20, label: 'S20', timestamp: Date.now() });
    decomposed.push({ segment: 20, multiplier: 1, score: 20, label: 'S20', timestamp: Date.now() });
    decomposed.push({ segment: 20, multiplier: 1, score: 20, label: 'S20', timestamp: Date.now() });
  } else if (totalTurnScore === 26) {
    decomposed.push({ segment: 20, multiplier: 1, score: 20, label: 'S20', timestamp: Date.now() });
    decomposed.push({ segment: 1, multiplier: 1, score: 1, label: 'S1', timestamp: Date.now() });
    decomposed.push({ segment: 5, multiplier: 1, score: 5, label: 'S5', timestamp: Date.now() });
  } else if (totalTurnScore === 41) {
    decomposed.push({ segment: 20, multiplier: 1, score: 20, label: 'S20', timestamp: Date.now() });
    decomposed.push({ segment: 20, multiplier: 1, score: 20, label: 'S20', timestamp: Date.now() });
    decomposed.push({ segment: 1, multiplier: 1, score: 1, label: 'S1', timestamp: Date.now() });
  } else if (totalTurnScore === 45) {
    decomposed.push({ segment: 15, multiplier: 3, score: 45, label: 'T15', timestamp: Date.now() });
    decomposed.push({ segment: 0, multiplier: 0, score: 0, label: 'MISS', timestamp: Date.now() });
    decomposed.push({ segment: 0, multiplier: 0, score: 0, label: 'MISS', timestamp: Date.now() });
  } else if (totalTurnScore === 81) {
    decomposed.push({ segment: 19, multiplier: 3, score: 57, label: 'T19', timestamp: Date.now() });
    decomposed.push({ segment: 12, multiplier: 1, score: 12, label: 'S12', timestamp: Date.now() });
    decomposed.push({ segment: 12, multiplier: 1, score: 12, label: 'S12', timestamp: Date.now() });
  } else if (totalTurnScore === 85) {
    decomposed.push({ segment: 15, multiplier: 3, score: 45, label: 'T15', timestamp: Date.now() });
    decomposed.push({ segment: 20, multiplier: 2, score: 40, label: 'D20', timestamp: Date.now() });
    decomposed.push({ segment: 0, multiplier: 0, score: 0, label: 'MISS', timestamp: Date.now() });
  } else if (totalTurnScore === 0) {
    decomposed.push({ segment: 0, multiplier: 0, score: 0, label: 'MISS', timestamp: Date.now() });
    decomposed.push({ segment: 0, multiplier: 0, score: 0, label: 'MISS', timestamp: Date.now() });
    decomposed.push({ segment: 0, multiplier: 0, score: 0, label: 'MISS', timestamp: Date.now() });
  } else {
    // Custom score breakdown
    const d1 = Math.min(60, totalTurnScore);
    const rem1 = totalTurnScore - d1;
    const d2 = Math.min(60, rem1);
    const d3 = rem1 - d2;

    decomposed.push({
      segment: d1 % 3 === 0 ? d1 / 3 : d1,
      multiplier: d1 % 3 === 0 ? 3 : 1,
      score: d1,
      label: `${d1}`,
      timestamp: Date.now(),
    });
    decomposed.push({
      segment: d2 % 3 === 0 ? d2 / 3 : d2,
      multiplier: d2 % 3 === 0 ? 3 : 1,
      score: d2,
      label: `${d2}`,
      timestamp: Date.now(),
    });
    decomposed.push({
      segment: d3 % 3 === 0 ? d3 / 3 : d3,
      multiplier: d3 % 3 === 0 ? 3 : 1,
      score: d3,
      label: `${d3}`,
      timestamp: Date.now(),
    });
  }

  let currState = { ...state, currentTurnDarts: [] };
  let res: ThrowResult = {
    nextState: currState,
    turnCompleted: false,
    legCompleted: false,
    matchCompleted: false,
    isBust: false,
    isWinDart: false,
  };

  for (let i = 0; i < decomposed.length; i++) {
    res = applyDartThrow(currState, decomposed[i]);
    currState = res.nextState;
    if (res.turnCompleted) break;
  }

  return res;
}

export function calculateMatchStats(match: Match): PlayerStats[] {
  return match.players.map((player) => {
    let dartsCount = 0;
    let totalScore = 0;
    let highTurn = 0;
    let scores60 = 0;
    let scores100 = 0;
    let scores140 = 0;
    let scores180 = 0;
    let checkoutsHit = 0;
    let highCheckout = 0;
    let checkoutsAttempted = 0;
    let first9Darts = 0;
    let first9Score = 0;

    match.legs.forEach((leg) => {
      const playerTurns = leg.turns.filter((t) => t.playerId === player.id);
      let legDarts = 0;

      playerTurns.forEach((turn) => {
        const darts = turn.darts.length || 3;
        dartsCount += darts;
        legDarts += darts;

        if (!turn.isBust) {
          totalScore += turn.turnTotal;
          if (turn.turnTotal > highTurn) highTurn = turn.turnTotal;
          if (turn.turnTotal === 180) scores180++;
          else if (turn.turnTotal >= 140) scores140++;
          else if (turn.turnTotal >= 100) scores100++;
          else if (turn.turnTotal >= 60) scores60++;

          if (turn.scoreAfter === 0) {
            checkoutsHit++;
            if (turn.turnTotal > highCheckout) highCheckout = turn.turnTotal;
          }
        }

        if (legDarts <= 9) {
          first9Darts += darts;
          if (!turn.isBust) first9Score += turn.turnTotal;
        }

        if (turn.scoreBefore <= 170 && turn.scoreBefore > 1) {
          checkoutsAttempted++;
        }
      });
    });

    const avg = dartsCount > 0 ? (totalScore / dartsCount) * 3 : 0;
    const f9 = first9Darts > 0 ? (first9Score / first9Darts) * 3 : avg;
    const checkoutPct = checkoutsAttempted > 0 ? (checkoutsHit / checkoutsAttempted) * 100 : 0;

    const legsWon = match.isTeamMatch && player.teamId && match.teamScores
      ? match.teamScores[player.teamId]?.legsWon || 0
      : match.scores[player.id]?.legsWon || 0;

    const setsWon = match.isTeamMatch && player.teamId && match.teamScores
      ? match.teamScores[player.teamId]?.setsWon || 0
      : match.scores[player.id]?.setsWon || 0;

    return {
      playerId: player.id,
      name: player.name,
      teamId: player.teamId,
      threeDartAvg: Math.round(avg * 100) / 100,
      first9Avg: Math.round(f9 * 100) / 100,
      highestTurn: highTurn,
      highestCheckout: highCheckout,
      checkoutsAttempted,
      checkoutsHit,
      checkoutPct: Math.round(checkoutPct * 10) / 10,
      dartsThrown: dartsCount,
      scores60Plus: scores60,
      scores100Plus: scores100,
      scores140Plus: scores140,
      scores180,
      legsWon,
      setsWon,
    };
  });
}
