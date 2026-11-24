// Photoperiod maths. Pure functions, tested by schedule.test.mjs.
export const CYCLES = { '12/12': 12, '14/10': 14, '16/8': 16 };

// Each cycle carries its light, as in Schmidt's scenes (legacy controller.ino):
// Normal 14 h W+B, Enjoy 12 h W at 50 %, Grow 16 h W only. docs/PROJECT_STATUS.md item 13.
// 50 % is PWM on W through the lamp's command line: dimming observed by Nicola, 2026-11-24.
export const SCENES = {
  '12/12': { name: 'Corto', spectrum: 'white50', light: 'Bianco al 50 %' },
  '14/10': { name: 'Normale', spectrum: 'full', light: 'Bianco + Blu' },
  '16/8': { name: 'Lungo', spectrum: 'white', light: 'Solo bianco' },
};

// Minutes since midnight → minutes of light left (0 when dark) and the next transition.
export function photoperiod(startHour, lightHours, nowMin) {
  const start = startHour * 60;
  const len = lightHours * 60;
  const since = (nowMin - start + 1440) % 1440;
  const on = since < len;
  const left = on ? len - since : 0;
  const nextMin = on ? (start + len) % 1440 : start;
  return { on, left, next: { type: on ? 'off' : 'on', at: nextMin } };
}

export const hhmm = m => `${String(Math.floor(m / 60) % 24).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
export const duration = m => `${Math.floor(m / 60)} h ${String(m % 60).padStart(2, '0')} min`;

// Settings live on this phone until firmware spec 003 adds a scheduler.
const KEY = 'sg.photoperiod';
export function loadSettings() {
  try {
    const s = JSON.parse(localStorage.getItem(KEY));
    if (s && CYCLES[s.cycle] && Number.isInteger(s.start)) return s;
  } catch {}
  return { cycle: '14/10', start: 7 };
}
export function saveSettings(s) { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch {} }
