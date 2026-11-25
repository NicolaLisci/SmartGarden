// Regression tests for the on-board light cycle (firmware/web-test/schedule.h, Scheduler).
// They simulate the board calling step() and applying the scene, day after day, and check
// that the light is ON exactly from the start hour for the cycle's hours, every day, for
// every cycle and every start hour, also across manual commands, reboots, app changes,
// a missing clock and the daylight-saving changes of Europe/Rome.
// Run: firmware/test/run.sh
#include "../web-test/schedule.h"
#include <cstdio>
#include <cstdlib>
#include <ctime>

static int failures = 0;
#define CHECK(cond, ...) do { if (!(cond)) { std::printf("FAIL %s:%d  %s  ", __FILE__, __LINE__, #cond); std::printf(__VA_ARGS__); std::printf("\n"); if (++failures > 20) std::exit(1); } } while (0)

// The board, as seen by the scheduler: what the outputs currently show.
struct Board {
  Scheduler s;
  bool lit = false;
  Scene shown = { 0, 0 };
  int changes = 0;
  void tick(time_t now) {
    bool on;
    if (s.step(now, on)) { lit = on; shown = on ? s.scene() : Scene{ 0, 0 }; changes++; }
  }
  void manual(time_t now, bool on) { lit = on; shown = on ? Scene{ 100, 100 } : Scene{ 0, 0 }; s.manual(now); }
};

// Local midnight of a calendar day in the board's time zone.
static time_t localMidnight(int y, int mo, int d) {
  struct tm t = {};
  t.tm_year = y - 1900; t.tm_mon = mo - 1; t.tm_mday = d; t.tm_isdst = -1;
  return mktime(&t);
}
static int localHM(time_t t) { struct tm lt; localtime_r(&t, &lt); return lt.tm_hour * 60 + lt.tm_min; }
static Config cfgOf(uint8_t cycle, uint8_t start) { Config c = defaultConfig(); c.cycle = cycle; c.start = start; return c; }
static bool expected(const Config &c, time_t t) { return lightOn(c.start, CYCLES[c.cycle].hours, (uint16_t)localHM(t)); }

