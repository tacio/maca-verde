/**
 * The audio coach (P12): Web Audio beeps and speechSynthesis, English only.
 *
 * One sound at a time: every cue goes through a queue that plays its items in
 * order and never overlaps a beep with speech. A new announcement replaces
 * whatever was still waiting or speaking (stale news is worse than silence),
 * and a countdown tick is dropped when anything else is playing.
 *
 * Respects settings.sound (beeps) and settings.voice (speech). Audio is
 * unlocked on the first user gesture (browsers keep an AudioContext suspended
 * until then). No React here.
 */

import type { Announcement, BeepKind } from './announce';

interface Note {
  freq: number;
  at: number;
  dur: number;
  type: OscillatorType;
  gain: number;
}

/** Legacy soundService tones, softened a little. Durations in seconds. */
const BEEPS: Record<BeepKind, Note[]> = {
  tick: [{ freq: 800, at: 0, dur: 0.15, type: 'triangle', gain: 0.22 }],
  start: [
    { freq: 587.33, at: 0, dur: 0.12, type: 'triangle', gain: 0.28 },
    { freq: 880, at: 0.12, dur: 0.25, type: 'triangle', gain: 0.28 },
  ],
  rest: [
    { freq: 523.25, at: 0, dur: 0.15, type: 'sine', gain: 0.24 },
    { freq: 392, at: 0.15, dur: 0.3, type: 'sine', gain: 0.24 },
  ],
  finish: [
    { freq: 523.25, at: 0, dur: 0.15, type: 'triangle', gain: 0.3 },
    { freq: 659.25, at: 0.16, dur: 0.15, type: 'triangle', gain: 0.3 },
    { freq: 783.99, at: 0.32, dur: 0.18, type: 'triangle', gain: 0.3 },
    { freq: 1046.5, at: 0.52, dur: 0.5, type: 'triangle', gain: 0.3 },
  ],
  /** One soft bell for the end of a rest practice (J6b). */
  chime: [
    { freq: 659.25, at: 0, dur: 2.2, type: 'sine', gain: 0.18 },
    { freq: 987.77, at: 0.02, dur: 1.6, type: 'sine', gain: 0.06 },
  ],
};

const beepLength = (kind: BeepKind) => Math.max(...BEEPS[kind].map((n) => n.at + n.dur));

type Item = { kind: 'beep'; beep: BeepKind } | { kind: 'say'; text: string };

/** Prefer a local US/UK English voice; Google voices on Android sound the most natural. */
export function pickVoice(voices: readonly Pick<SpeechSynthesisVoice, 'lang' | 'name' | 'localService' | 'default'>[]): number {
  let best = -1;
  let bestScore = -1;
  voices.forEach((v, i) => {
    const lang = v.lang.replace('_', '-').toLowerCase();
    if (!lang.startsWith('en')) return;
    let score = 1;
    if (lang === 'en-us') score += 4;
    else if (lang === 'en-gb') score += 3;
    if (v.localService) score += 2;
    if (/google/i.test(v.name)) score += 1;
    if (v.default) score += 1;
    if (score > bestScore) {
      best = i;
      bestScore = score;
    }
  });
  return best;
}

class Coach {
  private ctx: AudioContext | null = null;
  private queue: Item[] = [];
  private busy = false;
  /** Bumped on every interrupt so callbacks of a cancelled item are ignored. */
  private gen = 0;
  private timer: number | null = null;
  private sound = true;
  private voice = true;
  private chosenVoice: SpeechSynthesisVoice | null = null;
  private unlockInstalled = false;

  configure(opts: { sound: boolean; voice: boolean }): void {
    this.sound = opts.sound;
    this.voice = opts.voice;
  }

