# SmartGarden app

Mobile web app for the lamp, implementing the visual reference
`docs/design/reference/smartgarden-ui-reference.webp` (six screens). Plain HTML, CSS and
ES modules: no build step, no dependencies.

## Run

```bash
cd app
node dev/server.mjs                              # in-memory simulator of firmware/web-test
DEVICE=http://192.168.1.17 node dev/server.mjs   # real lamp, requests forwarded
node js/schedule.test.mjs                        # photoperiod maths
```

Open `http://localhost:5173`. The simulator is a dev tool only; the app never invents state.
It reads `GET /state` and writes `POST /set?ch=w|b|p&on=0|1` (firmware/web-test).

## Structure

| Path | Role |
|---|---|
| `css/tokens.css` | Design tokens: colour, type, geometry, elevation, motion |
| `css/app.css` | Components and screens |
| `js/device.js` | Communication layer and device state (single source) |
| `js/schedule.js` | Photoperiod maths and its settings |
| `js/app.js` | Router, screens, components, state → DOM bindings |
| `js/icons.js`, `js/plants.js` | Line icons, the seven pods |
| `assets/` | Images cropped from the reference |

## Differences from the reference

Each one follows from what the device can do today (`docs/PROJECT_STATUS.md`).

| Reference | Implemented | Why |
|---|---|---|
| Light "ON" / pump "Auto" | ON = forced by the app, Auto = left to the lamp | The board can force a channel on, never off |
| Intensity slider 100 % | Three light choices: white, white at 50 % (PWM), full | 50 % PWM on W confirmed on the lamp (2026-11-24); a continuous slider is not verified |
| Spectrum "Crescita (Blu)" / "Fioritura (Rosso + Blu)" | "Solo bianco" (W) / "Completo" (W + B) | The lamp never runs blue alone; Schmidt's scenes use W alone or W + B. W drives white and red LEDs together |
| Pump switch and modes Auto / ON / OFF | Read-only: always automatic, run by the lamp | Nicola's choice (2026-11-24): no pump settings in the app for now. A forced run from the test page is still shown |
| Pump "Ciclo attuale 10 min ogni 60", "Prossima attivazione" | Observed cycle "~5 min on, 30 min off · da confermare" | From docs/hardware/pump-timing-log.md, two non-clean runs; no next-run time without a schedule |
| Ciclo "Ciclo attivo" | Cycle name + footnote on who runs it | The board runs the cycle (`/schedule`); the phone keeps a copy only to display it offline |
| Ciclo start hour | Set by tapping the "Prossimo evento" row | The reference has no start-hour control; the requirement has one |
| Plants: list with stage and day, "+" | Top view of the seven pods (geometry from `docs/hardware/photos/duronic-overview-lamp.jpg`) plus the list; tap a pod or row to set plant and optional sowing date; day count from that date | Nicola asked for configurable pods; stored on the phone (`sg.pods`) until the firmware keeps settings. No growth stage: nothing measures it |
| Bottom nav on Home only, five icons with a settings gear | Same nav on every screen, icon + label: Home, Piante, Ciclo, Andamento, Attività | UX review (ui-ux-pro-max): navigation must stay in one place; Ciclo is a top-level tab, not a detail screen |
| Analytics chart, "+24 %", "Luce 98 %", hours bars | Empty state | No history is recorded; numbers would be fiction |
| Header "…" menus | Omitted | No function behind them |
| Hero lights-off look | CSS dim of the lights-on render | Only one render exists |
| Image sharpness | 300 px crops of the reference, soft at 3× | Needs renders ≥ 1170 px wide: hero on/off, LED close-up, water, seven plant thumbnails |

## Hosting

Today the app runs from the dev server. Serving it from the lamp (LittleFS) or loading
it from a CDN needs a firmware change, which is outside this task.
