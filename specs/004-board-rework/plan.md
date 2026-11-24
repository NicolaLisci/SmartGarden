# Plan 004 — 2023 board rework (Rev A)

Status: Superseded by plan 005 on 2026-11-23 — do not build
Spec: [spec.md](spec.md) (Approved 2026-11-23)
Assembly guide and schematic (interactive, Italian): [docs/hardware/assembly-guide.html](../../docs/hardware/assembly-guide.html).
Its element coordinates mirror the hole table below; change both together.
Last updated: 2026-11-23

## Approach

Keep the NodeMCU and the LM2596 module soldered where they are. Remove everything else
from the board (old wires, old resistors, MOSFETs, terminals) and rebuild the right-hand
strip as **three identical channel modules**, one per load. Each module holds one
PC817C driver, three resistors, one IRFZ44N standing upright and one screw terminal.
Trim the perfboard so it fits the box.

Why this approach:

- **Simple to build and to check.** One module is built, tested with the multimeter,
  then copied twice. No old wiring to trace (spec 001 netlist no longer needed).
- **Parts on hand.** Only the pump's flyback diode is bought, and it goes in last.
- **Fits the box.** Everything stays inside a 92 × 72 mm board outline and under
  about 19 mm of height (to be confirmed by measurement, see Prerequisites).

Alternatives considered:

| Alternative | Why not |
|---|---|
| Swap to IRLZ44N, keep Schmidt's circuit | Needs a purchase and a wait; Nicola chose to use the parts on hand |
| Rework only the gate resistors in place | Old wiring is undocumented and the MOSFETs/terminals sit beyond the box width |
| Rebuild on a new perfboard | Means desoldering the NodeMCU (30 pins); only if the current board cannot be trimmed |
| Keep the 100 Ω gate resistors | Not needed: the opto + 10 kΩ path already limits gate current to ~1.2 mA |

## Prerequisites — measure before cutting or soldering

| # | Measure | Why | Assumed until measured |
|---|---|---|---|
| P1 | Box inside length, width, height (base + lid), position and diameter of any internal posts | Board outline and height budget | 96 × 76 × 25 mm inside (2 mm walls), no posts in the board area |
| P2 | Current perfboard outline; distance from the NodeMCU right header to the board's right edge | Where to cut | Board ~107 × 70 mm; ~30 mm free right of the NodeMCU after trimming to 92 mm |
| P3 | Height above the board of the LM2596 capacitors and of the NodeMCU | Height budget | LM2596 ≈ 17 mm, NodeMCU ≈ 10–16 mm |
| P4 | Is the NodeMCU soldered directly or plugged into female headers? | Removal for flashing | Soldered |

## Circuit

### Power

```
 DC jack (on box wall)
   centre (+24 V) ──► pad "+24 IN" ──┬──► LM2596 IN+
                                     └──► red power spine ──► J1+, J2+, J3+  (and each R_C)
   sleeve (GND)   ──► pad "GND IN" ──┬──► LM2596 IN−
                                     └──► black power spine ──► module GND bars (MOSFET sources)

 LM2596 OUT+ (set to 5.0 V first!) ──► NodeMCU Vin     (orange wire, soldered LAST, after test T1)
 LM2596 OUT−                       ──► NodeMCU GND     (black, thin)
```

Load currents return straight to "GND IN" through the black spine, never through the
NodeMCU's ground.

### One channel module (×3, identical)

```
 NodeMCU GPIO ──[R_LED 470 Ω]──► U pin 1 (anode)          U pin 2 (cathode) ──► GND
                                                                                  
 +24 V ──[R_C 10 kΩ]──► U pin 4 (collector)
                        U pin 3 (emitter) = GATE ──┬──────────────► Q gate
                                                   └─[R_PD 10 kΩ]─► GND
 J pin "+" ◄── +24 V
 J pin "OUT" ◄── Q drain            Q source ──► GND (black spine)
```

- GPIO high → opto on → gate ≈ 12 V → MOSFET fully on → load on.
- GPIO low, floating, ESP in reset or unplugged → opto off → R_PD holds the gate at 0 V
  → load off. This is principle I in hardware.
- Values and margins: see `docs/HARDWARE_AUDIT.md`, "Proposed gate driver".

### Pin map

