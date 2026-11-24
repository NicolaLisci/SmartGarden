# Test plan

Last updated: 2026-11-22

Tests run in order; each one needs the previous to pass. Every test needs Nicola's
go-ahead before power is applied (constitution V). Results go in the owning spec's
`checklist.md`.

Power source for all bench tests: the original 24 V adapter or a bench supply with
current limit set to the lowest value that works. Nothing on the mains side is touched.

| # | Test | Setup | Procedure | Pass criterion | Requirements |
|---|---|---|---|---|---|
| T1 | ESP8266 power | DC-DC only: NodeMCU **removed or Vin disconnected**, no loads | Apply 24 V, measure DC-DC output; adjust trimmer to 5.0 V | 4.9–5.2 V, stable; nothing warm | 001 / 004 |
| T2 | Boot without loads | NodeMCU on Vin, terminals empty, LED + resistor probe on each gate | Power-cycle 10×, press RST 10× | ESP boots every time; gate probes never light during boot/reset | RQ-003-08 |
| T3 | GPIO test | As T2, test firmware toggling each output | Toggle each channel from UI or serial | Each gate goes high only on command; correct channel mapping | RQ-001-03, RQ-003-08 |
| T4 | MOSFET with dummy load | 24 V lamp or power resistor sized to the expected load current on each terminal | On for 30 min per channel at full current | Load switches; MOSFET case temperature acceptable (touch-warm at most, measure if possible) | 004 |
| T5 | LED panel | Only after RQ-002-03/04 CONFIRMED and wiring in WIRING CONFIRMED | Each light mode, current measured at first switch-on | Current within the panel's rated value; intensity differences per mode | RQ-003-01 |
| T6 | Pump | Flyback diode fitted; pump in water | ON/OFF/AUTO | Pump runs; no ESP resets at switching | RQ-003-03 |
| T7 | Timing | Shortened schedule (minutes instead of hours) then real schedule for 48 h | Log transitions | Durations exact ±1 min; transitions at configured times | RQ-003-01, RQ-003-02 |
| T8 | Power cut | Full system | Cut 24 V during lights-on and lights-off periods, restore after 1 min and after 1 h | Correct state restored without user action | RQ-003-04, RQ-003-07 |
| T9 | Wi-Fi down | Full system | Boot with AP off; then turn AP off during operation for 24 h | Defined fallback at boot; no state change and no reboot during outage | RQ-003-05, RQ-003-06 |
| T10 | Long run | Full system installed | 14 days of normal use | No unintended state, no reboot loops, board and MOSFETs at safe temperature, no moisture on the board | All |
