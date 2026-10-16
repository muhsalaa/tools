import { describe, expect, test } from "bun:test";
import {
  LONG_BREAK_SEC,
  SHORT_BREAK_SEC,
  FOCUS_SEC,
  dayStats,
  durationOf,
  formatTime,
  nextModeAfter,
} from "./pomodoro";

describe("durations", () => {
  test("classic 25/5/15 lengths", () => {
    expect(FOCUS_SEC).toBe(25 * 60);
    expect(SHORT_BREAK_SEC).toBe(5 * 60);
    expect(LONG_BREAK_SEC).toBe(15 * 60);
    expect(durationOf("focus")).toBe(25 * 60);
    expect(durationOf("short")).toBe(5 * 60);
    expect(durationOf("long")).toBe(15 * 60);
  });
});

describe("nextModeAfter", () => {
  test("focus -> short until 4th, then long; breaks -> focus", () => {
    expect(nextModeAfter("focus", 0)).toBe("short"); // 1st focus done
    expect(nextModeAfter("focus", 2)).toBe("short"); // 3rd focus done
    expect(nextModeAfter("focus", 3)).toBe("long"); // 4th focus done
    expect(nextModeAfter("focus", 7)).toBe("long"); // 8th focus done
    expect(nextModeAfter("short", 1)).toBe("focus");
    expect(nextModeAfter("long", 4)).toBe("focus");
  });
});

describe("formatTime", () => {
  test("mm:ss with zero pad", () => {
    expect(formatTime(25 * 60)).toBe("25:00");
    expect(formatTime(65)).toBe("01:05");
    expect(formatTime(0)).toBe("00:00");
  });
});

describe("dayStats", () => {
  test("count + total minutes from sessions", () => {
    const sessions = [
      { id: "a", start: 1, end: 2, durationSec: 1500 },
      { id: "b", start: 3, end: 4, durationSec: 1500 },
    ];
    expect(dayStats(sessions)).toEqual({ count: 2, totalMinutes: 50 });
  });

  test("empty log is zeroed", () => {
    expect(dayStats([])).toEqual({ count: 0, totalMinutes: 0 });
  });
});
