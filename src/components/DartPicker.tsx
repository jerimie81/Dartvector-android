import React, { useState } from 'react';
import { DartThrow } from '../types/darts';
import { BOARD_SEGMENTS, getCoordsFromSegment } from '../engine/darts-engine';

interface DartPickerProps {
  onAddDart: (dart: DartThrow) => void;
  dartsInHand: number;
}

export const DartPicker: React.FC<DartPickerProps> = ({ onAddDart, dartsInHand }) => {
  const [multiplier, setMultiplier] = useState<1 | 2 | 3>(1);

  const handleSelectSegment = (seg: number) => {
    let mult: number = multiplier;
    let label = '';
    let score = seg * mult;

    if (seg === 25) {
      mult = 1;
      label = 'BULL';
      score = 25;
    } else if (seg === 50) {
      mult = 2;
      label = 'D-BULL';
      score = 50;
    } else if (seg === 0) {
      mult = 0;
      label = 'MISS';
      score = 0;
    } else {
      if (mult === 3) label = `T${seg}`;
      else if (mult === 2) label = `D${seg}`;
      else label = `S${seg}`;
    }

    const coords = getCoordsFromSegment(label);
    const dart: DartThrow = {
      segment: seg,
      multiplier: mult,
      score,
      label,
      x: coords.x,
      y: coords.y,
      timestamp: Date.now(),
    };

    onAddDart(dart);
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Multiplier Selector */}
      <div className="flex items-center gap-2 bg-zinc-950 p-1 rounded-xl border border-zinc-800">
        <button
          onClick={() => setMultiplier(1)}
          className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
            multiplier === 1
              ? 'bg-zinc-800 text-white border border-zinc-700 shadow-sm'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          Single (1x)
        </button>
        <button
          onClick={() => setMultiplier(2)}
          className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
            multiplier === 2
              ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/50 shadow-sm'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          Double (2x)
        </button>
        <button
          onClick={() => setMultiplier(3)}
          className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
            multiplier === 3
              ? 'bg-red-600/30 text-red-300 border border-red-500/50 shadow-sm'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          Treble (3x)
        </button>
      </div>

      {/* Segments Grid 1 to 20 */}
      <div className="grid grid-cols-5 gap-1.5">
        {BOARD_SEGMENTS.map((seg) => {
          let scoreText = `${seg * multiplier}`;
          let prefix = multiplier === 3 ? 'T' : multiplier === 2 ? 'D' : '';
          return (
            <button
              key={seg}
              onClick={() => handleSelectSegment(seg)}
              className="py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700/80 active:bg-zinc-600 border border-zinc-700/60 flex flex-col items-center justify-center transition-all active:scale-95"
            >
              <span className="text-xs font-black text-white">{prefix}{seg}</span>
              <span className="text-[9px] text-amber-400/90 font-mono font-bold">{scoreText}</span>
            </button>
          );
        })}
      </div>

      {/* Bulls & Miss */}
      <div className="grid grid-cols-3 gap-2 pt-1 border-t border-zinc-800">
        <button
          onClick={() => handleSelectSegment(25)}
          className="py-2.5 bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-500/40 rounded-xl text-xs font-bold transition-all active:scale-95 flex items-center justify-center gap-1"
        >
          <span>Bull (25)</span>
        </button>
        <button
          onClick={() => handleSelectSegment(50)}
          className="py-2.5 bg-red-950/60 hover:bg-red-900/60 text-red-300 border border-red-500/40 rounded-xl text-xs font-bold transition-all active:scale-95 flex items-center justify-center gap-1"
        >
          <span>D-Bull (50)</span>
        </button>
        <button
          onClick={() => handleSelectSegment(0)}
          className="py-2.5 bg-zinc-950 hover:bg-zinc-800 text-zinc-400 border border-zinc-800 rounded-xl text-xs font-bold transition-all active:scale-95"
        >
          <span>Miss (0)</span>
        </button>
      </div>
    </div>
  );
};
