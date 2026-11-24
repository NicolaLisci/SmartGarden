# Spec 002 — Duronic GHS37 reverse engineering

Status: Draft
Owner: Nicola
Depends on: none (can run in parallel with 001)
Last updated: 2026-11-22

## Why

Schmidt's design targets the IDOO grow box. The GHS37 is not known to be electrically
identical. We do not know how its LED panel is driven, what the pump draws, or how the
water-level alarm works. These facts decide whether the 2023 board can drive the loads
directly (option H1) or should only emulate button presses on the original board
(option H2); see `docs/ARCHITECTURE.md`.

## Scope

In: opening the base and lamp head, photographing and mapping boards, connectors and
loads, characterising LED panel, pump, water-level sensor and touch panel.
Out: any modification of the Duronic hardware; connecting the 2023 board.

## Requirements

| ID | Requirement | Acceptance criterion |
|---|---|---|
| RQ-002-01 | Every PCB in the GHS37 shall be photographed on both sides. | Photos in `docs/hardware/photos/duronic-*.jpg`, IC markings legible. |
| RQ-002-02 | Every cable and connector shall be mapped. | Table in `docs/WIRING.md` (Duronic section): connector, wire count and colours, both ends, function. |
| RQ-002-03 | The LED panel topology shall be known. | Number of channels, strings, location of current limiting (panel resistors, driver IC on main board, or none), and how the board dims it in 12/12 vs 16/8. CONFIRMED. |
| RQ-002-04 | The LED panel's operating point shall be known in each mode. | Voltage across and current through the panel in 12/12, 14/10 and 16/8, or the driver's datasheet values. |
| RQ-002-05 | The pump shall be characterised. | Rated or measured voltage and current, motor type (brushed DC or brushless with internal driver), and the original on/off pattern if observable. |
| RQ-002-06 | The water-level sensor shall be characterised. | Sensor type (float/reed, electrodes, other), wire count, signal levels, and where it connects. |
| RQ-002-07 | The touch panel interface shall be characterised. | Touch IC part number and the signal between it and the main MCU, enough to decide whether a GPIO can emulate a press. |
| RQ-002-09 | The connectors of the LED panel, pump and power input shall be identified, so a mating harness to the controller box can be made without cutting the Duronic's cables. | For each: photo with a ruler, pin count, pitch (e.g. 2.0 / 2.5 mm), family if recognisable (JST PH/XH, Molex, barrel jack size), polarity. |
| RQ-002-10 | The power module's connections shall be mapped. | Continuity table of every DC1, DC2 and DC3 contact against +24 V, GND, U1 output, Q1, Q2, U2; markings of U1, U2, Q1, Q2, D1; function of the third TRS contact. All de-energised. |
| RQ-002-08 | A compatibility verdict shall be issued. | ARCHITECTURE records, per load, whether H1 is safe with the 2023 board and whether H2 is feasible, with the evidence. |

## Known facts

From the GHS37 manual (cdn.shopify.com … GHS37_Final_manual_update.pdf), CONFIRMED:

- Adapter input 100–240 V AC, output 24 V DC; rated power 25 W.
- At power-up the unit beeps and stays in standby until a mode button is pressed.
- Modes: 14/10 "normal", 12/12 "short" with reduced light intensity, 16/8 "long" with
  increased intensity; holding power 3 s gives 24 h light then back to standby.
- The cycle start time is the time the mode button was pressed.
- A long beep signals low water level, so a water-level sensor exists.
- The "power system" sits at the bottom of the water tank.

From Nicola's photos of 2026-11-23 (`docs/hardware/photos/duronic-*.jpg`):

- CONFIRMED (photo): the base label reads "Model GHS37, 220–240 V~ 50/60 Hz, Power 24 W"
  (the manual says 25 W).
- CONFIRMED (photo): the "power system" is a plug-in module that slides into a recess
  under the base. Its PCB is marked "I-0056 ICS-10 POWER", "20200807 VER:0.1".