int main() {
  // The board's time zone (same string as configTime() in web-test.ino).
  setenv("TZ", "CET-1CEST,M3.5.0,M10.5.0/3", 1);
  tzset();

  // 1. Every cycle, every start hour, three days minute by minute: the light matches the
  //    cycle at every minute, switches exactly twice a day, and is on for exactly N hours.
  for (uint8_t c = 0; c < CYCLE_COUNT; c++)
    for (uint8_t start = 0; start < 24; start++) {
      Board b; b.s.configure(cfgOf(c, start));
      const time_t t0 = localMidnight(2026, 11, 24);
      int onMinutes = 0;
      for (time_t t = t0; t < t0 + 3 * 86400; t += 60) {
        b.tick(t);
        CHECK(b.lit == expected(b.s.cfg, t), "cycle %s start %u at %02d:%02d", CYCLES[c].name, start, localHM(t) / 60, localHM(t) % 60);
        onMinutes += b.lit;
        if (b.lit) CHECK(b.shown.w == CYCLES[c].scene.w && b.shown.b == CYCLES[c].scene.b, "scene of %s", CYCLES[c].name);
      }
      CHECK(onMinutes == 3 * CYCLES[c].hours * 60, "cycle %s start %u: %d minutes on in 3 days", CYCLES[c].name, start, onMinutes);
      CHECK(b.changes <= 1 + 3 * 2, "cycle %s start %u: %d output changes", CYCLES[c].name, start, b.changes);
    }

  // 2. The exact second of the edges: 14/10 from 07:00 is on at 07:00:00, still on at
  //    20:59:59, off at 21:00:00 (checked once a second, as the firmware does).
  {
    Board b; b.s.configure(cfgOf(1, 7));
    const time_t d = localMidnight(2026, 11, 25);
    b.tick(d + 6 * 3600 + 59 * 60 + 59); CHECK(!b.lit, "06:59:59 must be off");
    b.tick(d + 7 * 3600);                CHECK(b.lit, "07:00:00 must be on");
    b.tick(d + 20 * 3600 + 59 * 60 + 59); CHECK(b.lit, "20:59:59 must be on");
    b.tick(d + 21 * 3600);               CHECK(!b.lit, "21:00:00 must be off");
  }

  // 3. A reboot at any minute (state lost, outputs released) is corrected at the first tick.
  for (int minute = 0; minute < 1440; minute += 7) {
    const time_t t = localMidnight(2026, 11, 25) + minute * 60;
    Board b; b.s.configure(cfgOf(1, 7));  // fresh after boot: nothing applied yet
    b.tick(t);
    CHECK(b.lit == expected(b.s.cfg, t), "after reboot at %02d:%02d", minute / 60, minute % 60);
  }

  // 4. No clock yet (before NTP): nothing is driven, the lamp decides; the first tick with
  //    a clock applies the cycle.
  {
    Board b; b.s.configure(cfgOf(1, 7));
    for (time_t t = 0; t < 600; t++) b.tick(t);  // ESP8266 time() counts from 1970 before NTP
    CHECK(b.changes == 0 && !b.lit, "no output change without a clock");
    const time_t noon = localMidnight(2026, 11, 25) + 12 * 3600;
    b.tick(noon);
    CHECK(b.lit, "clock arrives at noon: light on");
  }

  // 5. A manual command wins until the next edge, then the cycle takes over again,
  //    for every cycle, start hour and moment of the day.
  for (uint8_t c = 0; c < CYCLE_COUNT; c++)
    for (uint8_t start = 0; start < 24; start += 5)
      for (int minute = 0; minute < 1440; minute += 37) {
        Board b; b.s.configure(cfgOf(c, start));
        const time_t d = localMidnight(2026, 11, 25);
        const time_t t = d + minute * 60 + 13;  // mid-minute, like a real tap
        b.tick(t);
        const bool sched = b.lit;
        b.manual(t, !sched);  // the user does the opposite of the cycle
        const uint16_t left = minutesToNextEdge(start, CYCLES[c].hours, (uint16_t)localHM(t));
        const time_t edge = t - 13 + left * 60;
        for (time_t u = t + 1; u < edge; u += 30) {
          b.tick(u);
          CHECK(b.lit == !sched, "%s start %u: manual at %02d:%02d overridden too early", CYCLES[c].name, start, minute / 60, minute % 60);
        }
        const int before = b.changes;
        b.tick(edge);
        CHECK(b.lit == expected(b.s.cfg, edge), "%s start %u: cycle not back at the edge after manual at %02d:%02d", CYCLES[c].name, start, minute / 60, minute % 60);
        // The scheduler takes control back at the edge itself, not a second later.
        CHECK(b.s.overrideUntil == 0 && b.changes == before + 1, "%s start %u: override not ended exactly at the edge (manual at %02d:%02d)", CYCLES[c].name, start, minute / 60, minute % 60);
      }

  // 6. A change from the app applies at once, also the same state with another scene, and
  //    clears a pending manual override.
  {
    Board b; const time_t t = localMidnight(2026, 11, 25) + 10 * 3600;
    b.s.configure(cfgOf(1, 7)); b.tick(t);
    CHECK(b.lit && b.shown.b == 100, "14/10 at 10:00: white + blue");
    b.manual(t + 5, false);
    b.s.configure(cfgOf(2, 7)); b.tick(t + 10);
    CHECK(b.lit && b.shown.w == 100 && b.shown.b == 0, "switch to 16/8: white only, override cleared");
    b.s.configure(cfgOf(0, 7)); b.tick(t + 20);
    CHECK(b.lit && b.shown.w == 50 && b.shown.b == 0, "switch to 12/12: white at 50 %%");
    b.s.configure(cfgOf(0, 11)); b.tick(t + 30);
    CHECK(!b.lit, "start moved to 11:00 at 10:00: off at once");
  }

  // 7. Disabled cycle: the board never drives the light.
  {
    Board b; Config c = cfgOf(1, 7); c.enabled = 0; b.s.configure(c);
    for (time_t t = localMidnight(2026, 11, 25); t < localMidnight(2026, 11, 26); t += 60) b.tick(t);
    CHECK(b.changes == 0, "disabled: %d changes", b.changes);
    b.manual(localMidnight(2026, 11, 25) + 3600, true);
    CHECK(b.s.overrideUntil == 0, "disabled: manual sets no override");
  }

  // 8. Daylight saving (Europe/Rome): on the change days the light still comes on at 07:00
  //    and goes off at 21:00 local time, 14 hours, for both changes.
  static const int DST_DAYS[2][3] = { { 2026, 3, 29 }, { 2026, 10, 25 } };
  for (const auto &day : DST_DAYS) {
    Board b; b.s.configure(cfgOf(1, 7));
    const time_t d0 = localMidnight(day[0], day[1], day[2]);
    const time_t d1 = localMidnight(day[0], day[1], day[2] + 1);
    int onMinutes = 0, firstOn = -1, firstOff = -1;
    for (time_t t = d0; t < d1; t += 60) {
      const bool was = b.lit;
      b.tick(t);
      if (b.lit && !was && firstOn < 0) firstOn = localHM(t);
      if (!b.lit && was && firstOff < 0) firstOff = localHM(t);
      onMinutes += b.lit;
    }
    CHECK(firstOn == 7 * 60 && firstOff == 21 * 60 && onMinutes == 14 * 60,
          "DST %d-%02d-%02d: on %d, off %d, %d minutes", day[0], day[1], day[2], firstOn, firstOff, onMinutes);
  }

  // 9. The morning of 2026-11-25: the board took over at 08:47 and must keep the light on
  //    until 21:00, 14 hours after 07:00.
  {
    Board b; b.s.configure(cfgOf(1, 7));
    const time_t d = localMidnight(2026, 11, 25);
    b.tick(d + 8 * 3600 + 47 * 60);
    CHECK(b.lit, "08:47 on");
    CHECK(b.s.minutesLeft(d + 8 * 3600 + 47 * 60) == 12 * 60 + 13, "08:47: off in 12 h 13 min");
  }

  if (failures) { std::printf("%d failure(s)\n", failures); return EXIT_FAILURE; }
  std::printf("scheduler: ok\n");
  return EXIT_SUCCESS;
}
