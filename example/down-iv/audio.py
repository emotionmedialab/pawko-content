"""Synthesized music bed + SFX stems for "Down IV" (1147 frames). Writes music.wav and sfx.wav only.
Mix with: py mix.py voice.wav music.wav sfx.wav"""
import numpy as np, wave

SR = 48000
DUR = 1147 / 30
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

# ---------------- music ----------------
# Key word frames: KEEP IN SYNC with the `w` table in web/story.js (re-time = update both + TOTAL).
TOTAL = 1147
w = dict(down1=28, anywhere=50, grab=104, mat=126, helper=141, prac=176, grass=187, tile=195, carpet=211, pave=228, new=272, strange=299, so=325, easy=331,
         next=373, step=389, behind=398, one=424, second=431, then=457, back=462, reward1=497, still=530, down2=538, now=577, real=602, life=610,
         have=650, walk=662, tv=704, open=725, daily=768, cook=823, guests=844, visit=850, breaks=896, hard=934, lower=982, again=1025,
         say=1058, yes=1064, click=1088, then2=1113, reward2=1118)
w["if"] = 887; w["t_rew"] = w["down2"] - 4
# One bright, bouncy groove (C G Am F, 104 bpm): plucked bass, off-beat ukulele-ish chords, kick + shaker.
# It thins out for the "pops back up" mistake and lands on a flourish at the reward.
music = np.zeros(N, np.float32)
beat = 60 / 104; prog = [(48, [60, 64, 67]), (43, [59, 62, 67]), (45, [60, 64, 69]), (41, [60, 65, 69])]
tt = 0.0; bar = 0
while tt < DUR - 0.3:
    root, ch = prog[bar % 4]
    for b in range(4):
        tb = tt + b * beat
        if tb >= DUR - 0.3: break
        thin = F(w["if"] - 4) <= tb < F(w["lower"] - 4)
        if not thin:
            if b % 2 == 0: place(music, drum("kick"), tb, 0.42)
            place(music, drum("shaker"), tb + beat / 2, 0.22)
            if b == 3: place(music, drum("snare"), tb, 0.16)
        place(music, pluck(midi(root - 12 + (7 if b == 2 else 0)), 0.32, 0.4), tb, 0.36 if not thin else 0.18)
        for k, m in enumerate(ch): place(music, pluck(midi(m), 0.22, 0.65), tb + beat / 2 + k * 0.012, 0.09)
        if b == 0 and bar % 2 == 1 and not thin: place(music, bell(midi(ch[2] + 12), 0.5), tb + beat * 1.5, 0.05)
    bar += 1; tt += beat * 4
# "uh-oh" descending pluck on the mistake
for i, m in enumerate([72, 69, 65, 60]): place(music, pluck(midi(m), 0.4, 0.6), F(w["hard"] - 4) + i * 0.13, 0.22)
# reward flourish: rising arpeggio + bell chord
for i, m in enumerate([60, 64, 67, 72, 76, 79, 84]): place(music, pluck(midi(m), 0.4, 0.7), F(w["reward2"] - 2) + i * 0.05, 0.2)
for m in (72, 76, 79): place(music, bell(midi(m), 1.6), F(w["reward2"] + 2), 0.12)
fo = int(0.8 * SR); music[-fo:] *= np.linspace(1, 0, fo)

# ---------------- sfx ----------------
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

def clap_snd():
    out = np.zeros(int(0.16 * SR), np.float32)
    for k, d in enumerate((0.0, 0.07)):
        n = int(0.05 * SR); t = np.arange(n) / SR; b = hp_fast(lp_fast(rng.standard_normal(n).astype(np.float32), 5000) * np.exp(-t * 90), 900); i = int(d * SR); out[i:i + n] += b * (1.0 if k == 0 else 0.6)
    return out
def creak(d=0.7):
    n = int(d * SR); t = np.arange(n) / SR; f = 180 + 60 * np.sin(2 * np.pi * 5 * t) + 140 * t / d
    return (np.sin(np.cumsum(f) / SR * 2 * np.pi) * np.sin(np.pi * t / d) * 0.5 * (1 + 0.3 * rng.standard_normal(n))).astype(np.float32)
def sizzle(d=0.8):
    return hp_fast(noise(d), 3000) * np.minimum(1, np.arange(int(d * SR)) / (0.1 * SR)) * np.exp(-np.arange(int(d * SR)) / SR * 2) * 0.5
def tvon(d=0.5):
    n = int(d * SR); t = np.arange(n) / SR
    return ((hp_fast(noise(d), 2000) * 0.4 + np.sin(2 * np.pi * 440 * t) * 0.3) * np.exp(-t * 4)).astype(np.float32)
def bell2():
    return (bell(midi(79), 0.8) + bell(midi(75), 0.8) * 0.8).astype(np.float32)
