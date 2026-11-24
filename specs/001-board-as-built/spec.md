# Spec 001 — 2023 board as-built audit

Status: Draft
Owner: Nicola
Depends on: none
Last updated: 2026-11-22

## Why

The ESP8266 board built in 2023 has never been documented or tested. Its wiring is
point-to-point on the bottom of the perfboard and cannot be traced from photos. No
firmware or load can be connected safely until we know what the board actually is.

## Scope

In: identifying every component, reconstructing the netlist, listing deviations from
Schmidt's reference design and the modifications needed. All on a **de-energised** board.
Out: powering the board (see `docs/TEST_PLAN.md` T1–T4), executing any modification
(future spec), anything on the Duronic side (spec 002).

## Requirements

Note 2026-11-23: plan 004 rewires the board from scratch, so RQ-001-02, -03, -04 and
-06 are no longer needed. RQ-001-01 (remaining: DC-DC IC marking) and RQ-001-07 still
apply; RQ-001-07 is task T00 of spec 004.

| ID | Requirement | Acceptance criterion |
|---|---|---|
| RQ-001-01 | Every component shall be identified by part number or value. | `docs/HARDWARE_AUDIT.md` lists the three TO-220 part numbers (front markings), the six resistor values (measured), the NodeMCU variant and the DC-DC regulator IC, each CONFIRMED with a photo or measurement. |
| RQ-001-02 | The board netlist shall be reconstructed from continuity tests. | `docs/WIRING.md` has every net of the board (24 V in, GND, 5 V, 3V3, each GPIO→gate path, each drain→terminal, each terminal's other pole) with status CONFIRMED. |
| RQ-001-03 | The GPIO driving each output shall be known, and boot-strapping pins flagged. | WIRING lists GPIO ↔ output; any use of GPIO0, GPIO2 or GPIO15 is flagged with its boot consequence. |
| RQ-001-04 | The gate network of each MOSFET shall be characterised. | For each channel: series gate resistor value, pull-down value and position (gate–source or GPIO–GND), CONFIRMED. |
| RQ-001-05 | Deviations from Schmidt's design and required modifications shall be listed. | HARDWARE_AUDIT has a "Required modifications" table (change, reason, parts on hand or to buy). Nothing is executed under this spec. |
| RQ-001-06 | The function of the loose red wire on the barrel jack shall be known. | Recorded in WIRING, or the wire is declared spare by Nicola. |
| RQ-001-07 | The board shall be checked for fit in the 100 × 80 × 29 mm enclosure on hand. | Perfboard outline, tallest component height and underside clearance measured against the box's internal dimensions; result and required openings recorded in HARDWARE_AUDIT. |

## Known facts

From photos `docs/hardware/photos/board-2023-{top,bottom}.jpg`, 2026-11-22:

- CONFIRMED (photo): NodeMCU-style ESP-12 devkit, buck DC-DC module, three 3-lead
  TO-220 devices, two resistors next to each TO-220, three 2-pole screw terminals,
  panel-mount DC barrel jack, point-to-point wiring on the bottom.
- CONFIRMED (Nicola's purchase listings): NodeMCU V3 with CH340, LM2596 adjustable
  buck module, **IRFZ44N** MOSFETs (standard-level, V_GS(th) 2–4 V: not drivable
  reliably from 3.3 V; see HARDWARE_AUDIT, Known risks).
- CONFIRMED (photo `board-2023-mosfets.jpg`, 2026-11-23): the three fitted TO-220
  are marked IRFZ44N, IR logo, lot "H238D B9P0". RQ-001-01 is met for the MOSFETs.
- HYPOTHESIS: resistors = 100 Ω + 1 kΩ (Schmidt's BOM).
- UNKNOWN: every connection; DC-DC output setting; whether the board was ever powered.

## Open questions

- [NEEDS CLARIFICATION: was the board wired following Schmidt's schematic, or a variant?]
- [NEEDS CLARIFICATION: has it ever been powered? If yes, with what result?]

## Constitution check

II (evidence before wiring) is the purpose of this spec. V: no soldering or power
under this spec. IV: required modifications prefer parts on hand.
