#!/usr/bin/env python3
"""Draw docs/images/system-isometric.svg: an exploded isometric view of the Duronic GHS37 with
the SmartGarden controller in its lamp head. Facts come from specs/002 and specs/005 (parts,
positions, wiring); shapes and colours are illustrative. Run again after any change:
    python3 docs/tools/system-isometric.py
"""
from math import cos, sin, pi, atan2
from pathlib import Path
import random

OUT = Path(__file__).resolve().parents[1] / 'images' / 'system-isometric.svg'
C30, S30 = cos(pi / 6), 0.5
random.seed(7)

def iso(x, y, z):
    return ((x - y) * C30, (x + y) * S30 - z)

body = []                      # drawn in order: back to front
def pts(ps): return ' '.join(f'{X:.1f},{Y:.1f}' for X, Y in (iso(*p) for p in ps))
def poly(ps, fill, stroke='none', sw=0.8, extra=''):
    body.append(f'<polygon points="{pts(ps)}" fill="{fill}" stroke="{stroke}" stroke-width="{sw}" stroke-linejoin="round" {extra}/>')
def path(d, fill='none', stroke='none', sw=1, extra=''):
    body.append(f'<path d="{d}" fill="{fill}" stroke="{stroke}" stroke-width="{sw}" stroke-linecap="round" stroke-linejoin="round" {extra}/>')

def rrect(x0, x1, y0, y1, r, n=8):
    """Outline of a rounded rectangle in the x/y plane, counter-clockwise."""
    out = []
    for cx, cy, a0 in ((x1 - r, y0 + r, -90), (x1 - r, y1 - r, 0), (x0 + r, y1 - r, 90), (x0 + r, y0 + r, 180)):
        for i in range(n + 1):
            a = (a0 + 90 * i / n) * pi / 180
            out.append((cx + r * cos(a), cy + r * sin(a)))
    return out

def shade(base, k):
    r, g, b = (int(base[i:i + 2], 16) for i in (1, 3, 5))
    f = lambda c: max(0, min(255, int(c * k)))
    return f'#{f(r):02x}{f(g):02x}{f(b):02x}'

def solid(outline, z0, z1, color, top=None, opacity=1, stroke='#00000022', topextra=''):
    """Extruded outline: visible side faces shaded by their normal, then the top."""
    n = len(outline)
    faces = []
    for i in range(n):
        (ax, ay), (bx, by) = outline[i], outline[(i + 1) % n]
        nx, ny = by - ay, -(bx - ax)                       # outward normal (ccw)
        if nx + ny <= 0:                                   # faces away from the viewer
            continue
        ang = atan2(ny, nx)                                # 0 = +x (right face), 90° = +y (left face)
        k = 0.80 + 0.10 * sin(ang)                         # left faces a bit lighter than right
        faces.append((ax + ay + bx + by, [(ax, ay, z0), (bx, by, z0), (bx, by, z1), (ax, ay, z1)], shade(color, k)))
    for _, f, c in sorted(faces):
        poly(f, c, c, 0.6, f'fill-opacity="{opacity}" stroke-opacity="{opacity}"')
    poly([(x, y, z1) for x, y in outline], top or color, stroke, 0.8, f'fill-opacity="{opacity}" {topextra}')

def box(x0, x1, y0, y1, z0, z1, color, top=None):
    solid([(x0, y0), (x1, y0), (x1, y1), (x0, y1)], z0, z1, color, top)

def ellipse(cx, cy, z, r, fill, extra=''):
    X, Y = iso(cx, cy, z)
    body.append(f'<ellipse cx="{X:.1f}" cy="{Y:.1f}" rx="{r * 1.2247:.1f}" ry="{r * 0.7071:.1f}" fill="{fill}" {extra}/>')

