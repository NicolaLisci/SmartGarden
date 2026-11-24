# Architecture

Last updated: 2026-11-22

## System context

```
230 V AC ──► original adapter (24 V DC, 25 W) ──► 24 V rail
                                                  ├─► DC-DC 5 V ─► ESP8266 (NodeMCU)
                                                  ├─► LED panel   ◄─ low-side MOSFET (H1) or original board (H2)
                                                  └─► pump        ◄─ low-side MOSFET (H1) or original board (H2)
ESP8266 ◄─► Wi-Fi LAN ◄─► browser / Home Assistant (optional)
```

## Hardware options (decision D-003)

| | H1 — Replace the Duronic board | H2 — Keep the Duronic board, emulate buttons |
|---|---|---|
| Idea | Schmidt's approach: the 2023 board drives LEDs and pump directly through MOSFETs | The ESP "presses" a mode button on the original board (open-drain on the touch IC output) after boot |
| Reuses 2023 board | Fully, after fixing the gate drive: the fitted IRFZ44N are not logic-level (see HARDWARE_AUDIT) | Partly (ESP + DC-DC; MOSFETs unused or used as switches) |
| LED current limiting | Must be CONFIRMED on the panel, otherwise risk of destroying the LEDs | Kept by the original board |
| Water-level alarm, dimming, beep | Lost unless re-implemented | Kept |
| Control granularity | Full: any schedule, any intensity | Limited to the original modes; schedule start = press time |
| Risk | Higher (load side) | Lower; depends on touch IC accessibility |
| Effort | Higher | Lower |

Decision depends on spec 002 (RQ-002-08). Nicola's stated direction (2026-11-22) is to
restart from the 2023 board, which favours H1.

## Integration concept (proposed 2026-11-23, decision D-005)

Built on what the photos of 2026-11-23 show (see spec 002) and on parts on hand only.

**Idea: the controller box is the brain; the original power module stays in place and
becomes the docking connector.** The module already mates mechanically with the base
(DC3 ↔ lamp rod, DC2 ↔ pump plug) and takes the adapter on DC1. Wires are soldered to
the pads of its three sockets and run to the box in one multi-wire cable (an Ethernet
cable works: 8 conductors, doubled for +24 V and GND). No new connectors, no cut cables
in the Duronic.

```
adapter ─► DC1 ─┬─► module's own circuit (regulator U1, Hall sensor U2, D1) stays powered
                └─► +24 V / GND ─► box: LM2596 ─► NodeMCU, MOSFET channels
box CH3 OUT ─► DC2 switched contact (in parallel with the module's own pump switch)
box CH1/CH2 or a signal ─► DC3 contacts ─► lamp rod ─► lamp head
module U2 output ─► box D6 (water level, later)
```

Why this is the preferred option:

| Point | Reason |
|---|---|
| Pump | The module keeps feeding the pump from its own rail, so the pump gets its original voltage whatever it is. Box CH3 only closes the switched side. D1 next to DC2 is probably the pump's flyback diode, which would cover the missing 1N4007. HYPOTHESIS until the continuity checks below |
| Pump voltage | Measured 2026-11-23: DC2's centre pin is on the 24 V rail, not on U1's output, so the pump is fed from 24 V. Open: how its other contact is switched (a low-side PWM could still lower the average voltage), so keep the module's own supply path until that is known |
| Lamp | The lamp head holds touch buttons, MCU and LED drive, and gets three conductors only. Once the box drives the pump itself, the third conductor is free for the box to use |
| Reuse | 2023 board Rev A unchanged (three channels, screw terminals); module, adapter, pump, lamp untouched mechanically |

Pump control, after the measurements of 2026-11-23 (spec 002): the module already has
the whole pump stage (Q2 low-side switch with R7 4.7 kΩ + R3 10 kΩ on its control pin,
commanded by DC3 contact C/F). Two ways to drive it from the box:

| Option | Wiring | Notes |
|---|---|---|
| P1 — command the module's own Q2 (preferred) | NodeMCU D5 → series resistor 1 kΩ → Q2 control pin (point 9); common GND | One signal wire, no pump current in the cable, original switch and diode kept. R3 holds Q2 off while the GPIO floats at boot (principle I). The lamp's own command stays connected through R7, so the pump runs when the lamp **or** the box asks. Box channel 3 stays free. Q2 is marked "R0", type not identified; 1 kΩ suits both cases (NPN: about 2.6 mA base current; logic-level MOSFET: about 2.5 V on the gate with the lamp line low). Acceptance check at first power-up: less than 0.3 V between joints H/I and GND with the pump running |
| P2 — box channel 3 in parallel | CH3 OUT → DC2 joints H/I; common GND | Independent of Q2; carries the pump current in the cable; needs D1 confirmed as flyback diode or the diode added on the board |

