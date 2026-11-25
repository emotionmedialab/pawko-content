"""Music bed + SFX stems for At Your Feet (1663 frames). py audio.py && py mix.py voice.mp3 music.wav sfx.wav"""
import numpy as np, wave
TOTAL = 1663
import numpy as np, wave

SR = 48000
DUR = TOTAL / 30
N = int(DUR * SR)
rng = np.random.default_rng(7)
F = lambda f: f / 30

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
w = dict(job=139, wild=191, watch=321, night=373, light=411, blanket=442, fast=482, safe=580, danger=650, protect=709, circles=778, grass=868,
         lies=910, feet=936, door=1024, noise=1142, breathing=1218, safe2=1273, alarm=1327, jumps=1366, night2=1507, feet2=1606, door2=1638)
music = np.zeros(N, np.float32)
# soft lullaby groove (C Am F G, 76 bpm): pad + plucked bass + light plucks; brighter and bouncier after the alarm; a bell at the title
beat = 60 / 76; prog = [(48, [60, 64, 67]), (45, [60, 64, 69]), (41, [60, 65, 69]), (43, [59, 62, 67])]
tt = 0.0; bar = 0
while tt < DUR - 0.3:
    root, ch = prog[bar % 4]; day = F(w["alarm"]) <= tt
    place(music, pad([midi(m) for m in ch], beat * 4, 1100), tt, 0.5)
    for b in range(4):
        tb = tt + b * beat
        if tb >= DUR - 0.3: break
        place(music, pluck(midi(root - 12 + (7 if b == 2 else 0)), 0.5, 0.35), tb, 0.35)
        if day or b % 2: place(music, pluck(midi(ch[(bar + b) % 3] + 12), 0.3, 0.5), tb + beat / 2, 0.12)
        if day and b % 2 == 0: place(music, drum("shaker"), tb + beat / 2, 0.2)
    bar += 1; tt += beat * 4
for i, m in enumerate([72, 76, 79, 84]): place(music, bell(midi(m), 1.4), F(w["feet2"]) + i * 0.08, 0.1)
fo = int(1.2 * SR); music[-fo:] *= np.linspace(1, 0, fo)

sfx = np.zeros(N, np.float32)
def creak(d=0.9):
    n = int(d * SR); t = np.arange(n) / SR; f = 180 + 120 * np.sin(2 * np.pi * 3 * t) * np.sin(np.pi * t / d) + 40 * t
    s = np.sign(np.sin(np.cumsum(f) / SR * 2 * np.pi)) * 0.3 + lp_fast(noise(d), 700) * 0.3
    return (s * np.sin(np.pi * t / d) ** 0.7).astype(np.float32)
def tick(): return (click() * 0.6).astype(np.float32)
def alarm(d=1.2):
    out = np.zeros(int(d * SR), np.float32)
    for k in range(int(d * 8)):
        n = int(0.06 * SR); t = np.arange(n) / SR; b = (np.sin(2 * np.pi * 2000 * t) * np.sin(np.pi * t / 0.06)).astype(np.float32); i = int(k / 8 * SR); out[i:i + n] += b[: len(out) - i]
    return out
def howl(d=1.6):
    n = int(d * SR); t = np.arange(n) / SR; k = t / d; f = 330 + 220 * np.sin(np.pi * k) ** 0.8
    return (np.sin(np.cumsum(f) / SR * 2 * np.pi) * np.sin(np.pi * k) ** 1.2 * 0.5).astype(np.float32)
def car(d=1.2):
    n = int(d * SR); t = np.arange(n) / SR; return (lp_fast(noise(d), 400) * np.sin(np.pi * t / d) ** 2 * 0.7).astype(np.float32)

place(sfx, wind(5.0), F(w["wild"] - 10), 0.35)
place(sfx, howl(1.6), F(w["watch"] - 8), 0.35)                                  # watcher
for k in range(6): place(sfx, tick(), F(363 + 4 * k), 0.5)                       # clock insert
place(sfx, click(), F(405), 0.9); place(sfx, rustle(0.5), F(w["blanket"] - 8), 0.4); place(sfx, sigh(1.0), F(w["fast"]), 0.45)   # lamp off, blanket, asleep
place(sfx, heartbeat(), F(w["safe"] + 6), 0.4); place(sfx, creak(0.7), F(555), 0.3)                                               # puppy wakes
place(sfx, sting(), F(w["danger"] - 4), 0.5); place(sfx, heartbeat(), F(w["protect"]), 0.5)
place(sfx, taps(2.2, 5), F(758), 0.35); place(sfx, rustle(0.8), F(826), 0.5); place(sfx, wind(2.5), F(822), 0.3)            # circles, grass flattens
place(sfx, thunk(90, 0.3), F(938), 0.5); place(sfx, sigh(1.0), F(950), 0.4)                                                  # lies down
place(sfx, creak(0.9), F(1070), 0.55); place(sfx, car(1.3), F(1146), 0.4); place(sfx, bark(), F(1099), 0.0)
place(sfx, heartbeat(), F(w["breathing"]), 0.35); place(sfx, chime(), F(w["safe2"]), 0.3)
place(sfx, alarm(1.2), F(1330), 0.5); place(sfx, taps(0.5, 12), F(1368), 0.4); place(sfx, thunk(85, 0.3), F(1398), 0.5)       # alarm, puppy jumps, lands
place(sfx, pop(600, 1300, 0.14), F(1486), 0.4); place(sfx, pop(700, 1400, 0.14), F(1500), 0.4)                                # hearts
place(sfx, ding(88), F(w["feet2"]), 0.4); place(sfx, chime(), F(1608), 0.4)                                                    # title

def write(path, x):
    pcm = (np.clip(x / max(1e-9, np.abs(x).max()) * 0.9, -1, 1) * 32767).astype(np.int16)
    with wave.open(path, "wb") as w: w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes())
write("music.wav", music); write("sfx.wav", sfx); print("stems ok", DUR)
