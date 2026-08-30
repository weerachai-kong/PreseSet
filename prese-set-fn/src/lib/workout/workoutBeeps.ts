export type WorkoutPhase = "WORK" | "REST";

export const BEEP_SOUND_PRESETS = [
  "classic",
  "soft",
  "bell",
  "whistle",
  "chime",
  "pulse",
] as const;

export type BeepSoundPreset = (typeof BEEP_SOUND_PRESETS)[number];

type ToneSpec = {
  frequency: number;
  gapMs: number;
  durationMs?: number;
  type?: OscillatorType;
};

type PresetDefinition = {
  defaultType: OscillatorType;
  defaultDurationMs: number;
  work: ToneSpec[];
  rest: ToneSpec[];
  complete: ToneSpec[];
};

const PRESETS: Record<BeepSoundPreset, PresetDefinition> = {
  classic: {
    defaultType: "square",
    defaultDurationMs: 90,
    work: [
      { frequency: 880, gapMs: 0 },
      { frequency: 880, gapMs: 130 },
      { frequency: 880, gapMs: 260 },
    ],
    rest: [
      { frequency: 660, gapMs: 0 },
      { frequency: 660, gapMs: 130 },
    ],
    complete: [
      { frequency: 523, gapMs: 0 },
      { frequency: 659, gapMs: 150 },
      { frequency: 784, gapMs: 300 },
      { frequency: 988, gapMs: 450 },
    ],
  },
  soft: {
    defaultType: "sine",
    defaultDurationMs: 120,
    work: [
      { frequency: 440, gapMs: 0 },
      { frequency: 440, gapMs: 180 },
      { frequency: 440, gapMs: 360 },
    ],
    rest: [
      { frequency: 330, gapMs: 0 },
      { frequency: 330, gapMs: 180 },
    ],
    complete: [
      { frequency: 392, gapMs: 0 },
      { frequency: 494, gapMs: 200 },
      { frequency: 587, gapMs: 400 },
      { frequency: 698, gapMs: 600 },
    ],
  },
  bell: {
    defaultType: "sine",
    defaultDurationMs: 220,
    work: [
      { frequency: 784, gapMs: 0, durationMs: 280 },
      { frequency: 988, gapMs: 320, durationMs: 320 },
    ],
    rest: [{ frequency: 523, gapMs: 0, durationMs: 360 }],
    complete: [
      { frequency: 523, gapMs: 0, durationMs: 260 },
      { frequency: 659, gapMs: 320, durationMs: 260 },
      { frequency: 784, gapMs: 640, durationMs: 260 },
      { frequency: 988, gapMs: 960, durationMs: 360 },
    ],
  },
  whistle: {
    defaultType: "sine",
    defaultDurationMs: 65,
    work: [
      { frequency: 1400, gapMs: 0 },
      { frequency: 1400, gapMs: 95 },
      { frequency: 1400, gapMs: 190 },
    ],
    rest: [
      { frequency: 1100, gapMs: 0 },
      { frequency: 1100, gapMs: 95 },
    ],
    complete: [
      { frequency: 1000, gapMs: 0 },
      { frequency: 1200, gapMs: 110 },
      { frequency: 1400, gapMs: 220 },
      { frequency: 1600, gapMs: 330 },
    ],
  },
  chime: {
    defaultType: "sine",
    defaultDurationMs: 140,
    work: [
      { frequency: 523, gapMs: 0 },
      { frequency: 659, gapMs: 160 },
      { frequency: 784, gapMs: 320 },
    ],
    rest: [
      { frequency: 440, gapMs: 0 },
      { frequency: 349, gapMs: 180 },
    ],
    complete: [
      { frequency: 262, gapMs: 0 },
      { frequency: 330, gapMs: 180 },
      { frequency: 392, gapMs: 360 },
      { frequency: 523, gapMs: 540, durationMs: 220 },
    ],
  },
  pulse: {
    defaultType: "triangle",
    defaultDurationMs: 75,
    work: [
      { frequency: 220, gapMs: 0 },
      { frequency: 220, gapMs: 100 },
      { frequency: 220, gapMs: 200 },
      { frequency: 220, gapMs: 300 },
    ],
    rest: [
      { frequency: 180, gapMs: 0 },
      { frequency: 180, gapMs: 120 },
    ],
    complete: [
      { frequency: 220, gapMs: 0 },
      { frequency: 330, gapMs: 120 },
      { frequency: 440, gapMs: 240 },
      { frequency: 550, gapMs: 360 },
    ],
  },
};

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;

  const Ctx =
    window.AudioContext ||
    (window as Window & { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;
  if (!Ctx) return null;

  if (!audioCtx) {
    audioCtx = new Ctx();
  }

  if (audioCtx.state === "suspended") {
    void audioCtx.resume();
  }

  return audioCtx;
}

/** Map 0–100 slider to audible gain. */
export function beepVolumeGain(level: number): number {
  const clamped = Math.min(100, Math.max(0, level));
  return 0.04 + (clamped / 100) * 0.26;
}

export function isBeepSoundPreset(value: unknown): value is BeepSoundPreset {
  return (
    typeof value === "string" &&
    (BEEP_SOUND_PRESETS as readonly string[]).includes(value)
  );
}

function playTone(
  frequency: number,
  durationSec: number,
  volume: number,
  type: OscillatorType,
) {
  const ctx = getAudioContext();
  if (!ctx) return;

  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();

  oscillator.type = type;
  oscillator.frequency.value = frequency;
  oscillator.connect(gain);
  gain.connect(ctx.destination);

  const start = ctx.currentTime;
  gain.gain.setValueAtTime(volume, start);
  gain.gain.exponentialRampToValueAtTime(0.001, start + durationSec);

  oscillator.start(start);
  oscillator.stop(start + durationSec);
}

function playBurst(
  tones: ToneSpec[],
  volume: number,
  defaultType: OscillatorType,
  defaultDurationMs: number,
) {
  tones.forEach(({ frequency, gapMs, durationMs, type }) => {
    const toneMs = durationMs ?? defaultDurationMs;
    window.setTimeout(
      () =>
        playTone(
          frequency,
          toneMs / 1000,
          volume,
          type ?? defaultType,
        ),
      gapMs,
    );
  });
}

function getPresetDefinition(preset: BeepSoundPreset): PresetDefinition {
  return PRESETS[preset] ?? PRESETS.classic;
}

/** Rapid beeps when a work or rest segment ends. */
export function playPhaseEndBeeps(
  endedPhase: WorkoutPhase,
  volume = 0.18,
  preset: BeepSoundPreset = "classic",
) {
  const def = getPresetDefinition(preset);
  const tones = endedPhase === "WORK" ? def.work : def.rest;
  playBurst(tones, volume, def.defaultType, def.defaultDurationMs);
}

/** Longer pattern when the full workout finishes. */
export function playWorkoutCompleteBeeps(
  volume = 0.18,
  preset: BeepSoundPreset = "classic",
) {
  const def = getPresetDefinition(preset);
  playBurst(def.complete, volume, def.defaultType, def.defaultDurationMs);
}

/** Helps unlock audio on mobile after user interaction. */
export function primeWorkoutAudio() {
  getAudioContext();
}