def cylinder(cx, cy, z0, z1, r, light, dark, cap):
    X0, Y0 = iso(cx, cy, z0); X1, Y1 = iso(cx, cy, z1)
    rx, ry = r * 1.2247, r * 0.7071
    gid = f'cyl{len(body)}'
    body.append(f'<linearGradient id="{gid}" x1="0" x2="1"><stop offset="0" stop-color="{dark}"/><stop offset=".45" stop-color="{light}"/><stop offset="1" stop-color="{dark}"/></linearGradient>')
    body.append(f'<path d="M{X0 - rx:.1f},{Y0:.1f} L{X1 - rx:.1f},{Y1:.1f} A{rx:.1f},{ry:.1f} 0 0 1 {X1 + rx:.1f},{Y1:.1f} L{X0 + rx:.1f},{Y0:.1f} A{rx:.1f},{ry:.1f} 0 0 1 {X0 - rx:.1f},{Y0:.1f}Z" fill="url(#{gid})"/>')
    body.append(f'<ellipse cx="{X1:.1f}" cy="{Y1:.1f}" rx="{rx:.1f}" ry="{ry:.1f}" fill="{cap}"/>')

def wire(points3d, color, w=2.2):
    """Smooth wire through 3D points (Catmull-Rom → cubic Bézier), with a light casing."""
    P = [iso(*p) for p in points3d]
    d = f'M{P[0][0]:.1f},{P[0][1]:.1f}'
    for i in range(len(P) - 1):
        p0, p1, p2, p3 = P[max(i - 1, 0)], P[i], P[i + 1], P[min(i + 2, len(P) - 1)]
        c1 = (p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6)
        c2 = (p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6)
        d += f' C{c1[0]:.1f},{c1[1]:.1f} {c2[0]:.1f},{c2[1]:.1f} {p2[0]:.1f},{p2[1]:.1f}'
    path(d, stroke='#ffffff', sw=w + 1.6, extra='stroke-opacity=".7"')
    path(d, stroke=color, sw=w)

badges = []
def badge(n, p, dx=0, dy=0, color='#3f4a33'):
    X, Y = iso(*p); badges.append((n, X + dx, Y + dy, color))

# ---------------------------------------------------------------- ground and base
GROUND = rrect(-40, 340, -30, 150, 60)
X, Y = iso(150, 60, 0)
body.append(f'<ellipse cx="{X:.1f}" cy="{Y + 6:.1f}" rx="300" ry="95" fill="url(#ground)"/>')

BX, BY, BZ = 300, 120, 72
base = rrect(0, BX, 0, BY, 24)
# x-ray content first: water, pump, power module
solid(rrect(10, BX - 10, 10, BY - 10, 18), 4, 44, '#9cc3d6', '#bcd9e6', opacity=.55, stroke='none')
cylinder(210, 92, 6, 30, 11, '#e9e4d8', '#b9b2a2', '#f3efe6')                 # pump
box(204, 282, 6, 26, 8, 30, '#5f8a4c', '#77a362')                              # power module PCB stack
for i, x in enumerate((214, 238, 262)):                                       # DC1 DC2 DC3 sockets
    cylinder(x, 8, 22, 30, 4, '#3b3b3b', '#151515', '#555')
solid(base, 0, BZ, '#f2efe7', '#fbfaf6', opacity=.72, stroke='#00000030')
# water window, pods and plants
ellipse(272, 92, BZ + .2, 9, '#a8cbd9')
PODS = [(48, 34), (112, 34), (188, 34), (252, 34), (80, 90), (150, 90), (220, 90)]
for x, y in PODS:
    ellipse(x, y, BZ + .3, 13, '#d9d3c4')
    ellipse(x, y, BZ + .5, 9.5, '#2b2925')
