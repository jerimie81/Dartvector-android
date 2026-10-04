import React, { useState } from 'react';
import { X, HelpCircle, BookOpen, Target, Sparkles } from 'lucide-react';
import { CHECKOUT_TABLE } from '../engine/darts-engine';

interface GuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GuideModal: React.FC<GuideModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState<'rules' | 'checkouts' | 'slang'>('rules');

  const popularCheckouts = [
    { score: 170, route: 'T20 • T20 • Bull', note: 'The "Big Fish" (Highest Possible Checkout)' },
    { score: 167, route: 'T20 • T19 • Bull', note: 'Two trebles + Bullseye' },
    { score: 164, route: 'T20 • T18 • Bull', note: 'Two trebles + Bullseye' },
    { score: 161, route: 'T20 • T17 • Bull', note: 'Two trebles + Bullseye' },
    { score: 160, route: 'T20 • T20 • D20', note: 'Tops finish (T20 x2, Double Tops)' },
    { score: 141, route: 'T20 • T19 • D12', note: 'PDC standard out' },
    { score: 121, route: 'T20 • T15 • D8', note: 'Alternative: T20, 11, Bull' },
    { score: 100, route: 'T20 • D20', note: 'Two-dart Ton out' },
    { score: 81, route: 'T19 • D12', note: 'Standard two-dart finish' },
    { score: 40, route: 'D20 (Tops)', note: 'Most popular double on tour' },
    { score: 32, route: 'D16', note: 'George Noble / Phil Taylor favorite' },
  ];

  const slangTerms = [
    { term: 'Ton', def: 'A score of exactly 100 in a turn.' },
    { term: 'Ton 40 (Ton Forty)', def: 'A score of 140 (two treble 20s and a single 20).' },
    { term: 'Maximum / 180', def: 'The highest possible 3-dart score: three treble 20s.' },
    { term: 'Breakfast / 26', def: 'Hitting 20, 1, and 5 (called "half a crown" or "bag of chips").' },
    { term: 'Madhouse', def: 'Double 1 (D1) — notoriously difficult to get out of.' },
    { term: 'Tops', def: 'Double 20 (D20), positioned at the very top of the dartboard.' },
    { term: 'Shanghai', def: 'Hitting a single, double, and treble of the same number in one turn.' },
    { term: 'The Oche (Oh-key)', def: 'The throwing line, 7 feet 9¼ inches from the face of the board.' },
    { term: 'Big Fish', def: 'The 170 checkout (T20, T20, Bull) — maximum checkout in darts.' },
    { term: 'Robin Hood', def: 'Sticking a dart directly into the shaft/flight of a previously thrown dart.' },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl max-w-3xl w-full p-6 shadow-2xl flex flex-col gap-6 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white uppercase tracking-wide">
                How to Play & Scoring Guide
              </h2>
              <p className="text-xs text-zinc-400">PDC tournament regulations, finishes & darting jargon</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-white rounded-xl hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex bg-zinc-950 p-1 rounded-xl border border-zinc-800">
          <button
            onClick={() => setActiveTab('rules')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
              activeTab === 'rules'
                ? 'bg-amber-500 text-zinc-950 font-black shadow-md'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Match Rules (501 / Cricket)
          </button>
          <button
            onClick={() => setActiveTab('checkouts')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
              activeTab === 'checkouts'
                ? 'bg-amber-500 text-zinc-950 font-black shadow-md'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Checkout Table
          </button>
          <button
            onClick={() => setActiveTab('slang')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
              activeTab === 'slang'
                ? 'bg-amber-500 text-zinc-950 font-black shadow-md'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Darts Terminology
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto pr-1">
          {activeTab === 'rules' && (
            <div className="flex flex-col gap-4 text-xs leading-relaxed text-zinc-300">
              <div className="bg-zinc-950 p-4 rounded-2xl border border-zinc-800 flex flex-col gap-2">
                <h3 className="text-amber-400 font-black text-sm uppercase flex items-center gap-1.5">
                  <Target className="w-4 h-4" />
                  <span>501 / 301 (X01) Rules</span>
                </h3>
                <p>
                  Both players start with 501 points. Each turn, 3 darts are thrown to subtract points from the running total.
                </p>
                <ul className="list-disc pl-5 space-y-1 text-zinc-400">
                  <li><strong>Double-Out:</strong> To win a leg, the winning dart must land in a double ring (or the inner Bullseye, which counts as Double 25 = 50).</li>
                  <li><strong>Bust Rule:</strong> If you score more than your remaining score, or reduce your score to exactly 1 without double-out, the turn is a Bust. Your score reverts to what it was before the turn.</li>
                </ul>
              </div>

              <div className="bg-zinc-950 p-4 rounded-2xl border border-zinc-800 flex flex-col gap-2">
                <h3 className="text-amber-400 font-black text-sm uppercase flex items-center gap-1.5">
                  <Target className="w-4 h-4" />
                  <span>Cricket Rules</span>
                </h3>
                <p>
                  In American Cricket, only the numbers 15, 16, 17, 18, 19, 20 and the Bullseye are active.
                </p>
                <ul className="list-disc pl-5 space-y-1 text-zinc-400">
                  <li>To "close" a number, you must land 3 marks on it (Single = 1, Double = 2, Treble = 3).</li>
                  <li>Once closed, further hits on that number score points for you until your opponent also closes that number.</li>
                  <li>The first player to close all numbers and have equal or higher points wins!</li>
                </ul>
              </div>
            </div>
          )}

          {activeTab === 'checkouts' && (
            <div className="flex flex-col gap-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {popularCheckouts.map((c) => (
                  <div
                    key={c.score}
                    className="p-3 bg-zinc-950 border border-zinc-800 rounded-xl flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono font-black text-amber-400 text-base w-10">
                        {c.score}
                      </span>
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-white font-mono">{c.route}</span>
                        <span className="text-[10px] text-zinc-500">{c.note}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'slang' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {slangTerms.map((s) => (
                <div key={s.term} className="p-3 bg-zinc-950 border border-zinc-800 rounded-xl flex flex-col gap-1">
                  <span className="text-xs font-black text-amber-400">{s.term}</span>
                  <span className="text-[11px] text-zinc-300 leading-normal">{s.def}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
