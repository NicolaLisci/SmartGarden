# Project status

Last updated: 2026-11-24

## Where we are

**Phase 4a: controller board fitted in the lamp head and validated with the bench-test
program (2026-11-24): LED channels W and B and the pump respond.** Next: OTA-capable
firmware, then the final firmware (D-002). The table and blockers below date from
2026-11-22; the numbered next actions are current.

| Area | State |
|---|---|
| Repository | Restructured for spec-driven development (2026-11-22). Schmidt's code moved to `legacy/`. |
| Legacy firmware | Reviewed; not fit for use as is (see ARCHITECTURE, legacy review). |
| 2023 board | Photographed (top and bottom). Components confirmed from purchase listings; MOSFETs are IRFZ44N (not logic-level). Wiring unknown. |
| Duronic GHS37 | Manual studied. Internals never opened. |
| Target firmware | Not started. ESPHome proposed (D-002). |

## Blockers

1. The board uses IRFZ44N MOSFETs (CONFIRMED by photo), which a 3.3 V GPIO cannot
   drive reliably. Direction chosen: PC817C optocoupler driver per channel (parts on
   hand). Spec 004 approved; build plan Rev A drafted (rewire from scratch, three
   identical modules), waiting for Nicola's review and the box measurements (P1–P4).
2. One flyback diode to buy for the pump channel.
3. LED panel current limiting, pump and water sensor unknown → spec 002.
4. Decisions D-002 (firmware stack) and D-003 (H1 replace vs H2 emulate buttons) open.

## Next actions

1. Nicola reviews plan 004 Rev A through the interactive guide
   `docs/hardware/assembly-guide.html`, then measures P1–P4 (guide step 1, task T00).
2. Buy one flyback diode (1N4007, 1N5819 or SS14); it is fitted last.
3. Done 2026-11-23: power module photographed on both sides and measured (spec 002).
   Result: pump switched low-side by Q2, commanded by DC3 contact C/F; lamp gets +24 V
   (pad E), GND (pads A, D) and that command line only.
4. Done 2026-11-23: lamp head opened and photographed. Direct LED drive ruled out (no
   resistors on the LED panel); proposal D-006: ESP inside the lamp head.
5. D-006 accepted 2026-11-23: controller inside the lamp head. Spec 004 superseded by
   spec 005 (board Rev B: NodeMCU + LM2596 + three 330 Ω + one PC817C).
6. Next: Nicola reviews plan 005 through the guide, measures the space in the lamp
   head, then builds and bench-tests the board (guide steps 1–15).
7. Before soldering on the lamp board: confirm the five taps by measurement (step 17).
8. Decide D-002 and write the firmware (spec 003): bench-test program first.
9. Done 2026-11-24: board fitted in the lamp head and wired; `firmware/bench-test` flashed
   over USB (port `/dev/cu.usbserial-1110`). First power-up at 24 V failed: solder bridge
   between J3 + and − (sparks at the adapter plug, 0 V at J3); adapter and base survived
   (24 V measured at the base). After rework the NodeMCU boots from the lamp's 24 V and the
   test cycle runs: output W lights the white and red LEDs, output B the blue LEDs
   (observed by Nicola). The lamp's own low-water buzzer still sounds with the tank empty.
10. Done 2026-11-24: pump output confirmed with water in the tank (observed by Nicola).
    It did not visibly pump on the first cycle, only from the second; cause not verified
    (HYPOTHESIS: 5 s is too short to prime a dry pump).
11. Open: a large spark at the adapter plug on insertion (cause not verified; inspect J3,
    measure + ↔ − de-energised, try plugging the barrel first and the mains second); the
    10-power-cycle check that nothing turns on at boot (RQ-005-04).
12. Done 2026-11-24: over-the-air updates work. `firmware/ota-base` flashed over USB
    (outputs always released, Wi-Fi + ArduinoOTA with password; credentials in
    `firmware/ota-base/secrets.h`, git-ignored, entered by Nicola). The board joined the
    home Wi-Fi (IP 192.168.1.17 from DHCP, hostname `smartgarden`) and one upload over the
    network succeeded with the board on USB power. Not yet checked: Wi-Fi reception with
    the board inside the lamp head on the 24 V supply.
13. Next: design of the control app, agreed so far: a web page served by the lamp itself
    (Arduino firmware, D-002 option A) to set the cycle start time, keep the original
    14/10, 12/12 and 16/8 cycles and offer a debug/test page. Design to be approved by
    Nicola before spec 003 is updated and any code is written.

## History

- 2023-06: fork of Schmidt's project; board assembled on perfboard; integration not completed.
- 2026-11-24: board Rev C powered in the lamp head; LED channels W and B confirmed with the bench-test program.
- 2026-11-22: repository audit, firmware review, GHS37 manual review, SDD structure.
