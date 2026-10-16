export type PomodoroMode = "focus" | "short" | "long";

export const FOCUS_SEC = 25 * 60;
export const SHORT_BREAK_SEC = 5 * 60;
export const LONG_BREAK_SEC = 15 * 60;

export function durationOf(mode: PomodoroMode): number {
  switch (mode) {
    case "focus":
      return FOCUS_SEC;
    case "short":
      return SHORT_BREAK_SEC;
    case "long":
      return LONG_BREAK_SEC;
  }
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

export interface StreakSession {
  durationSec: number;
}

export function dayStats(sessions: StreakSession[]): { count: number; totalMinutes: number } {
  const totalSec = sessions.reduce((sum, s) => sum + s.durationSec, 0);
  return { count: sessions.length, totalMinutes: Math.round(totalSec / 60) };
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
