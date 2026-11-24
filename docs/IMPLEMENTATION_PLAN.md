# Implementation plan

Last updated: 2026-11-22

Phases are ordered by dependency. Each phase is delivered through one or more specs in
`specs/`. Future specs are listed with a reserved number; they are written when their
inputs exist.

```
001 board audit ──┐
                  ├──► decisions D-003, D-002 ──► 004 board rework ──┐
002 Duronic RE ───┘                          └──► 003 firmware ──────┴──► 005 integration & field test
```

| Phase | Spec | Status | Output |
|---|---|---|---|
| 1. Repository audit | — | Done 2026-11-22 | ARCHITECTURE (legacy review), PROJECT_STATUS |
| 2. Hardware audit | 001-board-as-built | Draft | HARDWARE_AUDIT, WIRING (board) confirmed |
| 3. Duronic reverse engineering | 002-duronic-reverse-engineering | Draft | WIRING (Duronic), compatibility verdict |
| Decision gate | — | Open | D-003 then D-002 in ARCHITECTURE |
| 4a. Board rework | 004-board-rework | Superseded by 005 | — |
| 4a. Controller board in the lamp head | 005-lamp-head-controller | Spec approved; plan Draft | Board Rev B built, bench-tested, connected to the lamp board and fitted |
| 4b. Firmware | 003-firmware | Draft, blocked | `firmware/` configuration, T2–T3, T7–T9 passing |
| 5. Integration and field test | 006 (reserved) | Not written | Installed in the GHS37, T5–T10 passing |

Specs 001 and 002 can run in parallel. 003 and 004 can run in parallel once the
decision gate is passed; 003 can be bench-tested on a NodeMCU with LEDs as dummy loads.
