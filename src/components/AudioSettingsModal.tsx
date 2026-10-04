import React, { useState } from 'react';
import { X, Volume2, VolumeX, Mic, Play } from 'lucide-react';
import { audioEngine, AudioSettings } from '../services/audio-engine';

interface AudioSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AudioSettingsModal: React.FC<AudioSettingsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const [settings, setSettings] = useState<AudioSettings>(audioEngine.getSettings());
  const voices = audioEngine.getAvailableVoices();

  const handleUpdate = (updated: Partial<AudioSettings>) => {
    audioEngine.saveSettings(updated);
    setSettings(audioEngine.getSettings());
  };

  const handlePreviewHit = (pack: AudioSettings['soundPack']) => {
    audioEngine.playDartHit(true, false, pack);
  };

  const handleTestCaller = () => {
    audioEngine.callScore(180);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl max-w-xl w-full p-6 shadow-2xl flex flex-col gap-6 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Volume2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white uppercase tracking-wide">
                Referee Caller FX & Audio
              </h2>
              <p className="text-xs text-zinc-400">PDC tournament caller, dart hit acoustics & fanfares</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-white rounded-xl hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Master Audio Toggle */}
        <div className="flex items-center justify-between bg-zinc-950 p-4 rounded-2xl border border-zinc-800">
          <div className="flex items-center gap-3">
            {settings.enabled ? (
              <Volume2 className="w-5 h-5 text-amber-400" />
            ) : (
              <VolumeX className="w-5 h-5 text-zinc-500" />
            )}
            <div>
              <div className="text-xs font-black text-white uppercase">Master Audio & Caller</div>
              <div className="text-[11px] text-zinc-400">Enable sound effects, dart impact, and speech</div>
            </div>
          </div>
          <button
            onClick={() => handleUpdate({ enabled: !settings.enabled })}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase transition-all ${
              settings.enabled
                ? 'bg-amber-500 text-zinc-950 shadow-md'
                : 'bg-zinc-800 text-zinc-400'
            }`}
          >
            {settings.enabled ? 'ON' : 'OFF'}
          </button>
        </div>

        {/* Sound Pack Selection */}
        <div className="flex flex-col gap-3 bg-zinc-950 p-4 rounded-2xl border border-zinc-800">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold uppercase tracking-wider text-amber-400">
              Sisal Dart Hit Sound Pack
            </label>
            <span className="text-[10px] text-zinc-500 font-mono">Synthesized Web Audio</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {[
              { id: 'pro_tournament', name: 'PDC Pro Tournament', desc: 'Crisp, punchy tournament sisal thud' },
              { id: 'pub_style', name: 'Traditional Pub', desc: 'Warm, resonant wooden board thud' },
              { id: 'heavy_steel', name: 'Heavy Steel Tip', desc: 'Deep metallic low-end impact' },
              { id: 'electronic_soft_tip', name: 'Electronic Soft-Tip', desc: 'Arcade digital contact click' },
            ].map((pack) => (
              <div
                key={pack.id}
                onClick={() => handleUpdate({ soundPack: pack.id as any })}
                className={`p-3 rounded-xl border cursor-pointer flex flex-col justify-between gap-2 transition-all ${
                  settings.soundPack === pack.id
                    ? 'border-amber-500 bg-amber-500/10 text-white ring-1 ring-amber-500/30'
                    : 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:border-zinc-700'
                }`}
              >
                <div>
                  <div className="text-xs font-black text-white">{pack.name}</div>
                  <div className="text-[10px] text-zinc-400 leading-tight mt-0.5">{pack.desc}</div>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePreviewHit(pack.id as any);
                  }}
                  className="self-end px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded text-[10px] font-bold flex items-center gap-1"
                >
                  <Play className="w-3 h-3 fill-current" />
                  <span>Preview</span>
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Referee Voice Caller Settings */}
        <div className="flex flex-col gap-3 bg-zinc-950 p-4 rounded-2xl border border-zinc-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Mic className="w-4 h-4 text-amber-400" />
              <label className="text-xs font-bold uppercase tracking-wider text-amber-400">
                PDC Referee Speech Caller
              </label>
            </div>
            <button
              onClick={() => handleUpdate({ refereeCaller: !settings.refereeCaller })}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                settings.refereeCaller
                  ? 'bg-amber-500 text-zinc-950 font-black'
                  : 'bg-zinc-900 text-zinc-500 border border-zinc-800'
              }`}
            >
              {settings.refereeCaller ? 'Caller Enabled' : 'Caller Muted'}
            </button>
          </div>

          {settings.refereeCaller && (
            <div className="flex flex-col gap-3 pt-2 border-t border-zinc-800">
              {/* Voice select */}
              {voices.length > 0 && (
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] text-zinc-400 uppercase font-semibold">
                    Referee Voice Selection
                  </span>
                  <select
                    value={settings.selectedVoiceURI || ''}
                    onChange={(e) => audioEngine.setVoice(e.target.value)}
                    className="bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  >
                    {voices.map((v) => (
                      <option key={v.voiceURI} value={v.voiceURI}>
                        {v.name} ({v.lang})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Test Button */}
              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] text-zinc-400">Test referee announcement:</span>
                <button
                  onClick={handleTestCaller}
                  className="px-3.5 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-xl text-xs font-black uppercase flex items-center gap-1.5 transition-all active:scale-95"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Call "180!"</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