| Channel | Module | NodeMCU pin | GPIO | Load |
|---|---|---|---|---|
| CH1 | top | D1 | GPIO5 | LED channel 1 |
| CH2 | middle | D2 | GPIO4 | LED channel 2 (spare if the panel has one channel) |
| CH3 | bottom | D5 | GPIO14 | Pump — with flyback diode |
| reserved | — | D6 | GPIO12 | Water-level input, if spec 002 finds a usable signal |

All four are boot-safe (no strap function, no pull-up at boot).

## Module layout on the hole grid

Coordinates are holes on the perfboard (2.54 mm pitch), seen **from the component
side**. `c` counts columns from the NodeMCU's right header to the right; `r` counts rows
downward from the top of the module.

- **Anchor:** column c0 is the first column right of the NodeMCU right header (the
  D0…3V3 side). c0 stays empty as clearance.
- Modules are stacked with one empty row between them: CH1 rows start at the top of the
  strip, CH2 eight rows lower, CH3 sixteen rows lower.

| Hole | Part / pin | Net |
|---|---|---|
| c1 r1 | R_LED, top leg (resistor standing) | IN — yellow wire from the GPIO |
| c1 r2 | R_LED, bottom leg → bend to c2 r2 | LED |
| c2 r2 | U pin 1 (anode, dot) | LED |
| c2 r3 | U pin 2 (cathode) → bend to c3 r3 | GND |
| c3 | Black spine (bare, thick), from CH1 r3 down to CH3 r6, through all modules | GND |
| c5 r0 | R_C, top leg (standing) | +24 V |
| c5 r1 | R_C, bottom leg → bend to c5 r2 | COL |
| c5 r2 | U pin 4 (collector) | COL |
| c5 r3 | U pin 3 (emitter) | GATE |
| c5 r4 | R_PD, top leg (standing) → bend to c5 r3 | GATE |
| c5 r5 | R_PD, bottom leg → link to c5 r6 | GND |
| c6 r3 | Bare link c5 r3 → c7 r3 passes here | GATE |
| c7 r3 | Q gate | GATE |
| c7 r4 | Q drain → bare thick link along r4 to c11 r4 | OUT |
| c7 r5 | Q source → link to c7 r6 | GND |
| c3…c7 r6 | GND bar (bare, thick) joining the spine | GND |
| c9 r2, c10 r2 | Bare bridge c9 r2 → c11 r2 (red spine drop) | +24 V |
| c11 r2 | J pin "+" | +24 V |
| c11 r4 | J pin "OUT" | OUT |

Orientation:

- **U (PC817C):** dot (pin 1) at c2 r2, top-left.
- **Q (IRFZ44N):** standing upright, **printed face toward the opto (left)**, metal tab
  toward the terminal. Seen from the printed face, legs left to right are G, D, S; in
  this orientation G is the top leg (r3), S the bottom leg (r5). Body seated ~2 mm
  above the board.
- **J:** wire entries facing the right edge of the board (the box wall).
- **Resistors:** standing (one leg bent over the body), body on the hole named "top leg".
- **Pump diode (CH3 only):** on the solder side, directly across J3's two pins, **stripe
  (cathode) on the "+" pin c11 r2**.

### Wire list (solder side unless stated)

| Wire | From | To | Type |
|---|---|---|---|
| Yellow CH1 | NodeMCU D1 | CH1 c1 r1 | Thin insulated (AWG 24–26) |
| Yellow CH2 | NodeMCU D2 | CH2 c1 r1 | Thin insulated |
| Yellow CH3 | NodeMCU D5 | CH3 c1 r1 | Thin insulated |
| Red local ×3 | c5 r0 | c11 r2 of the same module | Thin insulated, red |
| Red spine | +24 IN, along the bottom edge, then up column c9 to CH1 | Soldered at c9 r2 of each module (strip 5 mm of insulation there) | 0.5 mm² (AWG 20) insulated, red |
| Black spine | GND IN | CH3 c3 r6, then bare spine up column c3 to CH1 r3 | 0.5 mm² insulated to the strip, then bare solid copper ≥ 0.6 mm |
| Drain links ×3 | c7 r4 | c11 r4 | Bare solid copper ≥ 0.6 mm |
| GND bars ×3 | c3 r6 | c7 r6 (plus short drops from c5 r5 and c7 r5) | Bare solid copper ≥ 0.6 mm |
| LM2596 in | +24 IN / GND IN | LM2596 IN+ / IN− | 0.5 mm² red / black |
| LM2596 to ESP | LM2596 OUT− | NodeMCU GND (left header, next to Vin) | Thin black |
| **5 V link** | LM2596 OUT+ | NodeMCU Vin | Thin orange — **only after T1 passes** |

