import { defaultStore, safeGet, safeSet, type KeyValStore } from "./store";

export interface Session {
  id: string;
  start: number;
  end: number;
  /** Active (unpaused) seconds actually focused — never a fixed block length. */
  durationSec: number;
  label?: string;
}

export interface DayLog {
  date: string;
  sessions: Session[];
}

/**
 * Explicit 4-cycle streak state, persisted under its own key.
 * Reset is an explicit persisted write on date change — never silently
 * derived from sessions.length.
 */
export interface StreakState {
  date: string;
  focusCount: number;
}

const STREAK_KEY = "streak";
const dayKey = (date: string): string => `daylog:${date}`;

export function todayKey(now: Date = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function emptyLog(date: string): DayLog {
  return { date, sessions: [] };
}

function emptyStreak(date: string): StreakState {
  return { date, focusCount: 0 };
}

export async function loadDayLog(
  date: string = todayKey(),
  store: KeyValStore = defaultStore,
): Promise<DayLog> {
  const stored = await safeGet<DayLog>(dayKey(date), store);
  if (!stored || !Array.isArray(stored.sessions)) return emptyLog(date);
  return { date, sessions: stored.sessions };
}

export async function saveDayLog(log: DayLog, store: KeyValStore = defaultStore): Promise<void> {
  await safeSet(dayKey(log.date), log, store);
}

/** Append one completed focus block. Interrupted blocks must never call this. */
export async function appendSession(
  date: string,
  session: Session,
  store: KeyValStore = defaultStore,
): Promise<DayLog> {
  // Midnight-rollover guard: never append to a stale date. If the caller
  // passes yesterday's date after midnight, the Session lands in today's log.
  const target = date === todayKey() ? date : todayKey();
  const log = await loadDayLog(target, store);
  const next: DayLog = { date: target, sessions: [...log.sessions, session] };
  await saveDayLog(next, store);
  return next;
}

export async function loadStreak(
  date: string = todayKey(),
  store: KeyValStore = defaultStore,
): Promise<StreakState> {
  const stored = await safeGet<StreakState>(STREAK_KEY, store);
  if (!stored || stored.date !== date || typeof stored.focusCount !== "number") {
    // Explicit persisted reset on date change (or first run / corrupt data).
    const fresh = emptyStreak(date);
    await saveStreak(fresh, store);
    return fresh;
  }
  return stored;
}

export async function saveStreak(
  streak: StreakState,
  store: KeyValStore = defaultStore,
): Promise<void> {
  await safeSet(STREAK_KEY, streak, store);
}

export async function incrementStreak(
  date: string,
  store: KeyValStore = defaultStore,
): Promise<StreakState> {
  const current = await loadStreak(date, store);
  const next: StreakState = { date, focusCount: current.focusCount + 1 };
  await saveStreak(next, store);
  return next;
}

/**
 * Delete superseded daylog keys (midnight rollover cleanup). Keeps today's
 * key; no-op when the store cannot list keys or IndexedDB is blocked.
 */
export async function purgeStaleDayLogs(
  today: string,
  store: KeyValStore = defaultStore,
): Promise<void> {
  try {
    if (!store.keys) return;
    const keep = dayKey(today);
    for (const key of await store.keys()) {
      if (key.startsWith("daylog:") && key !== keep) await store.del(key);
    }
  } catch {
    // IndexedDB blocked/unavailable: degrade silently.
  }
}
