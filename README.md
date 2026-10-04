# DartVector - Professional Darts Scoring & Match Engine

Precision darts scoring, broadcast-style chalkboard mode, 25-level DartBot, and all-time career analytics. Built with React 19, TypeScript, Vite, and Tailwind CSS.

## Features

- **Regulation Interactive Sisal Dartboard**: Scaled to official PDC board dimensions with radial sectors, treble and double wire beds, single and double bullseye detection, wire click feedback, and heatmap visualization.
- **Match Engine**:
  - **X01 (501, 301, 701)**: Double-In, Straight-In, Double-Out, Master-Out, Straight-Out, legs & sets to win.
  - **Cricket**: Standard 15-20 & Bull closing with optional point accumulation.
  - **Around The Clock**: Singles, Doubles, or Trebles progression through 1 to 20 + Bullseye.
  - **Killer**: Assigned double elimination party game with life counters.
  - **Shanghai**: Round-by-round point scoring and instant Shanghai win (Single, Double, Treble).
  - **Bob's 27**: Dedicated double training drill.
- **25-Level DartBot**: Calibrated Gaussian error model scaling from novice pub throwers (15 avg) up to PDC World No. 1 legends (114 avg) with automated aim and throw generation.
- **Official Broadcast Chalkboard Mode**: Traditional pub scoreboard view with split columns, turn subtractions, and large chalk typography.
- **1-Tap Quick House Scores & NumPad**: Instant entry for 60, 100 Ton, 140, 180 Maximum, 26 Breakfast, 41, 45, 81, 85, 0 Miss, BUST, and custom scores.
- **Web Audio Sound Effects & Referee Caller**:
  - 4 Synthesized sound packs: PDC Pro Tournament, Traditional Pub, Heavy Steel Tip, Electronic Soft-Tip.
  - PDC Referee speech caller announcing scores ("ONE HUNDRED AND EIGHTY!", "Ton!"), checkout requirements, and "Game shot and the match!".
- **Match Vault & Career Analytics**: 3-dart averages, first 9 averages, 180 counters, checkout percentages, leg breakdowns, and JSON export/import.
- **House League Night & Leaderboard**: Weekly pub league standings table with points and leg differentials.
- **Throw-by-Throw Log**: Full chronological throw stream with segment badges, timestamps, and reverse sorting.

## Development

```bash
# Install dependencies
npm install

# Start local development server
npm run dev

# Build for production
npm run build
```
