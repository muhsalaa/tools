import type { Session } from "./daylog";

export type PomodoroMode = "focus" | "short" | "long";

export const FOCUS_SEC = 25 * 60;
export const SHORT_BREAK_SEC = 5 * 60;
export const LONG_BREAK_SEC = 15 * 60;

/**
 * Single shared mode map: durations and labels in one place. Pages render
 * labels from MODE_LABEL and lengths from durationOf — never a parallel
 * switch or a second map.
 */
export const MODE_META: Record<PomodoroMode, { label: string; seconds: number }> = {
  focus: { label: "Focus", seconds: FOCUS_SEC },
  short: { label: "Short break", seconds: SHORT_BREAK_SEC },
  long: { label: "Long break", seconds: LONG_BREAK_SEC },
};

export const MODE_LABEL: Record<PomodoroMode, string> = {
  focus: MODE_META.focus.label,
  short: MODE_META.short.label,
  long: MODE_META.long.label,
};

export function durationOf(mode: PomodoroMode): number {
  return MODE_META[mode].seconds;
}

/**
 * Mode of the next block after `current` completes.
 * `focusCompleted` counts completed focus blocks BEFORE the just-finished one
 * when current is "focus" (0-based); ignored for breaks.
 */
export function nextModeAfter(current: PomodoroMode, focusCompleted: number): PomodoroMode {
  if (current !== "focus") return "focus";
  return (focusCompleted + 1) % 4 === 0 ? "long" : "short";
}

export function formatTime(totalSec: number): string {
  const s = Math.max(0, Math.ceil(totalSec));
  const m = Math.floor(s / 60);
  return `${String(m).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

// Reuses Session's duration — no shadow interface. Any record carrying
// durationSec (full Session or a subset) works here.
export function dayStats(sessions: Pick<Session, "durationSec">[]): {
  count: number;
  totalMinutes: number;
} {
  const totalSec = sessions.reduce((sum, s) => sum + s.durationSec, 0);
  return { count: sessions.length, totalMinutes: Math.round(totalSec / 60) };
}

/**
 * Active (unpaused) milliseconds: previously accumulated time plus the open
 * run interval. `resumedAt` is null while idle/paused.
 */
export function activeMs(accumulatedMs: number, resumedAt: number | null, now: number): number {
  if (resumedAt === null) return accumulatedMs;
  return accumulatedMs + Math.max(0, now - resumedAt);
}

/** Whole active seconds for Session logging — the truthful block duration. */
export function activeSec(accumulatedMs: number, resumedAt: number | null, now: number): number {
  return Math.max(1, Math.round(activeMs(accumulatedMs, resumedAt, now) / 1000));
}

/** Runtime-generated WebAudio beep. No assets, offline-safe. */
export function playBeep(): void {
  try {
    const Ctx =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.5, ctx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.65);
    osc.onended = () => void ctx.close().catch(() => {});
  } catch {
    // Audio unavailable (SSR/offline edge): stay silent.
  }
}
