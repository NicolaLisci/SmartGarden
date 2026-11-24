# SmartGarden — Duronic GHS37 Smart Conversion

Make a **Duronic GHS37** hydroponic grow box controllable over Wi-Fi with an ESP8266,
so it no longer depends on its capacitive buttons. Today the device stays in standby
after a power cut and needs a button press to restart the light cycle.

Status: hardware audit phase. See [docs/PROJECT_STATUS.md](docs/PROJECT_STATUS.md).

## How this repository works

Development is spec-driven (GitHub Spec Kit cycle: spec → plan → tasks → checklist)
and designed for AI agents working alongside a human.

- Agents start from [AGENTS.md](AGENTS.md).
- Principles: [.specify/memory/constitution.md](.specify/memory/constitution.md).
- Work units: [specs/](specs/), in dependency order; roadmap in
  [docs/IMPLEMENTATION_PLAN.md](docs/IMPLEMENTATION_PLAN.md).

## Documents

| Document | Purpose |
|---|---|
| [PROJECT_STATUS](docs/PROJECT_STATUS.md) | Current state, blockers, next actions |
| [HARDWARE_AUDIT](docs/HARDWARE_AUDIT.md) | What the 2023 board contains, confirmed vs assumed |
| [WIRING](docs/WIRING.md) | Verified connections only |
| [ARCHITECTURE](docs/ARCHITECTURE.md) | Target architecture and open decisions |
| [IMPLEMENTATION_PLAN](docs/IMPLEMENTATION_PLAN.md) | Phases and specs in dependency order |
| [TEST_PLAN](docs/TEST_PLAN.md) | Incremental bench and field tests |

## Credits

Based on Dominik Schmidt's
[hydroponic-smart-garden-controller](https://github.com/dominik-schmidt/hydroponic-smart-garden-controller)
for the IDOO grow box ([article](https://www.dominikschmidt.net/2021/12/hydropomic-smart-garden-controller/)).
His code and README are kept unchanged in [legacy/schmidt-arduino/](legacy/schmidt-arduino/).
