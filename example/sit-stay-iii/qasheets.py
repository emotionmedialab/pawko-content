#!/usr/bin/env python3
"""Per-shot QA contact sheets with frame numbers:  py qasheets.py stills/qa stills/qa_sheets
Needs work/shots.json (written by: SHOTS=1 GPU=1 node render.mjs stills/qa "0-<N-1>" 3)."""
import sys, glob, re, os, json
from PIL import Image, ImageDraw
d, out = sys.argv[1], sys.argv[2]
os.makedirs(out, exist_ok=True)
shots = json.load(open('work/shots.json'))
fs = {int(re.search(r'f(\d+)', f).group(1)): f for f in glob.glob(d + '/f*.jpg')}
for n, s in enumerate(shots):
    ks = [k for k in sorted(fs) if s['a'] <= k <= s['b']]
    if not ks: continue
    W, tw, th = 10, 216, 384
    sh = Image.new('RGB', (tw * min(W, len(ks)), th * ((len(ks) + W - 1) // W)), 'black')
    for i, k in enumerate(ks):
        im = Image.open(fs[k]).resize((tw, th)); ImageDraw.Draw(im).text((4, 4), str(k), fill='yellow')
        sh.paste(im, ((i % W) * tw, (i // W) * th))
    sh.save(f"{out}/{n + 1:02d}{s['id']}.jpg", quality=85)
    print(f"{out}/{n + 1:02d}{s['id']}.jpg", s['a'], s['b'], len(ks))
