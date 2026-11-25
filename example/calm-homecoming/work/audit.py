# Full-size defect audit strips: every 3rd frame of the given shots at 540x960, 3 per strip, labelled.
#   py work/audit.py stills/qa 04 07 09 ...   -> stills/audit/<shot>_<n>.jpg
import sys, glob, re, os, json
from PIL import Image, ImageDraw
d, ids = sys.argv[1], sys.argv[2:]
shots = json.load(open('work/shots.json')); os.makedirs('stills/audit', exist_ok=True)
fs = {int(re.search(r'f(\d+)', f).group(1)): f for f in glob.glob(d + '/f*.jpg')}
for s in shots:
    if s['id'][:2] not in ids: continue
    ks = [k for k in sorted(fs) if s['a'] <= k <= s['b']][::2]   # every 6th frame (qa = every 3rd)
    for n in range(0, len(ks), 4):
        ch = ks[n:n + 4]; sh = Image.new('RGB', (540 * len(ch), 960))
        for i, k in enumerate(ch):
            im = Image.open(fs[k]).resize((540, 960)); dr = ImageDraw.Draw(im); dr.rectangle((0, 0, 60, 18), fill='black'); dr.text((4, 3), str(k), fill='yellow'); sh.paste(im, (i * 540, 0))
        sh.save(f"stills/audit/{s['id']}_{n // 4:02d}.jpg", quality=85)
print(len(glob.glob('stills/audit/*.jpg')))
