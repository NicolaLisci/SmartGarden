# Plan 005 — Controller board inside the lamp head (Rev B)

Status: Draft — needs Nicola's go-ahead before desoldering or cutting
Spec: [spec.md](spec.md) (Approved 2026-11-23)
Assembly guide, schematic and connection drawing (interactive, Italian):
[docs/hardware/assembly-guide.html](../../docs/hardware/assembly-guide.html). Its element
coordinates mirror the hole table below; change both together.
Last updated: 2026-11-23

## Approach

Keep NodeMCU and LM2596 soldered on the 2023 perfboard. Remove everything else and cut
the board about 74 mm wide, leaving six hole columns right of the NodeMCU. Add three
330 Ω resistors and one PC817C in that strip. Five thin wires go to the lamp board.

| Output | NodeMCU | On the board | Wire | Lamp board |
|---|---|---|---|---|
| W | D1 / GPIO5 | 330 Ω | yellow | control node of the W-channel transistor |
| B | D5 / GPIO14 | 330 Ω | green | control node of the B-channel transistor |
| P | D7 / GPIO13 | 330 Ω → PC817C LED; PC817C transistor from 5 V | blue | J3 pin C |
| +24 V | — | LM2596 IN+ | red | J3 pin + |
| GND | — | LM2596 IN− | black | J3 pin − |

Why these choices:

- LED lines direct, pump line through the optocoupler. Directly from 3.3 V the pump's
  transistor would see about 2.2 V, below the original 2.6 V; through the PC817C fed
  from 5 V it sees about 3.3 V. The LED transistors see about 3.0 V against the
  original 3.4 V, and direct drive keeps PWM dimming fast and allows forcing a channel
  off. RQ-005-02 verifies it; the fallback is an optocoupler per LED line.
- 330 Ω keeps the GPIO current near 1 mA even when the lamp's MCU drives the opposite level.

Alternatives that lost: external box with a cable to the power module (D-005: cannot
reach two LED channels through the rod); three-channel MOSFET board (spec 004: LEDs
cannot take 24 V directly); powering the NodeMCU from the lamp's 78M05 (too much heat
in a linear regulator).

## Hole table

Columns c0…c5 are the six columns right of the NodeMCU right header (c0 next to the
pins). Rows are named after the header pin on the same row. Component side.

| Hole | Part / pin |
|---|---|
| c0 and c4, row D1 | R_W 330 Ω, lying flat |
| c0 and c4, row D5 | R_B 330 Ω, lying flat |
| c0 and c4, row D7 | R_P 330 Ω, lying flat |
| c4, row RX | PC817C pin 1 (anode, dot) |
| c4, row TX | PC817C pin 2 (cathode) |
| c1, row TX | PC817C pin 3 (emitter) = output P |
| c1, row RX | PC817C pin 4 (collector) |
| c0, rows RX and TX | leave empty (clearance to the RX/TX pins) |

Solder side: pin D1 → c0 row D1; pin D5 → c0 row D5; pin D7 → c0 row D7 (only after the
pump-stage test); c4 row D7 → c4 row RX; c4 row TX → c4 row GND → along the row to the
GND pin; insulated orange wire from Vin to c1 row RX; yellow at c5 row D1 joined to c4;
green at c5 row D5 joined to c4; blue on PC817C pin 3.

## Lamp-board connection points (to confirm, RQ-005-07)

- J3 pins: silk reads C, −, +. Confirm: − has 0 Ω to the regulators' tabs.
- LED taps: the end of each "472" resistor on the transistor side; it reads 10 kΩ to GND.
- W or B: continuity from J1-W's − pin to the single pin of Q4 or Q5.

## Safety and constitution

| Principle | How this plan satisfies it |
|---|---|
| I. Safe by default | Floating GPIOs at boot; existing 10 kΩ pull-downs; D7 bridged to its resistor only after the stage is tested |
| II. Evidence before wiring | Step 17 of the guide measures every tap before soldering |
| IV. Reuse before buying | No purchase |
| V. Human gates | Power only at the ⚡ steps, each with Nicola's go-ahead |
| VI. Test before trust | Bench tests before the board touches the lamp |

## Risks

| Risk | Mitigation |
|---|---|
| Board does not fit (height about 18 mm) | Measure first; split into two pieces between LM2596 and NodeMCU |
| + and C swapped on J3 | Measured and written down before soldering; would damage the PC817C |
| Solder bridge to RX/TX | c0 left empty on those rows; continuity check |
| Wires disturb the touch keys | Route away from the central key area |
| Heat in the lamp head | 30-minute check before closing |
| Weak Wi-Fi under the LED panel's copper | Antenna toward the edge of the head |

