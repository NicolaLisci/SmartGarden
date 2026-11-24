# Hardware audit — 2023 board

Last updated: 2026-11-23. Sources: photos `hardware/photos/board-2023-top.jpg`,
`board-2023-bottom.jpg` and `board-2023-mosfets.jpg`; Nicola's purchase listings (NodeMCU V3 CH340, IRFZ44N,
LM2596 adjustable module, resistors). Labels: CONFIRMED / HYPOTHESIS / UNKNOWN (see AGENTS.md).
Spec 001 turns this page into a confirmed audit.

## Bill of materials

| # | Component | What we see | Identification | Label |
|---|---|---|---|---|
| 1 | ESP8266 devkit | ESP-12 module "ESP8266MOD", 16-pin SOIC USB chip, micro-USB, RST/FLASH buttons, pin labelled "VV" | NodeMCU V3 with CH340 | CONFIRMED by purchase listing (Nicola, 2026-11-22) and photo |
| 2 | DC-DC buck module | Blue module, trimmer "103", inductor "470" (47 µH), 100 µF 50 V input cap, 220 µF 35 V output cap, 5-pin TO-263 regulator | LM2596 adjustable module, 1.5–35 V output | CONFIRMED by purchase listing (Nicola, 2026-11-22); output setting UNKNOWN |
| 3–5 | 3 × TO-220, 3 leads | Marking "IRFZ44N", IR logo, "H238D B9P0" on all three; marked face toward the screw terminals | **IRFZ44N** standard-level N-MOSFET, 55 V 49 A. Not the logic-level IRLZ44N of Schmidt's design. Pinout facing the marking, left to right: gate, drain, source (datasheet) | CONFIRMED (photo `board-2023-mosfets.jpg`, purchase listing). Authenticity UNKNOWN: identical lot codes on a marketplace batch are compatible with both genuine and counterfeit parts |
| 6–11 | 6 × resistors, blue body | Two standing next to each TO-220 | 100 Ω gate + 1 kΩ per channel (Schmidt's BOM) | HYPOTHESIS; values UNKNOWN |
| 12–14 | 3 × 2-pole screw terminals | Grey, one per channel | Load outputs | HYPOTHESIS (function) |
| 15 | DC barrel jack, panel mount | Red/black pair to the board, plus one loose red wire with a stripped, unconnected end | 24 V input from the original adapter | HYPOTHESIS; loose wire UNKNOWN |
| 16 | Perfboard | Single-sided, isolated pads, point-to-point wires on the bottom (red, black, yellow, blue, purple) | — | CONFIRMED (photo) |

## Not present (not visible in photos)

| Missing | Why it matters | Label |
|---|---|---|
| Flyback diode across the pump output | The pump is inductive; turn-off spikes stress the MOSFET | CONFIRMED absent from Schmidt's BOM; on this board UNKNOWN (not visible) |
| Fuse or polyfuse on 24 V input | Limits damage from a short near water | Not visible |
| Bulk capacitor on 24 V rail | Pump inrush and PWM ripple | Only the DC-DC's own input cap visible |
| Connector to the Duronic harness | Schmidt used an RJ45 + adapter board | Not present; screw terminals only |
| Moisture protection | Board will sit near water | Not present; enclosure on hand (see below) |

## Parts on hand

| Part | Detail | Label | Open point |
|---|---|---|---|
| Plastic project box | 100 × 80 × 29 mm, intended to house the whole controller ([listing](https://www.aliexpress.com/item/1005001849672423.html); the page needs JavaScript and could not be read automatically) | CONFIRMED on hand (Nicola, 2026-11-22). External vs internal size, material, mounting posts and sealing UNKNOWN | Measure internal dimensions; fit check: RQ-001-07 |

Fit estimate (HYPOTHESIS): from the photo the perfboard looks like a standard
70 × 90 mm board and the tallest parts (NodeMCU on headers, DC-DC capacitors, screw
terminals) about 18–20 mm above the board, plus wiring underneath. If the box's inner
height is about 25 mm it fits with little margin; to be measured. Openings needed: DC
input, load cables (cable glands or strain relief), optional USB access for the first flash.

## Differences from Schmidt's reference

- **IRFZ44N instead of IRLZ44N**: standard-level instead of logic-level MOSFETs.
  CONFIRMED (purchase listing). This is the main deviation; see Known risks.
- NodeMCU instead of Wemos D1 mini (same D-pin naming; NodeMCU has a 10 kΩ pull-up on
  GPIO0/D3 and is larger). CONFIRMED (photo vs Schmidt's photo).
- No RJ45 link: loads would connect to screw terminals directly. CONFIRMED (photo).
- Barrel jack input on a flying lead. CONFIRMED (photo).

## Known risks to check

| Risk | Detail | Label |
|---|---|---|
| Pump on GPIO0 (D3) | Legacy firmware uses D3. GPIO0 is a boot strap pin with a pull-up: the pump can pulse at boot, and a 1 kΩ pull-down on it would make the ESP boot into flash mode | HYPOTHESIS until netlist known |
| **Gate drive at 3.3 V — blocking** | The fitted MOSFETs are IRFZ44N: datasheet V_GS(th) 2.0–4.0 V, R_DS(on) specified only at V_GS = 10 V. A 3.3 V GPIO is below the maximum threshold: a given part may not turn on at all, or only partly and overheat. It may seem to work on the bench and still have no margin across parts and temperature. Generic listings also carry a counterfeit risk | CONFIRMED from datasheet limits; the actual behaviour of these parts is UNKNOWN. Not acceptable without a fix (see Required modifications) |
| DC-DC output voltage | Trimmer setting unknown; >6 V on NodeMCU Vin could damage it | Measure with nothing connected before the first power-up (TEST_PLAN T1) |
| Common ground | ESP, DC-DC and MOSFET sources must share GND | UNKNOWN |

## Required modifications (proposed, not approved)

To be confirmed by spec 001. Nothing is to be executed before Nicola approves it.

| Change | Reason | Parts |
|---|---|---|
| Fix the gate drive, one of: (a) **replace the three IRFZ44N with logic-level MOSFETs** in TO-220 with the same G-D-S pinout (for example IRLZ44N, IRLB8721, IRL540N): drop-in, no wiring change, non-inverting, keeps outputs OFF at boot; (b) keep the IRFZ44N and add a **non-inverting** driver stage per channel that brings the gate to about 10–12 V, below the 20 V V_GS limit. Candidates: an optocoupler (e.g. PC817) whose transistor connects the gate to 24 V through a resistor divider (e.g. 10 k + 10 k → ~12 V), with the lower resistor doubling as gate pull-down; or an NPN + PNP pair. A single NPN is inverting: GPIO low or floating at boot would turn the load ON, violating principle I | IRFZ44N cannot be driven reliably from 3.3 V. Nicola has IRFZ44N on hand and prefers to use them (2026-11-22) | (a) 3 MOSFETs, a few euros, needs Nicola's approval (principle IV); (b) 3 optocouplers or 3 NPN + 3 PNP, plus resistors: depends on what is on hand. Optocoupler switching is slow: on/off is fine, PWM dimming needs a low frequency (~100–200 Hz) and a heat check |
| **Chosen direction (2026-11-23): option (b) with PC817C**, see "Proposed gate driver" below | Nicola has 20 × PC817C on hand | 3 × PC817C, 3 × 470–680 Ω, 6 × 10 kΩ |
| Move pump drive off GPIO0 to GPIO14 (D5), GPIO12 (D6) or GPIO13 (D7) | Boot safety (constitution I) | Wire only |
| Gate pull-down 10–100 kΩ gate–source on every channel, if absent | Outputs OFF while GPIOs float at boot | Resistors, likely on hand |
| Flyback diode across the pump terminal | Inductive load protection | 1N4007 / 1N5819 / similar, likely on hand |
| Fuse on 24 V input | Fault protection near water | Optional; check the adapter's own protection first |

## Proposed gate driver (not final)

Status: superseded by `specs/004-board-rework/plan.md` (Rev A, 2026-11-23), which
keeps this circuit but drops the 100 Ω gate resistor. Build from the plan, not from here.

One identical stage per channel (LED 1, LED 2, pump):

```
 3V3 GPIO ──[R_LED 470–680 Ω]──► PC817C pin 1 (anode)
 GND ───────────────────────────  PC817C pin 2 (cathode)

 +24 V ──[R1 10 kΩ]──── PC817C pin 4 (collector)
                        PC817C pin 3 (emitter) ──┬──[100 Ω, existing]── IRFZ44N gate
                                                 │
                                            [R2 10 kΩ]
                                                 │
 GND ────────────────────────────────────────────┴───────────────────── IRFZ44N source

 Load + ── +24 V          Load − ── IRFZ44N drain     (pump: flyback diode across the load,
                                                        cathode to +24 V)
```

How it works and why these values:

| Point | Value | Basis |
|---|---|---|
| LED current | (3.3 − 1.2 V) / 470 Ω ≈ 4.5 mA; ≈ 3 mA with 680 Ω | PC817 V_F typ 1.2 V (datasheet); ESP8266 GPIO stays well under its ~12 mA limit |
| Output current available | ≥ 2 × I_F ≈ 6–9 mA | PC817**C** CTR 200–400 % at I_F = 5 mA (datasheet) |
| Output current needed | 24 V / 20 kΩ ≈ 1.2 mA | R1 + R2; the opto saturates with a large margin |
| Gate voltage ON | ≈ 24 V × R2 / (R1 + R2) ≈ 12 V | Fully on per IRFZ44N datasheet (R_DS(on) spec at 10 V); below the ±20 V V_GS limit even with spikes on the 24 V rail |
| Gate voltage OFF | 0 V through R2 | R2 is also the gate pull-down |
| Opto off-state voltage | ≈ 24 V across collector–emitter | PC817 V_CEO 35 V (datasheet); check the adapter's no-load voltage stays below ~30 V |
| Logic | Non-inverting: GPIO high = load on | GPIO low or floating at boot = LED off = gate at 0 V = load off (principle I) |
| Switching time | Tens of µs (gate charge ≤ 63 nC through ~10 kΩ) | Fine for on/off. PWM only at ~100–200 Hz; at 1 kHz the MOSFET would spend too long in its linear region and heat up |
| MOSFET dissipation when on | ≈ I² × 17.5 mΩ ≈ 20 mW at 1 A | Negligible; no heatsink expected (verify in T4) |

Reuse: if one of the two existing resistors per channel is 1 kΩ, it can serve as R_LED
(≈ 2 mA LED current, still ≥ 3 × the needed output current). The 100 Ω one can stay as
gate resistor. Values to be measured under spec 001.

Still needed: a flyback diode for the pump. No 1N4007 on hand (Nicola, 2026-11-23).
Requirements: ≥ 1 A, ≥ 50 V; 1N400x, 1N5817–1N5819 or SS14 all fit. The IRFZ44N is
avalanche-rated (datasheet), so it would likely survive the pump's turn-off spikes, but
the spikes can also disturb or reset the ESP8266: a diode stays required (spec 004,
RQ-004-04).