tick = lambda fr, g=0.3: place(sfx, bell(midi(76), 0.5), F(fr), g)
place(sfx, rustle(0.5), F(12), 0.4); place(sfx, thunk(95, 0.3), F(w["down1"] - 4), 0.5)                                          # hook: lies down
for d in (0, 5, 9): place(sfx, pop(700 + d * 40, 1300), F(w["anywhere"] - 4 + d), 0.28)                                       # sparks
place(sfx, pop(500, 900, 0.1), F(w["grab"] + 2), 0.3); place(sfx, ding(88), F(w["mat"]), 0.45)                                   # jar, mat check
place(sfx, clap_snd(), F(w["helper"] + 1), 0.4); place(sfx, taps(0.5, 8), F(w["helper"] + 6), 0.3)                              # helper off screen
for k, fr in enumerate((w["grass"], w["tile"], w["carpet"], w["pave"])): place(sfx, pop(500 + k * 120, 900 + k * 120, 0.08), F(fr - 2), 0.3)   # surface swaps
place(sfx, ding(88), F(w["pave"] + 8), 0.35)
place(sfx, sigh(0.7), F(w["strange"]), 0.25); place(sfx, ding(88), F(w["easy"]), 0.4)
place(sfx, rustle(0.4), F(w["next"] + 4), 0.3)
for fr in (w["step"], w["step"] + 9, w["step"] + 18): place(sfx, pat(), F(fr), 0.4)                                              # trainer walks off
place(sfx, creak(0.6), F(w["behind"]), 0.35); place(sfx, thunk(70, 0.25), F(w["behind"] + 16), 0.4)                             # door closes
place(sfx, pop(600, 1200, 0.12), F(w["one"] - 3), 0.45); tick(w["one"] + 2, 0.4)                                                 # "1 sec"
place(sfx, creak(0.5), F(w["then"] - 6), 0.3)
for k in range(3): place(sfx, pat(), F(w["then"] + 2 + k * 8), 0.35)                                                             # trainer back
place(sfx, whoosh(0.5, 1000), F(w["reward1"]), 0.22); place(sfx, crunch(0.45), F(w["t_rew"] + 2), 0.55); place(sfx, pop(700, 1300), F(w["t_rew"] + 5), 0.3); place(sfx, ding(88), F(w["down2"]), 0.4)
for fr in (w["real"] - 2, w["life"] - 2): place(sfx, pop(700, 1300, 0.1), F(fr), 0.25)
for k in range(5): place(sfx, pat(), F(w["walk"] + k * 9), 0.35)                                                                 # helper walks in
place(sfx, ding(88), F(w["tv"] - 24 + 10), 0.35)
place(sfx, tvon(0.5), F(w["tv"] - 2), 0.45); place(sfx, ding(88), F(w["open"] - 16 + 8), 0.35)                                    # TV on
place(sfx, creak(0.7), F(w["open"] - 2), 0.4); place(sfx, ding(88), F(w["daily"] - 16 + 8), 0.35)                                 # door opens
for fr in (w["daily"] + 14, w["daily"] + 26, w["daily"] + 38): tick(fr)                                                          # daily pulses
place(sfx, sizzle(0.8), F(w["cook"] - 2), 0.4)                                                                                   # cooking
place(sfx, bell2(), F(w["guests"] - 2), 0.4); place(sfx, ding(88), F(w["visit"] + 4), 0.4)                                       # doorbell, check
place(sfx, slide(1.0, 400, 1400), F(w["breaks"] - 14), 0.4); place(sfx, taps(0.6), F(w["breaks"] - 2), 0.5); place(sfx, bonk(), F(w["hard"] - 3), 0.6)   # gets up, cross
place(sfx, whimper(0.5, 800), F(w["hard"] + 12), 0.2)
place(sfx, tvon(0.4), F(w["lower"] - 2), 0.4); place(sfx, tvon(0.3), F(w["lower"] + 12), 0.2)                                    # distraction gets quieter
place(sfx, rustle(0.4), F(w["again"] - 10), 0.3); place(sfx, ding(93), F(w["again"]), 0.45); place(sfx, pop(700, 1300), F(w["again"] + 4), 0.25)
place(sfx, pop(600, 1300, 0.14), F(w["yes"]), 0.5); place(sfx, click(), F(w["click"]), 0.9)                                     # "yes", clicker
place(sfx, crunch(0.5), F(w["reward2"] + 2), 0.55); place(sfx, chime(), F(w["reward2"]), 0.4)
for i in range(6): place(sfx, pop(600 + i * 120, 1000 + i * 150, 0.08), F(w["reward2"] + 3 + i * 3), 0.25)                     # confetti

def write(path, x):
    pcm = (np.clip(x / max(1e-9, np.abs(x).max()) * 0.9, -1, 1) * 32767).astype(np.int16)
    with wave.open(path, "wb") as w: w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes())
write("music.wav", music); write("sfx.wav", sfx); print("stems ok", DUR)
