#!/usr/bin/env python3
"""Build the README cover and app showcase.

Sources: docs/images/source/readme-{cover,app}.svg, which reference the real garden render and
app screenshots by relative path. Published: docs/images/readme-{cover,app}.png, rendered at 2x
with headless Chrome (GitHub does not load images referenced from inside an SVG).
    python3 docs/tools/readme-art.py
"""
import functools
import http.server
import subprocess
import threading
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / 'docs' / 'images' / 'source'
OUT = ROOT / 'docs' / 'images'
CHROME = next(Path.home().glob('Library/Caches/ms-playwright/chromium-*/chrome-mac*/*.app/Contents/MacOS/*'), None) \
    or Path('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome')
FONT = 'font-family="-apple-system, BlinkMacSystemFont, Segoe UI, Helvetica, Arial, sans-serif"'
MONO = 'font-family="ui-monospace, SFMono-Regular, Menlo, monospace"'
OLIVE, IVORY, INK, AMBER = '#6f7a5a', '#f6f3ea', '#24221e', '#e3a12f'

def led_cluster(cx, cy, r=9, a=.5):
    """The motif: one of the lamp's six-LED clusters (white, red, blue)."""
    from math import cos, sin, pi
    cols = ['#ffffff', '#ff8a78', '#ffffff', '#8fb0ff', '#ffffff', '#ffd98a']
    return ''.join(f'<circle cx="{cx + r * cos(2 * pi * k / 6):.1f}" cy="{cy + r * sin(2 * pi * k / 6):.1f}" r="2.6" fill="{c}" fill-opacity="{a}"/>' for k, c in enumerate(cols))

def phone(x, y, w, shot, label=None, lab_size=20, lab_col='#6b665c', weight=600):
    h = w * 780 / 360
    b, rid = w * .045, f'c{abs(hash((x, y))) % 10**6}'
    s = [f'<rect x="{x - b + 6:.1f}" y="{y - b + 22:.1f}" width="{w + 2 * b:.1f}" height="{h + 2 * b:.1f}" rx="{w * .19:.1f}" fill="#2b2a22" fill-opacity=".16"/>',
         f'<rect x="{x - b:.1f}" y="{y - b:.1f}" width="{w + 2 * b:.1f}" height="{h + 2 * b:.1f}" rx="{w * .19:.1f}" fill="#1c1c1e"/>',
         f'<clipPath id="{rid}"><rect x="{x:.1f}" y="{y:.1f}" width="{w:.1f}" height="{h:.1f}" rx="{w * .155:.1f}"/></clipPath>',
         f'<image href="{shot}" x="{x:.1f}" y="{y:.1f}" width="{w:.1f}" height="{h:.1f}" clip-path="url(#{rid})" preserveAspectRatio="xMidYMid slice"/>',
         f'<rect x="{x + w / 2 - w * .14:.1f}" y="{y + w * .035:.1f}" width="{w * .28:.1f}" height="{w * .085:.1f}" rx="{w * .0425:.1f}" fill="#1c1c1e"/>']
    if label:
        s.append(f'<text x="{x + w / 2:.1f}" y="{y + h + b + 34:.1f}" font-size="{lab_size}" font-weight="{weight}" fill="{lab_col}" text-anchor="middle">{label}</text>')
    return '\n'.join(s)

# ------------------------------------------------------------------ cover
W, H = 1200, 520
pill = lambda x, y, t, w: (f'<rect x="{x}" y="{y}" width="{w}" height="42" rx="21" fill="#ffffff" fill-opacity=".13" stroke="#ffffff" stroke-opacity=".32"/>'
                           f'<text x="{x + w / 2}" y="{y + 28}" font-size="19" font-weight="600" fill="{IVORY}" text-anchor="middle">{t}</text>')
cover = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" width="{W}" height="{H}" role="img" aria-labelledby="t d" {FONT}>
<title id="t">SmartGarden</title>
<desc id="d">A Duronic GHS37 hydroponic garden rewired from the inside and run from a phone, with no cloud. The garden render and the app's Home screen.</desc>
<defs>
  <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#46523a"/><stop offset=".6" stop-color="{OLIVE}"/><stop offset="1" stop-color="#959e7b"/></linearGradient>
  <radialGradient id="glow" cx=".5" cy=".4" r=".55"><stop offset="0" stop-color="#fff2c6" stop-opacity=".7"/><stop offset="1" stop-color="#fff2c6" stop-opacity="0"/></radialGradient>
  <clipPath id="card"><rect x="600" y="56" width="440" height="330" rx="30"/></clipPath>
