# AGENTS.md — SmartGarden

Operating contract for every AI agent (Claude Code, Codex, others) working in this
repository. `CLAUDE.md` imports this file; edit only this one.

## Goal

Turn a **Duronic GHS37** hydroponic grow box into a device that is fully controllable
over Wi-Fi, reliable, safe and independent of its capacitive buttons, reusing the
ESP8266 board Nicola built in 2023.

## Read first, in this order

1. `docs/PROJECT_STATUS.md` — where the project stands and what blocks it.
2. `.specify/memory/constitution.md` — non-negotiable principles. They win over any spec.
3. The spec you are working on: `specs/NNN-slug/`.
4. Only the `docs/` files that spec references.

Never assume the hardware works the way the original IDOO project did. Check
`docs/HARDWARE_AUDIT.md` for what is confirmed.

## Repository map

| Path | Content |
|---|---|
| `specs/NNN-slug/` | One unit of work: `spec.md` → `plan.md` → `tasks.md` → `checklist.md` |
| `.specify/memory/constitution.md` | Project principles |
| `.specify/templates/` | Templates for the four spec files |
| `docs/` | Living project knowledge: status, hardware audit, wiring, architecture, implementation plan, test plan |
| `docs/hardware/photos/` | Photos of the real hardware, named `<object>-<year>-<view>.jpg` |
| `firmware/` | Target firmware (not created yet; ESPHome is the proposed stack) |
| `legacy/schmidt-arduino/` | Dominik Schmidt's original Arduino controller, kept as reference. Read-only |

## Spec-driven workflow

The cycle is GitHub Spec Kit's: **spec → plan → tasks → implement → checklist**. The
folder layout matches Spec Kit, so its `specify` CLI and commands can be added later
without moving anything.

1. **Spec** (`spec.md`, from `.specify/templates/spec-template.md`). What and why,
   never how. Requirements carry stable IDs `RQ-NNN-xx` (NNN = spec number) and
   testable acceptance criteria. Open points are marked `[NEEDS CLARIFICATION: …]`.
2. **Plan** (`plan.md`). How: approach, hardware and firmware choices, risks, which
   constitution principles apply and how they are satisfied.
3. **Tasks** (`tasks.md`). Ordered, small, each one tied to the requirement IDs it
   serves. Tasks that touch hardware are marked `[HW]` and say who performs them.
4. **Implement.** One task at a time. Tick the box when done and note the evidence
   (photo, measurement, log, test output).
5. **Checklist** (`checklist.md`). Verifies every requirement against its acceptance
   criteria. A spec is `Done` only when every item has evidence.

### Gates

- Every spec file has a `Status:` line: `Draft` → `Approved` → `In progress` → `Done`
  (or `Blocked: <reason>`).
- Only Nicola moves a spec from `Draft` to `Approved`. No `plan.md` before the spec is
  approved; no implementation before the plan is approved.
- A spec with any `[NEEDS CLARIFICATION]` left cannot be approved.
- When a spec reaches `Done`, update the `docs/` files it changed (status, audit,
  wiring, architecture) in the same change.

### Numbering

Specs are numbered in dependency order (`001`, `002`, …) and never renumbered. A new
spec takes the next free number. The roadmap is `docs/IMPLEMENTATION_PLAN.md`.

## Evidence labels

Every hardware or behaviour claim in `docs/` and `specs/` carries one label:

- **CONFIRMED**: measured, observed or read in a datasheet or manual; cite the source.
- **HYPOTHESIS**: inferred; say from what.
- **UNKNOWN**: not yet known; say how to find out.

A HYPOTHESIS never becomes a wiring instruction. Plausible specific detail without a
source is a defect.

## Safety rules

- The system mixes water, 24 V DC and an inductive load (pump). Treat it accordingly.
- Default to measurements on **de-energised** circuits (continuity, resistance, diode
  test). Ask for a live measurement only when it is unavoidable, state the risk and
  the procedure, and never on the mains side of the power adapter.
- Never instruct connecting the LED panel or the pump to a MOSFET output before the
  load's voltage, current and current limiting are CONFIRMED.
- Every output must be OFF from power-up until the firmware drives it on purpose.
- No hardware modification, soldering, flashing or powering of loads without Nicola's
  explicit go-ahead for that step.
- No purchases unless a spec shows the part is necessary and nothing on hand works.

## README

`README.md` is the project's front page. Keep it current: every change that alters what
the device or the app can do, the hardware state, the screenshots or how to run, test or
update anything updates the README in the same change. When app screens change visibly,
retake the screenshots in `docs/images/app/` (390 × 844, served by `app/dev/server.mjs`).

## Git

- Never commit or push without Nicola's explicit authorisation.
- Never commit secrets: Wi-Fi credentials, API keys and OTA passwords live in
  `firmware/secrets.yaml`, which is git-ignored.
- `legacy/` is read-only reference; do not modify it.

## Language

- Talk to Nicola in Italian.
- Files in this repository (specs, docs, code, commit messages) are in English.
- Exception: bench guides Nicola uses while building (`docs/hardware/assembly-guide.html`)
  are in Italian, interactive and visual, with components drawn as they look.

## Tooling status

Nicola's Mac has the Arduino IDE with the ESP8266 core 3.1.2. The IDE bundles
`arduino-cli`; compile the bench test with:

```bash
"/Applications/Arduino IDE.app/Contents/Resources/app/lib/backend/resources/arduino-cli" compile --fqbn esp8266:esp8266:nodemcuv2 --warnings all firmware/bench-test
```

Upload with the same binary, `upload -p <port> --fqbn esp8266:esp8266:nodemcuv2`, with the
NodeMCU on USB and the lamp **off the base** (never USB and 24 V together). The final
firmware (spec 003, ESPHome or Arduino: decision D-002) is not written yet.

`firmware/ota-base` is the OTA-capable base (outputs released, Wi-Fi + ArduinoOTA). It
needs `firmware/ota-base/secrets.h` (git-ignored; copy `secrets.h.example`).

The board is closed inside the lamp head, so OTA must never be lost. **Every Wi-Fi
update goes through `firmware/tools/ota-upload.sh <sketch-dir>`**, never through
`arduino-cli upload --protocol network` or `espota.py` directly. The script blocks a
build whose OTA password differs from `firmware/ota-base/secrets.h` or that does not link
ArduinoOTA `begin`/`setPassword`/`handle`, and after the upload it checks that the board
answers again. Never work around a `BLOCKED:` message. New sketches start from
`ota-base.ino` and call `ArduinoOTA.handle()` on every `loop()` pass without blocking.
Details: `.claude/skills/ota-upload/SKILL.md`. On Claude Code the PreToolUse hook
`.claude/hooks/guard-ota.py` blocks any direct network upload. `firmware/web-test` is a
test page at `http://smartgarden.local/` to force W, B and the pump (10 s max) on.
When Nicola reports a lamp pump start or stop time, append it to
`docs/hardware/pump-timing-log.md` and update its analysis.