GREENS = ['#4f8a3c', '#62a04a', '#3f7431', '#78b25a', '#2f5f27', '#8cc06a']
for k, (x, y) in enumerate(sorted(PODS, key=lambda p: p[0] + p[1])):
    h = 26 + random.random() * 16
    path(f'M{iso(x, y, BZ)[0]:.1f},{iso(x, y, BZ)[1]:.1f} L{iso(x, y, BZ + h * .6)[0]:.1f},{iso(x, y, BZ + h * .6)[1]:.1f}', stroke='#3d6b2c', sw=1.6)
    leaves = []
    for j in range(19):
        a = random.random() * 2 * pi; rr = random.random() * 11
        lz = BZ + 8 + random.random() * h
        leaves.append((x + rr * cos(a), y + rr * sin(a), lz))
    for lx, ly, lz in sorted(leaves, key=lambda p: p[0] + p[1] + p[2] * .2):
        Xl, Yl = iso(lx, ly, lz)
        col = random.choice(GREENS) if k != 0 else random.choice(['#6b3f6e', '#7e4b80', '#5a3060'])  # basilico porpora
        rot = random.randint(-60, 60)
        body.append(f'<ellipse cx="{Xl:.1f}" cy="{Yl:.1f}" rx="{6 + random.random() * 4:.1f}" ry="{3.2 + random.random() * 1.6:.1f}" transform="rotate({rot} {Xl:.1f} {Yl:.1f})" fill="{col}" stroke="#00000022" stroke-width=".5"/>')
badge(1, (20, 110, BZ), -26, 10)
badge(2, (215, 104, 18), 18, 18)
badge(3, (282, 16, 18), 26, 2)

# adapter lead into DC1 at the back
wire([(214, 4, 26), (214, -30, 20), (240, -70, 6), (300, -90, 2)], '#262626', 3)
X, Y = iso(300, -90, 2)
body.append(f'<rect x="{X - 2:.1f}" y="{Y - 7:.1f}" width="26" height="15" rx="3" fill="#2a2a2a"/>')
badge(4, (300, -90, 2), 36, 0)

# ---------------------------------------------------------------- light from the LED panel
PZ = 300
X0, Y0 = iso(-2, 2, PZ); X1, Y1 = iso(302, 2, PZ); X2, Y2 = iso(302, 98, PZ); X3, Y3 = iso(-2, 98, PZ)
B0 = iso(10, 10, BZ + 30); B1 = iso(290, 10, BZ + 30); B2 = iso(290, 110, BZ + 30); B3 = iso(10, 110, BZ + 30)
body.append(f'<polygon points="{X3:.1f},{Y3:.1f} {X2:.1f},{Y2:.1f} {X1:.1f},{Y1:.1f} {B1[0]:.1f},{B1[1]:.1f} {B2[0]:.1f},{B2[1]:.1f} {B3[0]:.1f},{B3[1]:.1f}" fill="url(#beam)"/>')

# ---------------------------------------------------------------- rod: three wires
cylinder(150, 6, BZ, PZ, 5.5, '#eef0f2', '#9aa0a6', '#d4d7da')
badge(5, (150, 6, 190), 16, 0)

# ---------------------------------------------------------------- lamp head, exploded
HEAD = rrect(-12, 312, -6, 106, 26)
# 1) LED panel (faces down into the garden)
solid(rrect(-4, 304, 2, 98, 20), PZ, PZ + 4, '#f6f4ee', '#fbfaf6')
for gx in range(22, 300, 46):
    for gy in (24, 60, 84):
        for kk in range(6):
            a = 2 * pi * kk / 6
            col = '#5b8cf0' if kk in (0, 3) else ('#ff6b57' if kk == 1 else '#ffd36a')
            X, Y = iso(gx + 8 * cos(a), gy + 8 * sin(a), PZ + 4)
            body.append(f'<circle cx="{X:.1f}" cy="{Y:.1f}" r="4.2" fill="{col}" opacity=".22"/>')
            body.append(f'<circle cx="{X:.1f}" cy="{Y:.1f}" r="1.9" fill="{col}"/>')
badge(6, (304, 96, PZ + 4), 24, 8)

# guides between layers
SZ, CZ = 380, 520
for (x, y) in ((-12, 106), (312, 106), (312, -6)):
    a, b = iso(x, y, PZ + 4), iso(x, y, SZ)
    body.append(f'<line x1="{a[0]:.1f}" y1="{a[1]:.1f}" x2="{b[0]:.1f}" y2="{b[1]:.1f}" stroke="#a39d8f" stroke-width=".8" stroke-dasharray="2 4"/>')
