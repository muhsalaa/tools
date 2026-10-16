# Spec: local-first tools site (v1)

Status: resolved

## Problem Statement

Salma wants one personal site holding many small tools, runnable locally and offline, deployed on Cloudflare Pages. Day-to-day needs: a Pomodoro timer with today's history (reset daily), and temporary paste-notes like Google Keep. No backend, no accounts, no sync — open the page and it works, online first load then offline.

## Solution

A static single-page app: home icon grid (desktop-icon menu) where each Tool owns its own route. v1 ships two Tools — Pomodoro and temp Notes — styled on the studied Timeyfi DNA (mint paper, pine ink, rounded cards, side-rail/home shell), with the Notes Tool borrowing card language from the pastel notes reference (colored cards, pill tags, pin/copy/delete). All state persists in IndexedDB. A service worker precaches the build so deep links work offline after first load.

## User Stories

1. As Salma, I want a home grid with big desktop-style icons per Tool, so that I can pick a tool in one tap.
2. As Salma, I want each Tool at its own route (/pomodoro, /notes) with a home button, so that deep links and refresh work.
3. As Salma, I want the site to load from Cloudflare Pages then keep working offline, so that no internet doesn't block my tools.
4. As Salma, I want a Pomodoro timer with 25-minute focus, 5-minute short break, 15-minute long break after every 4 focus blocks, so that I follow the classic cycle.
5. As Salma, I want to start the next block manually, so that breaks don't auto-run into each other.
6. As Salma, I want pause, resume, and reset on the timer, so that interruptions don't destroy a block.
7. As Salma, I want an optional label per focus block, so that I know what each Session was for.
8. As Salma, I want a completion beep (WebAudio, no network asset) with a mute toggle, so that I hear block ends offline.
9. As Salma, I want every completed focus block recorded as a Session (start, end, duration, optional label), so that history is truthful.
10. As Salma, I want interrupted blocks to never become Sessions, so that history only shows real focus.
11. As Salma, I want a DayLog showing today's Sessions plus session count and total minutes, so that I see today's effort at a glance.
12. As Salma, I want the DayLog purged on local-date change with no carry-over, so that each day starts clean.
13. As Salma, I want many NoteCards (optional title derived from first line, body, pinned flag, timestamps), so that I can paste any temporary data.
14. As Salma, I want to add a NoteCard from a quick textarea, so that pasting is frictionless.
15. As Salma, I want to pin NoteCards with pinned-first ordering, so that important pastes stay on top.
16. As Salma, I want to search NoteCards by text, so that I find a paste fast.
17. As Salma, I want one-tap copy on a NoteCard, so that I move temp data elsewhere quickly.
18. As Salma, I want manual-only delete on NoteCards (no auto-wipe), so that temp data survives until I decide.
19. As Salma, I want Notes to survive reload via IndexedDB, so that a refresh never loses pastes.
20. As Salma, I want an empty-slot-friendly home grid, so that future Tools slot in without redesign.
21. As Salma, I want no markdown rendering in Notes v1, so that pastes show exactly as typed.

## Implementation Decisions

- Shell: static SPA, code-based TanStack Router (no file-gen plugin — avoids codegen risk on the Vite fork), routes for home grid plus one route per Tool; SPA fallback (`/* /index.html 200`) so refresh/deep-link works on Pages.
- Styling: TailwindCSS v4 line with the Vite plugin; Timeyfi DNA is the locked visual system (mint paper, pine ink, teal accent, 16–20px radii, pill controls, side-rail/home shell); Notes Tool borrows pastel card + pill-tag language from the notes reference without copying pixels or artwork.
- Storage: single IndexedDB wrapper (via a minimal keyval helper) serving both Tools — DayLog record keyed by local date (purge-on-date-change) and NoteCard list; no localStorage for payload data (5MB/sync risk on big pastes); silent no-op if IndexedDB is blocked.
- Domain vocabulary from GLOSSARY.md: Tool (icon + route), Session (one completed focus block), DayLog (today's Sessions, purged daily), NoteCard (title?, body, pinned, timestamps).
- Pomodoro cycle: focus 25 / short 5 / long 15-after-4, manual start of next block; remaining time computed from a target timestamp on a short tick (drift-safe); pause keeps remaining, reset restores current mode length.
- Sound: WebAudio oscillator beep, generated at runtime (no audio asset, offline-safe), behind a toggle.
- PWA: service-worker precache of the static build with index fallback for navigations, so first online load enables later offline use; installable via manifest on Pages HTTPS.
- Seams for testing: (A) route seam — each Tool renders at its route and home links navigate; (B) storage seam — DayLog date-purge + Session append and NoteCard CRUD/pin/search-order through the wrapper; timer transitions, formatting, and date-keys as pure helpers under (B).
- ADR-worthy: IndexedDB-over-localStorage choice (hard to reverse post-data, genuine tradeoff) — record in docs/adr when implemented if still true.

## Testing Decisions

- Good tests assert external behavior only: routes render and navigate; completing a focus block appends a Session; date change yields an empty DayLog; NoteCard add/pin/search/copy/delete behave through the wrapper. No DOM-structure or CSS assertions.
- Modules under test: the route shell (home grid + Tool routes), the Pomodoro Tool behavior (cycle transitions, Session logging, DayLog view), the Notes Tool behavior (CRUD, pin order, search, copy), the storage wrapper (purge rule, persistence round-trip).
- Prior art: none in repo (greenfield tools area); follow the project's `vp check` (format/lint/type) plus `vp build` as the gate, and keep any new tests at the two agreed seams.

## Out of Scope

- Markdown rendering in Notes; sync/accounts/backend; reminders, archives, trash, labels, image notes; editable timer lengths; statistics beyond today's count/total; additional Tools beyond Pomodoro + Notes; SSR or Pages Functions; design.md emission (diagnosis only unless later requested).

## Further Notes

- Design source: Timeyfi screenshot is the primary studied DNA; pastel-notes screenshot informs only the Notes Tool card axis. Imagery from references is never copied — illustrations are rebuilt or omitted.
- Stack already installed: React + React DOM, code-based TanStack Router, Tailwind v4, PWA plugin, IndexedDB keyval helper. Source tree is currently a placeholder; the build gate (`vp check`, `vp build`) passes.
