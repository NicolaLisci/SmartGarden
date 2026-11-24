# Wiring

Last updated: 2026-11-22

**No connection on this page is verified yet.** Only rows marked CONFIRMED may be used
as wiring instructions. Spec 001 fills the board section, spec 002 the Duronic section.

## 2023 board (spec 001)

| Net | From | To | Label | Evidence |
|---|---|---|---|---|
| +24 V in | Barrel jack centre? | DC-DC IN+, terminal pole? | UNKNOWN | |
| GND | Barrel jack sleeve? | DC-DC IN−, MOSFET sources, NodeMCU GND | UNKNOWN | |
| +5 V | DC-DC OUT+ | NodeMCU Vin | UNKNOWN | |
| CH1 gate | GPIO ? | R ? → Q1 gate | UNKNOWN | |
| CH2 gate | GPIO ? | R ? → Q2 gate | UNKNOWN | |
| CH3 gate | GPIO ? | R ? → Q3 gate | UNKNOWN | |
| CH1 out | Q1 drain | Terminal 1 | UNKNOWN | |
| CH2 out | Q2 drain | Terminal 2 | UNKNOWN | |
| CH3 out | Q3 drain | Terminal 3 | UNKNOWN | |
| Loose red wire | Barrel jack | ? | UNKNOWN | |

## Duronic GHS37 (spec 002)

| Connector / cable | Wires | From | To | Function | Label |
|---|---|---|---|---|---|
| LED panel | ? | Main board | Lamp head | LEDs | UNKNOWN |
| Pump | ? | Main board | Pump | Pump | UNKNOWN |
| Water-level sensor | ? | ? | Main board | Low-water alarm | UNKNOWN (sensor existence CONFIRMED by manual) |
| Touch panel | ? | Touch board | Main board | Buttons, buzzer? | UNKNOWN |
| 24 V input | 2 | Adapter | Power module DC1 (barrel socket, faces outward) | Power | CONFIRMED 24 V DC (manual); DC1 as input CONFIRMED (Nicola, 2026-11-23) |
| Lamp head ↔ power module | 3 (TRS: tip, ring, sleeve) | Lamp head, through the telescopic rod | Power module DC3 (3.5 mm socket) | +24 V, GND and one more line; no 5 V | Connector CONFIRMED (photos). CONFIRMED by measurement (Nicola, 2026-11-23): pads A and D = GND, pad E = +24 V, pads C and F = pump command from the lamp (to Q2's control pin through R7 4.7 kΩ, with R3 10 kΩ to GND). Pad B UNKNOWN |
| Base barrel plug | 2 (sleeve + centre hole) | Pump, through the base | Power module DC2 (barrel socket, centre pin, opening facing the base) | Pump | Plug ↔ DC2 CONFIRMED (photos: end view of the plug shows a centre hole; DC2 opens toward the base). Pump function CONFIRMED (Nicola, 2026-11-23). Centre pin on the 24 V rail and no DC2 contact on GND: CONFIRMED by continuity (Nicola, 2026-11-23). Solder joint G = centre pin = +24 V (0.03 Ω to the rail); joints H and I = switched contact, on Q2's single pin; Q2's other power pin is on GND (0 Ω). CONFIRMED by measurement (Nicola, 2026-11-23): the pump is switched low-side by Q2. Check de-energised: resistance sleeve ↔ centre (brushed DC motor: a few to tens of Ω); outer diameter with the caliper (≈ 2.35 mm would mean a 2.5 × 0.7 mm plug) |
| Water-level sensor | 3 (TO-92) | U2 on the power module, facing the tank | — | Low-water detection (Hall + float magnet) | HYPOTHESIS (photo) |

## Target pin map (spec 005, Rev B)

| Function | NodeMCU | GPIO | Through | To |
|---|---|---|---|---|
| LED channel W | D1 | GPIO5 | 330 Ω | W transistor's control node on the lamp board |
| LED channel B | D5 | GPIO14 | 330 Ω | B transistor's control node on the lamp board |
| Pump | D7 | GPIO13 | 330 Ω + PC817C from 5 V | J3 pin C |
| Power | Vin, GND | — | LM2596 at 5.0 V | J3 pins + and − |

Lamp-board taps, measured by Nicola 2026-11-23 (photo `docs/hardware/photos/duronic-lamp-led-taps.jpg`):

- Point A (left end of R15 "472", next to Q5) ↔ GND: 9.71 kΩ. Point B (left end of R14 "472", next to Q4) ↔ GND: 9.68 kΩ. Both are LED-transistor control nodes with a 10 kΩ pull-down.
- J1-W − ↔ Q5 single pin: continuity; J1-W − ↔ Q4 single pin: none. So **Q5 switches the W (white) channel**, Q4 the B channel.
- Continuity A ↔ Q5's control pin: CONFIRMED (Nicola, 2026-11-24). Therefore D1 (W) → point A, D5 (B) → point B.
- J3: + and middle wired to LM2596 IN+ / IN− (white / blue); middle = GND to be confirmed against the 78M05 tab.

## Superseded pin map (Rev A, kept for history)

| Function | NodeMCU | GPIO | Why |
|---|---|---|---|
| LED channel 1 | D1 | GPIO5 | Boot-safe, no strap function |
| LED channel 2 | D2 | GPIO4 | Boot-safe, no strap function |
| Pump | D5 | GPIO14 | Boot-safe; replaces GPIO0 |
| Water-level input | D6 or D7 | GPIO12 / GPIO13 | Boot-safe; only if spec 002 finds a usable signal |
