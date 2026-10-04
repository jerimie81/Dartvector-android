export interface AudioSettings {
  enabled: boolean;
  volume: number;
  voiceVolume: number;
  sfxVolume: number;
  soundPack: 'pro_tournament' | 'pub_style' | 'heavy_steel' | 'electronic_soft_tip';
  refereeCaller: boolean;
  callTotals: boolean;
  callRemaining: boolean;
  speechRate: number;
  selectedVoiceURI?: string;
}

const DEFAULT_AUDIO_SETTINGS: AudioSettings = {
  enabled: true,
  volume: 0.85,
  voiceVolume: 1,
  sfxVolume: 0.8,
  soundPack: 'pro_tournament',
  refereeCaller: true,
  callTotals: true,
  callRemaining: true,
  speechRate: 1.05,
};

export class AudioEngine {
  private ctx: AudioContext | null = null;
  private settings: AudioSettings = { ...DEFAULT_AUDIO_SETTINGS };
  private voices: SpeechSynthesisVoice[] = [];
  private selectedVoice: SpeechSynthesisVoice | null = null;

  constructor() {
    this.loadSettings();
    if (typeof window !== 'undefined') {
      this.initVoices();
    }
  }

  public loadSettings() {
    try {
      const stored = localStorage.getItem('dartmaster_audio_settings');
      if (stored) {
        this.settings = { ...DEFAULT_AUDIO_SETTINGS, ...JSON.parse(stored) };
      }
    } catch {
      // ignore
    }
  }

  public saveSettings(newSettings: Partial<AudioSettings>) {
    this.settings = { ...this.settings, ...newSettings };
    try {
      localStorage.setItem('dartmaster_audio_settings', JSON.stringify(this.settings));
    } catch {
      // ignore
    }
  }

  public getSettings(): AudioSettings {
    return { ...this.settings };
  }