</defs>
<rect width="{W}" height="{H}" rx="28" fill="url(#bg)"/>
{''.join(led_cluster(x, y, 9, .16) for x, y in ((1110, 60), (1150, 120), (560, 470), (40, 470)))}
<ellipse cx="830" cy="230" rx="380" ry="240" fill="url(#glow)"/>
<rect x="606" y="74" width="440" height="330" rx="30" fill="#1d2414" fill-opacity=".22"/>
<rect x="600" y="56" width="440" height="330" rx="30" fill="#e9ded8"/>
<image href="../../../app/assets/garden-on.jpg" x="580" y="46" width="480" height="360" clip-path="url(#card)" preserveAspectRatio="xMidYMid slice"/>
{phone(944, 108, 166, '../app/home.jpg')}
<text x="64" y="118" font-size="18" font-weight="600" fill="#dfe6c9" letter-spacing="3" {MONO}>DURONIC GHS37 · REWIRED</text>
<text x="60" y="210" font-size="88" font-weight="800" fill="#fbf8ef" letter-spacing="-3">SmartGarden</text>
<text x="64" y="268" font-size="28" font-weight="500" fill="#f1eedf">A hydroponic garden that runs</text>
<text x="64" y="306" font-size="28" font-weight="500" fill="#f1eedf">from your phone. No cloud.</text>
{pill(64, 348, "Lives in the lamp", 196)}
{pill(272, 348, "Runs offline", 156)}
{pill(440, 348, "Never forgets", 160)}
<text x="64" y="460" font-size="19" fill="#e4e8d2" {MONO}>http://smartgarden.local</text>
</svg>
'''

# ------------------------------------------------------------------ app showcase
SW, SH = 1200, 600
phones = [('ciclo', 'Light cycle', -2, 150), ('andamento', 'History', 2, 150), ('luce', 'Lighting', -1, 172), ('piante', 'Plants', 1, 172), ('home', 'Home', 0, 196)]
show = [f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {SW} {SH}" width="{SW}" height="{SH}" role="img" aria-labelledby="t d" {FONT}>',
        '<title id="t">The SmartGarden app</title>',
        '<desc id="d">Five real screens of the app: light cycle, lighting, home, plants and history.</desc>',
        f'<defs><linearGradient id="sbg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f7f4ec"/><stop offset="1" stop-color="#e9e4d6"/></linearGradient></defs>',
        f'<rect width="{SW}" height="{SH}" rx="28" fill="url(#sbg)"/>',
        f'<ellipse cx="{SW / 2}" cy="{SH - 92}" rx="500" ry="26" fill="{OLIVE}" fill-opacity=".10"/>']
for name, label, pos, w in phones:
    x = SW / 2 + pos * 214 - w / 2
    y = 262 - w * 780 / 360 / 2                    # every phone centred on the same line
    home = name == 'home'
    show.append(phone(x, y, w, f'../app/{name}.jpg'))
    show.append(f'<text x="{x + w / 2:.1f}" y="{SH - 34}" font-size="{22 if home else 20}" font-weight="{700 if home else 600}" fill="{"#3f4a33" if home else "#6b665c"}" text-anchor="middle">{label}</text>')
show.append('</svg>')

SRC.mkdir(parents=True, exist_ok=True)
(SRC / 'readme-cover.svg').write_text(cover)
(SRC / 'readme-app.svg').write_text('\n'.join(show) + '\n')

# ------------------------------------------------------------------ render
handler = functools.partial(http.server.SimpleHTTPRequestHandler, directory=str(ROOT))
class Quiet(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass
handler = functools.partial(Quiet, directory=str(ROOT))
srv = http.server.ThreadingHTTPServer(('127.0.0.1', 0), handler)
threading.Thread(target=srv.serve_forever, daemon=True).start()
port = srv.server_address[1]
for name, (w, h) in (('readme-cover', (W, H)), ('readme-app', (SW, SH))):
    png = OUT / f'{name}.png'
    subprocess.run([str(CHROME), '--headless=new', '--disable-gpu', '--hide-scrollbars', '--force-device-scale-factor=2',
                    f'--window-size={w},{h}', f'--screenshot={png}', '--default-background-color=00000000',
                    f'http://127.0.0.1:{port}/docs/images/source/{name}.svg'], check=True, capture_output=True)
    print(png, f'{png.stat().st_size // 1024} KB')
srv.shutdown()