# rod wires up into J3
wire([(150, 6, PZ + 4), (150, 6, SZ - 20), (190, 40, SZ + 2), (222, 61, SZ + 10)], '#8a8a8a', 1.4)

# 2) shell floor with the boards
solid(HEAD, SZ, SZ + 6, '#ece8df', '#f7f5f0')
F = SZ + 6
# ribs moulded in the shell
for x in (30, 80, 250, 290):
    a, b = iso(x, 0, F), iso(x, 100, F)
    body.append(f'<line x1="{a[0]:.1f}" y1="{a[1]:.1f}" x2="{b[0]:.1f}" y2="{b[1]:.1f}" stroke="#d9d3c6" stroke-width="1.2"/>')
# lamp board Y2020
box(105, 238, 54, 88, F, F + 2.4, '#2f7d3f', '#3d9a50')
for (x0, x1, y0, y1) in ((128, 138, 60, 68), (146, 156, 60, 68), (170, 186, 70, 80), (196, 204, 74, 82)):
    box(x0, x1, y0, y1, F + 2.4, F + 5, '#202020', '#2c2c2c')                  # Q4, Q5, MCU, regulator
box(212, 232, 57, 65, F + 2.4, F + 9, '#efe9dc', '#fbf7ee')                    # J3
box(112, 124, 72, 80, F + 2.4, F + 8, '#efe9dc', '#fbf7ee')                    # J1-W to LED panel
box(112, 124, 58, 66, F + 2.4, F + 8, '#efe9dc', '#fbf7ee')                    # J2-B
cylinder(160, 80, F + 2.4, F + 9, 3, '#d8d8d8', '#8f8f8f', '#bdbdbd')
# LM2596 module
box(12, 56, 36, 82, F, F + 2, '#2f5fae', '#3a70c8')
box(26, 42, 50, 66, F + 2, F + 13, '#1f1f1f', '#2e2e2e')                       # inductor
cylinder(18, 42, F + 2, F + 14, 4, '#3a3a3a', '#111', '#888')                   # capacitors
cylinder(48, 76, F + 2, F + 14, 4, '#3a3a3a', '#111', '#888')
box(44, 52, 38, 46, F + 2, F + 7, '#3d6fd0', '#5a8be6')                         # trimmer
# NodeMCU
box(60, 100, 14, 70, F, F + 2.2, '#1d1d1d', '#2a2a2a')
box(68, 92, 18, 40, F + 2.2, F + 4.6, '#a9afb5', '#d6dade')                     # ESP-12 can
box(74, 86, 64, 72, F + 2.2, F + 5.4, '#9ea4aa', '#c9ced3')                     # micro USB
path(' '.join(('M' if i == 0 else 'L') + f'{iso(70 + i * 2.4, 16, F + 4.7)[0]:.1f},{iso(70 + i * 2.4, 16 + (i % 2) * 2, F + 4.7)[1]:.1f}' for i in range(9)), stroke='#c8a23a', sw=1)
for i in range(14):                                                             # header pins
    for xx in (61.5, 98.5):
        X, Y = iso(xx, 20 + i * 3.5, F + 2.4)
        body.append(f'<circle cx="{X:.1f}" cy="{Y:.1f}" r=".9" fill="#d7b65a"/>')
# 330 Ω resistors and PC817C
for i, y in enumerate((24, 31, 38)):
    cylinder(110, y, F + 1, F + 1.2, 2.2, '#e8cf9e', '#b48e55', '#d8b77a')
    X, Y = iso(110, y, F + 1.2)
    body.append(f'<rect x="{X - 6:.1f}" y="{Y - 2:.1f}" width="12" height="4" rx="2" fill="#d9b97f" stroke="#8a6a35" stroke-width=".5"/>')
