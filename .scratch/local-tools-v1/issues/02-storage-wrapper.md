# 02: Storage wrapper

**What to build:** One IndexedDB wrapper serving both Tools, so Sessions and NoteCards persist across reload and the DayLog resets on local-date change.

**Blocked by:** None (can start immediately).

**Status:** resolved

- [ ] DayLog round-trips; same-date load returns stored Sessions
- [ ] Date change yields an empty DayLog (no carry-over)
- [ ] Completed focus blocks append Sessions; interrupted ones never do
- [ ] NoteCard add/pin/search-order/delete round-trip through the wrapper
- [ ] Blocked/unavailable IndexedDB degrades silently, never crashes