Rule: bare wires never cross each other. Insulated wires may pass over bare ones.

## Mechanical

| Item | Value |
|---|---|
| Board outline | 92 × 72 mm max (trim the right side after removing the old parts) |
| Strip for the modules | ~30 mm wide, right of the NodeMCU; terminals flush with the right edge |
| Tallest parts | IRFZ44N upright ≈ 18–19 mm; LM2596 ≈ 17 mm; terminals ≈ 10 mm |
| Height budget (assumed) | 25 mm inside − 1.6 mm board − 3–4 mm under-board clearance ≈ 19.5 mm |
| Fallback if too tall | Fold each IRFZ44N 90° toward the opto (printed face up), with tape between tab and parts underneath |
| Mounting | 3–4 mm standoffs on the box posts, or thick double-sided foam pads at the corners; the solder side must not touch anything |
| Right wall | One opening per terminal, aligned with the wire entries (or one slot with a grommet) |
| Left wall | DC jack, panel-mounted |
| Front wall | Optional slot for the NodeMCU USB (recovery flashing; OTA afterwards) |
| Antenna | NodeMCU antenna end (top) free of wires; plastic box only |

## Bill of materials

| Ref | Part | Qty | Source |
|---|---|---|---|
| A1 | NodeMCU V3 (CH340) | 1 | Stays on the board |
| A2 | LM2596 module | 1 | Stays on the board |
| Q1–Q3 | IRFZ44N | 3 | Reused (desoldered and refitted) |
| U1–U3 | PC817C | 3 | On hand (20) |
| R_LED ×3 | 470 Ω (or 680 Ω), 1/4 W | 3 | Resistor kit |
| R_C ×3 | 10 kΩ, 1/4 W | 3 | Resistor kit |
| R_PD ×3 | 10 kΩ, 1/4 W | 3 | Resistor kit |
| J1–J3 | 2-pole 5.08 mm screw terminal | 3 | Reused |
| DC jack | Panel-mount jack on flying leads | 1 | Reused |
| D_FLY | 1N4007, 1N5819 or SS14 | 1 | **To buy** (none on hand); fitted last |
| Wire | Red and black 0.5 mm²; thin yellow, red, black, orange | — | On hand? To confirm |
| Bare wire | Solid copper ≥ 0.6 mm (e.g. stripped solid core) | ~30 cm | On hand? To confirm |
| Mounting | Standoffs or foam pads | 4 | On hand? To confirm |

## Safety and constitution

| Principle | How this plan satisfies it |
|---|---|
| I. Safe by default | Non-inverting driver; R_PD holds every gate at 0 V when the ESP is off, resetting or unplugged; no strap pins used |
| II. Evidence before wiring | No load is connected under this plan; bench tests use dummy loads only |
| IV. Reuse before buying | One diode bought; everything else reused or on hand |
| V. Human gates | Each `[HW]` task needs Nicola's go-ahead; power is applied only at the test steps |
| VI. Test before trust | A multimeter check after every soldering step; T1–T4 before any real load |

## Risks

| Risk | Mitigation |
|---|---|
| Box inside smaller than assumed | P1 before cutting; fallback: fold MOSFETs flat |
| USB and 24 V connected at the same time back-feed the NodeMCU | Never connect USB while the board is on 24 V, until the NodeMCU's USB–Vin diode is checked |
| Solder bridge between adjacent pads | Continuity check of each module against the hole table before power |
| Old firmware on the NodeMCU drives D1/D2 at boot | Flash the test firmware over USB, with 24 V disconnected, before the yellow wires are soldered |
| LM2596 IN− and OUT− not common on this module | Continuity check in task T00 |

## Purchases

One flyback diode, ≥ 1 A and ≥ 50 V (1N4007, 1N5819 or SS14). A few cents. Needed only
for the pump channel, fitted last (principle IV).