The lamp needs one decision, possible only after opening the lamp head:

| Variant | When | What goes on the three TRS contacts | Work inside the lamp |
|---|---|---|---|
| A — direct LED drive | LED array has its own series resistors for 24 V | +24 V, LED 1 −, LED 2 − (box CH1, CH2) | Move the LED wires from the lamp board to the TRS wires; lamp board left unused |
| B — keep the LED driver | Lamp board has a constant-current driver with an enable/dim input | +24 V, GND, dim signal from the box | One wire to the driver's dim pin; MCU's own drive cut |
| C — emulate a button | Lamp MCU must stay in charge | +24 V, GND, "press" signal from the box | One PC817C across the touch IC's output |

Update 2026-11-23, after opening the lamp head (spec 002): no resistor is visible on
the LED panel, so **variant A is ruled out** unless the LED supply and current limiting
are found to sit entirely outside the control board. The lamp's control board already
holds one switching transistor per LED channel (W and B), driven by its microcontroller:
the natural way in is to command those transistors, as for the pump (wired-OR through a
resistor), which is variant B applied per channel.

Consequence for where the ESP8266 lives (decision D-006, proposed): the rod carries
three conductors only (+24 V, GND, pump command). An external box cannot reach two LED
channels through it. Putting the NodeMCU and the LM2596 **inside the lamp head** reaches
everything on one board: +24 V and GND at J3, both LED channel transistors, the pump
command line (J3, white wire). No cable to the base, nothing soldered on the power
module, original keys still usable. The three-channel MOSFET stage of board Rev A is
then not needed: spec 004 is on hold until D-006 is decided.

Close-ups of 2026-11-23 support D-006: the lamp board runs its logic at 5 V (78M05)
and switches both LED channels with "R0" transistors through the same 4.7 kΩ + 10 kΩ
network measured on the pump stage. Proposed hook-up, three signal wires plus power:

| NodeMCU pin | Through | To | Effect |
|---|---|---|---|
| D1 (GPIO5) | 330 Ω | control pin of the W-channel transistor | White LEDs |
| D2 (GPIO4) | 330 Ω | control pin of the B-channel transistor | B LEDs |
| D5 (GPIO14) | 330 Ω | J3 pin C (pump command line, after D2/R3) | Pump |
| Vin / GND | LM2596 set to 5.0 V | J3 pins + and − (24 V) | Power |

Notes: with 330 Ω the transistor sees about 3 V, close to the original 3.4 V (LEDs)
and above the original 2.6 V (pump). A GPIO left as input lets the lamp's own MCU and
keys stay in charge; driven high it forces the load on, driven low it forces it off.
All three pins float at boot, so nothing switches on by itself. Fallback if 3.3 V
proves too little: a PC817C per line switching the lamp board's 5 V. Which of Q4/Q5 is
W and which is B: one continuity check.

Still to confirm before D-006: how the LED current is limited (LED strings matched to
24 V is the working hypothesis); inner height and free area of the lamp
head (NodeMCU about 58 × 31 × 13 mm, LM2596 module about 43 × 21 × 14 mm); temperature
inside the head with the LEDs on.

Earlier assessment, kept for history: Variant A is preferred if the array allows it: full control of schedule and intensity,
nothing left of the original logic. B if the LEDs need the driver (the 1/4 W resistor kit
cannot replace it). C is the fallback.

Checks that confirm or kill this concept, all on the module out of the base, de-energised:

1. Done 2026-11-23: photos of both sides, continuity and resistance table (spec 002).
2. Still open: Q2's marking, DC3 pad B, D1's role, the voltage on contact C/F when the
   lamp runs the pump.

## Firmware options (decision D-002)

