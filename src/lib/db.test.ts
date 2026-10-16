import { describe, expect, test } from "bun:test";
import {
  appendSession,
  incrementStreak,
  loadDayLog,
  loadStreak,
  purgeStaleDayLogs,
  saveDayLog,
  addNote,
  displayTitle,
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
    keys: async (): Promise<string[]> => [...map.keys()],
  };
}

function blockedStore(): KeyValStore {
  const fail = async (): Promise<never> => {
    throw new DOMException("blocked", "SecurityError");
  };
  return {
    get: fail,
    set: fail,
    del: fail,
    keys: fail,
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
    const date = todayKey();
    let log = await appendSession(date, sess("a", "deep work"), store);
    expect(log.sessions).toHaveLength(1);
    log = await appendSession(date, sess("b"), store);
    expect(log.sessions.map((s) => s.id)).toEqual(["a", "b"]);
    // interrupted block: caller never appends, log stays as-is
    const reloaded = await loadDayLog(date, store);
    expect(reloaded.sessions).toHaveLength(2);
  });

  test("midnight rollover: stale-date append lands in today's log, old keys purged", async () => {
    const store = memStore();
    const today = todayKey();
    await saveDayLog({ date: "2000-01-01", sessions: [sess("old")] }, store);
    const log = await appendSession("2000-01-01", sess("new"), store);
    expect(log.date).toBe(today);
    expect(log.sessions.map((s) => s.id)).toEqual(["new"]);
    await purgeStaleDayLogs(today, store);
    expect(await loadDayLog("2000-01-01", store)).toEqual({
      date: "2000-01-01",
      sessions: [],
    });
    expect(await loadDayLog(today, store)).toEqual(log);
  });

  test("purge keeps today + non-daylog keys, drops superseded daylogs", async () => {
    const store = memStore();
    const today = todayKey();
    await saveDayLog({ date: "2000-01-01", sessions: [sess("old")] }, store);
    await saveDayLog({ date: today, sessions: [sess("fresh")] }, store);
    await store.set("notes", [{ id: "n" }]);
    await purgeStaleDayLogs(today, store);
    expect(store.map.has("daylog:2000-01-01")).toBe(false);
    expect(store.map.has(`daylog:${today}`)).toBe(true);
    expect(store.map.has("notes")).toBe(true);
  });
});

describe("Streak", () => {
  test("fresh streak starts at zero and persists", async () => {
    const store = memStore();
    const today = todayKey();
    expect(await loadStreak(today, store)).toEqual({ date: today, focusCount: 0 });
    expect(await incrementStreak(today, store)).toEqual({ date: today, focusCount: 1 });
    expect(await loadStreak(today, store)).toEqual({ date: today, focusCount: 1 });
  });

  test("date change resets the persisted streak explicitly, not via sessions", async () => {
    const store = memStore();
    await saveDayLog({ date: "2000-01-01", sessions: [sess("a"), sess("b")] }, store);
    const yesterday = "2000-01-01";
    expect(await incrementStreak(yesterday, store)).toEqual({ date: yesterday, focusCount: 1 });
    const today = todayKey();
    // Sessions still exist under the old date, but the streak resets anyway.
    expect(await loadStreak(today, store)).toEqual({ date: today, focusCount: 0 });
    // Reset was persisted: a second load sees the zeroed streak, not a revival.
    expect(store.map.get("streak")).toEqual({ date: today, focusCount: 0 });
  });
});

describe("NoteCard", () => {
  test("add/pin/search-order/delete round-trip", async () => {
    const store = memStore();
    const a = await addNote("alpha paste", undefined, store);
    const b = await addNote("beta paste", undefined, store);
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

  test("explicit title stored; empty autofills from body", async () => {
    const store = memStore();
    const titled = await addNote("body text here", "My Title", store);
    expect(titled.title).toBe("My Title");
    expect(displayTitle(titled)).toBe("My Title");
    const untitled = await addNote("first line\nsecond", "  ", store);
    expect(untitled.title).toBeUndefined();
    expect(displayTitle(untitled)).toBe("first line");
    const found = searchNotes(await loadNotes(store), "my title");
    expect(found.map((n: NoteCard) => n.id)).toEqual([titled.id]);
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
    const note = await addNote("x", undefined, store);
    expect(note.body).toBe("x");
    await setPinned(note.id, true, store);
    await removeNote(note.id, store);
    expect(await loadStreak("2026-10-16", store)).toEqual({
      date: "2026-10-16",
      focusCount: 0,
    });
    await purgeStaleDayLogs("2026-10-16", store);
  });
});
