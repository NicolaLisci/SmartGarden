// Light cycle logic, pure C++ with no Arduino dependency so it is unit-tested on the host
// (firmware/test/schedule_test.cpp). Scenes follow Schmidt's controller: Normal 14 h W+B,
// Enjoy 12 h W at 50 %, Grow 16 h W only (legacy/schmidt-arduino, turnOnLights).
#pragma once
#include <stdint.h>
#include <string.h>

struct Scene { uint8_t w, b; };  // duty in %, 0 = channel released
struct Cycle { const char *name; uint8_t hours; Scene scene; };

static const Cycle CYCLES[] = {
  { "12/12", 12, { 50, 0 } },
  { "14/10", 14, { 100, 100 } },
  { "16/8", 16, { 100, 0 } },
};
static const uint8_t CYCLE_COUNT = sizeof(CYCLES) / sizeof(CYCLES[0]);

// -1 when the name is not a known cycle.
inline int cycleIndex(const char *name) {
  for (uint8_t i = 0; i < CYCLE_COUNT; i++)
    if (name && strcmp(name, CYCLES[i].name) == 0) return i;
  return -1;
}

// minuteOfDay 0..1439. The start minute is on, the end minute is off.
inline bool lightOn(uint8_t startHour, uint8_t hours, uint16_t minuteOfDay) {
  const uint16_t since = (uint16_t)((minuteOfDay + 1440 - startHour * 60) % 1440);
  return since < hours * 60;
}

// Minutes from minuteOfDay until the next on/off transition (1..1440).
inline uint16_t minutesToNextEdge(uint8_t startHour, uint8_t hours, uint16_t minuteOfDay) {
  const uint16_t since = (uint16_t)((minuteOfDay + 1440 - startHour * 60) % 1440);
  const uint16_t len = hours * 60;
  return since < len ? len - since : 1440 - since;
}

// Settings persisted on the board. Validation guards whatever is read from flash.
struct Config { uint8_t magic, cycle, start, enabled; };
static const uint8_t CONFIG_MAGIC = 0x5C;
inline Config defaultConfig() { return { CONFIG_MAGIC, 1, 7, 1 }; }  // 14/10 from 07:00, on
inline bool validConfig(const Config &c) {
  return c.magic == CONFIG_MAGIC && c.cycle < CYCLE_COUNT && c.start < 24 && c.enabled <= 1;
}
