import { localStore, safeGet, safeSet, type KeyValStore } from "./store";
import type { PomodoroMode } from "./pomodoro";

export type TimerStatus = "idle" | "running" | "paused";

export interface TimerSnapshot {
  mode: PomodoroMode;
  status: TimerStatus;
  /** Wall-clock target the countdown runs against (running only). */
  targetAt: number;
  /** Seconds left at save time (used for idle/paused restore). */
  remainingSec: number;
  wallStart: number;
  activeMs: number;
  started: boolean;
  label: string;
  muted: boolean;
  savedAt: number;
}

const SNAP_KEY = "pomodoro-snapshot";

// Last-tick clock state is tiny and hot — localStorage is enough.
// DayLog/NoteCards stay in IndexedDB (bigger payloads).
export async function loadSnapshot(store: KeyValStore = localStore): Promise<TimerSnapshot | null> {
  const snap = await safeGet<TimerSnapshot>(SNAP_KEY, store);
  return snap ?? null;
}

export async function saveSnapshot(
  snap: TimerSnapshot,
  store: KeyValStore = localStore,
): Promise<void> {
  await safeSet(SNAP_KEY, snap, store);
}

/** Remaining seconds for a running snapshot at `now` (clamped ≥ 0). */
export function resumeRemaining(snap: TimerSnapshot, now: number): number {
  if (snap.status !== "running") return Math.max(0, Math.round(snap.remainingSec));
  return Math.max(0, Math.round((snap.targetAt - now) / 1000));
}
