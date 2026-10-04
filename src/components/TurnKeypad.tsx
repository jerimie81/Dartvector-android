import React, { useState } from 'react';
import { Delete, CornerDownLeft, X } from 'lucide-react';

interface TurnKeypadProps {
  onSubmitScore: (score: number) => void;
  maxScore?: number;
}

export const TurnKeypad: React.FC<TurnKeypadProps> = ({ onSubmitScore, maxScore = 180 }) => {
  const [value, setValue] = useState<string>('');

  const handleDigit = (digit: string) => {
    if (value.length >= 3) return;
    const newVal = value + digit;
    const num = parseInt(newVal, 10);
    if (num <= maxScore) {
      setValue(newVal);
    }
  };

  const handleBackspace = () => {
    setValue((prev) => prev.slice(0, -1));
  };

  const handleClear = () => {
    setValue('');
  };

  const handleSubmit = () => {
    if (!value) return;
    const num = parseInt(value, 10);
    if (!isNaN(num) && num >= 0 && num <= maxScore) {
      onSubmitScore(num);
      setValue('');
    }
  };

  return (
    <div className="flex flex-col gap-3 min-w-0 w-full">
      {/* Display */}
      <div className="flex items-center justify-between bg-zinc-950 px-4 py-3 rounded-xl border border-zinc-800 min-w-0 w-full">
        <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider shrink-0">Turn Score:</span>
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-2xl font-mono font-black text-amber-400 min-h-[32px] truncate">{value || '0'}</span>
          {value && (
            <button onClick={handleClear} className="p-1 hover:text-white text-zinc-500 shrink-0">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Grid Keypad */}
      <div className="grid grid-cols-3 gap-2 min-w-0 w-full">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
          <button
            key={digit}
            onClick={() => handleDigit(digit)}
            className="py-3 bg-zinc-800 hover:bg-zinc-700/80 active:bg-zinc-600 rounded-xl text-lg font-mono font-bold text-white transition-colors active:scale-95 shadow-sm"
          >
            {digit}
          </button>
        ))}
        <button
          onClick={handleBackspace}
          className="py-3 bg-zinc-800 hover:bg-zinc-700/80 active:bg-zinc-600 rounded-xl text-zinc-300 flex items-center justify-center transition-colors active:scale-95"
        >
          <Delete className="w-5 h-5" />
        </button>
        <button
          onClick={() => handleDigit('0')}
          className="py-3 bg-zinc-800 hover:bg-zinc-700/80 active:bg-zinc-600 rounded-xl text-lg font-mono font-bold text-white transition-colors active:scale-95 shadow-sm"
        >
          0
        </button>
        <button
          onClick={handleSubmit}
          disabled={!value}
          className="py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 disabled:opacity-40 disabled:pointer-events-none rounded-xl text-zinc-950 font-black flex items-center justify-center gap-1.5 transition-all active:scale-95 shadow-md"
        >
          <CornerDownLeft className="w-4 h-4 stroke-[2.5]" />
          <span className="text-xs uppercase">Enter</span>
        </button>
      </div>
    </div>
  );
};
