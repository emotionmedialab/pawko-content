"""Music bed + SFX stems for Eating Grass (1630 frames, copied from At Your Feet). py audio.py && py mix.py voice.mp3 music.wav sfx.wav"""
import numpy as np, wave
TOTAL = 1746   # v3: + CTA tail (voice_cta.wav)
import numpy as np, wave

SR = 48000
DUR = TOTAL / 30
N = int(DUR * SR)
rng = np.random.default_rng(7)
F = lambda f: f / 30   # cue frame -> seconds

def env(n, a=0.005, r=0.2):
    t = np.arange(n) / SR
    return np.minimum(1, t / max(a, 1e-4)) * np.exp(-t / r)
def lp_fast(x, cutoff):
    X = np.fft.rfft(x); f = np.fft.rfftfreq(len(x), 1 / SR); X *= 1 / (1 + (f / cutoff) ** 4); return np.fft.irfft(X, len(x)).astype(np.float32)
def hp_fast(x, cutoff):
    X = np.fft.rfft(x); f = np.fft.rfftfreq(len(x), 1 / SR); X *= 1 - 1 / (1 + (f / cutoff) ** 4); return np.fft.irfft(X, len(x)).astype(np.float32)
def place(buf, sig, t0, gain=1.0):
    i = int(t0 * SR); j = min(N, i + len(sig))
    if i < N and j > i: buf[i:j] += sig[: j - i] * gain
midi = lambda m: 440 * 2 ** ((m - 69) / 12)
def noise(d): return rng.standard_normal(int(d * SR)).astype(np.float32)

# ---------------- instruments ----------------
def pluck(f, dur=0.35, bright=0.5):
    n = int(dur * SR); t = np.arange(n) / SR
    s = sum((bright ** k) * np.sin(2 * np.pi * f * (k + 1) * t) / (k + 1) for k in range(6))
    return (s * env(n, 0.003, dur * 0.35)).astype(np.float32)
def pad(fs, dur, cut=1500):
    n = int(dur * SR); t = np.arange(n) / SR; s = np.zeros(n)
    for f in fs:
        for det in (-0.12, 0.12):
            ph = 2 * np.pi * (f + det) * t + 0.002 * np.sin(2 * np.pi * 4.5 * t)
            s += sum(np.sin((k + 1) * ph) / (k + 1) ** 1.6 for k in range(6))
    a = np.minimum(1, t / 0.35) * np.minimum(1, (dur - t) / 0.4).clip(0)
    return lp_fast((s * a).astype(np.float32), cut) / (2 * len(fs))
def bell(f, dur=1.2):
    n = int(dur * SR); t = np.arange(n) / SR
    return (sum(np.sin(2 * np.pi * f * m * t) * np.exp(-t * k) * g for m, k, g in [(1, 3, 1), (2.76, 6, 0.4), (5.4, 9, 0.2)]) * 0.5).astype(np.float32)
def drum(kind):
    if kind == "kick":
        n = int(0.3 * SR); t = np.arange(n) / SR; f = 50 + 90 * np.exp(-t * 30)
        return (np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 10)).astype(np.float32)
    if kind == "shaker":
        n = int(0.08 * SR); t = np.arange(n) / SR
        return hp_fast((rng.standard_normal(n) * np.exp(-t * 60)).astype(np.float32), 4000)
    n = int(0.15 * SR); t = np.arange(n) / SR
    return hp_fast((rng.standard_normal(n) * np.exp(-t * 30) * 0.5 + np.sin(2 * np.pi * 220 * t) * np.exp(-t * 25) * 0.4).astype(np.float32), 400)

sfx = np.zeros(N, np.float32)
def thunk(f0=90, d=0.3):
    n = int(d * SR); t = np.arange(n) / SR
    return (np.sin(2 * np.pi * f0 * t * (1 + 0.6 * np.exp(-t * 40))) * np.exp(-t * 14) + lp_fast(noise(d), 1200) * np.exp(-t * 30) * 0.5).astype(np.float32)
def pat():  # soft fur "boff"
    d = 0.16; n = int(d * SR); t = np.arange(n) / SR
    return (lp_fast(noise(d), 700) * np.exp(-t * 35) * 1.6 + np.sin(2 * np.pi * 120 * t) * np.exp(-t * 30) * 0.5).astype(np.float32)
