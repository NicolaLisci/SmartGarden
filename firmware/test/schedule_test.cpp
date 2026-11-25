// Host unit tests for firmware/web-test/schedule.h.
// Run: firmware/test/run.sh
#include "../web-test/schedule.h"
#include <cstdio>
#include <cstdlib>

static int failures = 0;
#define CHECK(cond) do { if (!(cond)) { std::printf("FAIL %s:%d  %s\n", __FILE__, __LINE__, #cond); failures++; } } while (0)
static uint16_t at(int h, int m) { return (uint16_t)(h * 60 + m); }

int main() {
  // Scenes match Schmidt's controller.
  CHECK(cycleIndex("12/12") == 0 && CYCLES[0].hours == 12 && CYCLES[0].scene.w == 50 && CYCLES[0].scene.b == 0);
  CHECK(cycleIndex("14/10") == 1 && CYCLES[1].hours == 14 && CYCLES[1].scene.w == 100 && CYCLES[1].scene.b == 100);
  CHECK(cycleIndex("16/8") == 2 && CYCLES[2].hours == 16 && CYCLES[2].scene.w == 100 && CYCLES[2].scene.b == 0);
  CHECK(cycleIndex("8/16") == -1);
  CHECK(cycleIndex(nullptr) == -1);

  // 14/10 from 07:00: on at 07:00, still on at 20:59, off at 21:00 and through the night.
  CHECK(lightOn(7, 14, at(7, 0)));
  CHECK(lightOn(7, 14, at(20, 59)));
  CHECK(!lightOn(7, 14, at(21, 0)));
  CHECK(!lightOn(7, 14, at(6, 59)));
  CHECK(!lightOn(7, 14, at(0, 0)));
  CHECK(lightOn(7, 14, at(8, 44)));  // the morning of 2026-11-25: should have been on

  // Cycle crossing midnight: 16/8 from 18:00 is on at 02:00, off at 10:00.
  CHECK(lightOn(18, 16, at(2, 0)));
  CHECK(!lightOn(18, 16, at(10, 0)));
  CHECK(lightOn(18, 16, at(23, 59)));

  // Next edge.
  CHECK(minutesToNextEdge(7, 14, at(8, 44)) == at(21, 0) - at(8, 44));
  CHECK(minutesToNextEdge(7, 14, at(23, 0)) == 8 * 60);
  CHECK(minutesToNextEdge(7, 14, at(7, 0)) == 14 * 60);
  CHECK(minutesToNextEdge(7, 14, at(21, 0)) == 10 * 60);
  CHECK(minutesToNextEdge(18, 16, at(2, 0)) == 8 * 60);

  // Every minute of the day agrees with the edge maths for every cycle and start hour.
  for (uint8_t c = 0; c < CYCLE_COUNT; c++)
    for (uint8_t s = 0; s < 24; s++) {
      int onMinutes = 0;
      for (uint16_t m = 0; m < 1440; m++) {
        onMinutes += lightOn(s, CYCLES[c].hours, m);
        const uint16_t n = minutesToNextEdge(s, CYCLES[c].hours, m);
        CHECK(n >= 1 && n <= 1440);
        CHECK(lightOn(s, CYCLES[c].hours, (m + n) % 1440) != lightOn(s, CYCLES[c].hours, m));
      }
      CHECK(onMinutes == CYCLES[c].hours * 60);
    }

  // Config validation.
  CHECK(validConfig(defaultConfig()));
  Config c = defaultConfig(); c.magic = 0; CHECK(!validConfig(c));
  c = defaultConfig(); c.cycle = 3; CHECK(!validConfig(c));
  c = defaultConfig(); c.start = 24; CHECK(!validConfig(c));
  c = defaultConfig(); c.enabled = 2; CHECK(!validConfig(c));

  if (failures) { std::printf("%d failure(s)\n", failures); return EXIT_FAILURE; }
  std::printf("schedule.h: ok\n");
  return EXIT_SUCCESS;
}