  public initContext() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public initVoices() {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    const load = () => {
      this.voices = window.speechSynthesis.getVoices();
      const britishMale = this.voices.find(
        (v) =>
          (v.lang.startsWith('en-GB') || v.lang.startsWith('en-UK')) &&
          (v.name.includes('Male') || v.name.includes('George') || v.name.includes('Daniel') || v.name.includes('Natural'))
      );
      const british = this.voices.find((v) => v.lang.startsWith('en-GB') || v.lang.startsWith('en-UK'));
      const english = this.voices.find((v) => v.lang.startsWith('en'));

      if (this.settings.selectedVoiceURI) {
        const found = this.voices.find((v) => v.voiceURI === this.settings.selectedVoiceURI);
        if (found) {
          this.selectedVoice = found;
          return;
        }
      }
      this.selectedVoice = britishMale || british || english || this.voices[0] || null;
    };

    load();
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = load;
    }
  }

  public getAvailableVoices(): SpeechSynthesisVoice[] {
    return this.voices;
  }

  public setVoice(voiceURI: string) {
    const v = this.voices.find((voc) => voc.voiceURI === voiceURI);
    if (v) {
      this.selectedVoice = v;
      this.saveSettings({ selectedVoiceURI: voiceURI });
    }
  }

  public setSoundPack(pack: AudioSettings['soundPack']) {
    this.saveSettings({ soundPack: pack });
  }

  public playDartHit(isDoubleOrTreble = false, isWire = false, overridePack?: AudioSettings['soundPack']) {
    if (!this.settings.enabled) return;
    this.initContext();
    if (!this.ctx) return;

    const pack = overridePack || this.settings.soundPack || 'pro_tournament';
    const now = this.ctx.currentTime;
    const masterGain = this.ctx.createGain();
    masterGain.gain.setValueAtTime(this.settings.volume * this.settings.sfxVolume, now);
    masterGain.connect(this.ctx.destination);

    try {
      if (pack === 'pub_style') {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(isDoubleOrTreble ? 140 : 105, now);
        osc.frequency.exponentialRampToValueAtTime(26, now + 0.14);
        gain.gain.setValueAtTime(0.75, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
        osc.connect(gain);
        gain.connect(masterGain);
        osc.start(now);
        osc.stop(now + 0.15);

        // Sisal thud noise
        const bufferSize = Math.floor(0.06 * this.ctx.sampleRate);
        const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = noiseBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = (2 * Math.random() - 1) * Math.exp(-i / (0.28 * bufferSize));
        }
        const noise = this.ctx.createBufferSource();
        noise.buffer = noiseBuffer;
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(isWire ? 2200 : 680, now);
        filter.Q.setValueAtTime(1.8, now);
        const nGain = this.ctx.createGain();
        nGain.gain.setValueAtTime(isWire ? 0.6 : 0.45, now);
        nGain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
        noise.connect(filter);
        filter.connect(nGain);
        nGain.connect(masterGain);
        noise.start(now);
        noise.stop(now + 0.07);
      } else if (pack === 'heavy_steel') {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(isDoubleOrTreble ? 240 : 180, now);
        osc.frequency.exponentialRampToValueAtTime(38, now + 0.08);
        gain.gain.setValueAtTime(0.65, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(400, now);
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(masterGain);
        osc.start(now);
        osc.stop(now + 0.09);
      } else if (pack === 'electronic_soft_tip') {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(isDoubleOrTreble ? 880 : 640, now);
        osc.frequency.exponentialRampToValueAtTime(180, now + 0.035);
        gain.gain.setValueAtTime(0.6, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);
        osc.connect(gain);
        gain.connect(masterGain);
        osc.start(now);
        osc.stop(now + 0.04);
      } else {
        // Pro Tournament
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(isDoubleOrTreble ? 180 : 130, now);
        osc.frequency.exponentialRampToValueAtTime(35, now + 0.09);
        gain.gain.setValueAtTime(0.7, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
        osc.connect(gain);
        gain.connect(masterGain);
        osc.start(now);
        osc.stop(now + 0.1);

        const bufferSize = Math.floor(0.04 * this.ctx.sampleRate);
        const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = noiseBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = (2 * Math.random() - 1) * Math.exp(-i / (0.2 * bufferSize));
        }
        const noise = this.ctx.createBufferSource();
        noise.buffer = noiseBuffer;
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(isWire ? 3200 : 900, now);
        filter.Q.setValueAtTime(isWire ? 4 : 1.5, now);
        const nGain = this.ctx.createGain();
        nGain.gain.setValueAtTime(isWire ? 0.6 : 0.4, now);
        nGain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
        noise.connect(filter);
        filter.connect(nGain);
        nGain.connect(masterGain);
        noise.start(now);
        noise.stop(now + 0.05);
      }
    } catch {
      // ignore audio context glitches
    }
  }

  public play180Fanfare() {
    if (!this.settings.enabled) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const masterGain = this.ctx.createGain();
      masterGain.gain.setValueAtTime(this.settings.volume * this.settings.sfxVolume * 0.8, now);
      masterGain.connect(this.ctx.destination);

      const notes = [261.63, 329.63, 392.0, 523.25, 659.25];
      notes.forEach((freq, idx) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const time = now + idx * 0.06;
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, time);
        gain.gain.setValueAtTime(0.001, time);
        gain.gain.linearRampToValueAtTime(0.25, time + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.9);
        osc.connect(gain);
        gain.connect(masterGain);
        osc.start(time);
        osc.stop(time + 1);
      });
    } catch {
      // ignore
    }
  }

  public playBustSound() {
    if (!this.settings.enabled) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(110, now);
      osc.frequency.linearRampToValueAtTime(75, now + 0.25);
      gain.gain.setValueAtTime(0.4 * this.settings.volume, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.35);
    } catch {
      // ignore
    }
  }

  public speak(text: string, priority: 'normal' | 'high' = 'normal', pitch = 1) {
    if (!this.settings.enabled || !this.settings.refereeCaller) return;
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    try {
      if (priority === 'high') {
        window.speechSynthesis.cancel();
      }
      const utter = new SpeechSynthesisUtterance(text);
      if (this.selectedVoice) {
        utter.voice = this.selectedVoice;
      }
      utter.volume = this.settings.volume * this.settings.voiceVolume;
      utter.rate = this.settings.speechRate;
      utter.pitch = pitch;
      window.speechSynthesis.speak(utter);
    } catch {
      // ignore
    }
  }

  public callScore(score: number, isBust = false) {
    if (isBust) {
      this.playBustSound();
      this.speak('Bust!', 'high', 0.9);
      return;
    }

    if (score === 180) {
      this.play180Fanfare();
      this.speak('ONE HUNDRED AND EIGHTY!', 'high', 1.25);
    } else if (score === 140) {
      this.speak('One hundred and forty!', 'high', 1.1);
    } else if (score === 100) {
      this.speak('Ton!', 'normal', 1.05);
    } else if (score === 0) {
      this.speak('No score', 'normal', 0.95);
    } else if (score === 26) {
      this.speak('Twenty-six', 'normal', 0.95);
    } else if (score >= 100) {
      this.speak(`One hundred and ${score - 100}`, 'normal', 1.05);
    } else {
      this.speak(`${score}`, 'normal', 1);
    }
  }

  public callRequirement(playerName: string, remaining: number) {
    if (!this.settings.callRemaining) return;
    if (remaining <= 170 && remaining > 1) {
      this.speak(`${playerName}, you require ${remaining}`, 'normal', 1);
    }
  }

  public callGameShot(isMatchWin: boolean, playerName: string, legOrSet?: string) {
    this.play180Fanfare();
    if (isMatchWin) {
      this.speak(`Game shot, and the match! Congratulations ${playerName}!`, 'high', 1.2);
    } else {
      this.speak(`Game shot ${legOrSet || 'and the leg'} to ${playerName}!`, 'high', 1.15);
    }
  }
}

export const audioEngine = new AudioEngine();