def whoosh(d=0.5, cut=1500):
    n = int(d * SR); t = np.arange(n) / SR
    return (lp_fast(noise(d), cut) * np.sin(np.pi * t / d) ** 2 * 0.6).astype(np.float32)
def riser(d):
    n = int(d * SR); t = np.arange(n) / SR; k = t / d
    s = lp_fast(noise(d), 600) * k ** 2 * 0.8 + np.sin(2 * np.pi * np.cumsum(60 + 140 * k ** 2) / SR) * k ** 2 * 0.4
    return s.astype(np.float32)
def pop(f0=500, f1=1100, d=0.12):
    n = int(d * SR); t = np.arange(n) / SR
    return (np.sin(2 * np.pi * np.cumsum(np.linspace(f0, f1, n)) / SR) * env(n, 0.002, d * 0.35)).astype(np.float32)
def whimper(d=0.6, f0=900):
    n = int(d * SR); t = np.arange(n) / SR; k = t / d
    f = f0 * (1 + 0.25 * np.sin(np.pi * k)) * (1 - 0.35 * k) + 12 * np.sin(2 * np.pi * 7 * t)
    ph = np.cumsum(f) / SR * 2 * np.pi
    s = (np.sin(ph) + 0.35 * np.sin(2 * ph) + 0.12 * np.sin(3 * ph)) * np.sin(np.pi * k) ** 1.5
    return lp_fast(s.astype(np.float32), 2500) * 0.6
def screech(d=0.75):
    n = int(d * SR); t = np.arange(n) / SR; k = t / d
    f = 2600 * (1 - 0.45 * k) + 120 * np.sin(2 * np.pi * 31 * t)
    ph = np.cumsum(f) / SR * 2 * np.pi
    s = (np.sin(ph) + 0.5 * np.sin(2 * ph + 0.3)) * (1 + 0.4 * rng.standard_normal(n)) * np.minimum(1, t / 0.03) * (1 - k) ** 0.6
    return hp_fast(lp_fast(s.astype(np.float32), 6000), 900) * 0.45
def flap():
    d = 0.14; n = int(d * SR); t = np.arange(n) / SR
    return (lp_fast(noise(d), 900) * np.sin(np.pi * t / d) * 1.1).astype(np.float32)
def heartbeat():
    return np.concatenate([thunk(55, 0.22), np.zeros(int(0.06 * SR), np.float32), thunk(50, 0.25) * 0.7])
def sting():
    n = int(2.0 * SR); t = np.arange(n) / SR
    low = np.sin(2 * np.pi * 41 * t) * np.exp(-t * 1.5) * 1.2
    hit = lp_fast(noise(2.0), 900) * np.exp(-t * 6) * 0.8
    st = pad([midi(45), midi(48), midi(51)], 1.4, 2000); s = low + hit; s[: len(st)] += st * 2.5 * np.exp(-np.arange(len(st)) / SR * 2)
    return s.astype(np.float32)
def shimmer(d):
    out = np.zeros(int(d * SR), np.float32); r = np.random.default_rng(3)
    for k in range(int(d * 9)):
        b = bell(midi(84 + r.choice([0, 4, 7, 11, 12, 16])), 0.6) * 0.35; i = int(r.uniform(0, d - 0.6) * SR); out[i:i + len(b)] += b
    return out
def wind(d):
    n = int(d * SR); t = np.arange(n) / SR
    return (lp_fast(noise(d), 500) * (0.6 + 0.4 * np.sin(2 * np.pi * 0.23 * t) ** 2) * np.minimum(1, t / 0.6) * np.minimum(1, (d - t) / 0.4)).astype(np.float32)
def chirp(f0):
    d = 0.09; n = int(d * SR); t = np.arange(n) / SR
    return (np.sin(2 * np.pi * np.cumsum(f0 * (1 + 0.5 * np.sin(np.pi * t / d))) / SR) * np.sin(np.pi * t / d)).astype(np.float32)
def chitter(d):
    out = np.zeros(int(d * SR), np.float32)
    for k in range(int(d * 14)): c = chirp(3200 + 400 * (k % 3)) * 0.5; i = int(k / 14 * SR); out[i:i + len(c)] += c[: len(out) - i]
    return out
