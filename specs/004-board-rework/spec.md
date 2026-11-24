# Spec 004 — 2023 board rework

Status: Superseded by spec 005 on 2026-11-23 (controller inside the lamp head). Was: Approved — Nicola, 2026-11-23 ("procedi a progettare la board … predisposta per stare nella scatola"; build to be guided step by step, simple to solder)
Owner: Nicola
Depends on: 001 RQ-001-07 (enclosure measurements). The plan rewires the board from
scratch, so the old netlist (RQ-001-02) is no longer needed.
Last updated: 2026-11-23

## Why

The 2023 board cannot drive its loads safely as built. Its IRFZ44N MOSFETs are not
logic-level and need about 10 V on the gate, while the ESP8266 gives 3.3 V. The
legacy pin map puts the pump on a boot strap pin, and there is no flyback diode on
the pump.

## Scope

In: gate drivers, GPIO reassignment, flyback diode, DC-DC set-up, fit in the enclosure.
All with parts on hand where possible.
Out: firmware (spec 003), Duronic-side wiring (spec 002 / 005).

## Requirements

| ID | Requirement | Acceptance criterion |
|---|---|---|
| RQ-004-01 | Each load channel shall have a non-inverting driver that brings the MOSFET gate fully on from a 3.3 V GPIO. | With 24 V applied: gate 10–13 V when the GPIO is high, below 0.5 V when it is low, on every channel. |
| RQ-004-02 | Every output shall stay OFF while the ESP8266 powers up, resets or is removed. | TEST_PLAN T2: no gate pulse over 10 power cycles and 10 resets; gates at 0 V with the NodeMCU unplugged. |
| RQ-004-03 | No load shall be driven by a boot strap pin (GPIO0, GPIO2, GPIO15). | WIRING shows the final GPIO map; ESP boots normally with all channels wired. |
| RQ-004-04 | The pump channel shall have a flyback diode across the load. | Diode fitted, cathode to +24 V, checked with the multimeter diode test. |
| RQ-004-05 | The MOSFETs shall run at full load current without a heatsink. | TEST_PLAN T4: case at most touch-warm (below 60 °C) after 30 min at the expected load current. |
| RQ-004-06 | The DC-DC output shall be set to 5.0 V before the NodeMCU is connected. | TEST_PLAN T1: 4.9–5.2 V measured with no load. |
| RQ-004-07 | The reworked board shall fit the 100 × 80 × 29 mm enclosure. | Box closes with the board and cables inside; openings for 24 V in and load cables (see RQ-001-07). |
| RQ-004-08 | The rework shall use parts on hand unless a purchase is justified. | Plan lists every part with "on hand" or a justification (principle IV). |
| RQ-004-09 | The build shall be simple to solder and to verify step by step. | Three identical channel modules; every hole and wire specified on a grid; a multimeter check after each step in `tasks.md`. |

## Known facts

- CONFIRMED (photo `board-2023-mosfets.jpg`): three IRFZ44N fitted.
- CONFIRMED (IRFZ44N datasheet): V_GS(th) 2.0–4.0 V, R_DS(on) specified at 10 V,
  V_GS max ±20 V, Q_g max 63 nC.
- CONFIRMED (Nicola, 2026-11-23): 20 × PC817C optocouplers on hand.
- Proposed circuit: HARDWARE_AUDIT, "Proposed gate driver". It becomes this spec's
  `plan.md` after approval.

## Resolved questions

- Flyback diode: none on hand (Nicola, 2026-11-23). Resolved: one diode rated ≥ 1 A,
  ≥ 50 V (1N4007, 1N5819 or SS14) is the plan's only purchase; it is fitted last, so
  the build and bench tests can start without it.
- Resistors: Nicola has a 30-value metal-film kit, 1/4 W, 1 %, 10 Ω – 1 MΩ
  (2026-11-23). 470 Ω or 680 Ω and 10 kΩ are standard values in such kits; check the
  actual list when the plan's part list is drawn up. Dissipation in the proposed driver
  is ≤ 15 mW per resistor, well within 1/4 W.

## Constitution check

I: non-inverting driver with gate pull-down keeps loads off at boot. IV: reuses the
IRFZ44N and the PC817C. V: no soldering before Nicola approves the plan.