  /** Resume (or create) the AudioContext on the first gesture, and pick a voice. */
  installUnlock(): void {
    if (this.unlockInstalled || typeof window === 'undefined') return;
    this.unlockInstalled = true;
    const unlock = () => {
      this.audio();
      window.removeEventListener('pointerdown', unlock, true);
      window.removeEventListener('keydown', unlock, true);
    };
    window.addEventListener('pointerdown', unlock, true);
    window.addEventListener('keydown', unlock, true);
    if ('speechSynthesis' in window) {
      const load = () => {
        const voices = window.speechSynthesis.getVoices();
        const i = pickVoice(voices);
        this.chosenVoice = i >= 0 ? voices[i] : null;
      };
      load();
      window.speechSynthesis.addEventListener?.('voiceschanged', load);
    }
  }

  /** A phase change: replaces anything pending or playing. */
  announce(a: Announcement): void {
    this.interrupt();
    if (a.beep) this.queue.push({ kind: 'beep', beep: a.beep });
    if (a.text) this.queue.push({ kind: 'say', text: a.text });
    this.next();
  }

  /** Words only, after whatever is playing (e.g. the drill's breathing words). */
  say(text: string): void {
    this.queue.push({ kind: 'say', text });
    this.next();
  }

  /** A sound only, after whatever is playing. */
  beep(kind: BeepKind): void {
    this.queue.push({ kind: 'beep', beep: kind });
    this.next();
  }

  /** Countdown tick: dropped when anything else is playing (one sound at a time). */
  tick(): void {
    if (this.busy || this.queue.length) return;
    this.beep('tick');
  }

  /** Silence now (leaving a screen, pausing). */
  stop(): void {
    this.interrupt();
  }

  private interrupt(): void {
    this.gen++;
    this.queue = [];
    this.busy = false;
    if (this.timer !== null) window.clearTimeout(this.timer);
    this.timer = null;
    if (typeof window !== 'undefined' && 'speechSynthesis' in window && (window.speechSynthesis.speaking || window.speechSynthesis.pending))
      window.speechSynthesis.cancel();
  }

  private next(): void {
    if (this.busy) return;
    const item = this.queue.shift();
    if (!item) return;
    const gen = this.gen;
    const done = () => {
      if (gen !== this.gen) return;
      if (this.timer !== null) window.clearTimeout(this.timer);
      this.timer = null;
      this.busy = false;
      this.next();
    };
    this.busy = true;
    if (item.kind === 'beep') {
      if (!this.sound || !this.playBeep(item.beep)) return done();
      this.timer = window.setTimeout(done, beepLength(item.beep) * 1000 + 60);
    } else {
      if (!this.voice || !this.speak(item.text, done)) return done();
      // onend is unreliable on some Android builds: give up after a generous estimate.
      this.timer = window.setTimeout(done, 1500 + item.text.length * 90);
    }
  }

  private audio(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return null;
      try {
        this.ctx = new Ctor();
      } catch {
        return null;
      }
    }
    if (this.ctx.state === 'suspended') void this.ctx.resume().catch(() => undefined);
    return this.ctx;
  }

  private playBeep(kind: BeepKind): boolean {
    const ctx = this.audio();
    if (!ctx) return false;
    try {
      const t0 = ctx.currentTime;
      for (const n of BEEPS[kind]) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = n.type;
        osc.frequency.value = n.freq;
        gain.gain.setValueAtTime(n.gain, t0 + n.at);
        gain.gain.exponentialRampToValueAtTime(0.001, t0 + n.at + n.dur);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(t0 + n.at);
        osc.stop(t0 + n.at + n.dur);
      }
      return true;
    } catch {
      return false;
    }
  }

  private speak(text: string, done: () => void): boolean {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return false;
    try {
      const u = new SpeechSynthesisUtterance(text);
      u.lang = this.chosenVoice?.lang ?? 'en-US';
      if (this.chosenVoice) u.voice = this.chosenVoice;
      u.rate = 1.0;
      u.volume = 1;
      u.onend = done;
      u.onerror = done;
      window.speechSynthesis.speak(u);
      return true;
    } catch {
      return false;
    }
  }
}

/** The app's one coach. */
export const coach = new Coach();