def bark():
    d = 0.22; n = int(d * SR); t = np.arange(n) / SR
    f = 420 * (1 + 0.5 * np.exp(-t * 25)); ph = np.cumsum(f) / SR * 2 * np.pi
    s = (np.sign(np.sin(ph)) * 0.4 + np.sin(2 * ph) * 0.3) * env(n, 0.005, 0.07) + lp_fast(noise(d), 1800) * env(n, 0.002, 0.04) * 0.4
    return lp_fast(s.astype(np.float32), 2200)
def chime():
    out = np.zeros(int(1.8 * SR), np.float32)
    for i, m in enumerate([79, 84, 88, 91]): b = bell(midi(m), 1.4) * 0.5; j = int(i * 0.07 * SR); out[j:j + len(b)] += b
    return out

def crunch(d=0.5):
    out = np.zeros(int(d * SR), np.float32)
    for k in range(5):
        n = int(0.05 * SR); t = np.arange(n) / SR; b = hp_fast((rng.standard_normal(n) * np.exp(-t * 70)).astype(np.float32), 1800) * 0.9
        i = int(k * 0.09 * SR); out[i:i + n] += b[: len(out) - i]
    return out
def click():
    n = int(0.03 * SR); t = np.arange(n) / SR
    return (hp_fast(rng.standard_normal(n).astype(np.float32) * np.exp(-t * 400), 2500) * 1.4 + np.sin(2 * np.pi * 3200 * t) * np.exp(-t * 300) * 0.6).astype(np.float32)
def ding(m=88):
    return (bell(midi(m), 0.9) + bell(midi(m + 7), 0.9) * 0.6).astype(np.float32)
def bonk():
    n = int(0.35 * SR); t = np.arange(n) / SR; f = 300 * np.exp(-t * 6)
    return (np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 9) * 0.9).astype(np.float32)
def slide(d, f0, f1):
    n = int(d * SR); t = np.arange(n) / SR; f = f0 * (f1 / f0) ** (t / d)
    return (np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * t / d) * 0.6).astype(np.float32)
def hum(d):
    n = int(d * SR); t = np.arange(n) / SR
    return ((np.sin(2 * np.pi * 220 * t) + 0.5 * np.sin(2 * np.pi * 330 * t)) * (0.6 + 0.4 * np.sin(2 * np.pi * 6 * t)) * np.sin(np.pi * t / d) * 0.35).astype(np.float32)
def rustle(d):
    n = int(d * SR); t = np.arange(n) / SR
    return (hp_fast(lp_fast(noise(d), 3500), 600) * (0.5 + 0.5 * np.abs(np.sin(2 * np.pi * 3 * t))) * np.sin(np.pi * t / d) * 0.7).astype(np.float32)
def sigh(d=0.9):
    n = int(d * SR); t = np.arange(n) / SR; k = t / d
    return (lp_fast(noise(d), 900) * np.sin(np.pi * k) ** 1.5 * (1 - 0.5 * k) * 0.9).astype(np.float32)
def taps(d, rate=12):
    out = np.zeros(int(d * SR), np.float32)
    for k in range(int(d * rate)): s = thunk(160 + 40 * (k % 2), 0.08) * 0.5; i = int(k / rate * SR); out[i:i + len(s)] += s[: len(out) - i]
    return out


# Key word frames: KEEP IN SYNC with web/story.js header.
w = dict(grass=16, sick=71, vomit=110, but=147, science=150, checked=157, research=249, univ=272, almost=349, eight=354, plants=402, fav=454, n1500=506,
         fewer=567, one10=582, sick2=621, eating=640, only=690, one5=700, threw=725, so=778, why=781, wolves=848, wolves2=882, theory=939, broom=1004,
         sweeping=1025, worms=1044, that=1083, right=1136, couch=1149, just=1184, careful=1191, garden=1247, toxic=1339, andif=1381, desp=1418, see=1496,
         vet=1505, does=1536, tall=1552, short=1595, paw=1642, guide=1724)
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
place(sfx, taps(1.2, 10), F(1636), 0.35); place(sfx, pop(600, 1300, 0.14), F(w["paw"] - 1), 0.45); place(sfx, ding(88), F(w["guide"]), 0.35)   # CTA: trot in, COMMENT PAW!, guide

def write(path, x):
    pcm = (np.clip(x / max(1e-9, np.abs(x).max()) * 0.9, -1, 1) * 32767).astype(np.int16)
    with wave.open(path, "wb") as w: w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes())
write("music.wav", music); write("sfx.wav", sfx); print("stems ok", DUR)
