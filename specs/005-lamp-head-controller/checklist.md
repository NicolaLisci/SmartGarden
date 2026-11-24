# Checklist 005 — Controller board inside the lamp head

The spec is Done only when every row has evidence.

| Requirement | Acceptance criterion | Result | Evidence | Date |
|---|---|---|---|---|
| RQ-005-01 | LM2596 output 4.9–5.2 V before the NodeMCU is connected; 3V3 pin 3.2–3.4 V | PASS | Nicola read 5.0 V on OUT+/OUT− (module alone on the 24 V adapter), then 3.3 V on the NodeMCU 3V3 hole after wires 3 and 4, adapter only, no USB. Bare NodeMCU (headers desoldered) checked first on USB: blue LED blinks on reset | 2026-11-23 |
| RQ-005-02 | Less than 0.3 V on the LED connector's − pin with the output on; LEDs off when released | | | |
| RQ-005-03 | Output P at 4.5–5 V when on (bench, 10 kΩ load); pump runs on command | | | |
| RQ-005-04 | Ten power cycles: no output rises before the firmware drives it | | | |
| RQ-005-05 | Outputs on GPIO5, GPIO14, GPIO13 | | | |
| RQ-005-06 | With the GPIOs released the lamp behaves as before | | | |
| RQ-005-07 | J3 +, −, C identified; each LED tap reads 10 kΩ to GND; W/B transistor identified | | | |
| RQ-005-08 | Fits in the lamp head without touching LED panel or touch-key area | | | |
| RQ-005-09 | All parts on hand; a multimeter check after each step | | | |
| RQ-005-10 | After 30 min with LEDs on, NodeMCU and LM2596 warm at most | | | |

## Docs updated

- [ ] docs/PROJECT_STATUS.md
- [ ] docs/WIRING.md (as-built connections)
- [ ] docs/hardware/assembly-guide.html (redraw for Rev C)
