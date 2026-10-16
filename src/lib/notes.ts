import { defaultStore, safeGet, safeSet, uid, type KeyValStore } from "./store";

export interface NoteCard {
  id: string;
  /** Optional explicit title. Empty → UI falls back to first line of body. */
  title?: string;
  body: string;
  pinned: boolean;
  createdAt: number;
  updatedAt: number;
}

const NOTES_KEY = "notes";

// Spec story 13: title is derived from the first line (60-char cap is the
// tolerated detail). Spec story 21: no markdown rendering — the card renders
// note.body verbatim inside a <pre>, so pastes show exactly as typed.
export function titleOf(body: string): string {
  return body.split("\n", 1)[0].trim().slice(0, 60);
}

/** Display title: explicit title wins, else first line of body. */
export function displayTitle(note: Pick<NoteCard, "title" | "body">): string {
  return note.title?.trim() || titleOf(note.body) || "Untitled";
}

export async function loadNotes(store: KeyValStore = defaultStore): Promise<NoteCard[]> {
  const stored = await safeGet<NoteCard[]>(NOTES_KEY, store);
  if (!Array.isArray(stored)) return [];
  return stored;
}

export async function saveNotes(
  notes: NoteCard[],
  store: KeyValStore = defaultStore,
): Promise<void> {
  await safeSet(NOTES_KEY, notes, store);
}

export async function addNote(
  body: string,
  title?: string,
  store: KeyValStore = defaultStore,
): Promise<NoteCard> {
  const now = Date.now();
  const trimmedTitle = title?.trim();
  const note: NoteCard = {
    id: uid(),
    body,
    pinned: false,
    createdAt: now,
    updatedAt: now,
    ...(trimmedTitle ? { title: trimmedTitle } : {}),
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
    notes.filter((n) => {
      const q2 = q;
      return (
        n.body.toLowerCase().includes(q2) ||
        (n.title ?? "").toLowerCase().includes(q2) ||
        titleOf(n.body).toLowerCase().includes(q2)
      );
    }),
  );
}
