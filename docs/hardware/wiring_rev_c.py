#!/usr/bin/env python3
"""Generate docs/hardware/wiring-rev-c.svg: every connection of the lamp-head controller,
soldered point to point (no carrier board). Spec 005, layout Rev C.

Run: python3 docs/hardware/wiring_rev_c.py
The connection list mirrors specs/005-lamp-head-controller/plan.md; change both together.
"""
from pathlib import Path

W, H = 1600, 1130
s = []
INK, MUT = "#1c2227", "#5b6770"
RED, BLK, ORA, YEL, GRN, BLU = "#d42a2a", "#161616", "#f07a00", "#e0ae00", "#2e9e4f", "#1f6feb"


def R(x, y, w, h, f, st="none", rx=0, sw=1.5, dash=""):
    d = f' stroke-dasharray="{dash}"' if dash else ""
    s.append(f'<rect x="{x:.1f}" y="{y:.1f}" width="{w:.1f}" height="{h:.1f}" rx="{rx}" fill="{f}" stroke="{st}" stroke-width="{sw}"{d}/>')


def C(x, y, r, f, st="none", sw=1.2):
    s.append(f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{r}" fill="{f}" stroke="{st}" stroke-width="{sw}"/>')


def P(d, st, sw=2, dash=""):
    da = f' stroke-dasharray="{dash}"' if dash else ""
    s.append(f'<path d="{d}" fill="none" stroke="{st}" stroke-width="{sw}" stroke-linecap="round" stroke-linejoin="round"{da}/>')


def T(x, y, t, sz=16, a="start", c=INK, w=400):
    t = t.replace("&", "&amp;").replace("<", "&lt;")
    s.append(f'<text x="{x:.1f}" y="{y:.1f}" font-size="{sz}" text-anchor="{a}" fill="{c}" font-weight="{w}">{t}</text>')


def wire(d, col, n=None, at=None):
    P(d, "#ffffff", 9)
    P(d, col, 5)
    if n is not None:
        x, y = at
        C(x, y, 15, "#fff", col, 3.5)
        T(x, y + 6, str(n), 16, "middle", INK, 700)


def tag(x, y, w, text, col):
    R(x, y - 17, w, 34, "#fff", col, 8, 3)
    T(x + w / 2, y + 6, text, 16, "middle", INK, 700)


def resistor(x, y):
    """Horizontal 330 ohm resistor, body from x to x+60, on row y."""
    R(x, y - 9, 60, 18, "#5d9be0", "#2f5e93", 8, 1.2)
    for n, col in enumerate(["#f08a00", "#f08a00", "#151515", "#151515", "#7b4a1e"]):
        R(x + 9 + n * 8 + (5 if n == 4 else 0), y - 9, 4, 18, col)
    T(x + 30, y - 15, "330 Ω", 13, "middle", INK, 600)


s.append(f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}" font-family="Helvetica, Arial, sans-serif">')
R(0, 0, W, H, "#eceff1")
T(40, 50, "Scheda SmartGarden nella lampada: tutti i collegamenti", 30, "start", INK, 700)
T(40, 82, "Saldature dirette, senza basetta. I numeri sui fili corrispondono all'elenco in basso.", 18, "start", MUT)

# ---------------- lamp board (already in the lamp) ----------------
def px(x):
    return 60 + (x - 305) * 0.424


def py(y):
    return 120 + y * 0.44


T(185, 112, "Scheda della lampada (c'è già)", 17, "middle", INK, 700)
R(60, 120, 250, 780, "#1f6b3a", "#0f3d20", 6)
R(px(480), py(360), 94, 430, "#17532c", "none", 4)
for n, t in enumerate(["zona dei tasti", "a sfioro:", "niente fili qui"]):
    T(px(480) + 47, py(790) + n * 19, t, 14, "middle", "#d6f0dc", 600 if n == 0 else 400)
C(px(655), py(45) + 6, 9, "#eceae4", "#8d9398")
C(px(640), py(1720), 9, "#eceae4", "#8d9398")
for y in (148, 166, 184):                       # rod wires + J3
    P(f"M20 {y} L62 {y}", "#9aa1a7", 4)
R(58, py(20), 60, 62, "#e9e6dc", "#a9a69c", 3)
for y in (148, 166, 184):
    R(118, y - 4, 15, 8, "#d9b45a")
T(88, 210, "J3", 15, "middle", "#fff", 700)
R(px(380), py(215), 60, 52, "#141414", "#000", 2, 1)
T(px(380) + 30, py(215) + 31, "78M12", 11, "middle", "#ddd")
R(px(760), py(215), 50, 46, "#141414", "#000", 2, 1)
T(px(760) + 25, py(215) + 28, "78M05", 11, "middle", "#ddd")
C(px(660), py(175), 14, "#c3c8cc", "#666")
C(px(640), py(300), 14, "#c3c8cc", "#666")
C(px(780), py(410), 14, "#c3c8cc", "#666")
R(px(730), py(830), 30, 56, "#141414", "#000", 2, 1)
R(58, py(1130), 60, 56, "#e9e6dc", "#a9a69c", 3)
T(126, py(1130) + 22, "J1-W", 13, "start", "#fff", 700)
R(58, py(1370), 60, 64, "#e9e6dc", "#a9a69c", 3)
T(126, py(1370) + 20, "J2-B", 13, "start", "#fff", 700)
for n, y in enumerate((1410, 1480, 1550)):
    R(px(530), py(y), 15, 14, "#141414", "#000", 1, 0.8)
    T(px(530) - 4, py(y) + 12, ["Q5", "Q4", "Q3"][n], 10, "end", "#fff")
for y, lab in ((1415, "103"), (1447, "472"), (1482, "472"), (1514, "103")):
    R(px(620), py(y), 30, 10, "#c9cdd0")
    R(px(620) + 7, py(y), 16, 10, "#1a1a1a")
    T(px(620) + 15, py(y) + 9, lab, 8, "middle", "#eee")
R(px(700), py(1420), 70, 36, "#141414", "#000", 2, 1)
T(px(700) + 35, py(1420) + 23, "U6", 12, "middle", "#ddd")
R(px(370), py(1600), 62, 62, "#1c1c1c", "#000", 6)

# connection tags beside the lamp board
P("M136 140 L326 140 M136 192 L326 232", MUT, 1.5, "5 5")
tag(330, 150, 104, "J3  +", RED)
tag(330, 190, 104, "J3  −", BLK)
tag(330, 230, 104, "J3  C", BLU)
T(330, 122, "J3: quale piedino è +, − e C si conferma col tester", 13, "start", MUT)
gx = px(620)
R(gx - 4, py(1440), 38, 34, "none", "#fff", 5, 2, "4 3")
P(f"M{gx + 34} {py(1445)} L326 745 M{gx + 34} {py(1505)} L326 815", MUT, 1.5, "5 5")
tag(330, 760, 140, "comando B", GRN)
tag(330, 800, 140, "comando W", YEL)
T(330, 838, "capo della resistenza «472»", 13, "start", MUT)
T(330, 855, "dal lato del transistor:", 13, "start", MUT)
T(330, 872, "verso massa legge 10 kΩ", 13, "start", MUT)

# ---------------- NodeMCU (bare, no pins) ----------------
NX, NY, NW, NH = 760, 250, 280, 522
PY0, PITCH = 351, 22.9
LX, RX = NX + 26, NX + NW - 26
LEFT = ["3V3", "GND", "TX", "RX", "D8", "D7", "D6", "D5", "GND", "3V3", "D4", "D3", "D2", "D1", "D0"]
RIGHT = ["Vin", "GND", "RST", "EN", "3V3", "GND", "SK", "S0", "SC", "S1", "S2", "S3", "VU", "GND", "A0"]
USED_L, USED_R = {1: BLK, 5: BLU, 7: GRN, 13: YEL}, {0: ORA, 1: BLK}


def ly(n):
    return PY0 + PITCH * n


T(NX + NW / 2, NY + NH + 28, "NodeMCU senza piedini (USB in alto)", 17, "middle", INK, 700)
R(NX, NY, NW, NH, "#1e2227", "#000", 10, 1.5)
R(NX + 110, NY - 8, 60, 34, "#c3c8cc", "#7e8489", 4, 1.2)
T(NX + 140, NY + 46, "USB", 13, "middle", "#aeb4b9")
R(NX + 88, NY + 90, 104, 44, "#111", "none", 3)
T(NX + 140, NY + 118, "CH340", 13, "middle", "#9aa0a6")
R(NX + 80, NY + 300, 120, 130, "#c3c8cc", "#8f959a", 4, 1.2)
T(NX + 140, NY + 372, "ESP-12", 16, "middle", "#4b5157", 700)
P(f"M{NX + 70} {NY + 500} h20 v-34 h20 v34 h20 v-34 h20 v34 h20 v-34 h20 v34 h20", "#d9b45a", 4)
T(NX + 140, NY + 470, "antenna", 12, "middle", "#aeb4b9")
for n in range(15):
    for x, names, used, anchor, dx in ((LX, LEFT, USED_L, "start", 16), (RX, RIGHT, USED_R, "end", -16)):
        on = n in used
        C(x, ly(n), 8 if on else 6, "#d9b45a", used[n] if on else "#7a6427", 4 if on else 1)
        C(x, ly(n), 2.6, "#1e2227")
        T(x + dx, ly(n) + 5, names[n], 14 if on else 12, anchor, "#fff" if on else "#8a9299", 700 if on else 400)

# ---------------- LM2596 ----------------
MX, MY, MW, MH = 1240, 400, 180, 390
T(MX + MW / 2, MY + MH + 76, "LM2596 (regolato a 5,0 V)", 17, "middle", INK, 700)
R(MX, MY, MW, MH, "#2458a8", "#173a70", 6, 1.5)
C(MX + 90, MY + 95, 32, "#c3c8cc", "#555")
T(MX + 90, MY + 100, "220 µF", 12, "middle", "#333")
R(MX + 40, MY + 150, 100, 92, "#2b2b2b", "#000", 8)
T(MX + 90, MY + 204, "470", 18, "middle", "#ddd", 700)
R(MX + 52, MY + 258, 76, 44, "#111", "none", 3)
C(MX + 90, MY + 330, 28, "#c3c8cc", "#555")
T(MX + 90, MY + 335, "100 µF", 12, "middle", "#333")
R(MX + 132, MY + 70, 34, 44, "#3f74c9", "#1b3f7a", 3)
C(MX + 149, MY + 92, 7, "#d9b45a")
T(MX + 149, MY + 130, "trimmer", 11, "middle", "#cfe0ff")
PADS = {"OUT+": (MX + 22, MY + 22), "OUT−": (MX + MW - 22, MY + 22), "IN+": (MX + 22, MY + MH - 22), "IN−": (MX + MW - 22, MY + MH - 22)}
for name, (x, y) in PADS.items():
    R(x - 13, y - 13, 26, 26, "#d9b45a", "#7a6427", 3, 1)
    T(x + (-20 if "+" in name else 20), y + 6, name, 15, "end" if "+" in name else "start", INK, 700)
T(MX + MW / 2, MY + MH + 96, "segui le scritte IN+, IN−, OUT+, OUT− stampate sul modulo", 13, "middle", MUT)

# ---------------- PC817C ----------------
OX, OY = 520, 410
T(OX + 40, OY - 16, "PC817C", 17, "middle", INK, 700)
PIN = {2: (610, ly(5) - 36), 1: (610, ly(5)), 3: (510, ly(5) - 36), 4: (510, ly(5))}
for n, (x, y) in PIN.items():
    P(f"M{x} {y} L{560} {y}", "#c3c8cc", 6)
R(OX + 8, OY, 84, 76, "#202020", "#000", 5, 1.2)
C(OX + 58, OY + 66, 4, "#f2f2f2")
for n, (x, y) in PIN.items():
    T(OX + (76 if x > 560 else 16), y + 6, str(n), 15, "middle", "#fff", 700)
T(OX + 40, OY + 98, "pallino = piedino 1", 13, "middle", MUT)

# ---------------- wires ----------------
rd7, rd5, rd1 = ly(5), ly(7), ly(13)
for y in (rd7, rd5, rd1):
    P(f"M{LX} {y} L640 {y}", "#c3c8cc", 4)
    resistor(650, y)
vin, gnd_r, gnd_l = (RX, ly(0)), (RX, ly(1)), (LX, ly(1))
op, om, ip, im = PADS["OUT+"], PADS["OUT−"], PADS["IN+"], PADS["IN−"]

wire(f"M434 150 H1540 V830 H{ip[0]} V{ip[1]}", RED, 1, (900, 150))
wire(f"M434 190 H1515 V810 H{im[0]} V{im[1]}", BLK, 2, (980, 190))
wire(f"M{op[0]} {op[1]} V{vin[1]} H{vin[0]}", ORA, 3, (1170, vin[1]))
wire(f"M{PIN[4][0]} {PIN[4][1]} H482 V225 H1100 V{vin[1]}", ORA, 9, (640, 225))
C(1100, vin[1], 7, ORA)
wire(f"M{om[0]} {om[1]} V{MY - 26} H1190 V{gnd_r[1]} H{gnd_r[0]}", BLK, 4, (1190, 392))
wire(f"M650 {rd1} H600 V800 H472", YEL, 5, (600, 730))
wire(f"M650 {rd5} H560 V760 H472", GRN, 6, (560, 640))
wire(f"M650 {rd7} H{PIN[1][0]}", BLU, 7, (742, rd7))
wire(f"M{PIN[2][0]} {PIN[2][1]} H632 V{gnd_l[1]} H{gnd_l[0]}", BLK, 8, (700, gnd_l[1]))
wire(f"M{PIN[3][0]} {PIN[3][1]} H458 V230 H434", BLU, 10, (458, 330))
for x, y in (op, om, ip, im, vin, gnd_r, gnd_l, (LX, rd7), (LX, rd5), (LX, rd1)):
    C(x, y, 4.5, "#d3d7da", "#7f868b", 1)

# ---------------- list ----------------
R(40, 925, W - 80, 180, "#ffffff", "#d3d9de", 12, 1.5)
ITEMS = [
    (1, RED, "J3 + → LM2596 IN+"), (2, BLK, "J3 − → LM2596 IN−"),
    (3, ORA, "LM2596 OUT+ → NodeMCU Vin (solo dopo aver regolato i 5,0 V)"), (4, BLK, "LM2596 OUT− → NodeMCU GND, accanto a Vin"),
    (5, YEL, "NodeMCU D1 → 330 Ω → comando W (LED bianchi)"), (6, GRN, "NodeMCU D5 → 330 Ω → comando B (LED canale B)"),
    (7, BLU, "NodeMCU D7 → 330 Ω → PC817C piedino 1"), (8, BLK, "PC817C piedino 2 → NodeMCU GND, accanto a 3V3"),
    (9, ORA, "PC817C piedino 4 → 5 V: insieme al filo 3, nel foro Vin"), (10, BLU, "PC817C piedino 3 → J3 C (comando pompa)"),
]
for i, (n, col, text) in enumerate(ITEMS):
    cx = 70 + (i % 2) * 760
    cy = 955 + (i // 2) * 30
    C(cx, cy, 12, "#fff", col, 3.5)
    T(cx, cy + 5, str(n), 13, "middle", INK, 700)
    T(cx + 22, cy + 6, text, 16, "start", INK)
T(W - 60, 1123, "Dove due fili si incrociano nel disegno, non si toccano. Ogni giunzione va isolata con guaina o nastro.", 14, "end", MUT)
s.append("</svg>")
out = Path(__file__).with_name("wiring-rev-c.svg")
out.write_text("\n".join(s), encoding="utf-8")
print("wrote", out)
