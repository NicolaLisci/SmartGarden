#!/usr/bin/env bash
# Prints the board's persisted activity log, oldest first, in local time, plus the light
# cycle the board is running. For monitoring and debugging from the Mac.
# Usage: firmware/tools/log.sh [host] [--last N]      (default host: smartgarden.local)
set -euo pipefail
HOST="smartgarden.local"; LAST=0
while [[ $# -gt 0 ]]; do
  case "$1" in
    --last) LAST="$2"; shift 2 ;;
    *) HOST="$1"; shift ;;
  esac
done
# Resolve once over IPv4: curl's IPv6 attempt on .local names costs ~5 s per request.
IP="$(dig +short +time=2 +tries=1 -p 5353 @224.0.0.251 "$HOST" A 2>/dev/null | grep -E '^[0-9.]+$' | head -1 || true)"
BASE="http://${IP:-$HOST}"

python3 -I - "$BASE" "$LAST" <<'PY'
import json, sys, urllib.request, datetime
base, last = sys.argv[1], int(sys.argv[2])
get = lambda p: json.load(urllib.request.urlopen(base + p, timeout=10))
events, since = [], 0
while True:
    page = get(f"/log?since={since}")
    events += page["events"]
    if not page["events"] or not page["more"]: break
    since = page["events"][-1]["seq"]
anchor = {}
for e in events:
    if e["t"] and e["boot"] not in anchor: anchor[e["boot"]] = e["t"] - e["up"] / 1000
CYC = ["12/12", "14/10", "16/8"]
def text(e):
    k, v, ch, src = e["e"], e["v"], e["ch"], e["src"]
    if k == "set": return f"{'on' if v else 'released'} {ch}" + (f" at {v}%" if 1 < v < 100 else "") + (f"  ({src})" if src else "")
    if k == "sched": return "cycle: light " + ("ON" if v else "OFF")
    if k == "config": return "cycle disabled" if v < 0 else f"cycle set to {CYC[v // 24]} from {v % 24:02d}:00  ({src})"
    if k == "lamp": return f"lamp line {ch.upper()} {'high' if v else 'low'}"
    if k == "release": return f"all released  ({src})"
    return k
rows = events[-last:] if last else events
for e in rows:
    t = e["t"] or (anchor[e["boot"]] + e["up"] / 1000 if e["boot"] in anchor else None)
    when = datetime.datetime.fromtimestamp(t).strftime("%Y-%m-%d %H:%M:%S") if t else f"boot {e['boot']} +{e['up'] // 1000}s"
    print(f"{e['seq']:>6}  {when}  boot {e['boot']:<3} {text(e)}")
s = get("/schedule")
print(f"\n{len(events)} events. Cycle {s['cycle']} from {s['start']:02d}:00, "
      f"{'enabled' if s['enabled'] else 'DISABLED'}, clock {'ok' if s['clock'] else 'MISSING'}, "
      f"light should be {'ON' if s['on'] else 'OFF'}, next change in {s['next'] // 60} h {s['next'] % 60:02d} min"
      + (f", manual override for {s['override'] // 60} min" if s['override'] else ""))
PY
