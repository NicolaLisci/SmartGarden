// Light cycle logic, pure C++ with no Arduino dependency so it is unit-tested on the host
// (firmware/test/schedule_test.cpp). Scenes follow Schmidt's controller: Normal 14 h W+B,
// Enjoy 12 h W at 50 %, Grow 16 h W only (legacy/schmidt-arduino, turnOnLights).
#pragma once
#include <stdint.h>
#include <string.h>
#include <time.h>

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

// Local minute of the day for an epoch, using the TZ set with configTime()/setenv("TZ").
// False while the clock is not set yet (before NTP the ESP8266 counts from 1970).
inline bool localMinuteOf(time_t t, uint16_t &m) {
  if (t < 1700000000) return false;
  struct tm lt;
  localtime_r(&t, &lt);
  m = (uint16_t)(lt.tm_hour * 60 + lt.tm_min);
  return true;
}

// Every decision of the on-board light cycle, kept free of hardware so it is tested on the
// host. The firmware calls step() once a second and applies the scene when it returns true.
struct Scheduler {
  Config cfg = defaultConfig();
  uint32_t overrideUntil = 0;  // epoch seconds; 0 = no manual override
  int8_t last = -1;            // state last applied, -1 = must (re)apply

  // A new configuration from the app takes effect at once.
  void configure(const Config &c) { cfg = c; overrideUntil = 0; last = -1; }

  // A manual light command wins until the next scheduled on/off edge.
  void manual(time_t now) {
    uint16_t m;
    if (!cfg.enabled || !localMinuteOf(now, m)) return;
    overrideUntil = (uint32_t)now + minutesToNextEdge(cfg.start, CYCLES[cfg.cycle].hours, m) * 60u - (uint32_t)now % 60u;
    last = -1;  // reapply the cycle when the override ends
  }

  // True when the outputs must change; `on` is then the state to apply with scene().
  bool step(time_t now, bool &on) {
    uint16_t m;
    if (!cfg.enabled || !localMinuteOf(now, m)) return false;  // no clock: the lamp decides
    if (overrideUntil && (uint32_t)now < overrideUntil) return false;
    overrideUntil = 0;
    on = lightOn(cfg.start, CYCLES[cfg.cycle].hours, m);
    if (last == (int8_t)on) return false;
    last = on;
    return true;
  }

  Scene scene() const { return CYCLES[cfg.cycle].scene; }
  uint16_t minutesLeft(time_t now) const {
    uint16_t m;
    return localMinuteOf(now, m) ? minutesToNextEdge(cfg.start, CYCLES[cfg.cycle].hours, m) : 0;
  }
};

// ---------- daily light history (kept in EEPROM) ----------
// Minutes of light per local calendar day for the last HISTORY_DAYS days, as a ring
// indexed by day number. Written to EEPROM a few times a day only: flash sectors wear out.
static const uint8_t HISTORY_DAYS = 60;
static const uint8_t HISTORY_MAGIC = 0xD7;
struct DailyHistory { uint8_t magic, pad; uint16_t lastDay; uint16_t minutes[HISTORY_DAYS]; };

// Days since 1970-01-01 for a civil date (Howard Hinnant's days_from_civil).
inline int32_t daysFromCivil(int y, unsigned m, unsigned d) {
  y -= m <= 2;
  const int era = (y >= 0 ? y : y - 399) / 400;
  const unsigned yoe = (unsigned)(y - era * 400);
  const unsigned doy = (153 * (m + (m > 2 ? -3 : 9)) + 2) / 5 + d - 1;
  const unsigned doe = yoe * 365 + yoe / 4 - yoe / 100 + doy;
  return era * 146097 + (int32_t)doe - 719468;
}
// Local day number for an epoch (TZ applied); false before the clock is set.
inline bool localDayOf(time_t t, uint16_t &day) {
  if (t < 1700000000) return false;
  struct tm lt;
  localtime_r(&t, &lt);
  day = (uint16_t)daysFromCivil(lt.tm_year + 1900, lt.tm_mon + 1, lt.tm_mday);
  return true;
}

inline void historyReset(DailyHistory &h) { memset(&h, 0, sizeof h); h.magic = HISTORY_MAGIC; }
inline bool historyValid(const DailyHistory &h) {
  if (h.magic != HISTORY_MAGIC) return false;
  for (uint8_t i = 0; i < HISTORY_DAYS; i++) if (h.minutes[i] > 1440) return false;
  return true;
}
// Moves the ring to `day`, zeroing the days skipped (board off, or a new day).
// Returns true when the day changed (a good moment to save).
inline bool historyAdvance(DailyHistory &h, uint16_t day) {
  if (h.lastDay == day || (h.lastDay && day < h.lastDay)) return false;  // same day, or clock behind
  if (h.lastDay == 0 || day - h.lastDay >= HISTORY_DAYS) {
    // First use, or a gap longer than the window: start afresh.
    for (uint8_t i = 0; i < HISTORY_DAYS; i++) h.minutes[i] = 0;
  } else {
    for (uint16_t d = h.lastDay + 1; d <= day; d++) h.minutes[d % HISTORY_DAYS] = 0;
  }
  h.lastDay = day;
  return true;
}
// Called once per elapsed minute with whether the light was on in that minute.
inline bool historyMinute(DailyHistory &h, uint16_t day, bool lit) {
  if (h.lastDay && day < h.lastDay) return false;  // a clock running behind never rewrites history
  const bool newDay = historyAdvance(h, day);
  uint16_t &m = h.minutes[day % HISTORY_DAYS];
  if (lit && m < 1440) m++;
  return newDay;
}
// Minutes of light on `day`; 0 for days outside the kept window.
inline uint16_t historyGet(const DailyHistory &h, uint16_t day) {
  if (h.lastDay == 0 || day > h.lastDay || h.lastDay - day >= HISTORY_DAYS) return 0;
  return h.minutes[day % HISTORY_DAYS];
}
