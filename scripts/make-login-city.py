#!/usr/bin/env python3
"""Draws the flat night-city illustration with smart cameras (public/img/login-city.svg). Run: python3 scripts/make-login-city.py"""
import random
random.seed(7)
W, H = 1600, 900
o = []
a = o.append
a(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" preserveAspectRatio="xMidYMax slice" role="img" aria-label="Night city with smart cameras">')
a('''<defs>
<linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#17406a"/><stop offset="1" stop-color="#3d7ba3"/></linearGradient>
<linearGradient id="wallL" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#e3eefb"/><stop offset="1" stop-color="#bcd3ee"/></linearGradient>
<linearGradient id="wallD" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#5f9bc4"/><stop offset="1" stop-color="#3f7ea8"/></linearGradient>
<linearGradient id="roof" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#2a4c72"/><stop offset="1" stop-color="#0a1a30"/></linearGradient>
<linearGradient id="dome" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#f3f8ff"/><stop offset="1" stop-color="#9ec3e6"/></linearGradient>
<linearGradient id="street" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1c4a73" stop-opacity="0"/><stop offset="1" stop-color="#0a1f38"/></linearGradient>
<radialGradient id="glow"><stop offset="0" stop-color="#3b82f6" stop-opacity=".9"/><stop offset="1" stop-color="#3b82f6" stop-opacity="0"/></radialGradient>
<linearGradient id="beam" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#60a5fa" stop-opacity=".55"/><stop offset="1" stop-color="#60a5fa" stop-opacity="0"/></linearGradient>
</defs>''')
a(f'<rect width="{W}" height="{H}" fill="url(#sky)"/>')
# stars and moon
for _ in range(34):
    x, y, r = random.randint(10, W - 10), random.randint(10, 330), random.choice([3, 4, 5])
    a(f'<path d="M{x} {y-r} L{x+r} {y} L{x} {y+r} L{x-r} {y} Z" fill="#dff1ff" opacity="{random.choice([.5,.8,1])}"/>')
a('<path d="M300 14 a62 62 0 0 1 0 124 a46 62 0 0 0 0 -124 Z" fill="#d8ebfb"/>')
# far skyline
a('<g fill="#1d4f78" opacity=".85">')
x = 0
while x < W:
    w, h = random.randint(50, 110), random.randint(120, 260)
    a(f'<rect x="{x}" y="{H-h-120}" width="{w}" height="{h+120}"/>')
    if random.random() < .5: a(f'<rect x="{x+8}" y="{H-h-136}" width="14" height="16"/>')
    x += w + random.randint(0, 16)
a('</g>')
a('<g fill="#0e2d4d" opacity=".9"><ellipse cx="90" cy="330" rx="120" ry="70"/><ellipse cx="1180" cy="420" rx="110" ry="60"/><ellipse cx="640" cy="430" rx="100" ry="50"/></g>')

def windows(x, y, cols, rows, w, h, gx, gy, lit=.6, arch=False):
    for r in range(rows):
        for c in range(cols):
            wx, wy = x + c * (w + gx), y + r * (h + gy)
            on = random.random() < lit
            fill = '#ffffff' if on else '#7fb0d6'
            if arch:
                a(f'<path d="M{wx} {wy+h} V{wy+w/2} a{w/2} {w/2} 0 0 1 {w} 0 V{wy+h} Z" fill="{fill}"/>')
            else:
                a(f'<rect x="{wx}" y="{wy}" width="{w}" height="{h}" fill="{fill}"/>')
                a(f'<rect x="{wx+w/2-1}" y="{wy}" width="2" height="{h}" fill="#5f9bc4" opacity=".7"/><rect x="{wx}" y="{wy+h/2-1}" width="{w}" height="2" fill="#5f9bc4" opacity=".7"/>')

def rail(x, y, w, dark=False):
    col = '#0a1a30' if dark else '#7fb0d6'
    a(f'<rect x="{x}" y="{y}" width="{w}" height="5" fill="{col}"/>')
    a(f'<g stroke="{col}" stroke-width="2.5">' + ''.join(f'<line x1="{x+i}" y1="{y+5}" x2="{x+i}" y2="{y+26}"/>' for i in range(4, int(w), 12)) + '</g>')
    a(f'<rect x="{x}" y="{y+26}" width="{w}" height="4" fill="{col}"/>')

def dormer(x, y):
    a(f'<polygon points="{x-4},{y} {x+20},{y-18} {x+44},{y}" fill="#dbe9f9"/><rect x="{x}" y="{y}" width="40" height="44" fill="#e8f1fc"/><rect x="{x+10}" y="{y+8}" width="20" height="36" fill="#ffffff"/><rect x="{x+39}" y="{y-18}" width="10" height="62" fill="#0a1a30" opacity=".55"/>')

def camera(x, y, flip=False, beam=True):
    """A smart camera on a bracket; (x, y) is where it is fixed to the wall. flip = points left."""
    d = -1 if flip else 1
    lx = x + d * 42
    if beam:
        a(f'<polygon points="{lx},{y+7} {lx+d*200},{y-40} {lx+d*200},{y+95}" fill="url(#beam)"/>')
    a(f'<circle cx="{lx}" cy="{y+7}" r="30" fill="url(#glow)"/>')
    a(f'<rect x="{x-(0 if not flip else 6)}" y="{y-10}" width="6" height="34" rx="2" fill="#0a1a30"/>')
    a(f'<rect x="{x+(0 if not flip else -14)}" y="{y+1}" width="14" height="8" fill="#0a1a30"/>')
    bx = x + 6 if not flip else x - 46
    a(f'<rect x="{bx}" y="{y-2}" width="40" height="18" rx="5" fill="#f3f8ff" stroke="#0a1a30" stroke-width="3"/>')
    a(f'<circle cx="{lx-d*4}" cy="{y+7}" r="8" fill="#0a1a30"/><circle cx="{lx-d*4}" cy="{y+7}" r="4" fill="#3b82f6"/><circle cx="{lx-d*6}" cy="{y+5}" r="1.6" fill="#fff"/>')
    a(f'<circle cx="{x+d*18}" cy="{y+3}" r="2.4" fill="#ef4444"/>')

# centre domed building
cx = 800
a(f'<rect x="{cx-170}" y="470" width="340" height="430" fill="url(#wallL)"/><rect x="{cx+10}" y="470" width="160" height="430" fill="#9ec3e6" opacity=".55"/>')
a(f'<path d="M{cx-130} 470 V330 a130 130 0 0 1 260 0 V470 Z" fill="url(#dome)"/>')
for i in range(-3, 4):
    a(f'<path d="M{cx+i*30} 470 V340 a{abs(i)*0+10} 10 0 0 1 0 0" stroke="#7fb0d6" stroke-width="3" fill="none"/>')
a(f'<path d="M{cx-130} 330 a130 130 0 0 1 260 0" fill="none" stroke="#6aa5d1" stroke-width="3"/>')
a(f'<path d="M{cx-90} 470 V290 a90 90 0 0 1 180 0 V470" fill="none" stroke="#6aa5d1" stroke-width="3"/><path d="M{cx} 470 V200" stroke="#6aa5d1" stroke-width="3"/>')
a(f'<path d="M{cx-60} 236 a60 60 0 0 1 120 0 Z" fill="#e6f1ff"/><rect x="{cx-8}" y="150" width="16" height="48" fill="#cfe3f8"/><polygon points="{cx-10},150 {cx},118 {cx+10},150" fill="#f3f8ff"/><rect x="{cx-1.5}" y="86" width="3" height="34" fill="#cfe3f8"/>')
for sx in (-1, 1):
    a(f'<rect x="{cx+sx*150-24}" y="350" width="48" height="130" fill="#dbe9f9"/><path d="M{cx+sx*150-30} 352 a30 30 0 0 1 60 0 Z" fill="url(#dome)"/><rect x="{cx+sx*150-4}" y="308" width="8" height="22" fill="#cfe3f8"/>')
windows(cx - 120, 500, 5, 3, 30, 56, 20, 26, .55, arch=True)
windows(cx - 120, 760, 5, 1, 30, 56, 20, 26, .5, arch=True)
a(f'<rect x="{cx-170}" y="470" width="340" height="8" fill="#7fb0d6"/>')

# left mansard building
a('<rect x="0" y="560" width="560" height="340" fill="url(#wallL)"/><rect x="330" y="560" width="230" height="340" fill="#9ec3e6" opacity=".5"/>')
a('<path d="M0 560 V400 Q0 290 120 300 L560 330 V560 Z" fill="url(#roof)"/>')
a('<g stroke="#3f7ea8" stroke-width="4" fill="none"><path d="M40 560 Q60 380 150 300"/><path d="M130 560 Q150 400 230 305"/><path d="M230 560 Q250 410 310 312"/><path d="M340 560 Q355 420 390 318"/><path d="M450 560 Q460 430 470 322"/></g>')
for dx in (60, 180, 300, 420): dormer(dx, 480)
a('<rect x="0" y="470" width="560" height="6" fill="#dbe9f9"/>')
rail(0, 524, 560)
windows(30, 590, 6, 2, 34, 64, 54, 28, .6)
rail(0, 770, 560)
windows(20, 810, 6, 1, 38, 70, 52, 20, .5, arch=True)
# chimneys
a('<rect x="110" y="236" width="86" height="64" fill="#d6e6f8"/><rect x="104" y="228" width="98" height="10" fill="#a9c9e8"/><rect x="330" y="244" width="86" height="64" fill="#d6e6f8"/><rect x="324" y="236" width="98" height="10" fill="#a9c9e8"/>')

# right building
rx = 1090
a(f'<rect x="{rx}" y="440" width="{W-rx}" height="460" fill="url(#wallL)"/>')
a(f'<path d="M{rx} 440 V300 Q{rx} 150 {rx+120} 110 L{W} 80 V440 Z" fill="url(#roof)"/>')
a(f'<g stroke="#3f7ea8" stroke-width="4" fill="none"><path d="M{rx+40} 440 Q{rx+50} 250 {rx+150} 120"/><path d="M{rx+160} 440 Q{rx+180} 260 {rx+270} 105"/><path d="M{rx+290} 440 Q{rx+310} 270 {rx+400} 95"/></g>')
a(f'<rect x="{rx+120}" y="300" width="70" height="150" fill="#e8f1fc"/><rect x="{rx+136}" y="326" width="38" height="124" fill="#ffffff"/><polygon points="{rx+114},300 {rx+155},262 {rx+196},300" fill="#dbe9f9"/>')
a(f'<rect x="{rx+330}" y="300" width="70" height="150" fill="#e8f1fc"/><rect x="{rx+346}" y="326" width="38" height="124" fill="#ffffff"/><polygon points="{rx+324},300 {rx+365},262 {rx+406},300" fill="#dbe9f9"/>')
rail(rx, 444, W - rx, dark=True)
windows(rx + 24, 500, 5, 2, 30, 64, 62, 28, .6)
rail(rx, 690, W - rx, dark=True)
a(f'<rect x="{rx}" y="730" width="{W-rx}" height="170" fill="#e8f1fc"/>')
for i in range(4):
    ax = rx + 20 + i * 120
    a(f'<path d="M{ax} 900 V820 a40 40 0 0 1 80 0 V900 Z" fill="#0a2a4a"/>')

# middle blue buildings
a('<rect x="560" y="520" width="150" height="380" fill="url(#wallD)"/>')
windows(578, 548, 3, 5, 24, 46, 16, 26, .55)
a('<rect x="560" y="520" width="150" height="6" fill="#2b648d"/>')
a('<rect x="910" y="560" width="180" height="340" fill="#5b99c3"/><polygon points="910,560 940,470 1060,470 1090,560" fill="#1c3b5e"/><g stroke="#4a86b0" stroke-width="3"><line x1="935" y1="560" x2="955" y2="472"/><line x1="975" y1="560" x2="990" y2="472"/><line x1="1015" y1="560" x2="1025" y2="472"/></g>')
windows(924, 590, 3, 4, 28, 44, 20, 28, .5)

# smart cameras on corners and roofs
camera(560, 600, flip=True)           # left building edge, looking right
camera(910, 640, flip=True)           # left edge of the middle building
camera(1090, 560, flip=True)          # right building corner
camera(cx - 170, 500, flip=True)      # dome base
camera(cx + 170, 520, flip=False)
camera(560, 800, flip=True, beam=False)
# street
a(f'<rect x="0" y="700" width="{W}" height="200" fill="url(#street)"/>')
a('</svg>')
open('public/img/login-city.svg', 'w').write('\n'.join(o))
print('ok', sum(len(x) for x in o) // 1024, 'KB')
