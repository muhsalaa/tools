import { describe, expect, test } from "bun:test";
import { PASTELS, pastelFor } from "./pastel";

describe("pastelFor", () => {
  test("returns a palette member and is stable per id", () => {
    const color = pastelFor("some-note-id");
    expect(PASTELS).toContain(color);
    expect(pastelFor("some-note-id")).toBe(color);
  });

  test("matches worked example: 'a' hashes to second palette entry", () => {
    // h = 97, 97 % 6 = 1
    expect(pastelFor("a")).toBe(PASTELS[1]);
  });
});
