import { describe, expect, test } from "bun:test";
import {
  loadSnapshot,
  resumeRemaining,
  saveSnapshot,
  type KeyValStore,
  type TimerSnapshot,
} from "./db";

function memStore(): KeyValStore {
  const map = new Map<string, unknown>();
  return {
    // biome-ignore lint/suspicious/noExplicitAny: test double
    get: async (k: string) => map.get(k) as any,
    set: async (k: string, v: unknown) => {
      map.set(k, v);
    },
    del: async (k: string) => {
      map.delete(k);
    },
  };
}

function snap(over: Partial<TimerSnapshot> = {}): TimerSnapshot {
  return {
    mode: "focus",
    status: "running",
    targetAt: 1_000_000,
    remainingSec: 1500,
    wallStart: 900_000,
    activeMs: 5000,
    started: true,
    label: "deep work",
    muted: false,
    savedAt: 999_000,
    ...over,
  };
}

describe("timer snapshot", () => {
  test("round-trips; null when never saved", async () => {
    const store = memStore();
    expect(await loadSnapshot(store)).toBeNull();
    await saveSnapshot(snap(), store);
    expect(await loadSnapshot(store)).toEqual(snap());
  });

  test("resumeRemaining follows target clock, clamps at zero", () => {
    expect(resumeRemaining(snap({ targetAt: 1_010_000 }), 1_000_000)).toBe(10);
    expect(resumeRemaining(snap({ targetAt: 900_000 }), 1_000_000)).toBe(0);
    expect(resumeRemaining(snap({ status: "paused", remainingSec: 321.6 }), 1_000_000)).toBe(322);
  });
});
