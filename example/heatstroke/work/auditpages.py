# Full-size defect audit pages (Nel rule A): every 3rd frame at 540 px wide, 3x2 per page, labelled with frame + shot id.
#   py work/auditpages.py frames stills/audit
import sys, json, os
from PIL import Image, ImageDraw
src, out = sys.argv[1], sys.argv[2]; os.makedirs(out, exist_ok=True)
shots = json.load(open('work/shots.json'))
sid = lambda f: next(s['id'] for s in shots if s['a'] <= f <= s['b'])
fs = list(range(0, shots[-1]['b'] + 1, 3))
for p in range(0, len(fs), 6):
    pg = Image.new('RGB', (3 * 540, 2 * 960), 'black')
    for i, f in enumerate(fs[p:p + 6]):
        im = Image.open(f'{src}/f{f:04d}.jpg').resize((540, 960)); d = ImageDraw.Draw(im)
        d.rectangle((0, 0, 330, 26), fill='black'); d.text((6, 6), f'f{f}  {sid(f)}', fill='yellow')
        pg.paste(im, ((i % 3) * 540, (i // 3) * 960))
    pg.save(f'{out}/p{p // 6 + 1:03d}_f{fs[p]:04d}.jpg', quality=88)
print(len(fs), 'frames,', (len(fs) + 5) // 6, 'pages')
