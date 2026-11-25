# Key word frames: KEEP IN SYNC with web/story.js header.
w = dict(grass=16, sick=71, vomit=110, but=147, science=150, checked=157, research=249, univ=272, almost=349, eight=354, plants=402, fav=454, n1500=506,
         fewer=567, one10=582, sick2=621, eating=640, only=690, one5=700, threw=725, so=778, why=781, wolves=848, wolves2=882, theory=939, broom=1004,
         sweeping=1025, worms=1044, that=1083, right=1136, couch=1149, just=1184, careful=1191, garden=1247, toxic=1339, andif=1381, desp=1418, see=1496,
         vet=1505, does=1536, tall=1552, short=1595)
music = np.zeros(N, np.float32)
# the At Your Feet groove (C Am F G, 76 bpm: pad + plucked bass + plucks), in its brighter daytime form (shaker on) for this all-day reel; a bell on the closing question
beat = 60 / 76; prog = [(48, [60, 64, 67]), (45, [60, 64, 69]), (41, [60, 65, 69]), (43, [59, 62, 67])]
tt = 0.0; bar = 0
while tt < DUR - 0.3:
    root, ch = prog[bar % 4]
    place(music, pad([midi(m) for m in ch], beat * 4, 1100), tt, 0.5)
    for b in range(4):
        tb = tt + b * beat
        if tb >= DUR - 0.3: break
        place(music, pluck(midi(root - 12 + (7 if b == 2 else 0)), 0.5, 0.35), tb, 0.35)
        place(music, pluck(midi(ch[(bar + b) % 3] + 12), 0.3, 0.5), tb + beat / 2, 0.12)
        if b % 2 == 0: place(music, drum("shaker"), tb + beat / 2, 0.2)
    bar += 1; tt += beat * 4
for i, m in enumerate([72, 76, 79, 84]): place(music, bell(midi(m), 1.4), F(w["tall"]) + i * 0.08, 0.1)
fo = int(1.2 * SR); music[-fo:] *= np.linspace(1, 0, fo)

sfx = np.zeros(N, np.float32)
def munch(a, b, every=0.3, g=0.35):   # chewing: short crunches through frames a..b
    t = F(a)
    while t < F(b): place(sfx, crunch(0.2), t, g); t += every
def ring(d=1.0):
    out = np.zeros(int(d * SR), np.float32)
    for k in range(int(d * 10)):
        n = int(0.05 * SR); t = np.arange(n) / SR; s = (np.sin(2 * np.pi * 1400 * t) + np.sin(2 * np.pi * 1750 * t)) * np.sin(np.pi * t / 0.05) * 0.4; i = int(k / 10 * SR); out[i:i + n] += s[: len(out) - i].astype(np.float32)
    return out

munch(0, 29); munch(30, 146, 0.45, 0.2); place(sfx, pop(500, 900, 0.14), F(w["sick"] - 2), 0.4)            # hook: chewing, "?" pop
place(sfx, pop(600, 1300, 0.14), F(w["science"] - 1), 0.4); place(sfx, ding(88), F(w["checked"] - 2), 0.45)   # SCIENCE CHECKED + check badge
munch(200, 248, 0.4, 0.25); place(sfx, pop(600, 1300, 0.14), F(w["univ"] - 1), 0.4)
munch(249, 346, 0.5, 0.15)
for k in ["eight", "n1500", "one10", "one5"]: place(sfx, pop(600, 1300, 0.14), F(w[k] - 1), 0.45); place(sfx, thunk(90, 0.3), F(w[k] - 1), 0.3)   # stat cards
place(sfx, pop(700, 1200, 0.12), F(w["plants"] - 8), 0.3); place(sfx, pop(700, 1200, 0.12), F(w["sick2"] - 2), 0.3); place(sfx, pop(700, 1200, 0.12), F(w["threw"] - 2), 0.3)
munch(347, 399, 0.4, 0.2); munch(430, 487, 0.4, 0.25)
place(sfx, pop(600, 1300, 0.14), F(w["fav"] - 2), 0.4); place(sfx, pop(700, 1400, 0.14), F(w["fav"] + 8), 0.4)            # hearts
place(sfx, taps(1.8, 10), F(567), 0.35); munch(650, 689, 0.4, 0.25)                                                       # trot in, head down
place(sfx, pop(500, 900, 0.14), F(w["why"] - 2), 0.45); place(sfx, slide(0.5, 500, 900), F(w["why"]), 0.25)              # "?"
place(sfx, wind(7.8), F(w["wolves"] - 2), 0.35); place(sfx, rustle(1.2), F(w["wolves2"]), 0.35); munch(882, 931, 0.5, 0.2)   # day forest, grazing wolf
place(sfx, pop(600, 1300, 0.14), F(w["broom"] - 1), 0.4); place(sfx, rustle(2.4), F(1006), 0.6); place(sfx, whoosh(0.6), F(w["sweeping"] - 2), 0.4)
place(sfx, pop(700, 1400, 0.14), F(w["worms"] - 1), 0.4); place(sfx, slide(0.6, 900, 400), F(w["worms"] + 4), 0.25)
munch(1083, 1135, 0.45, 0.2); place(sfx, thunk(85, 0.3), F(w["right"]), 0.3); place(sfx, sigh(0.9), F(w["couch"] + 4), 0.3)   # match cut, couch
place(sfx, bonk(), F(w["careful"] - 2), 0.35); place(sfx, bonk(), F(w["garden"] - 4), 0.35); place(sfx, pop(600, 1300, 0.14), F(w["garden"] - 1), 0.35)
place(sfx, bonk(), F(w["toxic"] - 6), 0.35); place(sfx, pop(600, 1300, 0.14), F(w["toxic"] - 3), 0.35)
munch(1381, 1495, 0.2, 0.3)                                                                                                # desperate fast chewing
place(sfx, pop(600, 1300, 0.14), F(w["see"] - 1), 0.4); place(sfx, ring(0.8), F(1506), 0.3)                               # SEE A VET, phone
place(sfx, chime(), F(w["tall"] - 1), 0.4); place(sfx, ding(88), F(w["short"]), 0.35)                                     # closing question