box(168, 180, 32, 44, F, F + 4, '#222222', '#333333')
# wiring
wire([(232, 62, F + 9), (240, 48, F + 4), (140, 46, F + 2), (54, 46, F + 8)], '#d83a2e')          # J3 + → IN+
wire([(212, 63, F + 9), (204, 96, F + 2), (60, 96, F + 2), (40, 82, F + 4)], '#1b1b1b')            # J3 − → IN−
wire([(16, 80, F + 6), (10, 92, F + 4), (58, 94, F + 4), (64, 68, F + 4)], '#d83a2e', 1.8)       # OUT+ → Vin
wire([(100, 24, F + 3), (110, 24, F + 4), (132, 30, F + 6), (133, 60, F + 6)], '#fafafa', 2.4)    # D1 → W
wire([(100, 31, F + 3), (110, 31, F + 4), (150, 40, F + 6), (151, 60, F + 6)], '#3a6ee0')          # D5 → B
wire([(100, 38, F + 3), (110, 38, F + 4), (168, 38, F + 4)], '#e3a12f')                            # D7 → PC817C
wire([(180, 38, F + 4), (205, 42, F + 6), (214, 58, F + 10)], '#e3a12f')                           # → J3 C
# low front walls of the shell, see-through
n = len(HEAD)
for i in range(n):
    (ax, ay), (bx, by) = HEAD[i], HEAD[(i + 1) % n]
    if (by - ay) - (bx - ax) > 0:
        poly([(ax, ay, F), (bx, by, F), (bx, by, F + 18), (ax, ay, F + 18)], '#f4f1ea', '#00000018', .6, 'fill-opacity=".28"')
badge(7, (238, 88, F + 2), 22, 14)
badge(8, (12, 82, F + 12), -28, 4)
badge(9, (80, 14, F + 4), -6, -20)
badge(10, (174, 32, F + 4), 6, -22, '#9a6a12')

# 3) cover with the touch keys
solid(HEAD, CZ, CZ + 12, '#f7f5f0', '#ffffff', opacity=.62, stroke='#00000030')
for i, x in enumerate((128, 150, 172)):
    ellipse(x, 22, CZ + 12.3, 7, '#00000000', 'stroke="#8f897d" stroke-width="1"')
    ellipse(x, 22, CZ + 12.3, 2.2, '#8f897d')
badge(11, (312, 50, CZ + 12), 26, 0)

# ---------------------------------------------------------------- assemble
nums = []
for s in body:
    for key in ('points="', ' d="'):
        if key in s:
            raw = s.split(key)[1].split('"')[0].replace('M', ' ').replace('L', ' ').replace('C', ' ').replace('Z', ' ')
            for tok in raw.replace(',', ' ').split():
                try: nums.append(float(tok))
                except ValueError: pass
xs, ys = nums[0::2], nums[1::2]
DW = max(xs) - min(xs)
ox, oy = -min(xs) + 40, -min(ys) + 110
LX = DW + 110                                     # legend column
W = LX + 360
H = max(max(ys) + oy + 40, 900)

LEGEND = [
    ('Base', 'Water tank with seven pods; the plants grow here.'),
    ('Pump', 'Sits in the water, plugged into socket DC2.'),
    ('Power module', 'DC1 adapter in, DC2 pump, DC3 rod plug. Its Q2 switches the pump on command C.'),
    ('24 V adapter', 'The only power input: 24 V DC, 25 W.'),
    ('Telescopic rod', 'Three wires only: +24 V, GND and the pump command C.'),
    ('LED panel', 'Faces down: W = white + red LEDs, B = blue LEDs. No resistors, fed by the lamp board.'),
    ('Lamp board "Y2020"', 'The original: touch keys, its own MCU, J3 from the rod, Q4/Q5 for W and B.'),
    ('LM2596', '24 V from J3 down to 5.0 V for the NodeMCU.'),
    ('NodeMCU (ESP8266)', 'Wi-Fi, the app, the light cycle, settings and log. Added by SmartGarden.'),
    ('Our three commands', 'D1 → 330 Ω → W · D5 → 330 Ω → B · D7 → PC817C → J3 C (pump: still open).'),
    ('Cover', 'Top of the head with the lamp\'s touch keys, which keep working.'),
]