| Criterion | A — Evolve the Arduino sketch | B — ESPHome |
|---|---|---|
| Code to maintain | All of it (web server, scheduler, persistence, OTA, MQTT) | YAML configuration; components maintained upstream |
| Local schedule without HA | Custom code | `time:` + `on_time` automations, run on device |
| Local web UI | Custom; legacy one depends on a CDN | Built-in `web_server` |
| Home Assistant | MQTT discovery to write | Native API |
| OTA | Add ArduinoOTA | Built-in, password-protected |
| Power-cut restore | Custom (EEPROM/LittleFS) | `restore_mode`, `globals` with `restore_value` |
| Wi-Fi provisioning | Custom | Fallback AP + captive portal |
| Pitfall | — | `api:` and `wifi:` reboot after 15 min without a client by default; set `reboot_timeout: 0s` for constitution III |
| No-time fallback (RQ-003-05) | Custom | Lambda or script using `uptime`; small custom piece |

Proposed: **B — ESPHome** (Nicola's initial preference; matches constitution VII).
Status: Proposed, to confirm before spec 003 is approved. ESP8266 support in the
current ESPHome release must be checked at that time.

Migration strategy: legacy sketch stays in `legacy/`; ESPHome config goes in
`firmware/`; first flash over USB, then OTA. The legacy sketch can be reflashed at any
time from `legacy/schmidt-arduino/`.

## Legacy firmware review

File: `legacy/schmidt-arduino/src/sketch/controller/controller.ino`. Review of
2026-11-22. Line numbers refer to that file.

| # | Finding | Lines | Severity |
|---|---|---|---|
| 1 | `hour <= stopHour` adds one hour to every cycle: Normal 15 h, Enjoy 13 h, Grow 17 h | 235 | Bug |
| 2 | `connectWifi()` loops forever in `setup()`: without Wi-Fi no schedule ever runs; without NTP the clock starts at 1970 and timer mode keeps lights off | 128–131 | Bug (violates III) |
| 3 | Pump on GPIO0 (D3), a boot strap pin with pull-up: pulse at boot, possible boot into flash mode | 22 | Safety |
| 4 | GPIOs are floating inputs until `setup()`; safe only with hardware pull-downs | 57–63 | Safety |
| 5 | `analogWrite(128)`: 50 % on core ≥ 3.0 (range 255), 12.5 % on core 2.x (range 1023) | 278 | Portability |
| 6 | `htmlButton` compares C strings with `==` (pointer comparison) | 328–345 | Bug (works by chance) |
| 7 | `log(char[])` and `htmlButton(char[])` take string literals as `char*` | 163, 325 | Compiler warnings/errors on recent toolchains |
| 8 | No persistence: after a power cut, always Normal + Auto + pump Auto | 40–42 | Gap |
| 9 | HTTP without auth, state changes via GET (CSRF from any LAN web page), unbounded `readStringUntil`, request dropped if it arrives after 50 ms | 82–120 | Security |
| 10 | Stylesheet URL `…/SmartGarden//css/styles.css` does not exist: UI renders unstyled; UI depends on a CDN | 395 | Bug |
| 11 | Wi-Fi credentials hard-coded in the sketch | 13–14 | Security |
| 12 | Pump AUTO = 30 min on / 30 min off around the clock; original GHS37 pattern unknown | 191 | To verify |

Reusable: pin naming and the scene/mode concepts. Nothing else is worth porting.

## Decision log

| ID | Decision | Status | Date |
|---|---|---|---|
| D-001 | Spec-driven development with GitHub Spec Kit layout (`specs/`, `.specify/`), no CLI dependency | Accepted | 2026-11-22 |
| D-002 | Firmware stack: ESPHome | Proposed | 2026-11-22 |
| D-003 | Hardware approach: H1 replace vs H2 emulate buttons | Open (direction: H1); narrowed by D-005 to lamp variants A/B/C | 2026-11-23 |
| D-006 | Put NodeMCU + LM2596 inside the lamp head and command the lamp board's own LED and pump stages; external box, cable and MOSFET board dropped. Outputs: W = D1/GPIO5 and B = D5/GPIO14 through 330 Ω, pump = D7/GPIO13 through a PC817C fed from 5 V (spec 005) | Accepted by Nicola; supersedes D-005 | 2026-11-23 |
| D-005 | Superseded by D-006. Integration concept: external controller box; original power module kept as docking connector; pump switched in parallel on DC2; lamp through the three TRS contacts | Proposed | 2026-11-23 |
| D-004 | Schmidt's code moved to `legacy/schmidt-arduino/`, read-only | Accepted | 2026-11-22 |
