import { del, get, set } from "idb-keyval";

export interface Session {
  id: string;
  start: number;
  end: number;
  durationSec: number;
  label?: string;
}

export interface DayLog {
  date: string;
  sessions: Session[];
}

export interface NoteCard {
  id: string;
  body: string;
  pinned: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface KeyValStore {
  get<T>(key: string): Promise<T | undefined>;
  set(key: string, value: unknown): Promise<void>;
  del(key: string): Promise<void>;
}

const defaultStore: KeyValStore = {
  get: (key) => get(key),
  set: (key, value) => set(key, value),
  del: (key) => del(key),
};

const NOTES_KEY = "notes";
const dayKey = (date: string): string => `daylog:${date}`;

export function todayKey(now: Date = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function uid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

export function titleOf(body: string): string {
  return body.split("\n", 1)[0].trim().slice(0, 60);
}

function emptyLog(date: string): DayLog {
  return { date, sessions: [] };
}

export async function loadDayLog(
  date: string = todayKey(),
  store: KeyValStore = defaultStore,
): Promise<DayLog> {
  try {
    const stored = await store.get<DayLog>(dayKey(date));
    if (!stored || !Array.isArray(stored.sessions)) return emptyLog(date);
    return { date, sessions: stored.sessions };
  } catch {
    return emptyLog(date);
  }
}

export async function saveDayLog(log: DayLog, store: KeyValStore = defaultStore): Promise<void> {
  try {
    await store.set(dayKey(log.date), log);
  } catch {
    // IndexedDB blocked/unavailable: degrade silently.
  }
}

/** Append one completed focus block. Interrupted blocks must never call this. */
export async function appendSession(
  date: string,
  session: Session,
  store: KeyValStore = defaultStore,
): Promise<DayLog> {
  const log = await loadDayLog(date, store);
  const next: DayLog = { date, sessions: [...log.sessions, session] };
  await saveDayLog(next, store);
  return next;
}

export async function loadNotes(store: KeyValStore = defaultStore): Promise<NoteCard[]> {
  try {
    const stored = await store.get<NoteCard[]>(NOTES_KEY);
    if (!Array.isArray(stored)) return [];
    return stored;
  } catch {
    return [];
  }
}

export async function saveNotes(
  notes: NoteCard[],
  store: KeyValStore = defaultStore,
): Promise<void> {
  try {
    await store.set(NOTES_KEY, notes);
  } catch {
    // IndexedDB blocked/unavailable: degrade silently.
  }
}

export async function addNote(body: string, store: KeyValStore = defaultStore): Promise<NoteCard> {
  const now = Date.now();
  const note: NoteCard = {
    id: uid(),
    body,
    pinned: false,
    createdAt: now,
    updatedAt: now,
  };
  const notes = await loadNotes(store);
  await saveNotes([...notes, note], store);
  return note;
}

export async function setPinned(
  id: string,
  pinned: boolean,
  store: KeyValStore = defaultStore,
): Promise<NoteCard[]> {
  const notes = await loadNotes(store);
  const next = notes.map((n) => (n.id === id ? { ...n, pinned, updatedAt: Date.now() } : n));
  await saveNotes(next, store);
  return next;
}

export async function removeNote(
  id: string,
  store: KeyValStore = defaultStore,
): Promise<NoteCard[]> {
  const notes = await loadNotes(store);
  const next = notes.filter((n) => n.id !== id);
  await saveNotes(next, store);
  return next;
}

/** Pinned first, then most recently updated. */
export function sortedNotes(notes: NoteCard[]): NoteCard[] {
  return [...notes].sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    return b.updatedAt - a.updatedAt;
  });
}

export function searchNotes(notes: NoteCard[], query: string): NoteCard[] {
  const q = query.trim().toLowerCase();
  if (!q) return sortedNotes(notes);
  return sortedNotes(
    notes.filter(
      (n) => n.body.toLowerCase().includes(q) || titleOf(n.body).toLowerCase().includes(q),
    ),
  );
}
