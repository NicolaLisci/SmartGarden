#!/usr/bin/env python3
"""Generate docs/hardware/lm2596-setup.svg: how to set the LM2596 output to 5.0 V
before it is connected to the NodeMCU (spec 005, guide step "Regola i 5 V").

Run: python3 docs/hardware/lm2596_setup.py
"""
from pathlib import Path

W, H = 1600, 980
s = []
INK, MUT, RED, BLK, HL = "#1c2227", "#5b6770", "#d42a2a", "#161616", "#1f6feb"


def R(x, y, w, h, f, st="none", rx=0, sw=1.5):
    s.append(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{rx}" fill="{f}" stroke="{st}" stroke-width="{sw}"/>')


def C(x, y, r, f, st="none", sw=1.5):
    s.append(f'<circle cx="{x}" cy="{y}" r="{r}" fill="{f}" stroke="{st}" stroke-width="{sw}"/>')


def P(d, st, sw=2, f="none", dash=""):
    da = f' stroke-dasharray="{dash}"' if dash else ""
    s.append(f'<path d="{d}" fill="{f}" stroke="{st}" stroke-width="{sw}" stroke-linecap="round" stroke-linejoin="round"{da}/>')


def T(x, y, t, sz=18, a="start", c=INK, w=400):
    s.append(f'<text x="{x}" y="{y}" font-size="{sz}" text-anchor="{a}" fill="{c}" font-weight="{w}">{t}</text>')


def wire(d, col, sw=7):
    P(d, "#fff", sw + 5)
    P(d, col, sw)


def badge(x, y, n):
    C(x, y, 24, HL, "#fff", 4)
    T(x, y + 9, str(n), 26, "middle", "#fff", 700)


s.append(f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}" font-family="Helvetica, Arial, sans-serif">')
s.append('<defs><marker id="ah" markerWidth="10" markerHeight="10" refX="6" refY="5" orient="auto"><path d="M0 0 L10 5 L0 10 Z" fill="#1f6feb"/></marker></defs>')
R(0, 0, W, H, "#eceff1")
T(40, 54, "Regolare il LM2596 a 5,0 V", 32, "start", INK, 700)
T(40, 88, "Solo il modulo blu sul tavolo. Il NodeMCU resta scollegato.", 20, "start", MUT)

# adapter, cable, plug, jack
R(50, 330, 120, 150, "#1c1c1c", "#000", 12)
T(110, 398, "24 V", 24, "middle", "#fff", 700)
T(110, 426, "alimentatore", 14, "middle", "#bbb")
R(72, 306, 12, 26, "#c3c8cc")
R(136, 306, 12, 26, "#c3c8cc")
wire("M170 405 C 230 405 230 405 270 405", "#1c1c1c", 8)
R(268, 388, 60, 34, "#2a2a2a", "#000", 6)
R(326, 396, 22, 18, "#c3c8cc", "#777", 2)
R(352, 372, 70, 66, "#111", "#000", 10)
T(387, 462, "jack", 16, "middle", MUT)
wire("M422 392 C 480 392 500 322 582 322", RED)
wire("M422 418 C 480 418 500 493 582 493", BLK)
T(470, 318, "centro del jack", 15, "middle", RED, 700)
T(470, 520, "esterno del jack", 15, "middle", INK, 700)

# LM2596 module
MX, MY, MW, MH = 560, 300, 440, 215
R(MX, MY, MW, MH, "#2458a8", "#173a70", 8, 2)
C(MX + 92, MY + 108, 46, "#c3c8cc", "#555")
T(MX + 92, MY + 104, "100 µF", 15, "middle", "#333")
T(MX + 92, MY + 123, "50 V", 13, "middle", "#333")
R(MX + 150, MY + 52, 86, 110, "#111", "none", 4)
T(MX + 193, MY + 112, "LM2596", 14, "middle", "#aaa")
R(MX + 250, MY + 78, 96, 96, "#2b2b2b", "#000", 10)
T(MX + 298, MY + 135, "470", 24, "middle", "#ddd", 700)
C(MX + 392, MY + 150, 36, "#c3c8cc", "#555")
T(MX + 392, MY + 155, "220 µF", 13, "middle", "#333")
R(MX + 252, MY + 14, 92, 50, "#3f74c9", "#1b3f7a", 4, 2)          # trimmer
C(MX + 322, MY + 39, 15, "#d9b45a", "#7a6427", 2)
P(f"M{MX + 311} {MY + 39} L{MX + 333} {MY + 39}", "#5c4a1a", 4)
PADS = {"IN+": (582, 322), "IN−": (582, 493), "OUT+": (978, 322), "OUT−": (978, 493)}
for name, (x, y) in PADS.items():
    R(x - 15, y - 15, 30, 30, "#d9b45a", "#7a6427", 4, 1.5)
    C(x, y, 5, "#2458a8")
T(600, 292, "IN+", 20, "start", INK, 700)
T(600, 540, "IN−", 20, "start", INK, 700)
T(960, 292, "OUT+", 20, "end", INK, 700)
T(960, 540, "OUT−", 20, "end", INK, 700)

# screwdriver on the trimmer
SX, SY = MX + 322, MY + 39
P(f"M{SX} {SY - 6} L{SX - 40} {SY - 130}", "#9aa1a7", 9)
P(f"M{SX - 40} {SY - 130} L{SX - 70} {SY - 220}", "#f08a00", 30)
P(f"M{SX + 34} {SY - 26} A 42 42 0 1 1 {SX - 40} {SY - 16}", HL, 5)
s.append(f'<path d="M{SX - 52} {SY - 30} L{SX - 38} {SY - 8} L{SX - 24} {SY - 30} Z" fill="{HL}"/>')
T(SX + 60, SY - 150, "vite del trimmer:", 17, "start", HL, 700)
T(SX + 60, SY - 128, "tanti giri, piano", 17, "start", HL)

# multimeter
TX, TY = 1180, 170
R(TX, TY, 300, 500, "#f2b632", "#a87410", 26, 3)
R(TX + 30, TY + 34, 240, 110, "#c9d6c0", "#56604f", 8, 3)
T(TX + 150, TY + 118, "5.00", 78, "middle", "#1f2a1c", 700)
C(TX + 150, TY + 280, 86, "#2b2b2b", "#111", 3)
P(f"M{TX + 150} {TY + 280} L{TX + 96} {TY + 218}", "#f5f5f5", 9)
T(TX + 54, TY + 204, "V", 26, "middle", INK, 700)
P(f"M{TX + 66} {TY + 190} h18 M{TX + 66} {TY + 197} h4 m4 0 h4 m4 0 h2", INK, 2.5)
T(TX + 48, TY + 232, "20", 18, "middle", INK, 700)
C(TX + 96, TY + 440, 20, "#111", "#000")
C(TX + 204, TY + 440, 20, RED, "#7d1414")
T(TX + 96, TY + 482, "COM", 15, "middle", INK, 700)
T(TX + 204, TY + 482, "V Ω", 15, "middle", INK, 700)
wire(f"M{TX + 204} {TY + 440} C {TX + 204} 705, 1150 705, 1058 392", RED, 6)
wire(f"M{TX + 96} {TY + 440} C {TX + 96} 690, 1130 690, 1062 562", BLK, 6)
P("M1040 345 L990 326", "#9aa1a7", 6)                                  # probe tips
P("M1042 515 L990 497", "#9aa1a7", 6)
P("M1058 392 L1040 345", RED, 14)
P("M1062 562 L1042 515", BLK, 14)

# numbered steps on the drawing
badge(505, 250, 1)
badge(1110, 250, 2)
badge(SX - 120, SY - 190, 3)

# instructions
R(40, 720, W - 80, 232, "#fff", "#d3d9de", 14, 1.5)
STEPS = [
    (1, "Collega l'ingresso, a corrente staccata: il filo del centro del jack su IN+, quello dell'esterno su IN−."),
    (2, "Tester su tensione continua, portata 20 V: puntale rosso su OUT+, puntale nero su OUT−. Poi attacca l'alimentatore."),
    (3, "Gira piano la vite del trimmer finché il tester segna 5,0 V (va bene da 4,9 a 5,2). Poi stacca l'alimentatore."),
]
for i, (n, t) in enumerate(STEPS):
    y = 770 + i * 50
    C(84, y - 7, 19, HL)
    T(84, y, str(n), 21, "middle", "#fff", 700)
    T(120, y, t, 20, "start", INK)
T(84, 928, "Su OUT+ e OUT− non c'è collegato nulla, solo i puntali. Se il tester segna un valore negativo, i due fili d'ingresso sono invertiti: stacca e scambiali.", 16, "start", MUT)
s.append("</svg>")
out = Path(__file__).with_name("lm2596-setup.svg")
out.write_text("\n".join(s), encoding="utf-8")
print("wrote", out)