## Purchases

None.

## Candidate layout Rev C (proposed by Nicola, 2026-11-23)

Photos: `docs/hardware/photos/board-revc-protoboard-top.jpg`, `-bottom.jpg`.

- CONFIRMED (photo): a new double-sided prototyping board, 20 × 14 plated holes with
  lettered columns A–T, about 70 × 50 mm. The NodeMCU sits on it with its D-side header
  (3V3, GND, TX, RX, D8…D0) one row in from the long edge and its Vin-side header on the
  opposite edge row; one full row of free holes runs beside the D-side header. The
  LM2596 lies along that edge, overlapping the board, with its OUT− and IN− pads over
  board holes. Nothing looks soldered yet.
- Assessment: better base than the trimmed 2023 perfboard. Same circuit (three 330 Ω,
  one PC817C, five wires). Every pin the design uses (D1, D5, D7, GND, 3V3) has a free
  hole next to it.
- Constraints: the top side has only that one free row, so the three resistors and the
  PC817C go on the underside, in the area between the two headers, and are soldered
  before the NodeMCU. OUT+ must reach Vin on the far header with a wire, only after the
  LM2596 is set to 5.0 V. LM2596 on top of the board gives about 18 mm overall; LM2596
  beside the board on short wires gives about 14 mm.
- Status: not yet the plan. If Nicola confirms, the hole table above and the assembly
  guide are redrawn for this board.

### Rev C placement proposed by Nicola (photo `duronic-lamp-head-placement-proposal.jpg`, 2026-11-23)

- CONFIRMED (photo): NodeMCU on the protoboard laid in the large flat compartment to
  the right of the lamp board's transistor end, USB toward the shell's long edge,
  antenna toward the lamp board; LM2596 separate, in the pocket above it. The protoboard
  is about 40 × 60 mm (4 × 6 cm type), not 50 × 70. As laid, its left edge rests on a rib.
  In this photo the NodeMCU is seated the other way round on the protoboard: the two
  free rows are beside the A0/Vin-side header, not the D-side one.
- Assessment: good position. The compartment is about 48 × 65 mm clear of ribs and
  posts (estimate from the photo), so the board fits once moved about 5 mm off the rib.
  It is next to the LED transistors (short yellow/green wires) and far from the touch
  keys; red, black and blue run about 15 cm to J3 along the lower edge of the lamp board.
- With the LM2596 off the board, the two free rows beside the D-side header take all
  parts on the top side (resistors standing, PC817C across the two rows at the USB
  end, next to the GND pin): nothing underneath, NodeMCU can be soldered first, board
  height about 11 mm, LM2596 about 13 mm. Requires the NodeMCU seated with its D-side
  header beside the free rows.
- To measure: height of the screw posts in that compartment, or the closed-lamp
  clearance with a crushed foil ball.

### Rev C as chosen by Nicola (2026-11-23, 21:10): point-to-point wiring, no carrier board

Nicola desoldered all the NodeMCU header pins and chose to solder every connection
directly. Drawing: `docs/hardware/wiring-rev-c.jpg` (source `wiring-rev-c.svg`, generated
by `wiring_rev_c.py`). The hole table above no longer applies; the circuit is unchanged.

| # | Connection | Wire |
|---|---|---|
| 1 | J3 + → LM2596 IN+ | red |
| 2 | J3 − → LM2596 IN− | black |
| 3 | LM2596 OUT+ → NodeMCU Vin, only after the output is set to 5.0 V | orange |
| 4 | LM2596 OUT− → NodeMCU GND (next to Vin) | black |
| 5 | NodeMCU D1 → 330 Ω → W transistor's control node | yellow |
| 6 | NodeMCU D5 → 330 Ω → B transistor's control node | green |
| 7 | NodeMCU D7 → 330 Ω → PC817C pin 1 | — |
| 8 | PC817C pin 2 → NodeMCU GND (next to 3V3, D side) | black |
| 9 | PC817C pin 4 → 5 V (Vin hole, with wire 3) | orange |
| 10 | PC817C pin 3 → J3 C | blue |

Each resistor has one lead in the NodeMCU hole and the other soldered to its wire;
every joint is insulated with heat-shrink or tape. The interactive guide still shows
Rev B and must be redrawn for this variant. Still open: clearance in the lamp head for
the LM2596 (about 13 mm), the five tap measurements (RQ-005-07), NodeMCU check after
desoldering (pads, USB power-up).
