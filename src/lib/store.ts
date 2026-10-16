import { del, get, keys, set } from "idb-keyval";

export interface KeyValStore {
  get<T>(key: string): Promise<T | undefined>;
  set(key: string, value: unknown): Promise<void>;
  del(key: string): Promise<void>;
  /** List stored keys. Optional — in-memory/test doubles may omit it. */
  keys?(): Promise<string[]>;
}

export const defaultStore: KeyValStore = {
  get: (key) => get(key),
  set: (key, value) => set(key, value),
  del: (key) => del(key),
  keys: async () => (await keys()).map(String),
};

export function uid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

/** Shared get-with-fallback: undefined when IndexedDB is blocked/unavailable. */
export async function safeGet<T>(key: string, store: KeyValStore): Promise<T | undefined> {
  try {
    return await store.get<T>(key);
  } catch {
    return undefined;
  }
}

/** Shared set-with-fallback: degrades silently when IndexedDB is blocked. */
export async function safeSet(key: string, value: unknown, store: KeyValStore): Promise<void> {
  try {
    await store.set(key, value);
  } catch {
    // IndexedDB blocked/unavailable: degrade silently.
  }
}
