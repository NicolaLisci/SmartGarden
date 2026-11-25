// Tests for firmware/web-test/plants.h. Run: firmware/test/run.sh
#include "../web-test/plants.h"
#include <cstdio>
#include <cstdlib>

static int failures = 0;
#define CHECK(cond) do { if (!(cond)) { std::printf("FAIL %s:%d  %s\n", __FILE__, __LINE__, #cond); failures++; } } while (0)

int main() {
  // Fits the EEPROM layout (512 bytes in all, plants from offset 160).
  CHECK(sizeof(Plants) <= 512 - 160);

  // Defaults: Nicola's seven pods, valid, not yet edited.
  Plants p; plantsDefault(p);
  CHECK(plantsValid(p) && !p.edited);
  CHECK(strcmp(p.pods[0].name, "Basilico porpora") == 0 && strcmp(p.pods[6].name, "Bonsai di pino") == 0);

  // Dates round trip; empty means none; impossible or malformed dates are refused.
  uint16_t d;
  CHECK(parseDate("2026-11-10", d) && d == plantDaysFromCivil(2026, 11, 10));
  char buf[16]; formatDate(d, buf); CHECK(strcmp(buf, "2026-11-10") == 0);
  CHECK(parseDate("", d) && d == 0); formatDate(0, buf); CHECK(buf[0] == 0);
  CHECK(parseDate("2028-02-29", d)); formatDate(d, buf); CHECK(strcmp(buf, "2028-02-29") == 0);
  CHECK(!parseDate("2026-02-29", d));
  CHECK(!parseDate("2026-02-30", d));
  CHECK(!parseDate("2026-13-01", d));
  CHECK(!parseDate("10/11/2026", d));
  CHECK(!parseDate("2026-11-10x", d));
  CHECK(!parseDate("1999-01-01", d));
  for (int y = 2020; y <= 2030; y++) for (int m = 1; m <= 12; m++) {  // every day of a decade
    for (int dd = 1; dd <= 31; dd++) {
      char s[16]; std::snprintf(s, sizeof s, "%04d-%02d-%02d", y, m, dd);
      uint16_t n;
      if (parseDate(s, n)) { formatDate(n, buf); CHECK(strcmp(buf, s) == 0); }
    }
  }

  // Names: up to 24 bytes of UTF-8, no control characters.
  CHECK(plantNameValid("Peperoncino"));
  CHECK(plantNameValid("Basilico è già"));            // accents are 2 bytes each in UTF-8
  CHECK(plantNameValid("abcdefghijklmnopqrstuvwx"));  // exactly 24 bytes
  CHECK(!plantNameValid("abcdefghijklmnopqrstuvwxy")); // 25 bytes
  CHECK(!plantNameValid("Basilico è già cresciuto"));  // 26 bytes
  CHECK(!plantNameValid("Un nome decisamente troppo lungo"));
  CHECK(!plantNameValid("riga\nnuova"));
  CHECK(!plantNameValid(nullptr));

  // Setting pods.
  CHECK(plantsSet(p, 2, "Menta", "2026-11-01") && p.edited && strcmp(p.pods[2].name, "Menta") == 0);
  formatDate(p.pods[2].sown, buf); CHECK(strcmp(buf, "2026-11-01") == 0);
  CHECK(plantsSet(p, 2, "", "2026-11-01") && p.pods[2].name[0] == 0 && p.pods[2].sown == 0);  // emptied
  CHECK(!plantsSet(p, 7, "Menta", ""));
  CHECK(!plantsSet(p, -1, "Menta", ""));
  CHECK(!plantsSet(p, 1, "Menta", "2026-02-30"));
  CHECK(plantsValid(p));

  // Corrupt EEPROM contents are rejected.
  Plants q = p; q.magic = 0; CHECK(!plantsValid(q));
  q = p; memset(q.pods[3].name, 'x', sizeof q.pods[3].name); CHECK(!plantsValid(q));  // no terminator
  q = p; q.pods[4].name[0] = 1; CHECK(!plantsValid(q));
  q = p; q.edited = 9; CHECK(!plantsValid(q));

  // JSON escaping.
  char out[64];
  CHECK(jsonEscape("Basilico \"lemon\" \\ ok", out, sizeof out) && strcmp(out, "Basilico \\\"lemon\\\" \\\\ ok") == 0);
  CHECK(jsonEscape("a\tb", out, sizeof out) && strcmp(out, "a\\u0009b") == 0);
  CHECK(jsonEscape("già", out, sizeof out) && strcmp(out, "già") == 0);
  CHECK(!jsonEscape("abcdef", out, 4));

  if (failures) { std::printf("%d failure(s)\n", failures); return EXIT_FAILURE; }
  std::printf("plants: ok\n");
  return EXIT_SUCCESS;
}
