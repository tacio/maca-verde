class SoundService {
  private audioCtx: AudioContext | null = null;
  private soundEnabled: boolean = true;
  private voiceCoachEnabled: boolean = true;

  constructor() {
    // AudioContext will be initialized on first user interaction
  }

  public setSoundEnabled(enabled: boolean) {
    this.soundEnabled = enabled;
  }

  public setVoiceCoachEnabled(enabled: boolean) {
    this.voiceCoachEnabled = enabled;
  }

  private initAudio() {
    if (!this.audioCtx && typeof window !== 'undefined') {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtxClass) {
        this.audioCtx = new AudioCtxClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  public playTone(freq: number, durationSeconds: number, type: OscillatorType = 'sine', gainVal: number = 0.2) {
    if (!this.soundEnabled) return;
    try {
      this.initAudio();
      if (!this.audioCtx) return;

      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.audioCtx.currentTime);

      gain.gain.setValueAtTime(gainVal, this.audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + durationSeconds);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start();
      osc.stop(this.audioCtx.currentTime + durationSeconds);
    } catch {
      // Audio playback safely ignored if browser blocked
    }
  }

  // Countdown tick (3, 2, 1)
  public playCountdownTick(count: number) {
    if (!this.soundEnabled) return;
    if (count > 0) {
      this.playTone(800, 0.15, 'triangle', 0.25);
    }
  }

  // Work interval starting: high energetic double chime
  public playWorkStart() {
    if (!this.soundEnabled) return;
    try {
      this.initAudio();
      if (!this.audioCtx) return;

      const now = this.audioCtx.currentTime;
      [
        { freq: 587.33, start: 0, dur: 0.12 }, // D5
        { freq: 880.00, start: 0.12, dur: 0.25 } // A5
      ].forEach(note => {
        const osc = this.audioCtx!.createOscillator();
        const gain = this.audioCtx!.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(note.freq, now + note.start);
        gain.gain.setValueAtTime(0.3, now + note.start);
        gain.gain.exponentialRampToValueAtTime(0.001, now + note.start + note.dur);
        osc.connect(gain);
        gain.connect(this.audioCtx!.destination);
        osc.start(now + note.start);
        osc.stop(now + note.start + note.dur);
      });
    } catch {
      // Ignore
    }
  }

  // Rest interval starting: soft relaxing chime
  public playRestStart() {
    if (!this.soundEnabled) return;
    try {
      this.initAudio();
      if (!this.audioCtx) return;

      const now = this.audioCtx.currentTime;
      [
        { freq: 523.25, start: 0, dur: 0.15 }, // C5
        { freq: 392.00, start: 0.15, dur: 0.3 } // G4
      ].forEach(note => {
        const osc = this.audioCtx!.createOscillator();
        const gain = this.audioCtx!.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(note.freq, now + note.start);
        gain.gain.setValueAtTime(0.25, now + note.start);
        gain.gain.exponentialRampToValueAtTime(0.001, now + note.start + note.dur);
        osc.connect(gain);
        gain.connect(this.audioCtx!.destination);
        osc.start(now + note.start);
        osc.stop(now + note.start + note.dur);
      });
    } catch {
      // Ignore
    }
  }

  // Victory fanfare on routine completion
  public playVictory() {
    if (!this.soundEnabled) return;
    try {
      this.initAudio();
      if (!this.audioCtx) return;

      const now = this.audioCtx.currentTime;
      const notes = [
        { freq: 523.25, time: 0, dur: 0.15 }, // C5
        { freq: 659.25, time: 0.16, dur: 0.15 }, // E5
        { freq: 783.99, time: 0.32, dur: 0.18 }, // G5
        { freq: 1046.50, time: 0.52, dur: 0.5 } // C6
      ];

      notes.forEach(n => {
        const osc = this.audioCtx!.createOscillator();
        const gain = this.audioCtx!.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(n.freq, now + n.time);
        gain.gain.setValueAtTime(0.35, now + n.time);
        gain.gain.exponentialRampToValueAtTime(0.001, now + n.time + n.dur);
        osc.connect(gain);
        gain.connect(this.audioCtx!.destination);
        osc.start(now + n.time);
        osc.stop(now + n.time + n.dur);
      });
    } catch {
      // Ignore
    }
  }

  // Voice coach announcements using SpeechSynthesis
  public speak(text: string, lang: 'en' | 'pt-BR' = 'pt-BR') {
    if (!this.voiceCoachEnabled || typeof window === 'undefined' || !('speechSynthesis' in window)) {
      return;
    }
    try {
      window.speechSynthesis.cancel(); // Stop prior speech
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang === 'pt-BR' ? 'pt-BR' : 'en-US';
      utterance.rate = 1.05;
      utterance.pitch = 1.0;
      utterance.volume = 0.95;
      window.speechSynthesis.speak(utterance);
    } catch {
      // Ignore
    }
  }
}

export const soundService = new SoundService();