def wrap(t, n=46):
    words, lines, cur = t.split(), [], ''
    for w in words:
        if len(cur) + len(w) + 1 > n: lines.append(cur); cur = w
        else: cur = f'{cur} {w}'.strip()
    return lines + [cur]

out = [f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W:.0f} {H:.0f}" width="{W:.0f}" height="{H:.0f}" font-family="-apple-system, BlinkMacSystemFont, Segoe UI, Helvetica, Arial, sans-serif">',
       '<defs>',
       '<linearGradient id="bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fbfaf6"/><stop offset="1" stop-color="#eeeadf"/></linearGradient>',
       '<radialGradient id="ground"><stop offset="0" stop-color="#3d3a33" stop-opacity=".18"/><stop offset="1" stop-color="#3d3a33" stop-opacity="0"/></radialGradient>',
       '<linearGradient id="beam" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff3c4" stop-opacity=".75"/><stop offset="1" stop-color="#fff3c4" stop-opacity="0"/></linearGradient>',
       '<filter id="soft" x="-10%" y="-10%" width="120%" height="120%"><feDropShadow dx="0" dy="3" stdDeviation="4" flood-color="#3d3a33" flood-opacity=".14"/></filter>',
       '</defs>',
       f'<rect width="{W:.0f}" height="{H:.0f}" rx="22" fill="url(#bg)"/>',
       f'<text x="40" y="52" font-size="26" font-weight="700" fill="#24221e" letter-spacing="-.3">Where SmartGarden lives</text>',
       f'<text x="40" y="78" font-size="15" fill="#6b665c">An exploded view of the Duronic GHS37. The controller sits in the lamp head, above the LEDs.</text>',
       f'<g transform="translate({ox:.1f},{oy:.1f})">', *body]
for nmb, X, Y, col in badges:
    out.append(f'<g filter="url(#soft)"><circle cx="{X:.1f}" cy="{Y:.1f}" r="11" fill="{col}"/><text x="{X:.1f}" y="{Y + 4.3:.1f}" font-size="12" font-weight="700" fill="#fff" text-anchor="middle">{nmb}</text></g>')
out.append('</g>')
y = 112
for i, (title, text) in enumerate(LEGEND, 1):
    lines = wrap(text)
    h = 30 + 17 * len(lines)
    col = '#9a6a12' if i == 10 else '#3f4a33'
    ours = i in (8, 9, 10)
    out.append(f'<g filter="url(#soft)"><rect x="{LX}" y="{y}" width="330" height="{h}" rx="12" fill="{"#f3f6ee" if ours else "#ffffff"}" stroke="{"#b9c9a6" if ours else "#e6e1d6"}"/></g>')
    out.append(f'<circle cx="{LX + 22}" cy="{y + 21}" r="11" fill="{col}"/><text x="{LX + 22}" y="{y + 25.3}" font-size="12" font-weight="700" fill="#fff" text-anchor="middle">{i}</text>')
    out.append(f'<text x="{LX + 42}" y="{y + 26}" font-size="14.5" font-weight="650" fill="#24221e">{title}</text>')
    for j, ln in enumerate(lines):
        out.append(f'<text x="{LX + 42}" y="{y + 45 + 17 * j}" font-size="12.5" fill="#5c574d">{ln.replace("&", "&amp;")}</text>')
    y += h + 10
out.append(f'<text x="{LX}" y="{y + 18}" font-size="11.5" fill="#8a8478">Green cards: added by SmartGarden. Everything else is the original lamp.</text>')
out.append('</svg>')
H2 = max(H, y + 50)
svg = '\n'.join(out).replace(f'height="{H:.0f}"', f'height="{H2:.0f}"').replace(f'0 0 {W:.0f} {H:.0f}', f'0 0 {W:.0f} {H2:.0f}')
OUT.write_text(svg + '\n')
print(OUT, f'{W:.0f}x{H2:.0f}')
