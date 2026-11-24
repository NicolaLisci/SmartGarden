# Tasks 004 — 2023 board rework (Rev A)

Superseded by spec 005 on 2026-11-23. Do not execute.

Plan: [plan.md](plan.md) (must be Approved before T10)
Guide: [assembly-guide.html](../../docs/hardware/assembly-guide.html) — the same steps, drawn hole by hole, for use at the bench

How we work: Nicola solders, the agent guides. One task at a time. After each task
marked 📷, Nicola sends a photo (component side and solder side) and the agent checks it
against the plan before the next task. `[HW]` = physical action. ⚡ = power is applied:
explicit go-ahead first, every time.

**Tools:** soldering iron, solder, multimeter (continuity, resistance, DC volts),
desoldering braid or pump, side cutter, wire stripper, small saw or cutter for the
perfboard, drill for the box, tape.

**Resistor colour codes (5 bands, 1 %):** 470 Ω = yellow violet black black brown ·
680 Ω = blue grey black black brown · 10 kΩ = brown black black red brown. Always
confirm with the multimeter before fitting.

## Phase 0 — Prepare (no soldering)

- [ ] T00 [HW] Measure P1–P4 from the plan (box inside, posts, board outline, heights,
  NodeMCU mounting). Check continuity between LM2596 IN− and OUT− (expected: 0 Ω). —
  serves RQ-004-07 — evidence: numbers sent to the agent
- [ ] T01 Agent updates the drawing and plan with the real dimensions (Rev B if anything
  moves). — evidence: regenerated SVG
- [ ] T02 [HW] Lay out the parts: 3 × PC817C, 3 × 470 Ω, 6 × 10 kΩ, wire (red/black
  0.5 mm², thin yellow/red/black/orange), bare solid copper ≥ 0.6 mm. Measure each
  resistor. — serves RQ-004-08 — evidence: 📷 of the parts

## Phase 1 — Strip the old board

- [ ] T10 [HW] Desolder and remove all wires on the solder side, the six old resistors,
  the three IRFZ44N and the three terminals. Keep NodeMCU, LM2596 and the DC jack. Keep
  the IRFZ44N and terminals for reuse. — evidence: 📷 both sides
- [ ] T11 [HW] Check: no continuity left between NodeMCU pins and anything except their
  own pads; LM2596 IN+ not shorted to IN−. — evidence: readings
- [ ] T12 [HW] Cut the board to the outline confirmed in T01; smooth the edge; check it
  sits flat in the box. — serves RQ-004-07 — evidence: 📷 board in the box

## Phase 2 — Power section

