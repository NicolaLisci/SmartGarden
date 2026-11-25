#!/usr/bin/env python3
"""Draw the README's cover and app showcase as SVG with the pictures embedded, so GitHub
shows them without external requests. Run again after new screenshots or garden renders:
    python3 docs/tools/readme-art.py
"""
import base64
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
IMG = ROOT / 'docs' / 'images'
FONT = 'font-family="-apple-system, BlinkMacSystemFont, Segoe UI, Helvetica, Arial, sans-serif"'

def data(p):
    return 'data:image/jpeg;base64,' + base64.b64encode(p.read_bytes()).decode()

# ------------------------------------------------------------------ cover
W, H = 1280, 600
garden = data(ROOT / 'app' / 'assets' / 'garden-on.jpg')
pill = lambda x, y, t, w: (f'<rect x="{x}" y="{y}" width="{w}" height="38" rx="19" fill="#ffffff" fill-opacity=".14" stroke="#ffffff" stroke-opacity=".35"/>'
                           f'<text x="{x + w / 2}" y="{y + 25}" font-size="16" font-weight="600" fill="#f6f3ea" text-anchor="middle">{t}</text>')
cover = f'''<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 {W} {H}" width="{W}" height="{H}" {FONT}>
<defs>
  <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#4a5639"/><stop offset=".55" stop-color="#6f7a5a"/><stop offset="1" stop-color="#9aa37f"/></linearGradient>
  <radialGradient id="glow" cx=".5" cy=".42" r=".6"><stop offset="0" stop-color="#fff2c6" stop-opacity=".85"/><stop offset="1" stop-color="#fff2c6" stop-opacity="0"/></radialGradient>
  <clipPath id="card"><rect x="640" y="70" width="580" height="460" rx="36"/></clipPath>
  <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="18" stdDeviation="22" flood-color="#1d2414" flood-opacity=".45"/></filter>
  <pattern id="dots" width="22" height="22" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1.2" fill="#ffffff" fill-opacity=".09"/></pattern>
</defs>
<rect width="{W}" height="{H}" rx="28" fill="url(#bg)"/>
<rect width="{W}" height="{H}" rx="28" fill="url(#dots)"/>
<ellipse cx="930" cy="250" rx="420" ry="300" fill="url(#glow)"/>
<g filter="url(#shadow)"><rect x="640" y="70" width="580" height="460" rx="36" fill="#e9ded8"/></g>
<image href="{garden}" xlink:href="{garden}" x="625" y="62" width="610" height="458" clip-path="url(#card)" preserveAspectRatio="xMidYMid slice"/>
<text x="72" y="150" font-size="18" font-weight="600" fill="#dfe6c9" letter-spacing="3">DURONIC GHS37 · REWIRED</text>
<text x="68" y="245" font-size="96" font-weight="800" fill="#fbf8ef" letter-spacing="-3">SmartGarden</text>
<text x="72" y="305" font-size="27" font-weight="500" fill="#f1eedf">A hydroponic garden that runs</text>
<text x="72" y="342" font-size="27" font-weight="500" fill="#f1eedf">from your phone, with no cloud.</text>
{pill(72, 396, "Lives in the lamp", 186)}
{pill(270, 396, "Runs offline", 150)}
{pill(432, 396, "Never forgets", 160)}
<text x="72" y="500" font-size="17" fill="#e4e8d2">http://smartgarden.local</text>
</svg>
'''
(IMG / 'readme-cover.svg').write_text(cover)

# ------------------------------------------------------------------ app showcase
SHOTS = [('ciclo', 'Light cycle'), ('luce', 'Lighting'), ('home', 'Home'), ('piante', 'Plants'), ('andamento', 'History')]
W, H = 1280, 760
PW, PH = 240, 520                 # phone size at scale 1 (screens are 360×780)
out = [f'<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 {W} {H}" width="{W}" height="{H}" {FONT}>',
       '<defs>',
       '<linearGradient id="sbg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f7f4ec"/><stop offset="1" stop-color="#e9e4d6"/></linearGradient>',
       '<filter id="ph" x="-30%" y="-20%" width="160%" height="150%"><feDropShadow dx="0" dy="22" stdDeviation="20" flood-color="#2b2a22" flood-opacity=".28"/></filter>',
       '</defs>',
       f'<rect width="{W}" height="{H}" rx="28" fill="url(#sbg)"/>',
       f'<ellipse cx="{W / 2}" cy="{H - 70}" rx="520" ry="40" fill="#6f7a5a" fill-opacity=".10"/>']
layout = [(-2, .84, 0), (-1, .92, 0), (0, 1.06, 0), (1, .92, 0), (2, .84, 0)]
order = [0, 4, 1, 3, 2]          # draw the outer phones first, Home on top
for idx in order:
    name, label = SHOTS[idx]
    pos, s, _ = layout[idx]
    w, h = PW * s, PH * s
    cx = W / 2 + pos * 232
    x, y = cx - w / 2, 60 + (1.06 - s) * 260
    shot = data(IMG / 'app' / f'{name}.jpg')
    b = 10 * s
    out.append(f'<g filter="url(#ph)"><rect x="{x - b:.1f}" y="{y - b:.1f}" width="{w + 2 * b:.1f}" height="{h + 2 * b:.1f}" rx="{44 * s:.1f}" fill="#1c1c1e"/></g>')
    out.append(f'<clipPath id="c{idx}"><rect x="{x:.1f}" y="{y:.1f}" width="{w:.1f}" height="{h:.1f}" rx="{36 * s:.1f}"/></clipPath>')
    out.append(f'<image href="{shot}" xlink:href="{shot}" x="{x:.1f}" y="{y:.1f}" width="{w:.1f}" height="{h:.1f}" clip-path="url(#c{idx})" preserveAspectRatio="xMidYMid slice"/>')
    out.append(f'<rect x="{cx - 34 * s:.1f}" y="{y + 9 * s:.1f}" width="{68 * s:.1f}" height="{20 * s:.1f}" rx="{10 * s:.1f}" fill="#1c1c1e"/>')
    out.append(f'<text x="{cx:.1f}" y="{y + h + b + 40:.1f}" font-size="{17 if idx == 2 else 15}" font-weight="{700 if idx == 2 else 600}" fill="{"#3f4a33" if idx == 2 else "#6b665c"}" text-anchor="middle">{label}</text>')
out.append('</svg>')
(IMG / 'readme-app.svg').write_text('\n'.join(out) + '\n')
for f in ('readme-cover.svg', 'readme-app.svg'):
    print(IMG / f, f'{(IMG / f).stat().st_size // 1024} KB')
