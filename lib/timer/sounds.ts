export type TimerSound = "countdown" | "complete" | "goal";

export interface TimerSoundOptions {
  enabled?: boolean;
  respectReducedMotion?: boolean;
  volume?: number;
}

export interface TimerSoundPlayer {
  play(sound: TimerSound): Promise<boolean>;
  playCountdown(secondsRemaining: number): Promise<boolean>;
  setEnabled(enabled: boolean): void;
  dispose(): Promise<void>;
}

const countdownMoments = new Set([10, 5, 3, 2, 1]);

/** Browser-only Web Audio cues. Audio is opt-in and never loads external media. */
export function createTimerSoundPlayer(options: TimerSoundOptions = {}): TimerSoundPlayer {
  let enabled = options.enabled ?? true;
  let context: AudioContext | null = null;
  let lastCountdown: number | null = null;
  const volume = Math.min(1, Math.max(0, options.volume ?? 0.16));

  const isAllowed = () => {
    if (!enabled || volume === 0 || typeof window === "undefined") return false;
    if (options.respectReducedMotion === false) return true;
    return !window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  };

  const getContext = () => {
    if (!context) {
      const AudioContextConstructor = window.AudioContext;
      context = new AudioContextConstructor();
    }
    return context;
  };

  const tone = (audio: AudioContext, frequency: number, start: number, duration: number) => {
    const oscillator = audio.createOscillator();
    const gain = audio.createGain();
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(frequency, start);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(volume, start + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    oscillator.connect(gain).connect(audio.destination);
    oscillator.start(start);
    oscillator.stop(start + duration + 0.01);
  };

  const play = async (sound: TimerSound) => {
    if (!isAllowed()) return false;
    const audio = getContext();
    if (audio.state === "suspended") await audio.resume();
    const now = audio.currentTime + 0.01;
    if (sound === "countdown") tone(audio, 660, now, 0.09);
    if (sound === "complete") {
      tone(audio, 523.25, now, 0.13);
      tone(audio, 659.25, now + 0.1, 0.16);
    }
    if (sound === "goal") {
      tone(audio, 523.25, now, 0.15);
      tone(audio, 659.25, now + 0.11, 0.16);
      tone(audio, 783.99, now + 0.23, 0.24);
    }
    return true;
  };

  return {
    play,
    async playCountdown(secondsRemaining) {
      const seconds = Math.ceil(secondsRemaining);
      if (!countdownMoments.has(seconds) || lastCountdown === seconds) return false;
      const played = await play("countdown");
      if (played) lastCountdown = seconds;
      return played;
    },
    setEnabled(value) {
      enabled = value;
      if (!value) lastCountdown = null;
    },
    async dispose() {
      if (context) await context.close();
      context = null;
      lastCountdown = null;
    },
  };
}