- [ ] T20 [HW] Solder the DC jack leads to "+24 IN" and "GND IN" (check the jack's centre
  pin with the original adapter's polarity mark; centre = +). Identify the loose red wire
  with the continuity tester (likely the jack's switch contact): if it is not the centre
  pin, insulate it and leave it unconnected (RQ-001-06). Strain-relieve the leads (cable
  tie through two holes). — evidence: 📷
- [ ] T21 [HW] Red 0.5 mm² "+24 IN" → LM2596 IN+; black 0.5 mm² "GND IN" → LM2596 IN−;
  thin black LM2596 OUT− → NodeMCU GND (left header, next to Vin). **Do not** connect
  OUT+ to Vin yet. — evidence: 📷
- [ ] T22 [HW] Check: "+24 IN" to "GND IN" is not a short (reading climbs as the
  capacitor charges). — evidence: reading
- [ ] T23 [HW] ⚡ Test T1: plug in the 24 V adapter, measure LM2596 OUT+ to OUT−, turn
  the trimmer slowly until 5.0 V (4.9–5.2 V). Unplug. — serves RQ-004-06 — evidence:
  📷 multimeter reading
- [ ] T24 [HW] Solder the orange wire LM2596 OUT+ → NodeMCU Vin. — evidence: 📷
- [ ] T25 [HW] ⚡ Plug in 24 V (no USB!): NodeMCU power LED on; 3V3 pin reads 3.2–3.4 V.
  Unplug. — evidence: readings

## Phase 3 — Power spines

- [ ] T30 [HW] Black spine: insulated black from "GND IN" along the bottom edge to CH3
  c3 r6; bare solid copper up column c3 to CH1 r3 (solder at every module's c3 r3 and
  c3 r6 when the modules are built; tack it at both ends now). — evidence: 📷 solder side
- [ ] T31 [HW] Red spine: insulated red 0.5 mm² from "+24 IN" along the bottom edge,
  up column c9 to CH1 r2. Strip 5 mm at c9 r2 of each module. — evidence: 📷
- [ ] T32 [HW] Check: "+24 IN" ↔ each c9 r2 window = 0 Ω; "GND IN" ↔ spine ends = 0 Ω;
  red ↔ black not shorted. — evidence: readings

## Phase 4 — Channel module CH1 (top)

Fit parts from the lowest to the tallest; solder each, then trim legs.

- [ ] T40 [HW] R_LED 470 Ω standing at c1 r1–r2 (body on c1 r1). R_C 10 kΩ standing at
  c5 r0–r1 (body on c5 r0). R_PD 10 kΩ standing at c5 r4–r5 (body on c5 r4). — evidence: 📷
- [ ] T41 [HW] PC817C: **dot at c2 r2** (pins 1 c2 r2, 2 c2 r3, 3 c5 r3, 4 c5 r2). — evidence: 📷
- [ ] T42 [HW] IRFZ44N upright at c7 r3–r5, **printed face toward the opto**, body ~2 mm
  above the board; G at r3, D at r4, S at r5. — evidence: 📷 from the side
- [ ] T43 [HW] Terminal at c11 r2 / r4, wire entries facing the right edge. — evidence: 📷
- [ ] T44 [HW] Solder-side links: c1 r2→c2 r2 · c2 r3→c3 r3 · c5 r1→c5 r2 ·
  c5 r4→c5 r3→c6 r3→c7 r3 · c5 r5→c5 r6 · c7 r5→c7 r6 · bar c3 r6→c7 r6 ·
  drain c7 r4→c11 r4 · bridge c9 r2→c11 r2 · red local c5 r0→c11 r2. — evidence: 📷 solder side
- [ ] T45 [HW] Continuity checks, power off — serves RQ-004-01, RQ-004-02 — evidence: table
  | Between | Expected |
  |---|---|
  | c1 r1 (IN) ↔ U pin 1 | 470 Ω |
  | U pin 4 ↔ "+24 IN" | 10 kΩ |
  | Q gate ↔ "GND IN" | 10 kΩ |
  | Q source ↔ "GND IN" | 0 Ω |
  | U pin 2 ↔ "GND IN" | 0 Ω |
  | J "+" ↔ "+24 IN" | 0 Ω |
  | J "OUT" ↔ Q drain | 0 Ω |
  | Q gate ↔ Q drain, J "+" ↔ J "OUT", "+24 IN" ↔ "GND IN" | no short |
- [ ] T46 [HW] ⚡ Driver test: dummy load = one 10 kΩ resistor between J1 "+" and J1
  "OUT". Plug in 24 V (no USB). Measure: gate ≈ 0 V and J1 OUT ≈ 24 V (load off). Touch a
  wire from NodeMCU 3V3 to c1 r1: gate 10–13 V and J1 OUT < 0.5 V (load on). Remove the
  wire: back to off. Unplug. — serves RQ-004-01 — evidence: readings

## Phase 5 — Modules CH2 and CH3

- [ ] T50 [HW] Repeat T40–T46 for CH2 (8 rows below CH1). — evidence: 📷 + readings
- [ ] T51 [HW] Repeat T40–T46 for CH3 (16 rows below CH1). — evidence: 📷 + readings

## Phase 6 — Connect the NodeMCU

- [ ] T60 Agent writes the bench-test firmware (`firmware/bench-test/`): all outputs low
  at boot, then CH1, CH2, CH3 on for 5 s each, in a loop. — evidence: compiles
- [ ] T61 [HW] Flash it over USB with **24 V unplugged**. Disconnect USB. — evidence: log
- [ ] T62 [HW] Solder the yellow wires: D1 → CH1 c1 r1, D2 → CH2 c1 r1, D5 → CH3 c1 r1. —
  serves RQ-004-03 — evidence: 📷
- [ ] T63 [HW] ⚡ Test T2/T3: dummy 10 kΩ loads on J1–J3, plug in 24 V. Each J OUT drops
  to ~0 V in turn, never two at once. Unplug and replug 10 times, press RST 10 times:
  no output turns on before the cycle starts. — serves RQ-004-02, RQ-004-03 — evidence:
  readings, short video if possible

## Phase 7 — Pump diode (when bought)

- [ ] T70 [HW] Solder the diode on the solder side across J3's pins, **stripe on the "+"
  pin (c11 r2)**. Check with diode test: red probe on J3 OUT, black on J3 "+" ≈ 0.4–0.7 V;
  reversed = OL. — serves RQ-004-04 — evidence: 📷 + reading

## Phase 8 — Into the box

- [ ] T80 [HW] Mark and drill: DC jack (left wall), one opening per terminal (right
  wall), optional USB slot (front wall). — evidence: 📷
- [ ] T81 [HW] Mount the board on standoffs or foam pads; fit the jack; close the lid. —
  serves RQ-004-07 — evidence: 📷 closed box

## Phase 9 — Load test (after spec 002)

- [ ] T90 [HW] ⚡ Test T4 with the real loads or an equivalent dummy at the expected
  current: 30 min per channel, MOSFET case below 60 °C. — serves RQ-004-05 — evidence:
  readings

## Done when

`checklist.md` shows every RQ-004-xx with evidence, and `docs/WIRING.md` holds the
as-built connections marked CONFIRMED.
