// The seven pods of the GHS37 and what is planted in them. Stored on this phone until the
// firmware can keep settings (spec 003). Pure helpers are tested by plants.test.mjs.
//
// Geometry from docs/hardware/photos/duronic-overview-lamp.jpg (seen from the front):
// back row four pods with the lamp pole in the middle, front row three pods and the
// water inlet on the right. Slots 0–2 front row, 3–6 back row, left to right.
export const SLOTS = [
  { row: 'front', col: 0 }, { row: 'front', col: 1 }, { row: 'front', col: 2 },
  { row: 'back', col: 0 }, { row: 'back', col: 1 }, { row: 'back', col: 2 }, { row: 'back', col: 3 },
];

// Plants with a photo; any other name gets the neutral sprout thumbnail.
export const CATALOG = [
  { key: 'basilico porpora', name: 'Basilico porpora', img: 'basilico-porpora' },
  { key: 'basilico lemon', name: 'Basilico lemon', img: 'basilico-lemon' },
  { key: 'basilico', name: 'Basilico', img: 'basilico' },
  { key: 'timo', name: 'Timo', img: 'timo' },
  { key: 'maggiorana', name: 'Maggiorana', img: 'maggiorana' },
  { key: 'trinidad', name: 'Trinidad Scorpion giallo', img: 'trinidad-scorpion' },
  { key: 'bonsai', name: 'Bonsai di pino', img: 'bonsai-pino' },
];

// Nicola's garden as recorded in docs/design/mockups-2026-11-24 (digital twin).
const DEFAULT = ['Basilico porpora', 'Basilico', 'Basilico lemon', 'Trinidad Scorpion giallo', 'Timo', 'Maggiorana', 'Bonsai di pino']
  .map(name => ({ name, sown: '' }));

export function imageFor(name) {
  const low = (name || '').toLowerCase();
  return CATALOG.find(c => low.includes(c.key))?.img || null;
}

export function daysSince(sown, today = new Date()) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(sown || '')) return null;
  const [y, m, d] = sown.split('-').map(Number);
  const days = Math.round((Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()) - Date.UTC(y, m - 1, d)) / 864e5);
  return days >= 0 ? days : null;
}

// One number per pod, read like the top view: back row 1–4, front row 5–7, left to right.
const WHERE = {
  back: ['dietro, a sinistra', 'dietro, centro-sinistra', 'dietro, centro-destra', 'dietro, a destra'],
  front: ['davanti, a sinistra', 'davanti, al centro', 'davanti, a destra'],
};
export const slotNumber = i => (SLOTS[i].row === 'back' ? SLOTS[i].col + 1 : SLOTS[i].col + 5);
export const slotWhere = i => WHERE[SLOTS[i].row][SLOTS[i].col];
export const rowLabel = i => `Posto ${slotNumber(i)} · ${slotWhere(i)}`;
// Pod indices in display order (by number).
export const ORDER = SLOTS.map((_, i) => i).sort((a, b) => slotNumber(a) - slotNumber(b));

// Validates what comes back from storage: seven entries, each null or { name, sown }.
export function normalize(raw) {
  if (!Array.isArray(raw) || raw.length !== SLOTS.length) return DEFAULT.map(p => ({ ...p }));
  return raw.map(p => (p && typeof p.name === 'string' && p.name.trim()
    ? { name: p.name.trim().slice(0, 32), sown: daysSince(p.sown) === null ? '' : p.sown }
    : null));
}

// The board keeps the pods in EEPROM (firmware/web-test/plants.h): names up to 24 bytes.
export const NAME_MAX_BYTES = 24;
export const nameFits = name => new TextEncoder().encode(name).length <= NAME_MAX_BYTES;

// GET /plants → the app's pods array (null = empty pod).
export function boardToPods(json) {
  if (!json || !Array.isArray(json.pods) || json.pods.length !== SLOTS.length) return null;
  return json.pods.map(p => (p && p.name ? { name: p.name, sown: daysSince(p.sown) === null ? '' : p.sown } : null));
}

// The first time the board is seen (never edited), the pods set on this phone move to it.
export function podsToMigrate(json, local, hasLocal) {
  const board = boardToPods(json);
  if (!board || json.edited || !hasLocal) return [];
  return local.map((p, i) => [i, p]).filter(([i, p]) => JSON.stringify(p) !== JSON.stringify(board[i]));
}

const KEY = 'sg.pods';
export const hasLocalPods = () => { try { return localStorage.getItem(KEY) !== null; } catch { return false; } };
export function loadPods() {
  try { return normalize(JSON.parse(localStorage.getItem(KEY))); } catch { return normalize(null); }
}
export function savePods(pods) { try { localStorage.setItem(KEY, JSON.stringify(pods)); } catch {} }
