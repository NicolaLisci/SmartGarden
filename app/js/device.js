// Communication layer for firmware/web-test: GET /state, POST /set?ch=w|b|p&on=0|1.
// "on" forces a channel on; "off" releases it to the lamp's own controller (the board
// cannot force a load off). The pump auto-releases after 10 s in firmware.
const POLL_MS = 1500;
const listeners = new Set();

export const device = {
  status: 'connecting', // connecting | online | offline
  state: null,          // { w, b, p, pumpLeft, lw, lb } as sent by the firmware
  pending: false,
};

function emit() { for (const fn of listeners) fn(device); }
export function subscribe(fn) { listeners.add(fn); fn(device); return () => listeners.delete(fn); }

async function call(url, opts) {
  const r = await fetch(url, { cache: 'no-store', ...opts });
  if (!r.ok) throw new Error(`${url}: HTTP ${r.status}`);
  return r.json();
}

function accept(state) { device.state = state; device.status = 'online'; emit(); }
function fail() { device.status = 'offline'; emit(); }

export async function refresh() {
  try { accept(await call('/state')); } catch { fail(); }
}

// on: false | true | a duty percentage 1–99 (PWM, light channels only).
export async function setChannel(ch, on) {
  device.pending = true; emit();
  const duty = typeof on === 'number' && on > 0 && on < 100 ? `&duty=${on}` : '';
  try { accept(await call(`/set?ch=${ch}&on=${on ? 1 : 0}${duty}&src=app`, { method: 'POST' })); }
  catch { fail(); }
  finally { device.pending = false; emit(); }
}

export async function setChannels(map) {
  for (const [ch, on] of Object.entries(map)) await setChannel(ch, on);
}

// Minutes of light per day counted by the board and kept in its EEPROM (GET /history).
export async function fetchHistory(days = 60) {
  try { return await call(`/history?days=${days}`); } catch { return null; }
}

// The seven pods, kept in the board's EEPROM (GET/POST /plants).
export async function fetchPlants() {
  try { return await call('/plants'); } catch { return null; }
}
export async function savePlant(pod, p) {
  const q = new URLSearchParams({ pod, name: p ? p.name : '', sown: p ? p.sown : '', src: 'app' });
  try { return await call(`/plants?${q}`, { method: 'POST' }); } catch { return null; }
}

// Activity log kept by the firmware (GET /log). Older firmware without it → null.
export async function fetchLog(since = 0) {
  try { return await call(`/log?since=${since}`); } catch { return null; }
}

// The light cycle runs on the board (GET/POST /schedule). null when unreachable or older firmware.
export const schedule = { value: null };
export async function fetchSchedule() {
  try { schedule.value = await call('/schedule'); } catch { schedule.value = null; }
  emit();
  return schedule.value;
}
export async function setSchedule(cfg) {
  const q = new URLSearchParams({ ...cfg, src: 'app' });
  try { schedule.value = await call(`/schedule?${q}`, { method: 'POST' }); return true; }
  catch { return false; }
  finally { emit(); }
}

export function startPolling() {
  fetchSchedule();
  setInterval(() => { if (!document.hidden) fetchSchedule(); }, 15000);
  refresh();
  setInterval(() => { if (!device.pending && !document.hidden) refresh(); }, POLL_MS);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) refresh(); });
}
