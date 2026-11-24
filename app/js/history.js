// Turns the firmware's persisted event log into absolute times and daily light hours.
// Pure functions, tested by history.test.mjs.

// Events carry an NTP epoch (t, seconds) or 0, plus uptime (up, ms) and a boot number.
// Within one boot, any event with a clock anchors the others: ts = anchor + up.
export function placeTimes(events) {
  const anchor = new Map();
  for (const e of events) if (e.t && !anchor.has(e.boot)) anchor.set(e.boot, e.t * 1000 - e.up);
  return events.map(e => ({ ...e, ts: e.t ? e.t * 1000 : anchor.has(e.boot) ? anchor.get(e.boot) + e.up : null }));
}

// Light is on while the app forces W or B, or while the lamp's own line reads high.
// A boot releases every output and forgets the lamp lines until they are read again.
// Returns [start, end] intervals in ms; the last one ends at `now` if still on.
export function lightIntervals(events, now) {
  const out = [];
  let forced = { w: 0, b: 0 }, lamp = { w: 0, b: 0 }, onSince = null, lastTs = null, boot = null;
  const lit = () => forced.w || forced.b || lamp.w || lamp.b;
  for (const e of events) {
    if (e.boot !== boot) {
      // Power was lost or the board restarted: close at the last known moment of the old boot.
      if (onSince !== null && lastTs !== null) out.push([onSince, lastTs]);
      onSince = null; forced = { w: 0, b: 0 }; lamp = { w: 0, b: 0 }; boot = e.boot;
    }
    if (e.e === 'set' && (e.ch === 'w' || e.ch === 'b')) forced[e.ch] = e.v > 0 ? 1 : 0;
    else if (e.e === 'release' || e.e === 'boot' || e.e === 'ota') forced = { w: 0, b: 0 };
    else if (e.e === 'lamp' && (e.ch === 'w' || e.ch === 'b')) lamp[e.ch] = e.v > 0 ? 1 : 0;
    if (e.ts === null) continue; // state still tracked, but no time to place an edge
    lastTs = e.ts;
    // An edge whose own event had no time is placed at the first event that has one.
    if (lit() && onSince === null) onSince = e.ts;
    else if (!lit() && onSince !== null) { out.push([onSince, e.ts]); onSince = null; }
  }
  if (onSince !== null) out.push([onSince, now]);
  return out;
}

const dayKey = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

// Hours of light per local calendar day for the `days` days ending today.
export function dailyHours(intervals, days, now) {
  const end = new Date(now);
  const result = [];
  for (let i = days - 1; i >= 0; i--) {
    const d0 = new Date(end.getFullYear(), end.getMonth(), end.getDate() - i).getTime();
    const d1 = new Date(end.getFullYear(), end.getMonth(), end.getDate() - i + 1).getTime();
    let ms = 0;
    for (const [a, b] of intervals) ms += Math.max(0, Math.min(b, d1) - Math.max(a, d0));
    result.push({ day: dayKey(new Date(d0)), hours: Math.round((ms / 36e5) * 10) / 10 });
  }
  return result;
}

// Merges a new /log page into the cached list (by seq, no duplicates).
export function mergeEvents(cache, page) {
  const last = cache.length ? cache[cache.length - 1].seq : 0;
  return cache.concat(page.filter(e => e.seq > last));
}
