import React, { useState } from 'react';

interface QuickScoresProps {
  onScoreSelect: (score: number) => void;
  onOpenCustomDialog: () => void;
}

export const QuickScores: React.FC<QuickScoresProps> = ({ onScoreSelect, onOpenCustomDialog }) => {
  const quickList = [
    { id: 'house-quick-60-btn', score: 60, label: '60', desc: 'Single 20 x3', highlight: 'zinc' },
    { id: 'house-quick-100-btn', score: 100, label: '100 (Ton)', desc: 'Ton', highlight: 'amber' },
    { id: 'house-quick-140-btn', score: 140, label: '140', desc: 'Ton 40', highlight: 'orange' },
    { id: 'house-quick-180-btn', score: 180, label: '180!', desc: 'Maximum', highlight: 'red' },
    { id: 'house-quick-26-btn', score: 26, label: '26', desc: 'Breakfast (20-1-5)', highlight: 'zinc' },
    { id: 'house-quick-41-btn', score: 41, label: '41', desc: 'Single 20-20-1', highlight: 'zinc' },
    { id: 'house-quick-45-btn', score: 45, label: '45', desc: 'Triple 15 / 20-20-5', highlight: 'zinc' },
    { id: 'house-quick-81-btn', score: 81, label: '81', desc: 'T19 + S12 x2', highlight: 'zinc' },
    { id: 'house-quick-85-btn', score: 85, label: '85', desc: 'T15 + D20', highlight: 'zinc' },
    { id: 'house-quick-0-btn', score: 0, label: '0 (Miss)', desc: 'No score', highlight: 'miss' },
    { id: 'house-quick--1-btn', score: -1, label: 'BUST', desc: 'Over score', highlight: 'bust' },
  ];

  const getButtonClass = (highlight: string) => {
    switch (highlight) {
      case 'amber':
        return 'border-amber-500/40 bg-amber-500/10 text-amber-300 hover:brightness-110';
      case 'orange':
        return 'border-orange-500/40 bg-orange-500/10 text-orange-300 hover:brightness-110';
      case 'red':
        return 'border-red-500/50 bg-red-500/20 text-red-300 font-black hover:brightness-110';
      case 'miss':
        return 'border-zinc-800 bg-zinc-950 text-zinc-400 hover:brightness-110';
      case 'bust':
        return 'border-red-500/40 bg-red-950/40 text-red-400 hover:brightness-110';
      default:
        return 'border-zinc-700 bg-zinc-800 hover:brightness-110 text-zinc-100';
    }
  };

  return (
    <div className="flex flex-col gap-2.5 min-w-0 w-full">
      <div className="flex items-center justify-between flex-wrap gap-1">
        <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
          1-Tap Common House Scores
        </span>
        <span className="text-[10px] text-amber-400 font-semibold">Tap once to score instantly</span>
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 min-w-0 w-full">
        {quickList.map((item) => (
          <button
            key={item.id}
            id={item.id}
            onClick={() => onScoreSelect(item.score)}
            className={`p-2 sm:p-2.5 rounded-xl border flex flex-col items-center justify-center gap-0.5 active:scale-95 transition-all shadow-sm min-w-0 w-full ${getButtonClass(
              item.highlight
            )}`}
          >
            <span className="text-sm sm:text-base font-black leading-none">{item.label}</span>
            <span className="text-[9px] text-zinc-400 leading-tight truncate max-w-full">{item.desc}</span>
          </button>
        ))}

        <button
          onClick={onOpenCustomDialog}
          className="p-2 sm:p-2.5 rounded-xl border border-amber-500/30 bg-zinc-900 hover:bg-zinc-800 text-amber-400 flex flex-col items-center justify-center gap-0.5 active:scale-95 transition-all min-w-0 w-full"
        >
          <span className="text-xs sm:text-sm font-black leading-none">Other...</span>
          <span className="text-[9px] text-zinc-400 leading-tight">Type custom</span>
        </button>
      </div>
    </div>
  );
};
