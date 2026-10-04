import { DartThrow, GameState } from '../types/darts';
import {
  getCoordsFromSegment,
  getDartThrowFromCoords,
  getCheckoutAdvice,
} from './darts-engine';

export interface DartBotProfile {
  level: number;
  name: string;
  sigmaMm: number; // Gaussian standard deviation in mm
  target3DA: number;
  reactionDelayMs: number;
}

export const DARTBOT_LEVELS: DartBotProfile[] = [
  { level: 1, name: 'Rookie (Lvl 1)', sigmaMm: 80, target3DA: 15, reactionDelayMs: 650 },
  { level: 2, name: 'Pub Novice (Lvl 2)', sigmaMm: 72, target3DA: 20, reactionDelayMs: 650 },
  { level: 3, name: 'Casual Thrower (Lvl 3)', sigmaMm: 65, target3DA: 24, reactionDelayMs: 600 },
  { level: 4, name: 'Social Player (Lvl 4)', sigmaMm: 58, target3DA: 28, reactionDelayMs: 600 },
  { level: 5, name: 'League Div 5 (Lvl 5)', sigmaMm: 52, target3DA: 32, reactionDelayMs: 550 },
  { level: 6, name: 'League Div 4 (Lvl 6)', sigmaMm: 46, target3DA: 36, reactionDelayMs: 550 },
  { level: 7, name: 'League Div 3 (Lvl 7)', sigmaMm: 41, target3DA: 40, reactionDelayMs: 500 },
  { level: 8, name: 'League Div 2 (Lvl 8)', sigmaMm: 37, target3DA: 44, reactionDelayMs: 500 },
  { level: 9, name: 'League Div 1 (Lvl 9)', sigmaMm: 33, target3DA: 48, reactionDelayMs: 500 },
  { level: 10, name: 'County Reserve (Lvl 10)', sigmaMm: 29.5, target3DA: 52, reactionDelayMs: 450 },
  { level: 11, name: 'County Player (Lvl 11)', sigmaMm: 26.5, target3DA: 56, reactionDelayMs: 450 },
  { level: 12, name: 'Super League (Lvl 12)', sigmaMm: 24, target3DA: 60, reactionDelayMs: 450 },
  { level: 13, name: 'Regional Semi-Pro (Lvl 13)', sigmaMm: 21.5, target3DA: 64, reactionDelayMs: 400 },
  { level: 14, name: 'Q-School Hopeful (Lvl 14)', sigmaMm: 19, target3DA: 68, reactionDelayMs: 400 },
  { level: 15, name: 'Challenge Tour (Lvl 15)', sigmaMm: 17, target3DA: 72, reactionDelayMs: 400 },
  { level: 16, name: 'Development Tour (Lvl 16)', sigmaMm: 15, target3DA: 76, reactionDelayMs: 380 },
  { level: 17, name: 'Pro Tour Qualifier (Lvl 17)', sigmaMm: 13.2, target3DA: 80, reactionDelayMs: 380 },
  { level: 18, name: 'PDC Tour Card (Lvl 18)', sigmaMm: 11.5, target3DA: 84, reactionDelayMs: 350 },
  { level: 19, name: 'PDC Top 64 (Lvl 19)', sigmaMm: 9.8, target3DA: 88, reactionDelayMs: 350 },
  { level: 20, name: 'PDC Top 32 (Lvl 20)', sigmaMm: 8.2, target3DA: 92, reactionDelayMs: 320 },
  { level: 21, name: 'Major Finalist (Lvl 21)', sigmaMm: 6.8, target3DA: 96, reactionDelayMs: 300 },
  { level: 22, name: 'Premier League Contender (Lvl 22)', sigmaMm: 5.5, target3DA: 100, reactionDelayMs: 280 },
  { level: 23, name: 'World Matchplay Champ (Lvl 23)', sigmaMm: 4.6, target3DA: 104, reactionDelayMs: 260 },
  { level: 24, name: 'PDC World No. 1 (Lvl 24)', sigmaMm: 3.8, target3DA: 108, reactionDelayMs: 240 },
  { level: 25, name: 'The Darting God (Lvl 25)', sigmaMm: 3.2, target3DA: 114, reactionDelayMs: 220 },
];

// Box-Muller transform for normal distribution
function gaussianRandom(mean = 0, stdev = 1): number {
  let u = 0;
  let v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return mean + Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v) * stdev;
}

export function determineBotTarget(state: GameState, botLevel: number): string {
  const activePlayer = state.match.players[state.activePlayerIndex];
  const rules = state.match.rules;

  if (rules.type === 'x01') {
    const remaining = state.remainingScores[activePlayer.id];
    const dartsLeft = 3 - state.currentTurnDarts.length;

    if (remaining <= 170 && remaining > 1) {
      const checkout = getCheckoutAdvice(remaining, dartsLeft);
      if (checkout && checkout.route.length > 0) {
        return checkout.route[0];
      }
    }

    if (remaining > 170) {
      // High score scoring dart
      if (botLevel >= 18 && (remaining % 20 === 19 || remaining === 179)) {
        return 'T19';
      }
      return 'T20';
    }

    // Setup dart if bogey or no checkout
    if (remaining <= 170) {
      if (remaining > 40) {
        return 'T20';
      }
      if (remaining % 2 === 0) {
        return `D${remaining / 2}`;
      }
      return 'S1';
    }

    return 'T20';
  }

  if (rules.type === 'cricket') {
    const cState = state.cricketState[activePlayer.id];
    const priority = [20, 19, 18, 17, 16, 15, 25];
    for (const seg of priority) {
      if ((cState?.marks[seg] || 0) < 3) {
        return seg === 25 ? 'D-BULL' : `T${seg}`;
      }
    }
    return 'D-BULL';
  }

  if (rules.type === 'around_the_clock') {
    const aState = state.aroundClockState[activePlayer.id];
    const target = aState?.currentTarget || 1;
    if (target === 25) return 'D-BULL';
    if (rules.config.targetType === 'trebles') return `T${target}`;
    if (rules.config.targetType === 'doubles') return `D${target}`;
    return `S${target}`;
  }

  return 'T20';
}

export function simulateBotThrow(targetLabel: string, botLevel: number): DartThrow {
  const profile = DARTBOT_LEVELS.find((l) => l.level === botLevel) || DARTBOT_LEVELS[11];
  const targetCoords = getCoordsFromSegment(targetLabel);

  // Conversion: board SVG radius is ~170mm at double wire (matching regulation 170mm radius!)
  // So sigmaMm directly maps 1:1 to coordinate units
  const dx = gaussianRandom(0, profile.sigmaMm);
  const dy = gaussianRandom(0, profile.sigmaMm);

  const throwX = targetCoords.x + dx;
  const throwY = targetCoords.y + dy;

  return getDartThrowFromCoords(throwX, throwY);
}
