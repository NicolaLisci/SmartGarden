# UI mockups, 2026-11-24

Status: **all discarded by Nicola on 2026-11-24.** Kept as a record of what was tried,
not as a base to iterate on. His verdict: "generic IoT dashboards with different colour
palettes". The direction he asked for instead is in `docs/PROJECT_STATUS.md`.

## Contents

| File | Concept |
|---|---|
| `canvas/Main.dc.html` | A · Serra notturna (dark, green 24 h dial) |
| `canvas/Botanico.dc.html` | B · Botanico chiaro (light cards) |
| `canvas/Strumento.dc.html` | C · Strumento (graphite, monospace) |
| `canvas/Proposta.dc.html` | D · A + C, after the ui-ux-pro-max design-system search |
| `canvas/Viva.dc.html` | E · Lampada viva (lamp, light cone, plants) |
| `canvas/Giornata.dc.html` | F · Giornata da scorrere (drag the sun through the day) |
| `canvas/Lusso.dc.html` | G · Lusso botanico (ivory, serif) |
| `canvas/BioTech.dc.html` | H · BioTech (obsidian, orbital rings) |
| `canvas/Spatial.dc.html` | I · Spatial (frosted glass, CSS-built device) |
| `canvas/NeoBotanico.dc.html` | J · Neo-botanico (chartreuse bento) |
| `canvas/canvas.json` | Layout of the ten artboards on the design canvas |
| `digital-twin.html` | Interactive 3D twin of the GHS37 (Three.js r128 from cdnjs) |

## How to view

- `digital-twin.html` opens directly in a browser (needs internet for Three.js and fonts).
- The `canvas/*.dc.html` files are artboards of a Claude Design canvas: they load a
  `support.js` runtime that is not in this repository, so they do not render on their
  own. They are stored as source. Live versions, private to Nicola's account:
  - canvas: https://claude.ai/artifact/B1MToQNAvAtdjBgUbMQ2s8
  - digital twin: https://claude.ai/artifact/FZuqQhQvW91cU1pfUs9JNa

## What is real and what is not

- Cycles (14/10, 12/12, 16/8), intensities from Schmidt's scenes and the 30/30 pump
  interval are the agreed requirements.
- Times, pump countdowns and diagnostics values are sample data.
- In A–J the pod row uses example plants; `digital-twin.html` uses Nicola's real layout
  (back row: Trinidad scorpion giallo, Timo, Maggiorana, Bonsai di pino; front row:
  Basilico porpora, Basilico normale, Basilico lemon).
