// Single import surface: DayLog + NoteCard helpers live in their own
// modules, but callers keep importing from "../lib/db" unchanged.
export type { KeyValStore } from "./store";
export { uid } from "./store";
export {
  appendSession,
  incrementStreak,
  loadDayLog,
  loadStreak,
  purgeStaleDayLogs,
  saveDayLog,
  saveStreak,
  todayKey,
  type DayLog,
  type Session,
  type StreakState,
} from "./daylog";
export {
  addNote,
  displayTitle,
  loadNotes,
  removeNote,
  searchNotes,
  setPinned,
  sortedNotes,
  titleOf,
  type NoteCard,
} from "./notes";
