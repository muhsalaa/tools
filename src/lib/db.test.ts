import { describe, expect, test } from "bun:test";
import {
  appendSession,
  loadDayLog,
  saveDayLog,
  addNote,
  loadNotes,
  removeNote,
  searchNotes,
  setPinned,
  sortedNotes,
  titleOf,
  todayKey,
  type KeyValStore,
  type NoteCard,
  type Session,
} from "./db";

function memStore(): KeyValStore & { map: Map<string, unknown> } {
  const map = new Map<string, unknown>();
  return {
    map,
    get: async <T>(key: string): Promise<T | undefined> => map.get(key) as T | undefined,
    set: async (key: string, value: unknown): Promise<void> => {
      map.set(key, value);
    },
    del: async (key: string): Promise<void> => {
      map.delete(key);
    },
  };
}

function blockedStore(): KeyValStore {
  return {
    get: async () => {
      throw new DOMException("blocked", "SecurityError");
    },
    set: async () => {
      throw new DOMException("blocked", "SecurityError");
    },
    del: async () => {
      throw new DOMException("blocked", "SecurityError");
    },
  };
}

const sess = (id: string, label?: string): Session => ({
  id,
  start: 1700000000000,
  end: 1700001500000,
  durationSec: 1500,
  ...(label === undefined ? {} : { label }),
});

describe("todayKey", () => {
  test("formats local yyyy-mm-dd", () => {
    const d = new Date(2026, 0, 5, 12, 0, 0);
    expect(todayKey(d)).toBe("2026-01-05");
  });
});

describe("titleOf", () => {
  test("uses first line truncated to 60 chars", () => {
    expect(titleOf("hello\nworld")).toBe("hello");
    expect(titleOf("x".repeat(100))).toBe("x".repeat(60));
    expect(titleOf("  spaced  \nmore")).toBe("spaced");
  });
});

describe("DayLog", () => {
  test("round-trips sessions on the same date", async () => {
    const store = memStore();
    await saveDayLog({ date: "2026-10-16", sessions: [sess("a")] }, store);
    const loaded = await loadDayLog("2026-10-16", store);
    expect(loaded).toEqual({ date: "2026-10-16", sessions: [sess("a")] });
  });

  test("date change yields an empty DayLog with no carry-over", async () => {
    const store = memStore();
    await saveDayLog({ date: "2026-10-16", sessions: [sess("a")] }, store);
    const next = await loadDayLog("2026-10-17", store);
    expect(next).toEqual({ date: "2026-10-17", sessions: [] });
  });

  test("completed focus blocks append; interrupted ones never do", async () => {
    const store = memStore();
    const date = "2026-10-16";
    let log = await appendSession(date, sess("a", "deep work"), store);
    expect(log.sessions).toHaveLength(1);
    log = await appendSession(date, sess("b"), store);
    expect(log.sessions.map((s) => s.id)).toEqual(["a", "b"]);
    // interrupted block: caller never appends, log stays as-is
    const reloaded = await loadDayLog(date, store);
    expect(reloaded.sessions).toHaveLength(2);
  });
});

describe("NoteCard", () => {
  test("add/pin/search-order/delete round-trip", async () => {
    const store = memStore();
    const a = await addNote("alpha paste", store);
    const b = await addNote("beta paste", store);
    expect(await loadNotes(store)).toHaveLength(2);

    await setPinned(b.id, true, store);
    const ordered = sortedNotes(await loadNotes(store));
    expect(ordered[0].id).toBe(b.id);

    const found = searchNotes(await loadNotes(store), "ALPHA");
    expect(found.map((n: NoteCard) => n.id)).toEqual([a.id]);

    await removeNote(a.id, store);
    const rest = await loadNotes(store);
    expect(rest.map((n) => n.id)).toEqual([b.id]);
  });
});

describe("blocked IndexedDB", () => {
  test("degrades silently, never throws", async () => {
    const store = blockedStore();
    const log = await loadDayLog("2026-10-16", store);
    expect(log).toEqual({ date: "2026-10-16", sessions: [] });
    const appended = await appendSession("2026-10-16", sess("a"), store);
    expect(appended.sessions).toHaveLength(1);
    await saveDayLog({ date: "2026-10-16", sessions: [sess("a")] }, store);
    expect(await loadNotes(store)).toEqual([]);
    const note = await addNote("x", store);
    expect(note.body).toBe("x");
    await setPinned(note.id, true, store);
    await removeNote(note.id, store);
  });
});
