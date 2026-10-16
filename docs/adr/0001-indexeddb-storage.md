# ADR 0001: IndexedDB for Tool payload data (over localStorage)

Status: accepted

## Context

Both v1 Tools persist payload data with no backend: the Pomodoro DayLog
(today's Sessions) and the Notes NoteCard list. The choice of client-side
store had to cover pastes of arbitrary size (Notes accepts anything
temporary), survive reload, and keep working offline after the first load.

## Decision

All payload data goes through a single IndexedDB wrapper (`idb-keyval`
`get`/`set`/`del`); no payload data lives in localStorage.

## Why not localStorage

- **Quota + sync risk:** localStorage caps around 5MB and its API is
  synchronous — a big paste would block the main thread on every read/write.
  IndexedDB is asynchronous and quota-generous, so large NoteCard bodies
  never jank the timer tick.
- **Offline posture is unchanged:** both are same-origin and offline-safe,
  so IndexedDB costs nothing on the offline story.

## Tradeoffs

- IndexedDB can be **blocked** (private mode, disabled storage, quota denial)
  where localStorage would still work. Mitigation: the wrapper degrades to a
  silent no-op — the Tools stay usable in-memory for the visit, and tests pin
  the never-throw behavior.
- Async-only API means load-then-render instead of sync reads; accepted, the
  pages already render empty/loading states first.

## Reversibility

**Hard to reverse after ship:** once real Sessions and NoteCards accumulate
in users' browsers, migrating stores means a data-migration path (read old
keys, rewrite, verify) with no server to reconcile against. That irreversibility
is why the decision is recorded here rather than left implicit.

## Consequences

- Storage seam for tests: DayLog date-purge + Session append and NoteCard
  CRUD/pin/search-order all run through the wrapper against injectable
  in-memory doubles.
- If a future Tool needs structured querying (indexes, ranges), it extends
  this wrapper — no second storage mechanism without a new ADR.
