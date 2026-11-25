// What is planted in the seven pods, kept in EEPROM. Pure C++, tested on the host
// (firmware/test/plants_test.cpp). Pod index order matches app/js/plants.js SLOTS:
// 0–2 front row, 3–6 back row, left to right.
#pragma once
#include <stdint.h>
#include <string.h>
#include <stdio.h>

static const uint8_t POD_COUNT = 7;
static const uint8_t PLANT_NAME_MAX = 24;  // bytes of UTF-8, without the terminator
static const uint8_t PLANTS_MAGIC = 0xA7;

struct PlantSlot { char name[PLANT_NAME_MAX + 1]; uint8_t pad; uint16_t sown; };  // sown: day number, 0 = none
struct Plants { uint8_t magic, edited; PlantSlot pods[POD_COUNT]; };

// Nicola's garden, used until the app saves something.
inline void plantsDefault(Plants &p) {
  static const char *const NAMES[POD_COUNT] = { "Basilico porpora", "Basilico", "Basilico lemon",
    "Trinidad Scorpion giallo", "Timo", "Maggiorana", "Bonsai di pino" };
  memset(&p, 0, sizeof p);
  p.magic = PLANTS_MAGIC;
  for (uint8_t i = 0; i < POD_COUNT; i++) strncpy(p.pods[i].name, NAMES[i], PLANT_NAME_MAX);
}

// A name is valid when it fits and has no control characters (UTF-8 bytes ≥ 0x80 are fine).
inline bool plantNameValid(const char *s) {
  if (!s) return false;
  const size_t n = strlen(s);
  if (n > PLANT_NAME_MAX) return false;
  for (size_t i = 0; i < n; i++) if ((unsigned char)s[i] < 0x20 || s[i] == 0x7F) return false;
  return true;
}

inline bool plantsValid(const Plants &p) {
  if (p.magic != PLANTS_MAGIC || p.edited > 1) return false;
  for (uint8_t i = 0; i < POD_COUNT; i++) {
    if (memchr(p.pods[i].name, 0, sizeof p.pods[i].name) == nullptr) return false;  // must be terminated
    if (!plantNameValid(p.pods[i].name)) return false;
  }
  return true;
}

// "YYYY-MM-DD" ⇄ day number (days since 1970-01-01). Empty string = no date.
inline int32_t plantDaysFromCivil(int y, unsigned m, unsigned d) {
  y -= m <= 2;
  const int era = (y >= 0 ? y : y - 399) / 400;
  const unsigned yoe = (unsigned)(y - era * 400);
  const unsigned doy = (153 * (m + (m > 2 ? -3 : 9)) + 2) / 5 + d - 1;
  return era * 146097 + (int32_t)(yoe * 365 + yoe / 4 - yoe / 100 + doy) - 719468;
}
inline bool parseDate(const char *s, uint16_t &day) {
  if (!s || !*s) { day = 0; return true; }
  int y, m, d; char tail;
  if (strlen(s) != 10 || sscanf(s, "%4d-%2d-%2d%c", &y, &m, &d, &tail) != 3) return false;
  if (y < 2000 || y > 2100 || m < 1 || m > 12 || d < 1 || d > 31) return false;
  const int32_t n = plantDaysFromCivil(y, m, d);
  // Reject impossible dates such as 2026-02-30 by a round trip through the next month.
  const int32_t first = plantDaysFromCivil(y, m, 1), next = m == 12 ? plantDaysFromCivil(y + 1, 1, 1) : plantDaysFromCivil(y, m + 1, 1);
  if (n < first || n >= next) return false;
  day = (uint16_t)n;
  return true;
}
inline void formatDate(uint16_t day, char out[16]) {  // 16: room the compiler can prove; dates use 10
  if (!day) { out[0] = 0; return; }
  // civil_from_days (Howard Hinnant)
  int32_t z = day + 719468;
  const int32_t era = (z >= 0 ? z : z - 146096) / 146097;
  const unsigned doe = (unsigned)(z - era * 146097);
  const unsigned yoe = (doe - doe / 1460 + doe / 36524 - doe / 146096) / 365;
  const unsigned doy = doe - (365 * yoe + yoe / 4 - yoe / 100);
  const unsigned mp = (5 * doy + 2) / 153;
  const unsigned d = doy - (153 * mp + 2) / 5 + 1;
  const unsigned m = mp < 10 ? mp + 3 : mp - 9;
  const int y = (int)yoe + era * 400 + (m <= 2);
  snprintf(out, 16, "%04d-%02u-%02u", y % 10000, m % 100, d % 100);
}

// Writes `s` as a JSON string body (without quotes) into out; false if it does not fit.
inline bool jsonEscape(const char *s, char *out, size_t cap) {
  size_t o = 0;
  for (; *s; s++) {
    const unsigned char c = (unsigned char)*s;
    char buf[8];
    const char *piece = buf;
    if (c == '"') piece = "\\\"";
    else if (c == '\\') piece = "\\\\";
    else if (c < 0x20) snprintf(buf, sizeof buf, "\\u%04x", c);
    else { buf[0] = (char)c; buf[1] = 0; }
    const size_t n = strlen(piece);
    if (o + n >= cap) return false;
    memcpy(out + o, piece, n);
    o += n;
  }
  out[o] = 0;
  return true;
}

// Sets one pod from the app; an empty name empties the pod. False on invalid input.
inline bool plantsSet(Plants &p, int pod, const char *name, const char *sown) {
  uint16_t day;
  if (pod < 0 || pod >= POD_COUNT || !plantNameValid(name) || !parseDate(sown, day)) return false;
  PlantSlot &s = p.pods[pod];
  memset(&s, 0, sizeof s);
  strncpy(s.name, name, PLANT_NAME_MAX);
  s.sown = *name ? day : 0;
  p.edited = 1;
  return true;
}
