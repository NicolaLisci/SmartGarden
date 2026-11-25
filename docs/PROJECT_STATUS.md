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
    network succeeded with the board on USB power. Checked 2026-11-24 evening: Wi-Fi works
    with the board mounted in the lamp head on 24 V; two OTA uploads went through
    `firmware/tools/ota-upload.sh` (the only allowed path: it refuses builds without
    ArduinoOTA and checks the board answers afterwards; a Claude Code hook blocks direct
    network uploads). The board now runs `firmware/web-test` (page at
    `http://192.168.1.17/`: force W, B, pump on; pump auto-off after 10 s). The lamp was
    closed without a safe-mode fallback (Nicola's choice): a crashing sketch or a Wi-Fi
    change would need the lamp opened.
    Open, 2026-11-24: the pump does not start from our D7 command although the firmware
    drives D7 high for 10 s; the lamp starts the pump itself at power-up, so pump and Q2
    work. Hypothesis, not measured: while the lamp holds the pump off it pulls J3 C low and
    the PC817C cannot overcome it. Next check: volts J3 C ↔ J3 − while D7 is on. If it is
    ~0 V, move our command after the lamp MCU (Q2 control pin), which would also let the
    app switch the pump off; today our outputs can only add "on". Needs the lamp opened.
    Observed by Nicola the same evening: W and B turn on and off from the page; the pump
    ran at power-up (lamp), stopped, and the lamp restarted it at about 20:57 and kept it
    running after our 10 s command ended. Timing the lamp's pump cycle is still open.
13. App design, 2026-11-24. Agreed requirements: a web page served by the lamp
    (Arduino firmware, D-002 option A); the three cycles 14/10, 12/12, 16/8, one at a
    time, with a chosen start hour; intensities from Schmidt's scenes on the two channels
    (Normale W 100 % B 100 %, Corto W 50 % B off, Lungo W 100 % B off), adjustable; pump
    30 min on / 30 min off day and night, adjustable; a map of the seven pods with plant
    name and optional sowing date; test and diagnostics (manual outputs with auto-off,
    live state, board health, event log, accelerated day).
14. UI: ten mockups and a 3D twin were made and all discarded by Nicola (record in
    `docs/design/mockups-2026-11-24/`). Direction he asked for: the garden as the hero in
    a photorealistic, edge-to-edge composition that changes with day and night, controls
    placed on the object, no dashboard cards and no dominant clock. Blocked on the image
    source: two real photos of the unit (lamp on / lamp off, same framing) are the
    proposed route; no image generator is installed on the Mac.
15. Spec 003 not yet updated with items 13–14.
16. 2026-11-24 evening: mobile app in `app/` (see `app/README.md`), served by the lamp from
    LittleFS at http://smartgarden.local; `firmware/web-test` now persists an activity log in
    LittleFS (`/log`) and accepts a PWM duty on W/B. CONFIRMED (observed by Nicola, 22:25):
    W at 50 % duty visibly dims the white LEDs with no visible flicker (ESP8266 default PWM,
    1 kHz), so the 12/12 scene (W 50 %, B off) is feasible.
17. 2026-11-25 morning: the lamp was found dark — it waits in standby after being
    re-plugged (the original fault) and nothing ran the cycle. The board now runs the light
    cycle itself (`firmware/web-test/schedule.h`, host tests in `firmware/test/`): settings
    in EEPROM (default 14/10 from 07:00), NTP clock, manual override until the next edge,
    `GET/POST /schedule`. Verified on the lamp 08:47–08:48. Open for spec 003: behaviour
    without a clock (today: the scheduler waits), pump schedule.

## History

- 2023-06: fork of Schmidt's project; board assembled on perfboard; integration not completed.
- 2026-11-24: board Rev C powered in the lamp head; LED channels W and B confirmed with the bench-test program.
- 2026-11-22: repository audit, firmware review, GHS37 manual review, SDD structure.
