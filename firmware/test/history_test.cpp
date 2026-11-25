// Tests for the daily light history (firmware/web-test/schedule.h, DailyHistory).
// Run: firmware/test/run.sh
#include "../web-test/schedule.h"
#include <cstdio>
#include <cstdlib>
#include <ctime>

static int failures = 0;
#define CHECK(cond, ...) do { if (!(cond)) { std::printf("FAIL %s:%d  %s  ", __FILE__, __LINE__, #cond); std::printf(__VA_ARGS__); std::printf("\n"); if (++failures > 20) std::exit(1); } } while (0)

static time_t localAt(int y, int mo, int d, int h, int mi) {
  struct tm t = {}; t.tm_year = y - 1900; t.tm_mon = mo - 1; t.tm_mday = d; t.tm_hour = h; t.tm_min = mi; t.tm_isdst = -1;
  return mktime(&t);
}

int main() {
  setenv("TZ", "CET-1CEST,M3.5.0,M10.5.0/3", 1);
  tzset();

  // Civil dates.
  CHECK(daysFromCivil(1970, 1, 1) == 0, "epoch");
  CHECK(daysFromCivil(2026, 11, 25) - daysFromCivil(2026, 11, 24) == 1, "consecutive");
  CHECK(daysFromCivil(2027, 1, 1) - daysFromCivil(2026, 12, 31) == 1, "new year");
  CHECK(daysFromCivil(2028, 3, 1) - daysFromCivil(2028, 2, 28) == 2, "leap year");

  // localDayOf follows local midnight, not UTC midnight.
  uint16_t d1, d2;
  CHECK(localDayOf(localAt(2026, 11, 25, 0, 30), d1) && localDayOf(localAt(2026, 11, 24, 23, 30), d2) && d1 == d2 + 1, "local midnight");
  CHECK(!localDayOf(1000, d1), "no clock");

  // A real day with the board running the 14/10 cycle: exactly 840 minutes counted.
  {
    DailyHistory h; historyReset(h);
    Scheduler s;  // default 14/10 from 07:00
    const time_t start = localAt(2026, 11, 25, 0, 0), end = localAt(2026, 11, 28, 0, 0);
    bool lit = false;
    int saves = 0;
    for (time_t t = start; t < end; t += 60) {
      bool on; if (s.step(t, on)) lit = on;
      uint16_t day; localDayOf(t, day);
      saves += historyMinute(h, day, lit);
    }
    uint16_t today; localDayOf(localAt(2026, 11, 27, 12, 0), today);
    for (int k = 0; k < 3; k++) CHECK(historyGet(h, today - k) == 14 * 60, "day -%d: %u minutes", k, historyGet(h, today - k));
    CHECK(saves == 3, "one save per new day, got %d", saves);
  }

  // Every cycle: one simulated day counts exactly its hours, also on DST days.
  static const int DAYS[3][3] = { { 2026, 11, 25 }, { 2026, 3, 29 }, { 2026, 10, 25 } };
  for (const auto &dd : DAYS)
    for (uint8_t c = 0; c < CYCLE_COUNT; c++) {
      DailyHistory h; historyReset(h);
      Scheduler s; Config cfg = defaultConfig(); cfg.cycle = c; s.configure(cfg);
      bool lit = false;
      uint16_t day; localDayOf(localAt(dd[0], dd[1], dd[2], 12, 0), day);
      for (time_t t = localAt(dd[0], dd[1], dd[2], 0, 0); t < localAt(dd[0], dd[1], dd[2] + 1, 0, 0); t += 60) {
        bool on; if (s.step(t, on)) lit = on;
        uint16_t dt; localDayOf(t, dt); historyMinute(h, dt, lit);
      }
      CHECK(historyGet(h, day) == CYCLES[c].hours * 60, "%d-%02d-%02d %s: %u", dd[0], dd[1], dd[2], CYCLES[c].name, historyGet(h, day));
    }

  // Days without the board (power off) read 0; days beyond the window read 0.
  {
    DailyHistory h; historyReset(h);
    historyMinute(h, 20000, true);
    historyMinute(h, 20005, true);  // board off for 4 days
    CHECK(historyGet(h, 20000) == 1 && historyGet(h, 20005) == 1, "kept days");
    for (uint16_t d = 20001; d < 20005; d++) CHECK(historyGet(h, d) == 0, "gap day %u", d);
    CHECK(historyGet(h, 20006) == 0, "future day");
    historyMinute(h, 20005 + HISTORY_DAYS, true);
    CHECK(historyGet(h, 20005) == 0, "beyond the window after a long gap");
  }

  // The ring keeps exactly the last HISTORY_DAYS days.
  {
    DailyHistory h; historyReset(h);
    for (uint16_t d = 1; d <= 100; d++) for (int m = 0; m < d; m++) historyMinute(h, 20000 + d, true);
    for (uint16_t d = 1; d <= 100; d++)
      CHECK(historyGet(h, 20000 + d) == (d > 100 - HISTORY_DAYS ? d : 0), "ring day %u", d);
  }

  // A clock that runs behind never rewrites the past; a day never exceeds 1440 minutes.
  {
    DailyHistory h; historyReset(h);
    historyMinute(h, 20010, true);
    CHECK(!historyMinute(h, 20009, true) && historyGet(h, 20009) == 0 && historyGet(h, 20010) == 1, "clock behind");
    for (int i = 0; i < 2000; i++) historyMinute(h, 20010, true);
    CHECK(historyGet(h, 20010) == 1440, "capped at 1440");
  }

  // Validation of what is read back from EEPROM.
  {
    DailyHistory h; historyReset(h); CHECK(historyValid(h), "fresh");
    h.minutes[3] = 1441; CHECK(!historyValid(h), "minutes out of range");
    historyReset(h); h.magic = 0; CHECK(!historyValid(h), "magic");
  }

  if (failures) { std::printf("%d failure(s)\n", failures); return EXIT_FAILURE; }
  std::printf("history: ok\n");
  return EXIT_SUCCESS;
}
