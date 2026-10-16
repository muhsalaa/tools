# tools

Local-first personal tools site. Works offline after first load. Deployed on Cloudflare Pages.

## Tools

| Route       | What                                                             |
| ----------- | ---------------------------------------------------------------- |
| `/`         | Desktop: icon grid + start bar                                   |
| `/pomodoro` | 25/5/15×4 timer, today's DayLog (purged daily), survives refresh |
| `/notes`    | Temp paste cards: title, pin, search, copy, delete               |

## Stack

React 19 · code-based TanStack Router · Tailwind v4 · IndexedDB (`idb-keyval`) for DayLog/NoteCards · localStorage for timer snapshot · `vite-plugin-pwa` (precache + index fallback) · `public/_redirects` for Pages SPA fallback.

## Commands

```bash
vp dev      # local dev
vp check    # format + lint + types
vp build    # typecheck + static build (dist/)
bun test    # unit tests (timer/storage/pastel)
```

## Docs

- `design.md` — locked visual system (mint/pine, desktop metaphor, icon voice)
- `GLOSSARY.md` — Tool, Session, DayLog, NoteCard
- `docs/adr/` — decisions (IndexedDB storage, …)
- `.scratch/local-tools-v1/` — spec + ticket history
