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

// Activity log kept by the firmware (GET /log). Older firmware without it → null.
export async function fetchLog(since = 0) {
  try { return await call(`/log?since=${since}`); } catch { return null; }
}

export function startPolling() {
  refresh();
  setInterval(() => { if (!device.pending && !document.hidden) refresh(); }, POLL_MS);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) refresh(); });
}
