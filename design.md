# Design — tools

Locked system for this app. Every page reads this before emitting code.
Studied DNA: Timeyfi dashboard (primary) + pastel notes cards (notes axis only)

- glossy gradient icon set (icon voice only). No pixels copied from any source.

## Genre

playful-calm desktop

## Macrostructure family

- App home: Desktop-icon-grid (icons top-left column, wallpaper, start bar)
- App tools: Window (title bar + card body, max-w column)

## Theme

- `--color-paper: #F4FBF7` (card white-mint)
- `--color-wall: #D9EFE4` (mint wallpaper base)
- `--color-ink: #173E3A` (pine ink)
- `--color-accent: #1F9D8A` (teal, ≤5% per viewport)
- `--color-note-amber: #F2B544` (notes icon family only)
- `--color-focus: #1F9D8A`

## Typography

- Display + body: system sans stack, roman only (offline: no webfonts)
- Labels: uppercase 12px bold tracking-wide
- Tabular numerals for timers/clock

## Spacing

4pt scale. Cards `rounded-[20px]`, pills `rounded-full`, icons `rounded-[22%]`.

## Motion

Fade-only ≤200ms. Reduced-motion: none. No hover lifts on cards.

## Microinteractions

- Desktop icons: single click opens (touch-safe). Focus-visible ring pine.
- Start button toggles popup; Esc closes; click-outside closes.

## Icon voice

Own hand-built SVG: glossy vertical-gradient tile, top inner highlight
(white .35), darker glyph inset, optional satellite badge. Families:
pomodoro = pine gradient + cream clock; notes = amber gradient + white card;
start = pine tile + mint 2x2 grid mark.

## What pages MUST share

Mint/pine tokens, system-sans roman type, pill CTA voice (pine fill, mint text),
icon voice above, start bar on home.

## What pages MAY differ on

Home = wallpaper + icons + start bar. Tools = window chrome + card bodies.
Notes cards keep pastel fills (notes axis).