- CONFIRMED (photo) on that PCB: three sockets, DC1, DC2 and DC3 (3.5 mm jack). CONFIRMED
  (Nicola, and photos: DC1 lies flat with its opening through the module's side wall):
  DC1 is the 24 V adapter input. CONFIRMED (photos): DC2 (centre pin) and DC3 open
  toward the base; DC3 takes the lamp rod's TRS plug, DC2 takes a thin hollow barrel
  plug fixed in the base: the pump (CONFIRMED by Nicola). Other parts: D1, U1 (3-lead DPAK regulator), Q1 and Q2 (SOT-23),
  C1 22 µF 35 V, C2 22 µF 25 V, a buzzer, U2 (3-lead TO-92) at the edge facing the tank.
- From the close-up `duronic-power-module-pcb-top.jpg` (2026-11-23), CONFIRMED (photo):
  no microcontroller on the component side; U1 is a 78M0x DPAK linear regulator (last
  digit not fully legible, most likely 78M05 = 5 V); R4 = 100 Ω ("101") next to buzzer
  ZD1; R7 = 4.7 kΩ ("472"); a trace runs from DC2 to Q2's single pin, and Q2's other two
  pins go through R3/R7 toward DC3; D1 sits directly beside DC2; Q1 with R4/R5 sits
  between buzzer and U2.
- HYPOTHESIS from that layout: Q2 switches the pump on DC2 and is commanded from a DC3
  contact (so from the lamp head); D1 is the pump's flyback diode; U2 (Hall) drives Q1
  and the buzzer locally. Test points for the continuity checks are numbered on
  `duronic-power-module-test-points.jpg`.
- From `duronic-power-module-pcb-bottom.jpg` (2026-11-23), CONFIRMED (photo): no
  components on the solder side, mostly copper pour; DC3 has six solder joints (three
  small at the board edge, three large); one wide track joins DC3's middle large pad to
  a pad near C1 and to a via near DC2/D1. HYPOTHESIS: that pad is a power line. Pads are
  lettered A–F on `duronic-power-module-test-points-bottom.jpg`.
- Continuity measured by Nicola on the module, de-energised (2026-11-23), CONFIRMED:
  DC1 centre pin ↔ U1 input (the 24 V rail goes straight into the regulator);
  DC2 centre pin ↔ U1 input (the pump's centre contact sits on the 24 V rail);
  DC2 centre pin ↔ U1 output: open; one DC3 pad ↔ U1 tab (GND); the central DC3 pad ↔
  U1 input (24 V); no DC3 pad ↔ U1 output (no 5 V goes to the lamp).
- Second round, same conditions (letters on `duronic-power-module-test-points-bottom.jpg`),
  CONFIRMED: no DC2 solder joint (G, H, I) is on GND; DC3 pads A and D are GND; DC3 pad
  E is +24 V; DC3 pads B, C, F are neither GND, +24 V nor Q2's single pin.
- Second round, to interpret with care: Q2's single pin beeps with all three DC2 joints,
  including the one that is the +24 V centre pin. A continuity tester also beeps through
  a Schottky diode, so this fits D1 sitting across DC2 as flyback diode, with Q2's single
  pin on the pump's switched contact (low-side switch). HYPOTHESIS until a diode-mode or
  ohm reading separates the three joints.
- Third round, resistance readings (Nicola, 2026-11-23), CONFIRMED:
  U1 input ↔ G = 0.03 Ω, H and I open → G is DC2's centre pin (+24 V), H and I are the
  pump's switched contact; GND ↔ Q2 lower-right pin (point 10) = 0 Ω; Q2 lower-left pin
  (point 9) ↔ DC3 pad C = 4.80 kΩ and ↔ pad F = 4.68 kΩ; GND ↔ pad F = 14.62 kΩ.
- What those readings mean, CONFIRMED by the values: DC3 pads C and F are one contact,
  the lamp's pump command. It reaches Q2's control pin through R7 (4.7 kΩ), with R3
  (10 kΩ) from that pin to GND (4.7 k + 10 k = 14.7 k, measured 14.62 k). Q2 is a
  low-side switch: control pin 9, pin 10 on GND, single pin 6 on the pump's negative
  contact (H, I). The pump runs when the lamp drives contact C/F high.
- Q2's marking reads "R0" (Nicola, 2026-11-23). SOT-23 marking codes are not unique, so
  the part is not identified from it.
- Still UNKNOWN: DC3 pad B; whether Q2 is an NPN or an N-MOSFET (the 4.7 k / 10 k
  network is the usual NPN arrangement); the voltage the lamp puts on C/F;
  D1's exact role (flyback across DC2 is the working hypothesis).
- Superseded list, kept for history. Still open after the first round: DC2's side contact showed no continuity to Q2's
  single pin nor to GND, so the pump's switched side is not identified yet (to repeat on
  DC2's solder joints G, H, I); which lettered DC3 pads are GND and 24 V; where the
  remaining DC3 pads go.
- Lamp head opened 2026-11-23 (`duronic-lamp-board-top.jpg`, `duronic-lamp-head-open.jpg`,
  `duronic-led-panel.jpg`), CONFIRMED (photo):
  - Control board in the lamp head, marked "Y2020". J3 = 3-pin connector from the rod
    (red, white, black wires). Two DPAK parts U4 and U5, C17 22 µF 35 V, C13 and C15
    22 µF 25 V, D1, D2 with R3 = 2 kΩ ("202") next to J3.
  - U6 = 16-pin SOIC with a cylindrical crystal Y1 beside it; one more 8-pin SOIC; three
    R/C pairs (R5/C10, R11/C9, R6/C11) on three short traces into the bare central area,
    where the three touch keys are.
  - Two 2-pin LED outputs, J1-W and J2-B, each marked + and −; SOT-23 transistors Q4 and
    Q5 with resistors R10, R14, R15 between those connectors and U6; Q3 with R8/R9 next
    to a second buzzer (ZD2).
  - LED panel marked "I-0032 IGS-10 VER:1.1 181019", fed by two 2-pin connectors marked
    B+ and W−: two LED channels, seven clusters of about nine LEDs. No resistor is
    visible on the LED panel.
- Close-ups of the lamp board (`duronic-lamp-board-closeup-supply.jpg`,
  `-closeup-outputs.jpg`, 2026-11-23), CONFIRMED (photo):
  - U4 = 78M12 (12 V regulator), U5 = 78M05 (5 V regulator).
  - J3 pins are marked C, −, +: control (pump command), GND, +24 V.
  - D2 (marked "A7") and R3 = 2 kΩ sit on the path to J3 pin C; D1 is also marked "A7".
  - R2 and R4 are 0 Ω links ("000") on the wide tracks that feed the LED connectors'
    + pins; R1 is not fitted.
  - Q4 and Q5 are marked "R0", the same marking as Q2 on the power module, each with a
    4.7 kΩ ("472") and a 10 kΩ ("103") resistor: the same control network as the pump's.
  - Q3 (buzzer) carries a different three-character marking; R8 = 100 Ω, R9 = 22 Ω.
  - Touch inputs: R5, R11 (2 kΩ) with C10, C9, C11 into the 8-pin IC.
- Reasoned from those parts, HYPOTHESIS: the LED + pins sit on +24 V through the 0 Ω
  links, and Q4/Q5 switch the − pins (PWM for the intensity levels). With no resistors
  on the panel the LED strings are matched to 24 V, so they must never see more than
  the adapter's 24 V. "R0" is an N-channel logic-level MOSFET: a bipolar transistor
  could not switch a LED channel through 4.7 kΩ. The lamp's MCU works at 5 V; the pump
  command reaches Q2's gate at about 2.6 V (5 V − diode, divided by 2 k + 4.7 k / 10 k).
- HYPOTHESIS from that layout: U6 is the microcontroller (keys, 24 h cycle, pump command);
  Q4 and Q5 switch the two LED channels on their negative side; Q3 drives the lamp's
  buzzer; LED current is set on the control board (U4 and/or the resistors R1, R2, R4),
  not on the LED panel.
- UNKNOWN: markings of U4, U5, U6, the 8-pin IC, Q3–Q5; the LED supply voltage and how the
  current is limited; the levels on the transistors' control pins; inner height of the
  lamp head.
- CONFIRMED (photo): the base exposes, in the module slot, a 3-pole 3.5 mm TRS plug
  (tip, ring, sleeve) and a single metal pin, plus plastic locating posts.
- HYPOTHESIS: the module is power input + low-water alarm only. U2 is a Hall sensor that
  sees a magnet in a float inside the tank; the buzzer gives the beeps. Everything
  reaches the rest of the unit through the TRS plug (3 conductors: likely +24 V, GND
  and one signal) and possibly the single pin.
- CONFIRMED (Nicola + photos `duronic-overview-lamp.jpg`, `duronic-rod-trs-plug.jpg`):
  the touch buttons are on top of the lamp head (three mode icons), the LED array is on
  its underside, and the lamp head sits on a telescopic aluminium rod whose foot ends in
  the 3-pole 3.5 mm TRS plug. The rod slides into a channel at the back of the base and
  the plug goes into the power module's DC3 socket.
- So the whole lamp head (LEDs, touch buttons and, HYPOTHESIS, the main MCU and LED
  driver) is fed through three conductors only: tip, ring, sleeve.
- HYPOTHESIS: two contacts are +24 V and GND; the third carries a signal between lamp and
  power module (pump command, buzzer or water-level).
- UNKNOWN: what the caliper photo measures (100.0 mm); the function of each TRS contact
  and of the single pin; where the pump is and how it is powered; how the LED array is
  driven inside the lamp head.

Observed by Nicola (handoff): the 14/10 button is less sensitive; the first press after
power-up may need several attempts.

## Open questions

- [NEEDS CLARIFICATION: is opening the GHS37 acceptable, and can it be put back together if H2 is chosen?]

## Constitution check

II: this spec produces the evidence. Safety: de-energised inspection first; live
measurements (RQ-002-04) only on the 24 V side, with Nicola's go-ahead and the
procedure written in the plan.
