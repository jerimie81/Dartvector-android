import React, { useState } from 'react';
import { X, Radio, Copy, Check, Users, Globe, Wifi } from 'lucide-react';

interface OnlineHubModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const OnlineHubModal: React.FC<OnlineHubModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const [roomCode, setRoomCode] = useState('PDC-9482');
  const [copied, setCopied] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [isConnected, setIsConnected] = useState(true);

  const handleCopy = () => {
    navigator.clipboard?.writeText(roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleGenerateNew = () => {
    const code = `PDC-${Math.floor(1000 + Math.random() * 9000)}`;
    setRoomCode(code);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl max-w-xl w-full p-6 shadow-2xl flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white uppercase tracking-wide">
                DartVector Online Hub
              </h2>
              <p className="text-xs text-zinc-400">Multiplayer board sync & remote chalkboard broadcast</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-white rounded-xl hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Connection Status Indicator */}
        <div className="flex items-center justify-between bg-zinc-950 p-4 rounded-2xl border border-zinc-800">
          <div className="flex items-center gap-3">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
            <div>
              <div className="text-xs font-black text-white uppercase">Online Network Active</div>
              <div className="text-[11px] text-zinc-400">
                Peer sync & local network broadcast ready
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-lg text-xs font-bold font-mono">
            <Wifi className="w-3.5 h-3.5" />
            <span>ONLINE</span>
          </div>
        </div>

        {/* Host Room Section */}
        <div className="bg-zinc-950 p-4 rounded-2xl border border-zinc-800 flex flex-col gap-3">
          <div className="text-xs font-black uppercase text-amber-400 tracking-wider">
            Host Your Dart Board Room
          </div>
          <p className="text-[11px] text-zinc-400 leading-relaxed">
            Share this room code with friends, league mates, or display devices to mirror your live score and broadcast throws in real time.
          </p>

          <div className="flex items-center gap-2">
            <div className="flex-1 bg-zinc-900 border border-zinc-800 px-4 py-3 rounded-xl font-mono font-black text-base text-amber-400 tracking-wider flex items-center justify-between">
              <span>{roomCode}</span>
              <button
                onClick={handleGenerateNew}
                className="text-xs text-zinc-500 hover:text-white underline font-sans"
              >
                Regenerate
              </button>
            </div>
            <button
              onClick={handleCopy}
              className="px-4 py-3 bg-amber-500 hover:bg-amber-400 text-zinc-950 rounded-xl font-black text-xs uppercase flex items-center gap-1.5 transition-all active:scale-95 shadow-md"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
        </div>

        {/* Join Room Section */}
        <div className="bg-zinc-950 p-4 rounded-2xl border border-zinc-800 flex flex-col gap-3">
          <div className="text-xs font-black uppercase text-zinc-300 tracking-wider">
            Join Peer / Spectator Room
          </div>
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="e.g. PDC-1234"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-zinc-600 font-mono focus:outline-none focus:border-amber-500 uppercase"
            />
            <button
              onClick={() => {
                if (joinCode) {
                  alert(`Connected to room ${joinCode}! Live throws will now synchronize.`);
                  onClose();
                }
              }}
              disabled={!joinCode}
              className="px-5 py-2.5 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 text-white rounded-xl text-xs font-bold transition-all active:scale-95"
            >
              Connect
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
